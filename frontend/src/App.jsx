import { useState, useEffect } from "react";
import { useWallet }     from "./hooks/useWallet";
import { useQuests }     from "./hooks/useQuests";
import Navbar            from "./components/Navbar";
import Dashboard         from "./components/Dashboard";
import QuestBoard        from "./components/QuestBoard";
import BossRaid          from "./components/BossRaid";
import Leaderboard       from "./components/Leaderboard";
import WalletAnalyzer    from "./components/WalletAnalyzer";

const TABS = [
  { id: "dashboard",   label: "Dashboard",      icon: "🏠" },
  { id: "quests",      label: "Quests",          icon: "🗺️" },
  { id: "bossraid",    label: "Boss Raid",       icon: "🐉" },
  { id: "leaderboard", label: "Leaderboard",     icon: "🏆" },
  { id: "analyzer",    label: "Wallet Analyzer", icon: "🔍" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const wallet = useWallet();
  const quests = useQuests(wallet);

  // Merge userProfile into wallet so Navbar can show XP/level
  const walletWithProfile = { ...wallet, userProfile: quests.userProfile };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":   return <Dashboard    quests={quests} wallet={wallet} setActiveTab={setActiveTab} />;
      case "quests":      return <QuestBoard   quests={quests} wallet={wallet} />;
      case "bossraid":    return <BossRaid     wallet={wallet} />;
      case "leaderboard": return <Leaderboard  wallet={wallet} />;
      case "analyzer":    return <WalletAnalyzer wallet={wallet} />;
      default:            return <Dashboard    quests={quests} wallet={wallet} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div style={{
      minHeight:  "100vh",
      background: "#0a0b0f",
      color:      "white",
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Navbar — gets wallet + userProfile merged */}
      <Navbar wallet={walletWithProfile} />

      {/* Tab bar */}
      <div style={{
        borderBottom:   "1px solid rgba(255,255,255,0.06)",
        background:     "rgba(255,255,255,0.02)",
        backdropFilter: "blur(10px)",
        position:       "sticky",
        top:            "64px",
        zIndex:         90,
        overflowX:      "auto",
      }}>
        <div style={{ display: "flex", maxWidth: "1100px", margin: "0 auto", padding: "0 16px" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background:   "none",
                border:       "none",
                borderBottom: activeTab === tab.id ? "2px solid #0052ff" : "2px solid transparent",
                padding:      "14px 18px",
                color:        activeTab === tab.id ? "white" : "#8892a4",
                fontWeight:   activeTab === tab.id ? "700" : "500",
                fontSize:     "13px",
                cursor:       "pointer",
                whiteSpace:   "nowrap",
                transition:   "all 0.2s",
                display:      "flex",
                alignItems:   "center",
                gap:          "6px",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "bossraid" && (
                <span style={{
                  background:   "rgba(255,59,59,0.2)",
                  border:       "1px solid rgba(255,59,59,0.4)",
                  borderRadius: "20px",
                  padding:      "1px 7px",
                  color:        "#ff6b6b",
                  fontSize:     "10px",
                  fontWeight:   "800",
                  marginLeft:   "2px",
                }}>LIVE</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 16px 80px" }}>
        {renderTab()}
      </div>

      {/* Mobile bottom nav */}
      <div style={{
        display:        "flex",
        position:       "fixed",
        bottom:         0,
        left:           0,
        right:          0,
        background:     "rgba(10,11,15,0.95)",
        borderTop:      "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        zIndex:         100,
        padding:        "8px 0 12px",
      }}
        className="mobile-nav"
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex:          1,
              background:    "none",
              border:        "none",
              color:         activeTab === tab.id ? "#0052ff" : "#8892a4",
              fontWeight:    activeTab === tab.id ? "700" : "400",
              fontSize:      "10px",
              cursor:        "pointer",
              display:       "flex",
              flexDirection: "column",
              alignItems:    "center",
              gap:           "4px",
              padding:       "4px 0",
              transition:    "color 0.2s",
            }}
          >
            <span style={{ fontSize: "20px" }}>{tab.icon}</span>
            <span>{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Global styles */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0b0f; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(0,82,255,0.3); border-radius: 3px; }
        input::placeholder { color: #4a5568; }
        a { color: inherit; }
        @media (min-width: 768px) { .mobile-nav { display: none !important; } }
        @media (max-width: 767px) { .mobile-nav { display: flex !important; } }
      `}</style>
    </div>
  );
}
