import { useState, useEffect } from "react";
import { TASKS, generateReferralCode, generateShareLink, parseReferralInput, getRefFromUrl } from "../utils/contracts";

export default function QuestBoard({ quests, wallet }) {
  const {
    dailyTasks, taskLoading, ethPrice,
    completeGM, completeDeploy, completeSwap,
    completeBridge, completeGame, completeReferral,
    completeProfile, completeMintNFT,
  } = quests;

  const { isConnected, address } = wallet;
  const [fields,    setFields]    = useState({});
  const [copied,    setCopied]    = useState(false);
  const [refFromUrl, setRefFromUrl] = useState(null);

  const referralCode = address ? generateReferralCode(address) : null;
  const shareLink    = address ? generateShareLink(address)    : null;

  // Auto-fill referred field if user arrived via referral link
  useEffect(() => {
    const ref = getRefFromUrl();
    if (ref) {
      setRefFromUrl(ref);
      setFields(p => ({ ...p, referred: ref }));
    }
  }, []);

  const copyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isTaskDone = (id) => {
    if (!dailyTasks) return false;
    const map = {
      gm:       dailyTasks.gmDone,
      deploy:   dailyTasks.deployDone,
      swap:     dailyTasks.swapDone,
      bridge:   dailyTasks.bridgeDone,
      game:     dailyTasks.gameDone,
      mint:     dailyTasks.mintDone,
      referral: dailyTasks.referralDone,
      profile:  dailyTasks.profileDone,
    };
    return !!map[id];
  };

  const handleTask = async (taskId) => {
    const field = fields[taskId] || "";
    if (taskId === "gm")       return completeGM();
    if (taskId === "deploy")   return completeDeploy(field);
    if (taskId === "swap")     return completeSwap();
    if (taskId === "bridge")   return completeBridge();
    if (taskId === "game")     return completeGame();
    if (taskId === "mint")     return completeMintNFT(field);
    if (taskId === "profile")  return completeProfile(field);
    if (taskId === "referral") {
      const resolved = parseReferralInput(field);
      if (!resolved) {
        alert("Please enter a valid wallet address or share link.");
        return;
      }
      return completeReferral(resolved);
    }
  };

  const visibleTasks = TASKS.filter(t => !t.auto);

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ color: "white", fontSize: "22px", fontWeight: "800", margin: "0 0 6px" }}>
          🗺️ Quest Board
        </h2>
        <p style={{ color: "#8892a4", fontSize: "14px", margin: 0 }}>
          Complete daily on-chain tasks to earn XP and climb the leaderboard.
        </p>
      </div>

      {/* ── My Referral Card ── */}
      {isConnected && address && (
        <div style={{
          background:    "linear-gradient(135deg, rgba(0,82,255,0.12), rgba(0,212,255,0.06))",
          border:        "1px solid rgba(0,82,255,0.35)",
          borderRadius:  "16px",
          padding:       "20px 24px",
          marginBottom:  "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <span style={{ fontSize: "22px" }}>👥</span>
            <div>
              <div style={{ color: "white", fontWeight: "800", fontSize: "16px" }}>Your Referral Link</div>
              <div style={{ color: "#8892a4", fontSize: "12px" }}>
                Share this link — your friend gets <span style={{ color: "#f0b429", fontWeight: "700" }}>+10 XP</span> and you earn <span style={{ color: "#f0b429", fontWeight: "700" }}>+150 XP</span>
              </div>
            </div>
          </div>

          {/* Referral Code Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
            <div style={{
              background:   "rgba(240,180,41,0.12)",
              border:       "1px solid rgba(240,180,41,0.35)",
              borderRadius: "10px",
              padding:      "8px 16px",
              color:        "#f0b429",
              fontWeight:   "800",
              fontSize:     "18px",
              letterSpacing: "2px",
              fontFamily:   "monospace",
            }}>
              {referralCode}
            </div>
            <div style={{ color: "#8892a4", fontSize: "12px" }}>← Your unique code</div>
          </div>

          {/* Share Link Box */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{
              flex:         1,
              background:   "rgba(255,255,255,0.04)",
              border:       "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding:      "10px 14px",
              color:        "#8892a4",
              fontSize:     "12px",
              fontFamily:   "monospace",
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}>
              {shareLink}
            </div>
            <button
              onClick={copyLink}
              style={{
                background:   copied ? "rgba(0,200,83,0.2)" : "rgba(0,82,255,0.2)",
                border:       `1px solid ${copied ? "rgba(0,200,83,0.5)" : "rgba(0,82,255,0.5)"}`,
                borderRadius: "10px",
                padding:      "10px 16px",
                color:        copied ? "#00c853" : "#0052ff",
                fontWeight:   "700",
                fontSize:     "13px",
                cursor:       "pointer",
                whiteSpace:   "nowrap",
                transition:   "all 0.2s",
              }}
            >
              {copied ? "✅ Copied!" : "📋 Copy Link"}
            </button>
          </div>

          {/* Share buttons */}
          <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
            <a
              href={`https://twitter.com/intent/tweet?text=🚀 Farm Base. Earn XP. Dominate the Chain.%0AJoin me on BaseQuest and earn +10 XP bonus!%0A${encodeURIComponent(shareLink)}`}
              target="_blank" rel="noreferrer"
              style={{
                background:   "rgba(29,155,240,0.12)",
                border:       "1px solid rgba(29,155,240,0.3)",
                borderRadius: "8px",
                padding:      "7px 14px",
                color:        "#1d9bf0",
                fontWeight:   "700",
                fontSize:     "12px",
                textDecoration: "none",
              }}
            >
              𝕏 Share on X
            </a>
            <a
              href={`https://warpcast.com/~/compose?text=🚀 Farm Base. Earn XP. Dominate the Chain.%0AJoin me on BaseQuest! ${encodeURIComponent(shareLink)}`}
              target="_blank" rel="noreferrer"
              style={{
                background:   "rgba(132,90,225,0.12)",
                border:       "1px solid rgba(132,90,225,0.3)",
                borderRadius: "8px",
                padding:      "7px 14px",
                color:        "#845ae1",
                fontWeight:   "700",
                fontSize:     "12px",
                textDecoration: "none",
              }}
            >
              🟣 Share on Warpcast
            </a>
          </div>
        </div>
      )}

      {/* ── Auto-fill notice ── */}
      {refFromUrl && (
        <div style={{
          background:   "rgba(0,200,83,0.08)",
          border:       "1px solid rgba(0,200,83,0.3)",
          borderRadius: "12px",
          padding:      "12px 16px",
          marginBottom: "20px",
          color:        "#00c853",
          fontSize:     "13px",
          fontWeight:   "600",
        }}>
          🎉 You were referred! Connect your wallet and complete any task — your referrer will earn XP and you get <strong>+10 XP</strong> bonus when they submit your address.
        </div>
      )}

      {/* ── Task Cards Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
        {visibleTasks.map((task) => {
          const done    = isTaskDone(task.id);
          const loading = taskLoading?.[task.id];
          const usdCost = (parseFloat(task.ethCost || 0) * ethPrice).toFixed(2);

          return (
            <div key={task.id} style={{
              background:    done ? "rgba(0,200,83,0.06)" : "rgba(255,255,255,0.03)",
              border:        `1px solid ${done ? "rgba(0,200,83,0.3)" : "rgba(255,255,255,0.08)"}`,
              borderRadius:  "16px",
              padding:       "20px",
              display:       "flex",
              flexDirection: "column",
              gap:           "14px",
              transition:    "border 0.2s",
            }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "26px" }}>{task.icon}</span>
                  <div>
                    <div style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>{task.name}</div>
                    <div style={{ color: "#8892a4", fontSize: "12px", marginTop: "2px" }}>{task.description}</div>
                  </div>
                </div>
                {done && (
                  <div style={{
                    background: "rgba(0,200,83,0.15)", border: "1px solid rgba(0,200,83,0.4)",
                    borderRadius: "20px", padding: "3px 10px", color: "#00c853",
                    fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap",
                  }}>✓ Done</div>
                )}
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{
                  background: "rgba(240,180,41,0.12)", border: "1px solid rgba(240,180,41,0.3)",
                  borderRadius: "20px", padding: "3px 10px", color: "#f0b429", fontSize: "12px", fontWeight: "700",
                }}>+{task.xp} XP</span>

                {task.ethCost !== "0" && (
                  <span style={{
                    background: "rgba(0,82,255,0.12)", border: "1px solid rgba(0,82,255,0.3)",
                    borderRadius: "20px", padding: "3px 10px", color: "#6699ff", fontSize: "12px", fontWeight: "600",
                  }}>{task.ethCost} ETH (~${usdCost})</span>
                )}

                {task.oneTime && (
                  <span style={{
                    background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)",
                    borderRadius: "20px", padding: "3px 10px", color: "#a855f7", fontSize: "11px", fontWeight: "600",
                  }}>One-time</span>
                )}

                {task.daily && (
                  <span style={{
                    background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
                    borderRadius: "20px", padding: "3px 10px", color: "#00d4ff", fontSize: "11px", fontWeight: "600",
                  }}>Daily</span>
                )}

                {task.id === "referral" && (
                  <span style={{
                    background: "rgba(0,200,83,0.1)", border: "1px solid rgba(0,200,83,0.3)",
                    borderRadius: "20px", padding: "3px 10px", color: "#00c853", fontSize: "11px", fontWeight: "600",
                  }}>Friend gets +10 XP</span>
                )}
              </div>

              {/* Referral task: extra info */}
              {task.id === "referral" && !done && (
                <div style={{
                  background: "rgba(0,82,255,0.06)", border: "1px solid rgba(0,82,255,0.15)",
                  borderRadius: "10px", padding: "10px 12px", fontSize: "12px", color: "#8892a4", lineHeight: "1.6",
                }}>
                  💡 Enter your <strong style={{ color: "#6699ff" }}>friend's wallet address</strong> or paste their <strong style={{ color: "#6699ff" }}>BaseQuest share link</strong> below to register the referral on-chain.
                </div>
              )}

              {/* Mint NFT: extra info */}
              {task.id === "mint" && !done && (
                <div style={{
                  background: "rgba(0,82,255,0.06)", border: "1px solid rgba(0,82,255,0.15)",
                  borderRadius: "10px", padding: "10px 12px", fontSize: "12px", color: "#8892a4", lineHeight: "1.6",
                }}>
                  💡 Mint an NFT on{" "}
                  <a href="https://zora.co" target="_blank" rel="noreferrer" style={{ color: "#00d4ff" }}>Zora</a>,{" "}
                  <a href="https://opensea.io/base" target="_blank" rel="noreferrer" style={{ color: "#00d4ff" }}>OpenSea</a>, or{" "}
                  <a href="https://mint.fun" target="_blank" rel="noreferrer" style={{ color: "#00d4ff" }}>mint.fun</a>, then paste the NFT contract address below.
                </div>
              )}

              {/* Input field */}
              {task.field && !done && (
                <input
                  type="text"
                  placeholder={task.fieldPlaceholder}
                  value={fields[task.id] || ""}
                  onChange={e => setFields(p => ({ ...p, [task.id]: e.target.value }))}
                  style={{
                    background:   "rgba(255,255,255,0.05)",
                    border:       "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    padding:      "10px 14px",
                    color:        "white",
                    fontSize:     "13px",
                    outline:      "none",
                    width:        "100%",
                    boxSizing:    "border-box",
                  }}
                />
              )}

              {/* Action button */}
              {!done && (
                <button
                  onClick={() => handleTask(task.id)}
                  disabled={loading || !isConnected}
                  style={{
                    background:   loading ? "rgba(0,82,255,0.3)" : "linear-gradient(135deg, #0052ff, #0066ff)",
                    border:       "none",
                    borderRadius: "12px",
                    padding:      "12px",
                    color:        "white",
                    fontWeight:   "700",
                    fontSize:     "14px",
                    cursor:       loading || !isConnected ? "not-allowed" : "pointer",
                    opacity:      !isConnected ? 0.5 : 1,
                    transition:   "opacity 0.2s",
                    width:        "100%",
                  }}
                >
                  {loading ? "⏳ Processing..." : isConnected ? `${task.icon} ${task.name}` : "Connect Wallet"}
                </button>
              )}

              {done && (
                <div style={{
                  textAlign:    "center",
                  color:        "#00c853",
                  fontWeight:   "700",
                  fontSize:     "14px",
                  padding:      "10px",
                  background:   "rgba(0,200,83,0.08)",
                  borderRadius: "12px",
                }}>
                  ✅ Completed {task.daily ? "today!" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
                  }
