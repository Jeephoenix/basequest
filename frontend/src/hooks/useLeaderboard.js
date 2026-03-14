import { useState, useEffect, useCallback } from "react";
import { getCoreContract, getReadProvider, getLevelInfo, shortAddr } from "../utils/contracts.js";

export function useLeaderboard(currentAddress, refreshInterval = 60000) {
  const [entries,     setEntries]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [totalUsers,  setTotalUsers]  = useState(0);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const provider = getReadProvider();
      const core     = getCoreContract(provider);

      const totalRaw = await core.getTotalUsers();
      const total    = Number(totalRaw);
      setTotalUsers(total);

      if (total === 0) { setEntries([]); setLoading(false); return; }

      const count = Math.min(total, 50);

      const addrPromises = [];
      for (let i = 0; i < count; i++) {
        addrPromises.push(core.allUsers(i));
      }
      const addrs = await Promise.all(addrPromises);

      const [xpResults, profileResults] = await Promise.all([
        Promise.allSettled(addrs.map(addr => core.getUserXP(addr))),
        Promise.allSettled(addrs.map(addr => core.getUserProfile(addr))),
      ]);

      const enriched = addrs.map((addr, i) => {
        const xp  = xpResults[i].status === "fulfilled" ? Number(xpResults[i].value) : 0;
        const lvl = getLevelInfo(xp);
        let tasksCompleted = 0, streakCount = 0, username = "";
        if (profileResults[i].status === "fulfilled") {
          tasksCompleted = Number(profileResults[i].value.tasksCompleted);
          streakCount    = Number(profileResults[i].value.streakCount);
          username       = profileResults[i].value.username || "";
        }
        return {
          address:       addr,
          display:       username || shortAddr(addr),
          xp,
          level:         lvl.current,
          tasksCompleted,
          streakCount,
          isCurrentUser: addr.toLowerCase() === currentAddress?.toLowerCase(),
        };
      });

      const sorted = enriched
        .sort((a, b) => b.xp - a.xp)
        .map((e, i) => ({ ...e, rank: i + 1 }));

      setEntries(sorted);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [currentAddress]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, refreshInterval]);

  const myRank = currentAddress ? (entries.find(e => e.isCurrentUser)?.rank ?? null) : null;
  return { entries, loading, error, lastUpdated, totalUsers, myRank, refresh: fetchLeaderboard };
}
