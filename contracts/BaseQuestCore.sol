// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BaseQuestCore {
    address public contractOwner;
    uint256 public rewardPool;
    uint256[6] public levelThresholds = [0, 500, 1500, 3500, 7500, 15000];

    // Bitmask positions for daily tasks
    uint256 constant BIT_GM          = 1 << 0;
    uint256 constant BIT_DEPLOY      = 1 << 1;
    uint256 constant BIT_SWAP        = 1 << 2;
    uint256 constant BIT_BRIDGE      = 1 << 3;
    uint256 constant BIT_GAME        = 1 << 4;
    uint256 constant BIT_REFERRAL    = 1 << 5;
    uint256 constant BIT_SWAP_AERO   = 1 << 6;
    uint256 constant BIT_SWAP_UNI    = 1 << 7;
    uint256 constant BIT_SWAP_JUMP   = 1 << 8;
    uint256 constant BIT_SWAP_RELAY  = 1 << 9;
    uint256 constant BIT_BRIDGE_JUMP = 1 << 10;
    uint256 constant BIT_BRIDGE_RELAY= 1 << 11;

    struct UserProfile {
        uint256 totalXP;
        string  username;
        bool    usernameSet;
        uint256 tasksCompleted;
        uint256 joinedAt;
        uint256 lastActivityDay;
        uint256 streakCount;
        uint256 referralCount;
        address referredBy;
    }

    struct DailyTask {
        uint256 bits;
        uint256 day;
    }

    mapping(address => UserProfile) public profiles;
    mapping(address => DailyTask)   public dailyTasks;
    mapping(address => bool)        public hasBeenReferred;
    mapping(address => bool)        public profileTaskDone;
    mapping(address => address[])   public referrals;
    address[] public allUsers;
    mapping(address => bool) public isRegistered;

    event TaskCompleted(address indexed user, string taskType, uint256 xpEarned, uint256 timestamp);
    event UsernameSet(address indexed user, string username);
    event ReferralRegistered(address indexed referrer, address indexed referred, uint256 xpEarned);
    event StreakBonusAwarded(address indexed user, uint256 streak, uint256 xpEarned);
    event XPAwarded(address indexed user, uint256 amount, uint256 newTotal);

    modifier onlyOwner() { require(msg.sender == contractOwner, "BaseQuestCore: not owner"); _; }
    modifier registered() { if (!isRegistered[msg.sender]) _registerUser(msg.sender); _; }

    constructor() { contractOwner = msg.sender; }

    function _today() internal view returns (uint256) { return block.timestamp / 86400; }

    function _registerUser(address user) internal {
        isRegistered[user] = true;
        allUsers.push(user);
        profiles[user].joinedAt = block.timestamp;
    }

    function _resetDailyIfNeeded(address user) internal {
        if (dailyTasks[user].day != _today()) {
            dailyTasks[user].bits = 0;
            dailyTasks[user].day  = _today();
        }
    }

    function _isDone(address user, uint256 bit) internal view returns (bool) {
        return (dailyTasks[user].bits & bit) != 0;
    }

    function _setDone(address user, uint256 bit) internal {
        dailyTasks[user].bits |= bit;
    }

    function _awardXPAndDistribute(address user, uint256 xp, string memory taskType) internal {
        uint256 ownerCut = msg.value / 5;
        rewardPool += msg.value - ownerCut;
        (bool sent, ) = payable(contractOwner).call{value: ownerCut}("");
        require(sent, "BaseQuestCore: owner transfer failed");

        uint256 today = _today();
        UserProfile storage p = profiles[user];
        if (p.lastActivityDay == 0)              { p.streakCount = 1; }
        else if (today == p.lastActivityDay + 1) { p.streakCount += 1; }
        else if (today > p.lastActivityDay + 1)  { p.streakCount = 1; }
        p.lastActivityDay = today;

        if (p.streakCount > 0 && p.streakCount % 7 == 0) {
            p.totalXP += 200;
            emit StreakBonusAwarded(user, p.streakCount, 200);
        }
        p.totalXP += xp;
        p.tasksCompleted += 1;
        emit XPAwarded(user, xp, p.totalXP);
        emit TaskCompleted(user, taskType, xp, block.timestamp);
    }

    // ── Main tasks ────────────────────────────────────────────────────────

    function completeGMTask() external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_GM), "BaseQuestCore: already done today");
        _setDone(msg.sender, BIT_GM);
        _awardXPAndDistribute(msg.sender, 50, "GM_BASE");
    }

    function completeDeployTask(address deployedContract) external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        require(deployedContract != address(0), "BaseQuestCore: invalid address");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_DEPLOY), "BaseQuestCore: already done today");
        _setDone(msg.sender, BIT_DEPLOY);
        _awardXPAndDistribute(msg.sender, 100, "DEPLOY_CONTRACT");
    }

    function completeSwapTask() external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_SWAP), "BaseQuestCore: already done today");
        _setDone(msg.sender, BIT_SWAP);
        _awardXPAndDistribute(msg.sender, 75, "SWAP_BASE");
    }

    function completeBridgeTask() external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_BRIDGE), "BaseQuestCore: already done today");
        _setDone(msg.sender, BIT_BRIDGE);
        _awardXPAndDistribute(msg.sender, 100, "BRIDGE_BASE");
    }

    function completeGameTask() external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_GAME), "BaseQuestCore: already done today");
        _setDone(msg.sender, BIT_GAME);
        _awardXPAndDistribute(msg.sender, 75, "MINI_GAME");
    }

    function completeReferralTask(address referred) external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        require(referred != address(0), "BaseQuestCore: invalid address");
        require(referred != msg.sender, "BaseQuestCore: cannot refer yourself");
        require(!hasBeenReferred[referred], "BaseQuestCore: already referred");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_REFERRAL), "BaseQuestCore: already done today");
        hasBeenReferred[referred] = true;
        profiles[referred].referredBy = msg.sender;
        referrals[msg.sender].push(referred);
        profiles[msg.sender].referralCount += 1;
        if (!isRegistered[referred]) _registerUser(referred);
        profiles[referred].totalXP += 10;
        emit XPAwarded(referred, 10, profiles[referred].totalXP);
        _setDone(msg.sender, BIT_REFERRAL);
        _awardXPAndDistribute(msg.sender, 150, "REFERRAL");
        emit ReferralRegistered(msg.sender, referred, 150);
    }

    function completeProfileTask(string calldata username) external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        require(!profileTaskDone[msg.sender], "BaseQuestCore: profile already set");
        require(bytes(username).length > 0, "BaseQuestCore: empty username");
        require(bytes(username).length <= 32, "BaseQuestCore: username too long");
        profileTaskDone[msg.sender] = true;
        profiles[msg.sender].username = username;
        profiles[msg.sender].usernameSet = true;
        _awardXPAndDistribute(msg.sender, 50, "SET_PROFILE");
        emit UsernameSet(msg.sender, username);
    }

    // ── Swap sub-tasks ────────────────────────────────────────────────────

    function completeSwapAerodrome() external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_SWAP_AERO), "BaseQuestCore: already done today");
        _setDone(msg.sender, BIT_SWAP_AERO);
        _awardXPAndDistribute(msg.sender, 50, "SWAP_AERODROME");
    }

    function completeSwapUniswap() external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_SWAP_UNI), "BaseQuestCore: already done today");
        _setDone(msg.sender, BIT_SWAP_UNI);
        _awardXPAndDistribute(msg.sender, 50, "SWAP_UNISWAP");
    }

    function completeSwapJumper() external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_SWAP_JUMP), "BaseQuestCore: already done today");
        _setDone(msg.sender, BIT_SWAP_JUMP);
        _awardXPAndDistribute(msg.sender, 50, "SWAP_JUMPER");
    }

    function completeSwapRelay() external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_SWAP_RELAY), "BaseQuestCore: already done today");
        _setDone(msg.sender, BIT_SWAP_RELAY);
        _awardXPAndDistribute(msg.sender, 50, "SWAP_RELAY");
    }

    // ── Bridge sub-tasks ──────────────────────────────────────────────────

    function completeBridgeJumper() external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_BRIDGE_JUMP), "BaseQuestCore: already done today");
        _setDone(msg.sender, BIT_BRIDGE_JUMP);
        _awardXPAndDistribute(msg.sender, 50, "BRIDGE_JUMPER");
    }

    function completeBridgeRelay() external payable registered {
        require(msg.value == 0.00005 ether, "BaseQuestCore: incorrect payment");
        _resetDailyIfNeeded(msg.sender);
        require(!_isDone(msg.sender, BIT_BRIDGE_RELAY), "BaseQuestCore: already done today");
        _setDone(msg.sender, BIT_BRIDGE_RELAY);
        _awardXPAndDistribute(msg.sender, 50, "BRIDGE_RELAY");
    }

    // ── View functions ─────────────────────────────────────────────────────

    function getUserXP(address user) external view returns (uint256) { return profiles[user].totalXP; }

    function getUserLevel(address user) external view returns (uint256) {
        uint256 xp = profiles[user].totalXP;
        for (uint256 i = 5; i > 0; i--) { if (xp >= levelThresholds[i]) return i + 1; }
        return 1;
    }

    function getUserProfile(address user) external view returns (
        uint256 totalXP, string memory username, bool usernameSet,
        uint256 tasksCompleted, uint256 joinedAt, uint256 streakCount,
        uint256 referralCount, address referredBy
    ) {
        UserProfile storage p = profiles[user];
        return (p.totalXP, p.username, p.usernameSet, p.tasksCompleted,
                p.joinedAt, p.streakCount, p.referralCount, p.referredBy);
    }

    function getDailyTasks(address user) external view returns (
        bool gmDone, bool deployDone, bool swapDone,
        bool bridgeDone, bool gameDone, bool referralDone,
        bool profileDone
    ) {
        uint256 bits  = dailyTasks[user].bits;
        bool    today = (dailyTasks[user].day == _today());
        return (
            today && (bits & BIT_GM)       != 0,
            today && (bits & BIT_DEPLOY)   != 0,
            today && (bits & BIT_SWAP)     != 0,
            today && (bits & BIT_BRIDGE)   != 0,
            today && (bits & BIT_GAME)     != 0,
            today && (bits & BIT_REFERRAL) != 0,
            profileTaskDone[user]
        );
    }

    function getSubTasks(address user) external view returns (
        bool swapAerodromeDone, bool swapUniswapDone,
        bool swapJumperDone,    bool swapRelayDone,
        bool bridgeJumperDone,  bool bridgeRelayDone
    ) {
        uint256 bits  = dailyTasks[user].bits;
        bool    today = (dailyTasks[user].day == _today());
        return (
            today && (bits & BIT_SWAP_AERO)    != 0,
            today && (bits & BIT_SWAP_UNI)     != 0,
            today && (bits & BIT_SWAP_JUMP)    != 0,
            today && (bits & BIT_SWAP_RELAY)   != 0,
            today && (bits & BIT_BRIDGE_JUMP)  != 0,
            today && (bits & BIT_BRIDGE_RELAY) != 0
        );
    }

    function getTopUsers(uint256 count) external view returns (
        address[] memory topAddresses,
        uint256[] memory topXPs
    ) {
        uint256 total = allUsers.length;
        if (count > total) count = total;
        if (count == 0) return (new address[](0), new uint256[](0));
        address[] memory sortedAddrs = new address[](total);
        uint256[] memory sortedXPs   = new uint256[](total);
        for (uint256 i = 0; i < total; i++) {
            sortedAddrs[i] = allUsers[i];
            sortedXPs[i]   = profiles[allUsers[i]].totalXP;
        }
        for (uint256 i = 1; i < total; i++) {
            address keyAddr = sortedAddrs[i];
            uint256 keyXP   = sortedXPs[i];
            int256  j       = int256(i) - 1;
            while (j >= 0 && sortedXPs[uint256(j)] < keyXP) {
                sortedAddrs[uint256(j) + 1] = sortedAddrs[uint256(j)];
                sortedXPs[uint256(j) + 1]   = sortedXPs[uint256(j)];
                j--;
            }
            sortedAddrs[uint256(j) + 1] = keyAddr;
            sortedXPs[uint256(j) + 1]   = keyXP;
        }
        topAddresses = new address[](count);
        topXPs       = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            topAddresses[i] = sortedAddrs[i];
            topXPs[i]       = sortedXPs[i];
        }
    }

    function getTotalUsers() external view returns (uint256) { return allUsers.length; }
    function getUserStreak(address user) external view returns (uint256) { return profiles[user].streakCount; }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "BaseQuestCore: zero address");
        contractOwner = newOwner;
    }

    receive() external payable { revert("BaseQuestCore: direct ETH not accepted"); }
}
