import { ethers } from "ethers";

export const ADDRESSES = {
  core:   import.meta.env.VITE_CORE_CONTRACT   || "",
  game:   import.meta.env.VITE_GAME_CONTRACT   || "",
  bridge: import.meta.env.VITE_BRIDGE_CONTRACT || "",
};

export const BASE_CHAIN_ID = 8453;
export const BASE_RPC_URL  = import.meta.env.VITE_CDP_RPC_URL || "https://mainnet.base.org";

export const CORE_ABI = [
  "function completeGMTask() external payable",
  "function completeDeployTask(address deployedContract) external payable",
  "function completeSwapTask() external payable",
  "function completeBridgeTask() external payable",
  "function completeGameTask() external payable",
  "function completeReferralTask(address referred) external payable",
  "function completeProfileTask(string calldata username) external payable",
  "function completeMintNFTTask(address nftContract) external payable",
  "function getUserXP(address user) external view returns (uint256)",
  "function getUserLevel(address user) external view returns (uint256)",
  "function getUserProfile(address user) external view returns (uint256 totalXP, string username, bool usernameSet, uint256 tasksCompleted, uint256 joinedAt, uint256 streakCount, uint256 referralCount, address referredBy)",
  "function getDailyTasks(address user) external view returns (bool gmDone, bool deployDone, bool swapDone, bool bridgeDone, bool gameDone, bool referralDone, bool profileDone, bool mintDone)",
  "function getTopUsers(uint256 count) external view returns (address[] topAddresses, uint256[] topXPs)",
  "function getTotalUsers() external view returns (uint256)",
  "function getUserStreak(address user) external view returns (uint256)",
  "function profileTaskDone(address) external view returns (bool)",
  "function contractOwner() external view returns (address)",
  "event TaskCompleted(address indexed user, string taskType, uint256 xpEarned, uint256 timestamp)",
  "event StreakBonusAwarded(address indexed user, uint256 streak, uint256 xpEarned)",
];

export const GAME_ABI = [
  "function joinGame() external payable",
  "function endRound() external",
  "function getCurrentPlayers() external view returns (address[])",
  "function getRoundTimeRemaining() external view returns (uint256)",
  "function getRoundNumber() external view returns (uint256)",
  "function hasJoinedCurrentRound(address player) external view returns (bool)",
  "function getCurrentPrizePool() external view returns (uint256)",
  "function getCurrentRoundStartTime() external view returns (uint256)",
  "function isRoundEnded() external view returns (bool)",
  "function getRecentRounds(uint256 count) external view returns (tuple(uint256 roundNumber, address winner, uint256 prize, uint256 playerCount, uint256 endedAt)[])",
  "function getWinCount(address player) external view returns (uint256)",
  "function ENTRY_FEE() external view returns (uint256)",
  "function ROUND_DURATION() external view returns (uint256)",
  "function currentRoundNumber() external view returns (uint256)",
  "event PlayerJoined(address indexed player, uint256 roundNumber, uint256 prizePool)",
  "event RoundEnded(address indexed winner, uint256 prize, uint256 roundNumber, uint256 playerCount)",
];

export const BRIDGE_ABI = [
  "function recordBridge(string calldata bridgeProtocol, string calldata note) external",
  "function getUserRecordIndexes(address user) external view returns (uint256[])",
  "function userBridgeCount(address) external view returns (uint256)",
];

let _readProvider = null;
export function getReadProvider() {
  if (!_readProvider) _readProvider = new ethers.JsonRpcProvider(BASE_RPC_URL);
  return _readProvider;
}

export function getCoreContract(s)   { if (!ADDRESSES.core)   throw new Error("VITE_CORE_CONTRACT not set");   return new ethers.Contract(ADDRESSES.core,   CORE_ABI,   s); }
export function getGameContract(s)   { if (!ADDRESSES.game)   throw new Error("VITE_GAME_CONTRACT not set");   return new ethers.Contract(ADDRESSES.game,   GAME_ABI,   s); }
export function getBridgeContract(s) { if (!ADDRESSES.bridge) throw new Error("VITE_BRIDGE_CONTRACT not set"); return new ethers.Contract(ADDRESSES.bridge, BRIDGE_ABI, s); }

