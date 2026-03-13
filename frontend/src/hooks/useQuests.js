import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getCoreContract, TASKS, SWAP_PLATFORMS, BRIDGE_PLATFORMS, DEPLOY_PLATFORMS } from "../utils/contracts";

export function useQuests(wallet) {
  const { address, signer, isConnected } = wallet;

  const [dailyTasks,  setDailyTasks]  = useState({});
  const [subTasks,    setSubTasks]    = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [txPending,   setTxPending]   = useState(false);
  const [lastTx,      setLastTx]      = useState(null);
  const [error,       setError]       = useState(null);

  const loadUserData = useCallback(async () => {
    if (!signer || !address) return;
    setLoading(true);
    try {
      const contract = getCoreContract(signer);
      const [profile, daily, subs] = await Promise.all([
        contract.getUserProfile(address),
        contract.getDailyTasks(address),
        contract.getSubTasks(address),
      ]);

      setUserProfile({
        totalXP:        Number(profile.totalXP),
        username:       profile.username,
        usernameSet:    profile.usernameSet,
        tasksCompleted: Number(profile.tasksCompleted),
        joinedAt:       Number(profile.joinedAt),
        streakCount:    Number(profile.streakCount),
      });

      setDailyTasks({
        gm:      daily.gmDone,
        deploy:  daily.deployDone,
        swap:    daily.swapDone,
        bridge:  daily.bridgeDone,
        game:    daily.gameDone,
        profile: daily.profileDone,
      });

      setSubTasks({
        swapAerodrome: subs.swapAerodromeDone,
        swapUniswap:   subs.swapUniswapDone,
        swapJumper:    subs.swapJumperDone,
        swapRelay:     subs.swapRelayDone,
        bridgeJumper:  subs.bridgeJumperDone,
        bridgeRelay:   subs.bridgeRelayDone,
        deployRemix:   subs.deployRemixDone,
      });
    } catch (err) {
      console.warn("loadUserData error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [signer, address]);

  useEffect(() => {
    if (isConnected && signer) loadUserData();
  }, [isConnected, signer, loadUserData]);

  const sendTx = async (fn, successMsg) => {
    setTxPending(true);
    setError(null);
    setLastTx(null);
    try {
      const tx = await fn();
      setLastTx({ status: "pending", hash: tx.hash });
      await tx.wait();
      setLastTx({ status: "success", hash: tx.hash, msg: successMsg });
      await loadUserData();
    } catch (err) {
      const msg = err?.reason || err?.message || "Transaction failed";
      if (!msg.includes("user rejected") && !msg.includes("User denied")) {
        setError(msg.slice(0, 120));
      }
      setLastTx(null);
    } finally {
      setTxPending(false);
    }
  };

  const FEE = ethers.parseEther("0.00005");

  const completeTask = async (taskId, fieldValues = {}) => {
    if (!signer) return;
    const contract = getCoreContract(signer);

    switch (taskId) {
      case "gm":
        return sendTx(
          () => contract.completeGMTask({ value: FEE }),
          "☀️ GM sent! +50 XP"
        );
      case "deploy":
        if (!fieldValues.deployedContract || !ethers.isAddress(fieldValues.deployedContract))
          return setError("Enter a valid deployed contract address");
        return sendTx(
          () => contract.completeDeployTask(fieldValues.deployedContract, { value: FEE }),
          "🚀 Deploy verified! +100 XP"
        );
      case "swap":
        return sendTx(
          () => contract.completeSwapTask({ value: FEE }),
          "🔄 Swap recorded! +75 XP"
        );
      case "bridge":
        return sendTx(
          () => contract.completeBridgeTask({ value: FEE }),
          "🌉 Bridge recorded! +100 XP"
        );
      case "game":
        return sendTx(
          () => contract.completeGameTask({ value: FEE }),
          "🐉 Boss Raid XP claimed! +75 XP"
        );
      case "profile":
        if (!fieldValues.username || fieldValues.username.trim().length === 0)
          return setError("Enter a username");
        if (fieldValues.username.length > 32)
          return setError("Username must be 32 chars or less");
        return sendTx(
          () => contract.completeProfileTask(fieldValues.username.trim(), { value: FEE }),
          "🪪 Profile set! +50 XP"
        );
      // Swap sub-tasks
      case "swapAerodrome":
        return sendTx(
          () => contract.completeSwapAerodrome({ value: FEE }),
          "✈️ Aerodrome swap recorded! +50 XP"
        );
      case "swapUniswap":
        return sendTx(
          () => contract.completeSwapUniswap({ value: FEE }),
          "🦄 Uniswap swap recorded! +50 XP"
        );
      case "swapJumper":
        return sendTx(
          () => contract.completeSwapJumper({ value: FEE }),
          "🦗 Jumper swap recorded! +50 XP"
        );
      case "swapRelay":
        return sendTx(
          () => contract.completeSwapRelay({ value: FEE }),
          "⚡ Relay swap recorded! +50 XP"
        );
      // Bridge sub-tasks
      case "bridgeJumper":
        return sendTx(
          () => contract.completeBridgeJumper({ value: FEE }),
          "🦗 Jumper bridge recorded! +50 XP"
        );
      case "bridgeRelay":
        return sendTx(
          () => contract.completeBridgeRelay({ value: FEE }),
          "⚡ Relay bridge recorded! +50 XP"
        );
      // Deploy sub-tasks
      case "deployRemix":
        return sendTx(
          () => contract.completeDeployRemix({ value: FEE }),
          "🔧 Remix deploy recorded! +50 XP"
        );
      default:
        setError("Unknown task: " + taskId);
    }
  };

  const getTaskStatus = (taskId) => {
    if (taskId === "streak") return { done: false, auto: true };
    return { done: !!dailyTasks[taskId] };
  };

  const getSubTaskStatus = (subId) => {
    return { done: !!subTasks[subId] };
  };

  const completedCount = Object.values(dailyTasks).filter(Boolean).length;
  const totalDaily     = TASKS.filter(t => t.daily).length;

  return {
    dailyTasks,
    subTasks,
    userProfile,
    loading,
    txPending,
    lastTx,
    error,
    completeTask,
    getTaskStatus,
    getSubTaskStatus,
    loadUserData,
    completedCount,
    totalDaily,
    SWAP_PLATFORMS,
    BRIDGE_PLATFORMS,
    DEPLOY_PLATFORMS,
  };
}
