import { useLeaderboard } from "../hooks/useLeaderboard";
import { formatNumber } from "../utils/contracts";

export default function Leaderboard({ wallet }) {
  const { address } = wallet;
  const { entries, loading, error, totalUsers, myRank, lastUpdated, refresh } = useLeaderboard(address);

  return (
    <div style={{ padding: "24px 0", maxWidth: "700px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ color: "white", fontSize: "22px", fontWeight: "800", margin: "0 0 4px" }}>
            🏆 Leaderboard
          </h2>
          <p style={{ color: "#8892a4", fontSize: "14px", margin: 0 }}>
            Top {entries.length} of {totalUsers} farmers
            {lastUpdated && (
              <span style={{ marginLeft: "8px" }}>· Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            background:   "rgba(255,255,255,0.04)",
            border:       "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding:      "8px 16px",
            color:        loading ? "#8892a4" : "white",
            fontWeight:   "600",
            fontSize:     "13px",
            cursor:       loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {/* Your rank */}
      {myRank && (
        <div style={{
          background:   "rgba(0,82,255,0.08)",
          border:       "1px solid rgba(0,82,255,0.3)",
          borderRadius: "16px",
          padding:      "16px 20px",
          marginBottom: "16px",
          display:      "flex",
          alignItems:   "center",
          gap:          "16px",
        }}>
          <span style={{ color: "#00d4ff", fontWeight: "900", fontSize: "28px" }}>#{myRank}</span>
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>Your Rank</div>
            <div style={{ color: "#8892a4", fontSize: "12px" }}>Keep farming to climb!</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background:   "rgba(255,255,255,0.02)",
          border:       "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          padding:      "24px",
          textAlign:    "center",
          color:        "#8892a4",
          fontSize:     "14px",
          marginBottom: "16px",
        }}>
          Unable to load leaderboard 😪 please tap Refresh to try again.
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              height:       "68px",
              background:   "rgba(255,255,255,0.03)",
              borderRadius: "16px",
              border:       "1px solid rgba(255,255,255,0.05)",
            }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div style={{
          background:   "rgba(255,255,255,0.02)",
          border:       "1px solid rgba(255,255,255,0.06)",
          borderRadius: "20px",
          padding:      "48px 24px",
          textAlign:    "center",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🌱</div>
          <div style={{ color: "white", fontWeight: "800", fontSize: "18px", marginBottom: "6px" }}>Be the First!</div>
          <div style={{ color: "#8892a4", fontSize: "14px" }}>No farmers yet. Complete quests to claim rank #1.</div>
        </div>
      )}

      {/* Entries */}
      {!loading && entries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {entries.map(e => {
            const rankEmoji = e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : null;
            const podiumBorder =
              e.rank === 1 ? "rgba(240,180,41,0.3)"  :
              e.rank === 2 ? "rgba(180,180,180,0.3)"  :
              e.rank === 3 ? "rgba(205,127,50,0.3)"   :
              e.isCurrentUser ? "rgba(0,82,255,0.3)"  :
              "rgba(255,255,255,0.06)";
            const podiumBg =
              e.rank === 1 ? "rgba(240,180,41,0.06)"  :
              e.rank === 2 ? "rgba(180,180,180,0.04)" :
              e.rank === 3 ? "rgba(205,127,50,0.04)"  :
              e.isCurrentUser ? "rgba(0,82,255,0.05)" :
              "rgba(255,255,255,0.02)";

            return (
              <div key={e.address} style={{
                background:   podiumBg,
                border:       `1px solid ${podiumBorder}`,
                borderRadius: "16px",
                padding:      "14px 18px",
                display:      "flex",
                alignItems:   "center",
                gap:          "14px",
              }}>

                {/* Rank */}
                <div style={{ width: "36px", textAlign: "center", flexShrink: 0 }}>
                  {rankEmoji
                    ? <span style={{ fontSize: "24px" }}>{rankEmoji}</span>
                    : <span style={{ color: "#8892a4", fontWeight: "700", fontSize: "14px" }}>#{e.rank}</span>
                  }
                </div>

                {/* Level emoji */}
                <span style={{ fontSize: "24px", flexShrink: 0 }}>{e.level.emoji}</span>

                {/* Name + stats */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "white", fontWeight: "700", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.display}
                    </span>
                    {e.isCurrentUser && (
                      <span style={{
                        background:   "rgba(0,82,255,0.2)",
                        border:       "1px solid rgba(0,82,255,0.4)",
                        borderRadius: "20px",
                        padding:      "1px 7px",
                        color:        "#00d4ff",
                        fontSize:     "10px",
                        fontWeight:   "700",
                        flexShrink:   0,
                      }}>you</span>
                    )}
                  </div>
                  <div style={{ color: "#8892a4", fontSize: "12px", marginTop: "2px" }}>
                    {e.level.name} · {e.tasksCompleted} tasks
                    {e.streakCount > 0 && ` · 🔥 ${e.streakCount}d`}
                  </div>
                </div>

                {/* XP */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: "#00d4ff", fontWeight: "800", fontSize: "16px" }}>
                    {formatNumber(e.xp)}
                  </div>
                  <div style={{ color: "#8892a4", fontSize: "11px" }}>XP</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
                                    }
