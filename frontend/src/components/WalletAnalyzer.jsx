import React, { useState } from "react";
import { getWalletAnalysis } from "../utils/basescan.js";
import { ethers } from "ethers";

export default function WalletAnalyzer({ wallet }) {
  const [input,    setInput]    = useState(wallet.address || "");
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const analyze = async () => {
    const addr = input.trim();
    if (!ethers.isAddress(addr)) { setError("Invalid Ethereum address."); return; }
    setLoading(true); setError(null); setAnalysis(null);
    try { setAnalysis(await getWalletAnalysis(addr)); }
    catch (err) { setError(err.message || "Failed to analyze wallet."); }
    finally { setLoading(false); }
  };

  const scoreColor = (s) => s >= 70 ? "#00c853" : s >= 40 ? "#f0b429" : "#ff3b3b";
  const scoreLabel = (s) => s >= 70 ? "OG Farmer" : s >= 40 ? "Active User" : "Newbie";

  return (
    <div className="max-w-3xl mx-auto animate-in">
      <div className="mb-6">
        <h2 className="section-title">🔍 Wallet Analyzer</h2>
        <p className="font-mono text-sm text-[#8892a4] mt-1">Analyze any Base wallet's on-chain activity and compute a Base Score.</p>
      </div>

      <div className="glass-card p-6 mb-6">
        <label className="font-mono text-sm text-[#8892a4] block mb-2">Wallet Address</label>
        <div className="flex gap-3">
          <input className="input-field flex-1" placeholder="0x..." value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && analyze()} />
          <button onClick={analyze} disabled={loading} className="btn-primary px-6">
            {loading ? <span className="spinner spinner-sm" /> : "Analyze"}
          </button>
        </div>
        {wallet.address && wallet.address !== input && (
          <button onClick={() => setInput(wallet.address)} className="font-mono text-xs text-[#0052ff] hover:text-[#00d4ff] mt-2 transition-colors">
            Use connected wallet
          </button>
        )}
        {error && <p className="font-mono text-sm text-[#ff3b3b] mt-2">{error}</p>}
      </div>

      {loading && (
        <div className="text-center py-12"><div className="spinner spinner-lg mx-auto mb-4" /><p className="font-mono text-[#8892a4]">Fetching on-chain data...</p></div>
      )}

      {analysis && !loading && (
        <div className="space-y-4 animate-in">
          <div className="glass-card p-6 text-center" style={{ border: "1px solid " + scoreColor(analysis.baseScore) + "40" }}>
            <p className="font-mono text-sm text-[#8892a4] mb-1">Base Score</p>
            <p className="font-[Orbitron] text-6xl font-black mb-1" style={{ color: scoreColor(analysis.baseScore) }}>{analysis.baseScore}</p>
            <p className="font-display font-bold text-lg text-white">{scoreLabel(analysis.baseScore)}</p>
            <p className="font-mono text-xs text-[#8892a4] mt-1">out of 100</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Txs",    value: analysis.totalTxs.toLocaleString() },
              { label: "Wallet Age",   value: analysis.walletAgeDays + "d" },
              { label: "Contracts",    value: analysis.uniqueContracts },
              { label: "Failed Txs",   value: analysis.failedCount },
            ].map(s => (
              <div key={s.label} className="glass-card p-4 text-center">
                <p className="font-[Orbitron] text-xl font-bold text-white">{s.value}</p>
                <p className="font-mono text-xs text-[#8892a4]">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-white mb-3">Activity Heatmap (90 days)</h3>
            <div className="flex flex-wrap gap-1">
              {analysis.heatmap.cells.map((count, i) => (
                <div key={i} title={count + " txs"} className="w-3 h-3 rounded-sm transition-all"
                  style={{ background: count === 0 ? "rgba(255,255,255,0.05)" : "rgba(0,82,255," + Math.min(0.9, 0.2 + (count / analysis.heatmap.maxCount) * 0.7) + ")" }} />
              ))}
            </div>
            <p className="font-mono text-xs text-[#8892a4] mt-2">Longest streak: {analysis.heatmap.longestStreak} days</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-white mb-3">Volume</h3>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="font-mono text-sm text-[#8892a4]">Sent</span><span className="font-mono text-sm text-white">{analysis.totalSentEth} ETH</span></div>
                <div className="flex justify-between"><span className="font-mono text-sm text-[#8892a4]">Received</span><span className="font-mono text-sm text-white">{analysis.totalRecvEth} ETH</span></div>
                <div className="flex justify-between"><span className="font-mono text-sm text-[#8892a4]">Avg Gas</span><span className="font-mono text-sm text-white">{analysis.avgGasUsed.toLocaleString()}</span></div>
              </div>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-display font-semibold text-white mb-3">Top Contracts</h3>
              {analysis.topContracts.length === 0 ? <p className="font-mono text-sm text-[#8892a4]">No contract interactions.</p> : (
                <div className="space-y-1">
                  {analysis.topContracts.map(c => (
                    <div key={c.contract} className="flex justify-between items-center">
                      <a href={"https://basescan.org/address/" + c.contract} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-xs text-[#00d4ff] hover:text-white truncate max-w-[160px] transition-colors">
                        {c.contract.slice(0,6)}...{c.contract.slice(-4)}
                      </a>
                      <span className="badge badge-gray">{c.count} txs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <a href={"https://basescan.org/address/" + analysis.address} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">
              View on Basescan ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
