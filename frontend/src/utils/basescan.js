const BLOCKSCOUT_URL = "https://base.blockscout.com/api";

async function blockscoutFetch(address) {
  const url = `${BLOCKSCOUT_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&limit=10000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Blockscout error: " + res.status);
  const data = await res.json();
  if (data.status === "0" && data.message !== "No transactions found") return [];
  return Array.isArray(data.result) ? data.result : [];
}

export async function fetchTransactions(address) {
  try { return await blockscoutFetch(address); }
  catch (err) { console.warn("Blockscout fetch failed:", err.message); return []; }
}

export function analyzeTransactions(address, txs) {
  if (!txs || txs.length === 0) return emptyAnalytics(address);
  const addr   = address.toLowerCase();
  const now    = Math.floor(Date.now() / 1000);
  const sorted = [...txs].sort((a, b) => Number(a.timeStamp) - Number(b.timeStamp));
  const first  = sorted[0];
  const last   = sorted[sorted.length - 1];
  const walletAgeDays = Math.floor((now - Number(first.timeStamp)) / 86400);
  const sentTxs      = txs.filter(tx => tx.from.toLowerCase() === addr && tx.isError === "0");
  const receivedTxs  = txs.filter(tx => tx.to?.toLowerCase() === addr  && tx.isError === "0");
  const totalSentWei = sentTxs.reduce((acc, tx) => acc + BigInt(tx.value || "0"), 0n);
  const totalRecvWei = receivedTxs.reduce((acc, tx) => acc + BigInt(tx.value || "0"), 0n);
  const successTxs   = txs.filter(tx => tx.isError === "0");
  const totalGasUsed = successTxs.reduce((acc, tx) => acc + Number(tx.gasUsed || 0), 0);
  const avgGasUsed   = successTxs.length ? Math.round(totalGasUsed / successTxs.length) : 0;
  const failedCount  = txs.filter(tx => tx.isError === "1").length;
  const contractCounts = {};
  txs.forEach(tx => {
    if (tx.to && tx.to !== "" && tx.to.toLowerCase() !== addr) {
      const to = tx.to.toLowerCase();
      contractCounts[to] = (contractCounts[to] || 0) + 1;
    }
  });
  const uniqueContracts = Object.keys(contractCounts).length;
  const topContracts = Object.entries(contractCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([contract, count]) => ({ contract, count }));
  const heatmap   = buildHeatmap(txs, 90);
  const baseScore = computeBaseScore({ totalTxs: txs.length, walletAgeDays, uniqueContracts, totalSentEth: Number(totalSentWei) / 1e18, totalRecvEth: Number(totalRecvWei) / 1e18, failedCount, streakDays: heatmap.longestStreak });
  return { address, walletAgeDays, totalTxs: txs.length, successTxs: successTxs.length, failedCount, firstTx: first ? formatTx(first) : null, lastTx: last ? formatTx(last) : null, totalSentEth: (Number(totalSentWei) / 1e18).toFixed(6), totalRecvEth: (Number(totalRecvWei) / 1e18).toFixed(6), avgGasUsed, uniqueContracts, topContracts, heatmap, baseScore };
}

function formatTx(tx) {
  return { hash: tx.hash, timestamp: Number(tx.timeStamp), date: new Date(Number(tx.timeStamp) * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }), valueEth: (Number(BigInt(tx.value || "0")) / 1e18).toFixed(6), from: tx.from, to: tx.to, gasUsed: tx.gasUsed, isError: tx.isError === "1" };
}

function buildHeatmap(txs, days) {
  const now      = Math.floor(Date.now() / 1000);
  const startDay = now - days * 86400;
  const cells    = new Array(days).fill(0);
  txs.forEach(tx => {
    const ts = Number(tx.timeStamp);
    if (ts >= startDay) {
      const dayIdx = Math.floor((ts - startDay) / 86400);
      if (dayIdx >= 0 && dayIdx < days) cells[dayIdx]++;
    }
  });
  let longestStreak = 0, currentStreak = 0;
  for (const count of cells) {
    if (count > 0) { currentStreak++; longestStreak = Math.max(longestStreak, currentStreak); }
    else currentStreak = 0;
  }
  return { cells, maxCount: Math.max(...cells, 1), longestStreak, days };
}

function computeBaseScore({ totalTxs, walletAgeDays, uniqueContracts, totalSentEth, totalRecvEth, failedCount, streakDays }) {
  let score = 0;
  score += Math.min(300, totalTxs * 2);
  score += Math.min(200, walletAgeDays * 2);
  score += Math.min(200, uniqueContracts * 5);
  score += Math.min(150, (totalSentEth + totalRecvEth) * 10);
  score += Math.min(100, streakDays * 10);
  score -= failedCount * 2;
  return Math.max(0, Math.min(1000, Math.round(score)));
}

function emptyAnalytics(address) {
  return { address, walletAgeDays: 0, totalTxs: 0, successTxs: 0, failedCount: 0, firstTx: null, lastTx: null, totalSentEth: "0.000000", totalRecvEth: "0.000000", avgGasUsed: 0, uniqueContracts: 0, topContracts: [], heatmap: { cells: new Array(90).fill(0), maxCount: 1, longestStreak: 0, days: 90 }, baseScore: 0 };
}

export async function getWalletAnalysis(address) {
  const txs = await fetchTransactions(address);
  return analyzeTransactions(address, txs);
}