export const LEVELS = [
  { level: 1, name: "Newbie",  minXP: 0,     maxXP: 499,     color: "#8892a4", emoji: "🌱" },
  { level: 2, name: "Farmer",  minXP: 500,   maxXP: 1499,    color: "#00c853", emoji: "🌾" },
  { level: 3, name: "Builder", minXP: 1500,  maxXP: 3499,    color: "#0052ff", emoji: "🔨" },
  { level: 4, name: "Degen",   minXP: 3500,  maxXP: 7499,    color: "#a855f7", emoji: "⚡" },
  { level: 5, name: "OG Base", minXP: 7500,  maxXP: 14999,   color: "#00d4ff", emoji: "🔥" },
  { level: 6, name: "Phoenix", minXP: 15000, maxXP: Infinity, color: "#f0b429", emoji: "🦅" },
];

export function getLevelInfo(xp) {
  const num = Number(xp || 0);
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (num >= LEVELS[i].minXP) {
      const current  = LEVELS[i];
      const next     = LEVELS[i + 1] || null;
      const progress = next ? ((num - current.minXP) / (next.minXP - current.minXP)) * 100 : 100;
      return { current, next, xp: num, progress: Math.min(progress, 100) };
    }
  }
  return { current: LEVELS[0], next: LEVELS[1], xp: num, progress: 0 };
}

export function shortAddr(addr) { if (!addr || addr.length < 10) return addr; return addr.slice(0, 6) + "..." + addr.slice(-4); }
export function formatEth(wei, decimals = 4) { if (!wei) return "0"; return parseFloat(ethers.formatEther(wei)).toFixed(decimals); }
export function formatNumber(n) { return Number(n || 0).toLocaleString("en-US"); }
export function timeAgo(timestamp) {
  const seconds = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (seconds < 60)    return seconds + "s ago";
  if (seconds < 3600)  return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  return Math.floor(seconds / 86400) + "d ago";
}
export function mmss(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds)));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
}

let _ethPrice = null, _ethPriceAt = 0;
export async function getEthPrice() {
  const now = Date.now();
  if (_ethPrice && now - _ethPriceAt < 120000) return _ethPrice;
  try {
    const res  = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
    const data = await res.json();
    _ethPrice  = data.ethereum?.usd || 2500;
    _ethPriceAt = now;
    return _ethPrice;
  } catch { return _ethPrice || 2500; }
}
export function ethToUsd(ethAmount, ethPrice) { return (parseFloat(ethAmount || 0) * (ethPrice || 2500)).toFixed(2); }

export const TASKS = [
  { id: "gm",       name: "GM Base",         description: "Send a GM on-chain message",           xp: 50,  ethCost: "0.0001", icon: "☀️",  daily: true,  field: null },
  { id: "deploy",   name: "Deploy Contract",  description: "Deploy a contract to Base Mainnet",    xp: 100, ethCost: "0.0002", icon: "🚀",  daily: true,  field: "deployedContract", fieldLabel: "Deployed Contract Address", fieldPlaceholder: "0x..." },
  { id: "swap",     name: "Swap on Base",     description: "Confirm a swap on Base",               xp: 75,  ethCost: "0.0001", icon: "🔄",  daily: true,  field: null },
  { id: "bridge",   name: "Bridge to Base",   description: "Bridge assets using the Base Bridge",  xp: 100, ethCost: "0.0002", icon: "🌉",  daily: true,  field: null },
  { id: "game",     name: "Play Mini-Game",   description: "Enter the 5-minute prize pool game",   xp: 75,  ethCost: "0.0001", icon: "🎲",  daily: true,  field: null },
  { id: "mint",     name: "Mint NFT",         description: "Mint any NFT on Base Mainnet",         xp: 125, ethCost: "0.0001", icon: "🎨",  daily: true,  field: "nftContract", fieldLabel: "NFT Contract Address", fieldPlaceholder: "0x..." },
  { id: "referral", name: "Refer a Friend",   description: "Register a referral address",          xp: 150, ethCost: "0.0001", icon: "👥",  daily: true,  field: "referred", fieldLabel: "Friend Wallet Address", fieldPlaceholder: "0x..." },
  { id: "profile",  name: "Set Profile",      description: "Set your on-chain username",           xp: 50,  ethCost: "0.0001", icon: "🪪",  daily: false, oneTime: true, field: "username", fieldLabel: "Username (max 32 chars)", fieldPlaceholder: "based_degen" },
  { id: "streak",   name: "Streak Bonus",     description: "Auto-awarded every 7 days",            xp: 200, ethCost: "0",      icon: "🔥",  daily: false, auto: true },
];
