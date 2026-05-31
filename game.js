(function () {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const human = 0;
  const bot = 1;

  const ITEMS = {
    burn: {
      name: "Burn Pile",
      cost: 5,
      tier: "common",
      text: "Burn the top discard and flip a fresh card onto the pile."
    },
    coinPurse: {
      name: "Coin Purse",
      cost: 0,
      tier: "common",
      immediate: true,
      text: "Gain 3 coins now, then buy nothing else this shop."
    },
    luckyMatch: {
      name: "Lucky Match",
      cost: 6,
      tier: "common",
      text: "Flip one hidden card. If it belongs there, keep it face-up."
    },
    bottomDeal: {
      name: "Bottom Deal",
      cost: 5,
      tier: "common",
      text: "Before drawing, draw from the bottom of the deck instead."
    },
    insuranceFraud: {
      name: "Insurance Fraud",
      cost: 4,
      tier: "common",
      shopUse: true,
      text: "Pay 1 coin now. If you lose next round, gain 3 bonus coins."
    },
    pardon: {
      name: "Royal Pardon",
      cost: 7,
      tier: "uncommon",
      text: "Discard an unplayable current card and draw again."
    },
    graveGrab: {
      name: "Grave Grab",
      cost: 8,
      tier: "uncommon",
      text: "Trash your unplayable card and steal the previous discard."
    },
    loadedDraw: {
      name: "Loaded Draw",
      cost: 10,
      tier: "uncommon",
      text: "Draw two cards from the deck, keep the better one."
    },
    taxCollector: {
      name: "Tax Collector",
      cost: 8,
      tier: "uncommon",
      shopUse: true,
      text: "Steal up to 3 coins from the opponent between rounds."
    },
    riggedDiscard: {
      name: "Rigged Discard",
      cost: 8,
      tier: "uncommon",
      text: "Put your current card on the discard pile and draw again."
    },
    blackMarket: {
      name: "Black Market",
      cost: 9,
      tier: "uncommon",
      shopUse: true,
      text: "Refresh this shop once with better rarity odds."
    },
    doubleDown: {
      name: "Double Down",
      cost: 10,
      tier: "uncommon",
      shopUse: true,
      text: "Win next round for +5 coins. Lose and gain no round coins."
    },
    chaosCut: {
      name: "Chaos Cut",
      cost: 11,
      tier: "rare",
      text: "Shuffle every face-down card on both boards."
    },
    mirrorCurse: {
      name: "Mirror Curse",
      cost: 12,
      tier: "rare",
      text: "Both players flip one random completed slot face-down."
    },
    shield: {
      name: "Crown Shield",
      cost: 12,
      tier: "rare",
      text: "Automatically blocks the next Debt of the Crown."
    },
    wildSeal: {
      name: "Wild Seal",
      cost: 12,
      tier: "rare",
      text: "Treat one face card as a number 1-5 once."
    },
    debtSwap: {
      name: "Debt Swap",
      cost: 13,
      tier: "rare",
      shopUse: true,
      text: "If behind by 2+ cards, swap board sizes next round only."
    },
    royalGambit: {
      name: "Royal Gambit",
      cost: 12,
      tier: "rare",
      text: "Guess a slot before drawing. If the top card matches, place it."
    },
    debt: {
      name: "Debt of the Crown",
      cost: 28,
      tier: "legendary",
      legendary: true,
      text: "Opponent adds 1 required card next round. Rare after round 3."
    },
    jokersFavor: {
      name: "Joker's Favor",
      cost: 30,
      tier: "legendary",
      legendary: true,
      text: "Treat your current card as any number once."
    }
  };

  const SHOP_TIERS = {
    common: ["burn", "coinPurse", "luckyMatch", "bottomDeal", "insuranceFraud"],
    uncommon: ["pardon", "graveGrab", "taxCollector", "loadedDraw", "riggedDiscard", "blackMarket", "doubleDown"],
    rare: ["chaosCut", "mirrorCurse", "shield", "wildSeal", "royalGambit", "debtSwap"],
    legendary: ["debt", "jokersFavor"]
  };
  const COIN_PURSE_SHOP_CHANCE = 0.25;
  const BOT_SHOP_ITEMS = new Set([
    "burn",
    "coinPurse",
    "luckyMatch",
    "bottomDeal",
    "insuranceFraud",
    "pardon",
    "graveGrab",
    "loadedDraw",
    "taxCollector",
    "riggedDiscard",
    "blackMarket",
    "doubleDown",
    "mirrorCurse",
    "chaosCut",
    "shield",
    "debt",
    "jokersFavor"
  ]);
  const MUSIC_FOLDER = "assets/audio/music/";
  const AUDIO_FILES = {
    music: "assets/audio/lofi-loop.mp3",
    draw: "assets/audio/SFX/Playing Card Being Layed.mp3",
    place: "assets/audio/SFX/Playing Card Being Layed.mp3",
    discard: "assets/audio/SFX/Playing Card Being Layed.mp3",
    shop: "assets/audio/SFX/Cash Drawer Opening.mp3",
    victory: "assets/audio/SFX/Casino Style Victory  Sound.mp3"
  };
  const AUDIO_VOLUMES = {
    music: 0.28,
    draw: 0.5,
    place: 0.48,
    discard: 0.5,
    shop: 0.45,
    victory: 0.58
  };
  const SFX_POOL_SIZE = 4;
  const PITCHED_SFX = new Set(["draw", "place", "discard"]);
  const CARD_SFX_PITCH_VARIANCE = 0.045;
  const PUBLIC_API_BASE = "https://trash-cards-api.chaseshaffer07.workers.dev";
  const AUTH_STORAGE_KEY = "trashCardsAuth";
  const PERFORMANCE_STORAGE_KEY = "trashCardsPerformanceMode";
  const ONLINE_TURN_MS = 30000;
  const ONLINE_SHOP_MS = 45000;
  const ONLINE_TIMEOUT_LIMIT = 2;
  const ONLINE_TIMEOUT_PENALTY_PERCENT = 5;
  const RELEASE_FALLBACKS = [
    {
      name: "v0.2.10 - Multiplayer Timers",
      tag_name: "v0.2.10",
      published_at: "2026-05-31T00:00:00Z",
      body: [
        "## Highlights",
        "- Added shared online Crown Debt shops so both players choose from the same offers.",
        "- Online shops now wait until both players are ready or their shop timers expire.",
        "- Added online turn timers that reset after draw, place, discard, and item actions.",
        "- Added timeout match endings with 5% point penalties for repeated inactivity."
      ].join("\n")
    },
    {
      name: "v0.2.9 - Crown Debt Item Overhaul",
      tag_name: "v0.2.9",
      published_at: "2026-05-21T00:00:00Z",
      body: [
        "## Highlights",
        "- Added Bottom Deal, Insurance Fraud, Rigged Discard, Black Market, Double Down, Mirror Curse, Debt Swap, Royal Gambit, and Joker's Favor.",
        "- Reworked Lucky Match into a suspense flip instead of guaranteed value.",
        "- Reworked Wild Seal so face cards can only become slots 1-5.",
        "- Replaced Sabotage with the fairer Mirror Curse.",
        "- Tuned Coin Purse to appear in about 25% of shops."
      ].join("\n")
    },
    {
      name: "v0.2.8 - Online Rooms Start",
      tag_name: "v0.2.8",
      published_at: "2026-05-20T00:00:00Z",
      body: [
        "## Highlights",
        "- Online rooms now start the player match when both players are ready.",
        "- Added seeded online match setup so both players share the same opening table.",
        "- Added core online draw, place, and discard action syncing through the room socket.",
        "- Fixed the main menu shine so it stays inside the mode cards.",
        "- Kept server URL controls and external release links out of the player-facing UI."
      ].join("\n")
    },
    {
      name: "v0.2.7 - Subtle Card Pitch Variety",
      tag_name: "v0.2.7",
      published_at: "2026-05-14T00:00:00Z",
      body: [
        "## Highlights",
        "- Added subtle random pitch variation to card draw, place, and discard sounds.",
        "- Kept shop, music, and victory audio at normal pitch.",
        "- Limited the pitch range so the card sound stays natural and does not distort."
      ].join("\n")
    },
    {
      name: "v0.2.6 - Faster SFX and Link Previews",
      tag_name: "v0.2.6",
      published_at: "2026-05-14T00:00:00Z",
      body: [
        "## Highlights",
        "- Warmed up sound effects after the first tap so card sounds respond faster after quiet moments.",
        "- Added a small SFX pool and Web Audio playback path for repeated card sounds.",
        "- Added Discord, Twitter, and Open Graph preview metadata for shared game links.",
        "- Added a canonical URL, theme color, and favicon metadata."
      ].join("\n")
    },
    {
      name: "v0.2.5 - In-Game Release Notes",
      tag_name: "v0.2.5",
      published_at: "2026-05-12T00:00:00Z",
      body: [
        "## Highlights",
        "- Moved the how-to-play question button into a floating bottom-right control.",
        "- Added a Recent releases button to the main menu.",
        "- Added a top-right version button in the game header.",
        "- Added an in-game release notes modal for recent update summaries.",
        "- Kept release notes built into the game so local and offline browser play still shows recent updates."
      ].join("\n")
    },
    {
      name: "v0.2.4 - Casino Table Layout",
      tag_name: "v0.2.4",
      published_at: "2026-05-12T00:00:00Z",
      body: [
        "## Highlights",
        "- Added the first CSS-only casino table pass with warmer felt, rail depth, card depth, and cleaner card shadows.",
        "- Fixed blurry desktop text by letting desktop layouts use the actual browser size instead of scaling a 1920x1080 stage.",
        "- Fixed short desktop windows so bottom-row cards keep space above the table rail.",
        "- Kept mobile and fullscreen layouts on the fixed 16:9 or 9:16 stage system for steadier phone sizing."
      ].join("\n")
    },
    {
      name: "v0.2.3 - Lock Card Placement",
      tag_name: "v0.2.3",
      published_at: "2026-05-11T00:00:00Z",
      body: [
        "## Highlights",
        "- Locked card placement to the active player.",
        "- Stopped fast human input from stealing cards while the bot is playing.",
        "- Kept the current-card tray stable during turns."
      ].join("\n")
    },
    {
      name: "v0.2.2 - Current Card Tray",
      tag_name: "v0.2.2",
      published_at: "2026-05-10T00:00:00Z",
      body: [
        "## Highlights",
        "- Gave the current card a permanent home.",
        "- Improved mobile and desktop table spacing.",
        "- Cleaned up classic mode so coins stay in Crown Debt."
      ].join("\n")
    }
  ];

  const els = {
    modeScreen: document.getElementById("modeScreen"),
    gameShell: document.getElementById("gameShell"),
    musicButton: document.getElementById("musicButton"),
    sfxButton: document.getElementById("sfxButton"),
    modeFullscreen: document.getElementById("modeFullscreen"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    serverStatusButton: document.getElementById("serverStatusButton"),
    serverStatusText: document.getElementById("serverStatusText"),
    menuModeButtons: document.querySelectorAll("[data-menu-mode]"),
    playModal: document.getElementById("playModal"),
    playTitle: document.getElementById("playTitle"),
    playSummary: document.getElementById("playSummary"),
    playTypePanel: document.getElementById("playTypePanel"),
    playModePanel: document.getElementById("playModePanel"),
    playChosenWrap: document.getElementById("playChosenWrap"),
    playChosenButton: document.getElementById("playChosenButton"),
    chosenModeTitle: document.getElementById("chosenModeTitle"),
    chosenModeSummary: document.getElementById("chosenModeSummary"),
    onlineRoomPanel: document.getElementById("onlineRoomPanel"),
    createRoomButton: document.getElementById("createRoomButton"),
    joinRoomCode: document.getElementById("joinRoomCode"),
    joinRoomButton: document.getElementById("joinRoomButton"),
    roomLobby: document.getElementById("roomLobby"),
    roomCodeText: document.getElementById("roomCodeText"),
    roomPlayerList: document.getElementById("roomPlayerList"),
    roomStatusText: document.getElementById("roomStatusText"),
    roomReadyButton: document.getElementById("roomReadyButton"),
    roomLeaveButton: document.getElementById("roomLeaveButton"),
    roomMessage: document.getElementById("roomMessage"),
    playModeChoices: document.getElementById("playModeChoices"),
    onlineGate: document.getElementById("onlineGate"),
    onlineAccountName: document.getElementById("onlineAccountName"),
    onlineGateText: document.getElementById("onlineGateText"),
    onlineAuthButton: document.getElementById("onlineAuthButton"),
    playBack: document.getElementById("playBack"),
    closePlay: document.getElementById("closePlay"),
    leaderboardButton: document.getElementById("leaderboardButton"),
    leaderboardModal: document.getElementById("leaderboardModal"),
    leaderboardStatus: document.getElementById("leaderboardStatus"),
    leaderboardList: document.getElementById("leaderboardList"),
    leaderboardTabs: document.querySelectorAll("[data-leaderboard-mode]"),
    closeLeaderboard: document.getElementById("closeLeaderboard"),
    settingsButton: document.getElementById("settingsButton"),
    settingsModal: document.getElementById("settingsModal"),
    settingsMusic: document.getElementById("settingsMusic"),
    settingsSfx: document.getElementById("settingsSfx"),
    settingsFullscreen: document.getElementById("settingsFullscreen"),
    settingsPerformance: document.getElementById("settingsPerformance"),
    closeSettings: document.getElementById("closeSettings"),
    accountButton: document.getElementById("accountButton"),
    authModal: document.getElementById("authModal"),
    authTitle: document.getElementById("authTitle"),
    authIntro: document.getElementById("authIntro"),
    authForm: document.getElementById("authForm"),
    authLoginTab: document.getElementById("authLoginTab"),
    authSignupTab: document.getElementById("authSignupTab"),
    authUsername: document.getElementById("authUsername"),
    authPassword: document.getElementById("authPassword"),
    authSubmit: document.getElementById("authSubmit"),
    authMessage: document.getElementById("authMessage"),
    authProfile: document.getElementById("authProfile"),
    authProfileName: document.getElementById("authProfileName"),
    authAccountMeta: document.getElementById("authAccountMeta"),
    authServerPill: document.getElementById("authServerPill"),
    authSummary: document.getElementById("authSummary"),
    authAccountInfo: document.getElementById("authAccountInfo"),
    authProfileStats: document.getElementById("authProfileStats"),
    authRefresh: document.getElementById("authRefresh"),
    authLogout: document.getElementById("authLogout"),
    closeAuth: document.getElementById("closeAuth"),
    helpButton: document.getElementById("helpButton"),
    helpModal: document.getElementById("helpModal"),
    closeHelp: document.getElementById("closeHelp"),
    releaseButtons: document.querySelectorAll("[data-release-button]"),
    releaseModal: document.getElementById("releaseModal"),
    releaseList: document.getElementById("releaseList"),
    closeRelease: document.getElementById("closeRelease"),
    modeName: document.getElementById("modeName"),
    coinStrip: document.getElementById("coinStrip"),
    botGrid: document.getElementById("botGrid"),
    humanGrid: document.getElementById("humanGrid"),
    botName: document.querySelector(".player-panel.opponent .player-line span"),
    humanName: document.querySelector(".player-panel.human .player-line span"),
    botCoins: document.getElementById("botCoins"),
    humanCoins: document.getElementById("humanCoins"),
    botCoinPop: document.getElementById("botCoinPop"),
    humanCoinPop: document.getElementById("humanCoinPop"),
    botTrack: document.getElementById("botTrack"),
    humanTrack: document.getElementById("humanTrack"),
    botTurnText: document.getElementById("botTurnText"),
    humanTurnText: document.getElementById("humanTurnText"),
    turnPill: document.getElementById("turnPill"),
    timerPill: document.getElementById("timerPill"),
    deckPile: document.getElementById("deckPile"),
    discardPile: document.getElementById("discardPile"),
    deckCount: document.getElementById("deckCount"),
    discardCard: document.getElementById("discardCard"),
    currentCard: document.getElementById("currentCard"),
    inventoryBar: document.getElementById("inventoryBar"),
    statusText: document.getElementById("statusText"),
    newGame: document.getElementById("newGame"),
    roundModal: document.getElementById("roundModal"),
    roundTitle: document.getElementById("roundTitle"),
    roundSummary: document.getElementById("roundSummary"),
    roundRewards: document.getElementById("roundRewards"),
    playAgain: document.getElementById("playAgain"),
    discardModal: document.getElementById("discardModal"),
    discardChoices: document.getElementById("discardChoices"),
    shopModal: document.getElementById("shopModal"),
    shopStatus: document.getElementById("shopStatus"),
    coinText: document.getElementById("coinText"),
    roundText: document.getElementById("roundText"),
    shopTimerText: document.getElementById("shopTimerText"),
    shopInventory: document.getElementById("shopInventory"),
    shopOffers: document.getElementById("shopOffers"),
    nextRound: document.getElementById("nextRound")
  };

  let state = null;
  let drag = null;
  let suppressClick = false;
  let modalAction = null;
  let fallbackFullscreen = false;
  let releasesLoaded = false;
  let selectedPlayType = "offline";
  let selectedMenuMode = "";
  let leaderboardMode = "crown";
  const authState = {
    mode: "login",
    token: "",
    expiresAt: "",
    user: null,
    busy: false,
    message: "",
    messageType: ""
  };
  const serverState = {
    status: "checking",
    label: "Checking server",
    detail: "Checking multiplayer server status."
  };
  const roomState = {
    room: null,
    mode: "",
    ready: false,
    busy: false,
    message: "",
    messageType: ""
  };
  let roomSocket = null;
  let onlineActionCounter = 0;
  let onlineTimerInterval = null;
  const audioState = {
    musicEnabled: false,
    sfxEnabled: false,
    initialized: false,
    musicTracks: [],
    currentMusicSrc: "",
    failedMusicTracks: new Set(),
    music: null,
    sfx: {},
    audioContext: null,
    unlocked: false,
    sfxBuffers: {},
    sfxBufferPromises: {}
  };

  try {
    const legacyAudio = localStorage.getItem("trashCardsAudio");
    const savedMusic = localStorage.getItem("trashCardsMusic");
    const savedSfx = localStorage.getItem("trashCardsSfx");
    audioState.musicEnabled = savedMusic === null ? legacyAudio === "on" : savedMusic === "on";
    audioState.sfxEnabled = savedSfx === null ? legacyAudio === "on" : savedSfx === "on";
  } catch (error) {
    audioState.musicEnabled = false;
    audioState.sfxEnabled = false;
  }

  function enablePerformanceMode() {
    const preference = getPerformancePreference();
    const lowCoreCount = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
    const mobileViewport = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldEnable = preference === "on" || (preference === "auto" && Boolean(lowCoreCount || lowMemory || mobileViewport || reducedMotion));
    document.body.classList.toggle("performance-mode", shouldEnable);
  }

  function getPerformancePreference() {
    try {
      const saved = localStorage.getItem(PERFORMANCE_STORAGE_KEY);
      return ["auto", "on", "off"].includes(saved) ? saved : "auto";
    } catch (error) {
      return "auto";
    }
  }

  function setPerformancePreference(value) {
    try {
      localStorage.setItem(PERFORMANCE_STORAGE_KEY, value);
    } catch (error) {
      // Ignore storage failure; the current session can still update the body class below.
    }
    enablePerformanceMode();
  }

  function getApiBase() {
    return PUBLIC_API_BASE;
  }

  function loadSavedAuth() {
    try {
      const saved = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
      if (saved && saved.token && saved.user) {
        authState.token = saved.token;
        authState.expiresAt = saved.expiresAt || "";
        authState.user = saved.user;
      }
    } catch (error) {
      clearAuthSession(false);
    }

    renderAuthUi();
    if (authState.token) {
      refreshAuthProfile(true);
    }
  }

  function persistAuthSession() {
    try {
      if (!authState.token || !authState.user) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        token: authState.token,
        expiresAt: authState.expiresAt,
        user: authState.user
      }));
    } catch (error) {
      // A failed save should not block local play.
    }
  }

  function setAuthSession(data) {
    authState.token = data.token || "";
    authState.expiresAt = data.expiresAt || "";
    authState.user = data.user || null;
    authState.message = authState.user ? `Signed in as ${authState.user.username}.` : "";
    authState.messageType = "";
    persistAuthSession();
    renderAuthUi();
    refreshOpenMenuState();
  }

  function clearAuthSession(render = true) {
    closeRoomSocket();
    authState.token = "";
    authState.expiresAt = "";
    authState.user = null;
    authState.message = "";
    authState.messageType = "";
    persistAuthSession();
    if (render) {
      renderAuthUi();
      renderAuthModal();
      refreshOpenMenuState();
    }
  }

  async function apiRequest(path, options = {}) {
    const base = getApiBase();
    const headers = {
      Accept: "application/json",
      ...(options.headers || {})
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (options.auth !== false && authState.token) {
      headers.Authorization = `Bearer ${authState.token}`;
    }

    let response;
    try {
      response = await fetch(`${base}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body)
      });
    } catch (error) {
      throw new Error("Account server is not reachable. Online features are unavailable right now.");
    }

    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = {};
      }
    }

    if (!response.ok) {
      const error = new Error(data.error || `Server returned ${response.status}.`);
      error.status = response.status;
      throw error;
    }

    return data;
  }

  function renderServerStatus() {
    if (!els.serverStatusButton || !els.serverStatusText) return;

    els.serverStatusButton.classList.toggle("checking", serverState.status === "checking");
    els.serverStatusButton.classList.toggle("online", serverState.status === "online");
    els.serverStatusButton.classList.toggle("offline", serverState.status === "offline");
    els.serverStatusText.textContent = serverState.label;
    els.serverStatusButton.title = serverState.detail;
    if (els.authModal && !els.authModal.classList.contains("hidden") && authState.user) {
      renderAuthModal();
    }
    refreshOpenMenuState();
  }

  async function checkServerStatus() {
    if (!els.serverStatusButton) return;

    if (navigator.onLine === false) {
      serverState.status = "offline";
      serverState.label = "Browser offline";
      serverState.detail = "Your browser says this device is offline.";
      renderServerStatus();
      return;
    }

    serverState.status = "checking";
    serverState.label = "Checking server";
    serverState.detail = "Checking multiplayer server status.";
    renderServerStatus();

    try {
      const status = await apiRequest("/api/status", { auth: false });
      const multiplayerOnline = Boolean(status.ok && status.multiplayer && status.multiplayer.online !== false);

      serverState.status = multiplayerOnline ? "online" : "offline";
      serverState.label = multiplayerOnline ? "Servers online" : "Servers limited";
      serverState.detail = multiplayerOnline
        ? "Online multiplayer services are reachable."
        : "The online service answered, but multiplayer is not reporting ready.";
    } catch (error) {
      serverState.status = "offline";
      serverState.label = "Servers offline";
      serverState.detail = error.message || "Multiplayer server is not reachable.";
    }

    renderServerStatus();
  }

  function modeLabel(mode) {
    return mode === "crown" ? "Crown Debt" : "Classic Trash";
  }

  function modeSummary(mode) {
    return mode === "crown"
      ? "Rounds, coins, a rarity shop, and one brutal comeback item."
      : "Race from 10 cards down to 1.";
  }

  function showPlayMenu(mode = "") {
    selectedMenuMode = mode;
    selectedPlayType = "offline";
    hideAllModals();
    renderPlayMenu("type");
    els.playModal.classList.remove("hidden");
  }

  function renderPlayMenu(step = "type") {
    const pickingType = step === "type";
    els.playTypePanel.hidden = !pickingType;
    els.playModePanel.hidden = pickingType;

    if (pickingType) {
      els.playTitle.textContent = selectedMenuMode ? `Play ${modeLabel(selectedMenuMode)}` : "Choose play type";
      els.playSummary.textContent = selectedMenuMode
        ? "Online is player-vs-player rooms. Offline is for local bot games."
        : "Online play can update leaderboards and levels. Offline play stays on this device.";
      return;
    }

    const online = selectedPlayType === "online";
    const signedIn = Boolean(authState.user && authState.token);
    const serverOnline = serverState.status === "online";
    els.playTitle.textContent = selectedMenuMode
      ? `${online ? "Online" : "Offline"} ${modeLabel(selectedMenuMode)}`
      : online ? "Online play" : "Offline play";
    els.playSummary.textContent = online
      ? "Online play uses player rooms. Bot matches stay offline."
      : "Offline matches are for practice and do not update levels or leaderboards.";
    els.onlineGate.hidden = !online;
    els.onlineRoomPanel.hidden = !online || !selectedMenuMode || !signedIn || !serverOnline;
    els.playChosenWrap.hidden = !selectedMenuMode || online;
    els.playModeChoices.hidden = Boolean(selectedMenuMode);
    if (selectedMenuMode) {
      els.chosenModeTitle.textContent = `Start ${modeLabel(selectedMenuMode)}`;
      els.chosenModeSummary.textContent = modeSummary(selectedMenuMode);
      els.playChosenButton.disabled = online;
    }
    document.querySelectorAll("[data-start-mode]").forEach((button) => {
      button.disabled = online && (!signedIn || !serverOnline);
    });

    if (online) {
      els.onlineAccountName.textContent = signedIn ? authState.user.username : "Not signed in";
      els.onlineGateText.textContent = serverOnline
        ? signedIn
          ? "Create a room or join a friend's code. Online games require a real player."
          : "Sign in to use online player rooms, levels, and global leaderboards."
        : "Online play is unavailable while the multiplayer server is offline.";
      els.onlineAuthButton.hidden = signedIn;
    }
    renderRoomUi();
  }

  function choosePlayType(type) {
    selectedPlayType = type;
    if (type !== "online") {
      closeRoomSocket();
    }
    renderPlayMenu("mode");
  }

  function startSelectedMode(mode) {
    const modeToStart = mode || selectedMenuMode || "classic";
    if (selectedPlayType === "online" && (!authState.token || !authState.user || serverState.status !== "online")) {
      renderPlayMenu("mode");
      return;
    }

    if (selectedPlayType === "online") {
      selectedMenuMode = modeToStart;
      roomState.mode = modeToStart;
      renderPlayMenu("mode");
      return;
    }

    startMatch(modeToStart, selectedPlayType);
  }

  function normalizeRoomCode(value) {
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  }

  function setRoomMessage(message, type = "") {
    roomState.message = message;
    roomState.messageType = type;
    renderRoomUi();
  }

  function roomSocketIsOpen() {
    return roomSocket && roomSocket.readyState === WebSocket.OPEN;
  }

  function roomSocketUrl(code) {
    const base = new URL(getApiBase());
    base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
    base.pathname = `${base.pathname.replace(/\/+$/, "")}/api/rooms/${code}/socket`;
    base.search = "";
    base.searchParams.set("token", authState.token);
    return base.toString();
  }

  function closeRoomSocket(clearRoom = true) {
    stopOnlineTimerLoop();
    if (roomSocket) {
      roomSocket.onopen = null;
      roomSocket.onmessage = null;
      roomSocket.onerror = null;
      roomSocket.onclose = null;
      roomSocket.close();
      roomSocket = null;
    }

    if (clearRoom) {
      roomState.room = null;
      roomState.ready = false;
      roomState.message = "";
      roomState.messageType = "";
      renderRoomUi();
    }
  }

  function renderRoomUi() {
    if (!els.onlineRoomPanel) return;

    const signedIn = Boolean(authState.user && authState.token);
    const canUseRooms = signedIn && serverState.status === "online" && !roomState.busy;
    const hasRoom = Boolean(roomState.room);

    els.onlineRoomPanel.hidden = selectedPlayType !== "online" || !selectedMenuMode || !signedIn || serverState.status !== "online";
    els.createRoomButton.disabled = !canUseRooms || hasRoom;
    els.joinRoomButton.disabled = !canUseRooms || hasRoom;
    els.joinRoomCode.disabled = !canUseRooms || hasRoom;
    els.roomLobby.hidden = !hasRoom;
    els.roomMessage.textContent = roomState.message;
    els.roomMessage.classList.toggle("error", roomState.messageType === "error");
    els.roomMessage.classList.toggle("success", roomState.messageType === "success");

    if (!hasRoom) return;

    const room = roomState.room;
    const players = room.players || [];
    els.roomCodeText.textContent = room.code || "------";
    els.roomPlayerList.replaceChildren(...[0, 1].map((index) => {
      const player = players[index];
      const row = document.createElement("div");
      const label = document.createElement("span");
      const name = document.createElement("strong");
      label.textContent = index === 0 ? "Player 1" : "Player 2";
      name.textContent = player ? `${player.username}${player.ready ? " - ready" : ""}` : "Waiting";
      row.append(label, name);
      return row;
    }));

    if (room.status === "active") {
      els.roomStatusText.textContent = "Both players are ready. Starting the player match...";
    } else if (players.length < 2) {
      els.roomStatusText.textContent = "Share this code with another player, then both players can ready up.";
    } else {
      els.roomStatusText.textContent = "Both players are connected. Press Ready when you are set.";
    }

    els.roomReadyButton.disabled = !roomSocketIsOpen();
    els.roomReadyButton.textContent = roomState.ready ? "Unready" : "Ready";
  }

  async function createOnlineRoom() {
    if (!selectedMenuMode || roomState.busy) return;

    roomState.busy = true;
    roomState.mode = selectedMenuMode;
    setRoomMessage("Creating player room...");

    try {
      const data = await apiRequest("/api/rooms", {
        method: "POST",
        body: { mode: selectedMenuMode }
      });
      connectOnlineRoom(data.room);
    } catch (error) {
      roomState.busy = false;
      setRoomMessage(error.message || "Could not create room.", "error");
    }
  }

  async function joinOnlineRoom() {
    const code = normalizeRoomCode(els.joinRoomCode.value);
    if (!code || roomState.busy) {
      setRoomMessage("Enter a room code first.", "error");
      return;
    }

    roomState.busy = true;
    setRoomMessage(`Joining room ${code}...`);

    try {
      const data = await apiRequest(`/api/rooms/${encodeURIComponent(code)}`, { auth: false });
      selectedMenuMode = data.room?.mode || selectedMenuMode || "classic";
      roomState.mode = selectedMenuMode;
      connectOnlineRoom(data.room);
    } catch (error) {
      roomState.busy = false;
      setRoomMessage(error.message || "Could not join room.", "error");
    }
  }

  function connectOnlineRoom(room) {
    const code = normalizeRoomCode(room?.code);
    if (!code) {
      roomState.busy = false;
      setRoomMessage("Room did not return a valid code.", "error");
      return;
    }

    closeRoomSocket(false);
    roomState.room = room;
    roomState.ready = false;
    renderPlayMenu("mode");
    maybeStartOnlineMatch(room);

    roomSocket = new WebSocket(roomSocketUrl(code));
    roomSocket.addEventListener("open", () => {
      roomState.busy = false;
      setRoomMessage(`Connected to room ${code}.`, "success");
    });
    roomSocket.addEventListener("message", (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data);
      } catch (error) {
        return;
      }

      if (payload.type === "room") {
        roomState.room = payload.room;
        renderRoomUi();
        maybeStartOnlineMatch(payload.room);
      } else if (payload.type === "action") {
        applyOnlineAction(payload);
      } else if (payload.type === "error") {
        setRoomMessage(payload.error || "Room error.", "error");
      }
    });
    roomSocket.addEventListener("error", () => {
      roomState.busy = false;
      setRoomMessage("Room connection failed.", "error");
    });
    roomSocket.addEventListener("close", () => {
      roomSocket = null;
      roomState.ready = false;
      if (roomState.room) {
        setRoomMessage("Disconnected from room.", "error");
      }
    });
  }

  function toggleRoomReady() {
    if (!roomSocketIsOpen()) return;
    roomState.ready = !roomState.ready;
    roomSocket.send(JSON.stringify({ type: "ready", ready: roomState.ready }));
    renderRoomUi();
  }

  function maybeStartOnlineMatch(room) {
    if (!room || room.status !== "active" || !authState.user) return;
    if (state && state.online && state.onlineRoom && state.onlineRoom.code === room.code) return;
    startOnlineMatch(room);
  }

  function startOnlineMatch(room) {
    const players = Array.isArray(room.players) ? room.players.filter((player) => player && player.userId) : [];
    const localSeat = players.findIndex((player) => player.userId === authState.user.id);
    if (localSeat < 0 || players.length < 2) return;

    const opponentSeat = localSeat === 0 ? 1 : 0;
    const localPlayer = players[localSeat];
    const opponentPlayer = players[opponentSeat];
    const mode = room.mode || roomState.mode || selectedMenuMode || "classic";

    unlockAudio();
    state = {
      mode,
      playType: "online",
      online: true,
      onlineRoom: {
        code: room.code,
        startedAt: room.startedAt || room.createdAt || "",
        localSeat,
        opponentSeat,
        localUserId: localPlayer.userId,
        opponentUserId: opponentPlayer.userId,
        players,
        processedActions: new Set()
      },
      round: 1,
      deck: [],
      discard: [],
      held: null,
      turn: human,
      phase: "draw",
      over: false,
      drawSource: null,
      turnPlacements: 0,
      matchStartedAt: Date.now(),
      pendingItem: null,
      pendingPurchase: null,
      shopOffers: [],
      shopLocked: false,
      shopReadySeats: [],
      shopDeadlineBySeat: [0, 0],
      timeoutMissesBySeat: [0, 0],
      timeoutChain: [],
      timeoutPenaltySeats: [],
      turnDeadlineAt: 0,
      turnTimerStartedAt: 0,
      matchEndReason: "",
      roundWinnerSeat: null,
      matchOver: false,
      recycleCount: 0,
      players: [createPlayer(localPlayer.username || "You"), createPlayer(opponentPlayer.username || "Opponent")]
    };
    state.players[human].seatIndex = localSeat;
    state.players[bot].seatIndex = opponentSeat;
    selectedPlayType = "online";
    selectedMenuMode = mode;
    roomState.busy = false;

    els.modeScreen.classList.add("hidden");
    els.gameShell.classList.remove("hidden");
    setAppHeight();
    hideAllModals();
    playMusic();
    startOnlineTimerLoop();
    startRound();
  }

  function onlineActorIndex(userId) {
    if (!state || !state.onlineRoom || !userId) return null;
    if (userId === state.onlineRoom.localUserId) return human;
    if (userId === state.onlineRoom.opponentUserId) return bot;
    return null;
  }

  function onlineSeatForPlayer(playerIndex) {
    return state?.players?.[playerIndex]?.seatIndex ?? playerIndex;
  }

  function onlinePlayerForSeat(seat) {
    return state?.players?.[playerIndexForSeat(seat)] || null;
  }

  function isOnlineCoordinator() {
    return Boolean(state && state.online && state.onlineRoom && state.onlineRoom.localSeat === 0);
  }

  function startOnlineTimerLoop() {
    if (onlineTimerInterval) return;
    onlineTimerInterval = window.setInterval(tickOnlineTimers, 250);
  }

  function stopOnlineTimerLoop() {
    if (!onlineTimerInterval) return;
    window.clearInterval(onlineTimerInterval);
    onlineTimerInterval = null;
  }

  function markOnlineActivity(playerIndex, options = {}) {
    if (!state || !state.online || state.matchOver) return;
    const seat = onlineSeatForPlayer(playerIndex);
    state.timeoutChain = [];

    if (options.shop) {
      ensureOnlineShopTimers(false);
      state.shopDeadlineBySeat[seat] = Date.now() + ONLINE_SHOP_MS;
      return;
    }

    if (state.players[state.turn]?.seatIndex === seat && !state.over) {
      startOnlineTurnTimer(playerIndex);
    }
  }

  function startOnlineTurnTimer(playerIndex = state?.turn) {
    if (!state || !state.online || state.over || state.matchOver) return;
    state.turnTimerStartedAt = Date.now();
    state.turnDeadlineAt = state.turnTimerStartedAt + ONLINE_TURN_MS;
  }

  function clearOnlineTurnTimer() {
    if (!state) return;
    state.turnDeadlineAt = 0;
    state.turnTimerStartedAt = 0;
  }

  function ensureOnlineShopTimers(reset = false) {
    if (!state || !state.online || !isCrownMode() || state.matchOver) return;
    if (!Array.isArray(state.shopReadySeats)) state.shopReadySeats = [];
    if (!Array.isArray(state.shopDeadlineBySeat)) state.shopDeadlineBySeat = [0, 0];
    const now = Date.now();
    [0, 1].forEach((seat) => {
      if (reset || !state.shopDeadlineBySeat[seat]) {
        state.shopDeadlineBySeat[seat] = now + ONLINE_SHOP_MS;
      }
    });
  }

  function resetOnlineShopFlow() {
    if (!state || !state.online) return;
    state.shopReadySeats = [];
    state.shopDeadlineBySeat = [0, 0];
  }

  function markShopReady(seat, ready = true) {
    if (!state || !state.online) return;
    const current = parseSeatList(state.shopReadySeats);
    state.shopReadySeats = ready
      ? parseSeatList([...current, seat])
      : current.filter((entry) => entry !== seat);
  }

  function localShopReady() {
    return Boolean(state && state.online && parseSeatList(state.shopReadySeats).includes(state.onlineRoom.localSeat));
  }

  function bothShopReady() {
    return Boolean(state && parseSeatList(state.shopReadySeats).length >= 2);
  }

  function handleOnlineShopReadyClick() {
    if (!state || !state.online || !isCrownMode() || state.matchOver || state.phase !== "over") {
      continueToNextRound();
      return;
    }
    const seat = state.onlineRoom.localSeat;
    markShopReady(seat, true);
    state.shopDeadlineBySeat[seat] = 0;
    els.shopStatus.textContent = "Ready. Waiting for the other player.";
    renderShop();
    renderTimerUi();
    sendOnlineAction("shopReady", { seat });
    maybeAdvanceOnlineShop("ready");
  }

  function maybeAdvanceOnlineShop(reason = "ready") {
    if (!state || !state.online || state.matchOver || state.phase !== "over") return;
    if (!bothShopReady()) return;
    if (!isOnlineCoordinator()) {
      setStatus("Both players are ready. Waiting for the room host to start the next round.");
      return;
    }
    state.shopReadySeats = [0, 1];
    state.shopDeadlineBySeat = [0, 0];
    continueToNextRound(reason);
  }

  function tickOnlineTimers() {
    renderTimerUi();
    if (!state || !state.online || state.matchOver || !isOnlineCoordinator()) return;

    const now = Date.now();
    if (!state.over && state.turnDeadlineAt && now >= state.turnDeadlineAt) {
      handleOnlineTurnTimeout();
      return;
    }

    if (state.phase === "over" && isCrownMode()) {
      handleOnlineShopTimeouts(now);
    }
  }

  function handleOnlineTurnTimeout() {
    if (!state || !state.online || state.matchOver) return;
    const timedOutPlayer = state.turn;
    const timedOutSeat = onlineSeatForPlayer(timedOutPlayer);
    noteOnlineTimeout(timedOutSeat);

    if (shouldEndForTimeouts()) {
      endOnlineTimeoutMatch(timeoutPenaltySeatsForEnd(), "turn-timeout");
      return;
    }

    if (state.phase === "place" && state.held) {
      state.discard.push(state.held);
      state.held = null;
      state.drawSource = null;
    }

    const nextSeat = timedOutSeat === 0 ? 1 : 0;
    state.turn = playerIndexForSeat(nextSeat);
    state.phase = "draw";
    state.turnPlacements = 0;
    state.drawSource = null;
    startOnlineTurnTimer(state.turn);
    setStatus(`${onlinePlayerForSeat(timedOutSeat)?.name || "Player"} timed out. Turn skipped.`);
    render();
    broadcastOnlineSnapshot("turnTimeout");
  }

  function handleOnlineShopTimeouts(now = Date.now()) {
    if (!state || !state.online || state.matchOver || state.phase !== "over") return;
    ensureOnlineShopTimers(false);
    const readySeats = parseSeatList(state.shopReadySeats);
    [0, 1].forEach((seat) => {
      if (readySeats.includes(seat)) return;
      const deadline = state.shopDeadlineBySeat[seat] || 0;
      if (!deadline || now < deadline) return;
      const playerIndex = playerIndexForSeat(seat);
      if (state.roundWinnerSeat === seat && state.players[playerIndex]?.items?.length >= 2) {
        discardWeakestItem(playerIndex);
      }
      noteOnlineTimeout(seat);
      markShopReady(seat, true);
      state.shopDeadlineBySeat[seat] = 0;
    });

    if (shouldEndForTimeouts()) {
      endOnlineTimeoutMatch(timeoutPenaltySeatsForEnd(), "shop-timeout");
      return;
    }

    if (bothShopReady()) {
      maybeAdvanceOnlineShop("shopTimeout");
    } else {
      broadcastOnlineSnapshot("shopTimeout");
    }
  }

  function noteOnlineTimeout(seat) {
    if (!state) return;
    state.timeoutMissesBySeat = parseSeatCounters(state.timeoutMissesBySeat);
    state.timeoutMissesBySeat[seat] += 1;
    const chain = Array.isArray(state.timeoutChain) ? state.timeoutChain : [];
    state.timeoutChain = [...chain, seat].slice(-2);
  }

  function shouldEndForTimeouts() {
    if (!state) return false;
    const misses = parseSeatCounters(state.timeoutMissesBySeat);
    if (misses.some((count) => count >= ONLINE_TIMEOUT_LIMIT)) return true;
    const chain = parseSeatList(state.timeoutChain);
    return chain.length >= 2 && chain.includes(0) && chain.includes(1);
  }

  function timeoutPenaltySeatsForEnd() {
    if (!state) return [];
    const misses = parseSeatCounters(state.timeoutMissesBySeat);
    const overLimit = [0, 1].filter((seat) => misses[seat] >= ONLINE_TIMEOUT_LIMIT);
    if (overLimit.length) return overLimit;
    const chain = parseSeatList(state.timeoutChain);
    return chain.length >= 2 && chain.includes(0) && chain.includes(1) ? [0, 1] : [];
  }

  function endOnlineTimeoutMatch(penaltySeats, reason = "timeout") {
    if (!state || !state.online || state.matchOver) return;
    const seats = parseSeatList(penaltySeats);
    state.matchOver = true;
    state.over = true;
    state.phase = "over";
    state.held = null;
    state.drawSource = null;
    state.timeoutPenaltySeats = seats;
    state.matchEndReason = reason;
    clearOnlineTurnTimer();
    state.shopDeadlineBySeat = [0, 0];
    state.shopReadySeats = [0, 1];
    render();
    showTimeoutModal(seats);
    sendOnlineAction("timeoutPenalty", {
      penaltyUserIds: seats
        .map((seat) => state.onlineRoom.players?.[seat]?.userId)
        .filter(Boolean),
      penaltySeats: seats,
      mode: isCrownMode() ? "crown" : "classic",
      reason,
      percent: ONLINE_TIMEOUT_PENALTY_PERCENT
    });
  }

  function showTimeoutModal(penaltySeats = []) {
    const names = parseSeatList(penaltySeats)
      .map((seat) => onlinePlayerForSeat(seat)?.name || `Player ${seat + 1}`)
      .join(" and ");
    const localPenalized = state?.onlineRoom && penaltySeats.includes(state.onlineRoom.localSeat);
    showRoundModal(
      "Match ended by inactivity.",
      names
        ? `${names} lost 5% of their saved points for repeated inactivity.`
        : "The room ended because players stopped making moves.",
      [],
      "Choose mode",
      () => showModeSelect()
    );
    if (localPenalized) window.setTimeout(() => refreshAuthProfile(true), 1500);
  }

  function renderTimerUi() {
    if (!els.timerPill) return;
    if (!state || !state.online || state.matchOver || state.phase === "over") {
      els.timerPill.hidden = true;
    } else {
      const seconds = Math.max(0, Math.ceil(((state.turnDeadlineAt || 0) - Date.now()) / 1000));
      els.timerPill.hidden = !state.turnDeadlineAt;
      els.timerPill.textContent = `${seconds}s`;
      els.timerPill.classList.toggle("warning", seconds <= 10 && seconds > 5);
      els.timerPill.classList.toggle("danger", seconds <= 5);
    }

    if (els.shopTimerText && state && state.online && state.phase === "over" && isCrownMode()) {
      const seat = state.onlineRoom.localSeat;
      const ready = localShopReady();
      const deadline = state.shopDeadlineBySeat?.[seat] || 0;
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      els.shopTimerText.textContent = ready ? "You are ready" : `Shop timer: ${seconds}s`;
    }
  }

  function sendOnlineAction(actionType, payload = {}) {
    if (!state || !state.online || !roomSocketIsOpen()) return;
    const actionId = `${authState.user?.id || "player"}:${Date.now()}:${onlineActionCounter += 1}`;
    state.onlineRoom?.processedActions?.add(actionId);
    roomSocket.send(JSON.stringify({
      type: "action",
      actionType,
      payload: {
        ...payload,
        actionId,
        snapshot: payload.snapshot === undefined ? makeOnlineSnapshot() : payload.snapshot
      }
    }));
  }

  function applyOnlineAction(message) {
    if (!state || !state.online || !message || !message.payload) return;
    const actionId = message.payload.actionId || `${message.userId || "unknown"}:${message.sequence || 0}`;
    const processed = state.onlineRoom?.processedActions;
    if (processed && processed.has(actionId)) return;
    if (processed) processed.add(actionId);

    const actorIndex = onlineActorIndex(message.userId);
    if (actorIndex === null || actorIndex === human) return;
    if (onlineSnapshotIsStale(message.payload.snapshot)) return;

    if (message.actionType === "sync") {
      applyOnlineSnapshot(message.payload.snapshot, message.userId);
      return;
    }

    if (message.actionType === "draw") {
      const source = message.payload.source === "discard" ? "discard" : "deck";
      const sourceRect = source === "discard" ? els.discardPile.getBoundingClientRect() : els.deckPile.getBoundingClientRect();
      drawFrom(source, sourceRect, actorIndex, false);
      setStatus(`${state.players[actorIndex].name} drew a card.`);
      applyOnlineSnapshot(message.payload.snapshot, message.userId);
      return;
    }

    if (message.actionType === "place") {
      placeHeld(Number(message.payload.index), currentRect(), actorIndex, false);
      if (!state.over) setStatus(`${state.players[actorIndex].name} is playing.`);
      applyOnlineSnapshot(message.payload.snapshot, message.userId);
      return;
    }

    if (message.actionType === "discard") {
      discardHeld(actorIndex, currentRect(), els.discardPile.getBoundingClientRect());
      finishOnlineTurn(actorIndex);
      applyOnlineSnapshot(message.payload.snapshot, message.userId);
      return;
    }

    if (message.actionType === "shopReady" || message.actionType === "timeoutPenalty") {
      applyOnlineSnapshot(message.payload.snapshot, message.userId);
      if (message.actionType === "shopReady") maybeAdvanceOnlineShop("remoteReady");
      return;
    }

    applyOnlineSnapshot(message.payload.snapshot, message.userId);
  }

  function broadcastOnlineSnapshot(reason = "sync") {
    if (!state || !state.online) return;
    sendOnlineAction("sync", {
      reason,
      snapshot: makeOnlineSnapshot()
    });
  }

  function cloneCard(card) {
    return card ? {
      rank: card.rank,
      suit: card.suit,
      value: card.value,
      red: Boolean(card.red)
    } : null;
  }

  function cloneCards(cards = []) {
    return cards.map(cloneCard).filter(Boolean);
  }

  function serializeSlot(slot) {
    return {
      card: cloneCard(slot.card),
      up: Boolean(slot.up),
      peeked: Boolean(slot.peeked)
    };
  }

  function deserializeSlot(slot) {
    return {
      card: cloneCard(slot && slot.card),
      up: Boolean(slot && slot.up),
      peeked: Boolean(slot && slot.peeked)
    };
  }

  function serializePlayer(player) {
    return {
      name: player.name,
      targetSize: player.targetSize,
      coins: player.coins,
      items: [...player.items],
      slots: player.slots.map(serializeSlot),
      maxChain: player.maxChain,
      discardPlace: Boolean(player.discardPlace),
      faceTrashed: Boolean(player.faceTrashed),
      itemUsedThisRound: Boolean(player.itemUsedThisRound),
      insuranceFraud: Boolean(player.insuranceFraud),
      doubleDown: Boolean(player.doubleDown),
      nextRoundSize: player.nextRoundSize,
      seatIndex: player.seatIndex
    };
  }

  function deserializePlayer(snapshotPlayer, fallbackPlayer, seatIndex) {
    const next = createPlayer(snapshotPlayer?.name || fallbackPlayer?.name || (seatIndex === 0 ? "Player 1" : "Player 2"));
    next.targetSize = clampClientNumber(snapshotPlayer?.targetSize, 1, 10, fallbackPlayer?.targetSize || 10);
    next.coins = clampClientNumber(snapshotPlayer?.coins, 0, 9999, fallbackPlayer?.coins || 0);
    next.items = Array.isArray(snapshotPlayer?.items) ? snapshotPlayer.items.filter((itemId) => ITEMS[itemId]).slice(0, 2) : [];
    next.slots = Array.isArray(snapshotPlayer?.slots) ? snapshotPlayer.slots.map(deserializeSlot) : [];
    next.maxChain = clampClientNumber(snapshotPlayer?.maxChain, 0, 99, fallbackPlayer?.maxChain || 0);
    next.discardPlace = Boolean(snapshotPlayer?.discardPlace);
    next.faceTrashed = Boolean(snapshotPlayer?.faceTrashed);
    next.itemUsedThisRound = Boolean(snapshotPlayer?.itemUsedThisRound);
    next.insuranceFraud = Boolean(snapshotPlayer?.insuranceFraud);
    next.doubleDown = Boolean(snapshotPlayer?.doubleDown);
    next.nextRoundSize = parseBoardSize(snapshotPlayer?.nextRoundSize);
    next.seatIndex = seatIndex;
    return next;
  }

  function clampClientNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(number)));
  }

  function parseSeat(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0 || number > 1) return null;
    return number;
  }

  function parseBoardSize(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 10) return null;
    return number;
  }

  function parseSeatList(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map(parseSeat).filter((seat) => seat !== null))];
  }

  function parseSeatCounters(value) {
    if (!Array.isArray(value)) return [0, 0];
    return [0, 1].map((seat) => clampClientNumber(value[seat], 0, 99, 0));
  }

  function parseSeatDeadlines(value) {
    if (!Array.isArray(value)) return [0, 0];
    return [0, 1].map((seat) => clampClientNumber(value[seat], 0, Number.MAX_SAFE_INTEGER, 0));
  }

  function onlineSnapshotIsStale(snapshot) {
    if (!snapshot || !state) return false;
    const snapshotRound = Number(snapshot.round);
    return Number.isFinite(snapshotRound) && snapshotRound < (state.round || 1);
  }

  function makeOnlineSnapshot() {
    if (!state || !state.online || !state.onlineRoom) return null;
    return {
      version: 1,
      roomCode: state.onlineRoom.code,
      mode: state.mode,
      round: state.round,
      deck: cloneCards(state.deck),
      discard: cloneCards(state.discard),
      held: cloneCard(state.held),
      turnSeat: state.players[state.turn]?.seatIndex ?? 0,
      phase: state.phase,
      over: Boolean(state.over),
      drawSource: state.drawSource,
      turnPlacements: state.turnPlacements,
      pendingItem: state.pendingItem,
      pendingPurchase: state.pendingPurchase,
      shopOffers: [...state.shopOffers],
      shopLocked: Boolean(state.shopLocked),
      shopReadySeats: parseSeatList(state.shopReadySeats),
      shopDeadlineBySeat: parseSeatDeadlines(state.shopDeadlineBySeat),
      timeoutMissesBySeat: parseSeatCounters(state.timeoutMissesBySeat),
      timeoutChain: parseSeatList(state.timeoutChain),
      timeoutPenaltySeats: parseSeatList(state.timeoutPenaltySeats),
      turnDeadlineAt: clampClientNumber(state.turnDeadlineAt, 0, Number.MAX_SAFE_INTEGER, 0),
      turnTimerStartedAt: clampClientNumber(state.turnTimerStartedAt, 0, Number.MAX_SAFE_INTEGER, 0),
      matchEndReason: state.matchEndReason || "",
      roundWinnerSeat: state.roundWinnerSeat,
      matchOver: Boolean(state.matchOver),
      recycleCount: state.recycleCount || 0,
      players: [0, 1].map((seatIndex) => serializePlayer(state.players[playerIndexForSeat(seatIndex)]))
    };
  }

  function applyOnlineSnapshot(snapshot, senderUserId = "") {
    if (!snapshot || !state || !state.online || !state.onlineRoom) return false;
    if (snapshot.roomCode && snapshot.roomCode !== state.onlineRoom.code) return false;

    const localSeat = state.onlineRoom.localSeat;
    const opponentSeat = state.onlineRoom.opponentSeat;
    const currentRoom = state.onlineRoom;
    const processedActions = currentRoom.processedActions || new Set();
    const previousPhase = state.phase;
    const previousRound = state.round;
    const snapshotRound = clampClientNumber(snapshot.round, 1, 99, state.round || 1);
    if (snapshotRound < (state.round || 1)) return false;

    state.mode = snapshot.mode || state.mode;
    state.round = snapshotRound;
    state.deck = cloneCards(snapshot.deck);
    state.discard = cloneCards(snapshot.discard);
    state.held = cloneCard(snapshot.held);
    state.turn = playerIndexForSeat(clampClientNumber(snapshot.turnSeat, 0, 1, 0));
    state.phase = typeof snapshot.phase === "string" ? snapshot.phase : state.phase;
    state.over = Boolean(snapshot.over);
    state.drawSource = snapshot.drawSource || null;
    state.turnPlacements = clampClientNumber(snapshot.turnPlacements, 0, 99, 0);
    state.pendingItem = snapshot.pendingItem || null;
    state.pendingPurchase = snapshot.pendingPurchase || null;
    state.shopOffers = Array.isArray(snapshot.shopOffers) ? snapshot.shopOffers.filter((itemId) => ITEMS[itemId]) : [];
    state.shopLocked = Boolean(snapshot.shopLocked);
    state.shopReadySeats = parseSeatList(snapshot.shopReadySeats);
    state.shopDeadlineBySeat = parseSeatDeadlines(snapshot.shopDeadlineBySeat);
    state.timeoutMissesBySeat = parseSeatCounters(snapshot.timeoutMissesBySeat);
    state.timeoutChain = parseSeatList(snapshot.timeoutChain);
    state.timeoutPenaltySeats = parseSeatList(snapshot.timeoutPenaltySeats);
    state.turnDeadlineAt = clampClientNumber(snapshot.turnDeadlineAt, 0, Number.MAX_SAFE_INTEGER, 0);
    state.turnTimerStartedAt = clampClientNumber(snapshot.turnTimerStartedAt, 0, Number.MAX_SAFE_INTEGER, 0);
    state.matchEndReason = snapshot.matchEndReason || "";
    state.roundWinnerSeat = parseSeat(snapshot.roundWinnerSeat);
    state.matchOver = Boolean(snapshot.matchOver);
    state.recycleCount = clampClientNumber(snapshot.recycleCount, 0, 999, state.recycleCount || 0);
    state.players[human] = deserializePlayer(snapshot.players?.[localSeat], state.players[human], localSeat);
    state.players[bot] = deserializePlayer(snapshot.players?.[opponentSeat], state.players[bot], opponentSeat);
    state.onlineRoom = {
      ...currentRoom,
      processedActions
    };

    if (state.phase !== previousPhase || state.round !== previousRound || state.phase === "draw") {
      hideAllModals();
    }

    if (state.phase === "over") {
      setStatus("Round synced. Continue when both players are ready.");
    } else if (state.turn === human && state.phase === "draw") {
      setStatus("Your turn. Draw a card, then drag it to a slot or discard.");
    } else if (state.turn === human && state.phase === "place" && state.held) {
      afterDraw(human, false);
    } else if (senderUserId) {
      setStatus(`${state.players[bot].name} synced the table.`);
    }

    render();
    if (state.matchOver && state.matchEndReason && state.matchEndReason.includes("timeout")) {
      showTimeoutModal(state.timeoutPenaltySeats);
    } else if (state.phase === "over" && endRoundUiIsHidden()) {
      showSyncedEndRoundUi();
    } else if (!els.shopModal.classList.contains("hidden")) {
      renderShop();
    }
    return true;
  }

  function showLeaderboard() {
    hideAllModals();
    els.leaderboardModal.classList.remove("hidden");
    loadLeaderboard(leaderboardMode);
  }

  async function loadLeaderboard(mode = leaderboardMode) {
    leaderboardMode = mode;
    els.leaderboardTabs.forEach((button) => {
      button.classList.toggle("active", button.dataset.leaderboardMode === mode);
    });
    els.leaderboardStatus.textContent = "Loading leaderboard...";
    els.leaderboardList.replaceChildren();

    if (serverState.status !== "online") {
      els.leaderboardStatus.textContent = "Global leaderboard is only available when online servers are reachable.";
      return;
    }

    try {
      const data = await apiRequest(`/api/leaderboard?mode=${encodeURIComponent(mode)}&limit=10`, { auth: false });
      renderLeaderboard(data.leaderboard || []);
    } catch (error) {
      els.leaderboardStatus.textContent = error.message || "Could not load leaderboard.";
    }
  }

  function renderLeaderboard(rows) {
    if (!rows.length) {
      els.leaderboardStatus.textContent = "No online scores yet.";
      return;
    }

    els.leaderboardStatus.textContent = "";
    els.leaderboardList.replaceChildren(...rows.map((row) => {
      const item = document.createElement("div");
      item.className = "leaderboard-row";

      const rank = document.createElement("span");
      rank.className = "leaderboard-rank";
      rank.textContent = `#${row.rank}`;

      const name = document.createElement("span");
      name.className = "leaderboard-name";
      name.textContent = row.username || "Player";

      const meta = document.createElement("span");
      meta.className = "leaderboard-meta";
      meta.textContent = `Lv ${playerLevel(row.stats)} - ${row.stats?.wins || 0}W - ${row.stats?.coins || 0}c`;

      item.append(rank, name, meta);
      return item;
    }));
  }

  function playerLevel(stats = {}) {
    const xp = (stats.wins || 0) * 100 + (stats.matches || 0) * 20 + (stats.coins || 0);
    return Math.max(1, Math.floor(xp / 120) + 1);
  }

  function showSettings() {
    hideAllModals();
    renderSettings();
    els.settingsModal.classList.remove("hidden");
  }

  function renderSettings() {
    els.settingsMusic.textContent = `Music: ${audioState.musicEnabled ? "On" : "Off"}`;
    els.settingsSfx.textContent = `SFX: ${audioState.sfxEnabled ? "On" : "Off"}`;
    els.settingsFullscreen.textContent = fullscreenElement() || fallbackFullscreen ? "Exit fullscreen" : "Open fullscreen";
    if (els.settingsPerformance) {
      const preference = getPerformancePreference();
      const active = document.body.classList.contains("performance-mode");
      els.settingsPerformance.textContent = `Performance: ${preference === "auto" ? `Auto (${active ? "On" : "Off"})` : preference === "on" ? "On" : "Off"}`;
    }
  }

  function cyclePerformanceMode() {
    const current = getPerformancePreference();
    const next = current === "auto" ? "on" : current === "on" ? "off" : "auto";
    setPerformancePreference(next);
    renderSettings();
  }

  function refreshOpenMenuState() {
    if (els.playModal && !els.playModal.classList.contains("hidden") && !els.playModePanel.hidden) {
      renderPlayMenu("mode");
    }
  }

  function setAuthMode(mode) {
    authState.mode = mode;
    authState.message = "";
    authState.messageType = "";
    renderAuthModal();
  }

  function showAuth() {
    hideAllModals();
    renderAuthModal();
    els.authModal.classList.remove("hidden");
    if (!authState.user) {
      window.setTimeout(() => els.authUsername.focus(), 80);
    }
  }

  function renderAuthUi() {
    if (!els.accountButton) return;

    const signedIn = Boolean(authState.user);
    const username = signedIn ? authState.user.username : "";
    els.accountButton.classList.toggle("signed-in", signedIn);
    els.accountButton.textContent = signedIn ? `Account: ${trimButtonLabel(username)}` : "Account";
    els.accountButton.title = signedIn ? `Signed in as ${username}` : "Sign in or create account";
  }

  function renderAuthModal() {
    if (!els.authModal) return;

    const signedIn = Boolean(authState.user && authState.token);
    els.authTitle.textContent = signedIn ? "Account" : authState.mode === "signup" ? "Create account" : "Sign in";
    els.authIntro.textContent = signedIn
      ? "Your account is ready for saved results, leaderboards, and multiplayer."
      : "Sign in to save match results and get ready for online leaderboards.";
    els.authForm.hidden = signedIn;
    els.authProfile.hidden = !signedIn;
    els.authLoginTab.classList.toggle("active", authState.mode === "login");
    els.authSignupTab.classList.toggle("active", authState.mode === "signup");
    els.authUsername.disabled = authState.busy;
    els.authPassword.disabled = authState.busy;
    els.authSubmit.disabled = authState.busy;
    els.authSubmit.textContent = authState.busy
      ? "Working..."
      : authState.mode === "signup"
        ? "Create account"
        : "Sign in";
    els.authPassword.autocomplete = authState.mode === "signup" ? "new-password" : "current-password";
    els.authMessage.textContent = authState.message;
    els.authMessage.classList.toggle("error", authState.messageType === "error");

    if (signedIn) {
      els.authProfileName.textContent = authState.user.username;
      renderAccountPage();
    }
  }

  function renderAccountPage() {
    const stats = authState.user?.stats || {};
    const total = combinedStats(stats);
    const createdAt = formatDate(authState.user?.createdAt);
    const lastLoginAt = formatDate(authState.user?.lastLoginAt);

    els.authAccountMeta.textContent = `Player ID ${shortId(authState.user?.id)}${createdAt ? ` - Joined ${createdAt}` : ""}`;
    els.authServerPill.textContent = serverState.status === "online" ? "Server online" : "Server offline";
    els.authServerPill.classList.toggle("offline", serverState.status !== "online");
    els.authSummary.replaceChildren(
      accountSummaryCard("Level", playerLevel(total)),
      accountSummaryCard("Matches", total.matches || 0),
      accountSummaryCard("Wins", total.wins || 0),
      accountSummaryCard("Win rate", `${winRate(total)}%`)
    );
    els.authAccountInfo.replaceChildren(
      accountInfoRow("Username", authState.user?.username || "Player"),
      accountInfoRow("Account ID", authState.user?.id || "Unknown"),
      accountInfoRow("Created", createdAt || "Unknown"),
      accountInfoRow("Last login", lastLoginAt || "Unknown")
    );
    els.authProfileStats.replaceChildren(
      profileStatCard("Crown Debt", stats.crown),
      profileStatCard("Classic", stats.classic)
    );
    if (els.authRefresh) {
      els.authRefresh.disabled = authState.busy;
      els.authRefresh.textContent = authState.busy ? "Refreshing..." : "Refresh account";
    }
  }

  function combinedStats(stats = {}) {
    const classic = stats.classic || {};
    const crown = stats.crown || {};
    return {
      matches: (classic.matches || 0) + (crown.matches || 0),
      wins: (classic.wins || 0) + (crown.wins || 0),
      losses: (classic.losses || 0) + (crown.losses || 0),
      coins: (classic.coins || 0) + (crown.coins || 0),
      rounds: (classic.rounds || 0) + (crown.rounds || 0),
      bestWinStreak: Math.max(classic.bestWinStreak || 0, crown.bestWinStreak || 0),
      currentWinStreak: Math.max(classic.currentWinStreak || 0, crown.currentWinStreak || 0)
    };
  }

  function winRate(stats = {}) {
    const matches = stats.matches || 0;
    return matches ? Math.round(((stats.wins || 0) / matches) * 100) : 0;
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function shortId(value) {
    return value ? String(value).slice(0, 8) : "unknown";
  }

  function accountSummaryCard(label, value) {
    const card = document.createElement("div");
    card.className = "account-summary-card";
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    card.append(labelEl, valueEl);
    return card;
  }

  function accountInfoRow(label, value) {
    const row = document.createElement("div");
    row.className = "account-info-row";
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    row.append(labelEl, valueEl);
    return row;
  }

  function profileStatCard(label, stats = {}) {
    const card = document.createElement("div");
    card.className = "profile-stat";

    const title = document.createElement("span");
    title.textContent = label;

    const record = document.createElement("strong");
    record.textContent = `Lv ${playerLevel(stats)} - ${stats.wins || 0}W / ${stats.losses || 0}L`;

    const details = document.createElement("small");
    details.textContent = `${stats.matches || 0} matches - ${stats.coins || 0}c - ${stats.rounds || 0} rounds - best streak ${stats.bestWinStreak || 0}`;

    card.append(title, record, details);
    return card;
  }

  function trimButtonLabel(value) {
    return value.length > 12 ? `${value.slice(0, 12)}...` : value;
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (authState.busy) return;

    const username = els.authUsername.value.trim();
    const password = els.authPassword.value;
    authState.busy = true;
    authState.message = "";
    authState.messageType = "";
    renderAuthModal();

    try {
      const endpoint = authState.mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const data = await apiRequest(endpoint, {
        method: "POST",
        auth: false,
        body: { username, password }
      });
      setAuthSession(data);
      els.authPassword.value = "";
    } catch (error) {
      authState.message = error.message || "Account request failed.";
      authState.messageType = "error";
    } finally {
      authState.busy = false;
      renderAuthModal();
    }
  }

  async function refreshAuthProfile(silent = false) {
    if (!authState.token) return;

    if (!silent) {
      authState.busy = true;
      authState.message = "Refreshing account...";
      authState.messageType = "";
      renderAuthModal();
    }

    try {
      const data = await apiRequest("/api/me");
      authState.user = data.user || authState.user;
      if (!silent) {
        authState.message = "Account is up to date.";
        authState.messageType = "";
      }
      persistAuthSession();
      renderAuthUi();
      renderAuthModal();
      refreshOpenMenuState();
    } catch (error) {
      if (error.status === 401) {
        clearAuthSession();
        return;
      }

      if (!silent) {
        authState.message = error.message || "Could not refresh account.";
        authState.messageType = "error";
        renderAuthModal();
      }
    } finally {
      if (!silent) {
        authState.busy = false;
        renderAuthModal();
      }
    }
  }

  async function logoutAuth() {
    const hadToken = Boolean(authState.token);
    if (hadToken) {
      try {
        await apiRequest("/api/auth/logout", { method: "POST" });
      } catch (error) {
        // Local logout should still work if the server is offline.
      }
    }

    clearAuthSession();
    authState.mode = "login";
    authState.message = "Signed out.";
    els.authPassword.value = "";
    renderAuthModal();
  }

  async function submitMatchResult(winner) {
    if (!state || !state.online || !authState.token) return;
    if (state.players[bot]?.name === "Bot") return;

    const payload = {
      mode: isCrownMode() ? "crown" : "classic",
      result: winner === human ? "win" : "loss",
      coins: state.players[human].coins || 0,
      rounds: state.round || 1,
      opponentType: "player",
      durationMs: Math.max(0, Date.now() - (state.matchStartedAt || Date.now()))
    };

    try {
      const data = await apiRequest("/api/matches", {
        method: "POST",
        body: payload
      });
      authState.user ||= {};
      authState.user.stats ||= {};
      authState.user.stats[payload.mode] = data.stats;
      persistAuthSession();
      renderAuthUi();
      refreshOpenMenuState();
    } catch (error) {
      console.warn("Could not submit match result.", error);
    }
  }

  function setAppHeight() {
    const visualHeight = window.visualViewport && window.visualViewport.height;
    const visualWidth = window.visualViewport && window.visualViewport.width;
    const height = Math.max(1, Math.round(visualHeight || window.innerHeight || document.documentElement.clientHeight));
    const width = Math.max(1, Math.round(visualWidth || window.innerWidth || document.documentElement.clientWidth));
    const landscape = width >= height;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const hoverNone = window.matchMedia("(hover: none)").matches;
    const compactViewport = Math.min(width, height) <= 720 || Math.max(width, height) <= 1100;
    const mobileMode = coarsePointer || hoverNone || compactViewport;
    const designWidth = mobileMode ? (landscape ? 1920 : 1080) : width;
    const designHeight = mobileMode ? (landscape ? 1080 : 1920) : height;
    const stageScale = mobileMode ? Math.min(width / designWidth, height / designHeight) : 1;
    const stageWidth = Math.floor(designWidth * stageScale);
    const stageHeight = Math.floor(designHeight * stageScale);
    const buttonTarget = landscape ? 54 : 44;
    const buttonMin = landscape ? 86 : 112;
    const buttonMax = landscape ? 150 : 130;
    const mobileButtonSize = Math.round(Math.min(buttonMax, Math.max(buttonMin, buttonTarget / Math.max(stageScale, 0.01))));

    document.documentElement.style.setProperty("--app-width", `${width}px`);
    document.documentElement.style.setProperty("--app-height", `${height}px`);
    document.documentElement.style.setProperty("--design-width", `${designWidth}px`);
    document.documentElement.style.setProperty("--design-height", `${designHeight}px`);
    document.documentElement.style.setProperty("--stage-scale", stageScale.toFixed(5));
    document.documentElement.style.setProperty("--stage-width", `${stageWidth}px`);
    document.documentElement.style.setProperty("--stage-height", `${stageHeight}px`);
    document.documentElement.style.setProperty("--mobile-button-size", `${mobileButtonSize}px`);
    document.body.classList.toggle("stage-landscape", landscape);
    document.body.classList.toggle("stage-portrait", !landscape);
    document.body.classList.toggle("mobile-mode", mobileMode);
    document.body.classList.toggle("desktop-mode", !mobileMode);
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
  }

  function makeAudio(src, loop = false, volume = 0.5) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.loop = loop;
    audio.volume = volume;
    return audio;
  }

  function makeSfxPool(name) {
    const count = name === "draw" || name === "place" || name === "discard" ? SFX_POOL_SIZE : 2;
    return Array.from({ length: count }, () => makeAudio(AUDIO_FILES[name], false, AUDIO_VOLUMES[name]));
  }

  function normalizeMusicTrack(src) {
    const track = src.trim();
    if (/^(https?:)?\/\//.test(track) || track.startsWith("/") || track.startsWith("assets/")) return track;
    return `${MUSIC_FOLDER}${track}`;
  }

  function configuredMusicTracks() {
    const playlist = Array.isArray(window.TRASH_MUSIC_PLAYLIST) ? window.TRASH_MUSIC_PLAYLIST : [];
    const tracks = playlist
      .filter((track) => typeof track === "string" && track.trim())
      .map(normalizeMusicTrack);
    return tracks.length ? tracks : [AUDIO_FILES.music];
  }

  function initAudio() {
    if (audioState.initialized || typeof Audio === "undefined") return;
    audioState.musicTracks = configuredMusicTracks();
    Object.keys(AUDIO_FILES).forEach((key) => {
      if (key === "music" || !AUDIO_FILES[key]) return;
      audioState.sfx[key] = makeSfxPool(key);
    });
    audioState.initialized = true;
  }

  function audioContext() {
    if (audioState.audioContext) return audioState.audioContext;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      audioState.audioContext = new Context();
    } catch (error) {
      audioState.audioContext = null;
    }
    return audioState.audioContext;
  }

  function resumeAudioContext() {
    const context = audioContext();
    if (!context) return;
    if (context.state === "suspended" && typeof context.resume === "function") {
      context.resume().catch(() => {});
    }
  }

  function decodeAudio(context, data) {
    return new Promise((resolve, reject) => {
      const copy = data.slice(0);
      const done = (buffer) => resolve(buffer);
      const fail = () => reject(new Error("Audio decode failed"));
      const result = context.decodeAudioData(copy, done, fail);
      if (result && typeof result.then === "function") result.then(done).catch(fail);
    });
  }

  function loadSfxBuffer(name) {
    const src = AUDIO_FILES[name];
    const context = audioContext();
    if (!src || !context || typeof fetch !== "function") return null;
    if (audioState.sfxBuffers[src]) return Promise.resolve(audioState.sfxBuffers[src]);
    if (audioState.sfxBufferPromises[src]) return audioState.sfxBufferPromises[src];

    audioState.sfxBufferPromises[src] = fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error("SFX fetch failed");
        return response.arrayBuffer();
      })
      .then((data) => decodeAudio(context, data))
      .then((buffer) => {
        audioState.sfxBuffers[src] = buffer;
        return buffer;
      })
      .catch(() => null);
    return audioState.sfxBufferPromises[src];
  }

  function warmSfx() {
    if (!audioState.sfxEnabled) return;
    initAudio();
    resumeAudioContext();
    Object.keys(audioState.sfx).forEach((name) => {
      audioState.sfx[name].forEach((clip) => {
        try {
          clip.load();
        } catch (error) {
          // Some mobile browsers ignore manual SFX preloads.
        }
      });
      loadSfxBuffer(name);
    });
  }

  function unlockAudio() {
    initAudio();
    resumeAudioContext();
    const context = audioContext();
    if (context && !audioState.unlocked) {
      try {
        const source = context.createBufferSource();
        source.buffer = context.createBuffer(1, 1, context.sampleRate);
        source.connect(context.destination);
        source.start(0);
        audioState.unlocked = true;
      } catch (error) {
        audioState.unlocked = false;
      }
    }
    warmSfx();
  }

  function saveAudioPreference() {
    try {
      localStorage.setItem("trashCardsMusic", audioState.musicEnabled ? "on" : "off");
      localStorage.setItem("trashCardsSfx", audioState.sfxEnabled ? "on" : "off");
    } catch (error) {
      // Audio still works without saved preferences.
    }
  }

  function syncAudioButton(button, label, enabled) {
    if (!button) return;
    button.classList.toggle("audio-on", enabled);
    button.title = `${label} ${enabled ? "on" : "off"}`;
    button.setAttribute("aria-label", `${label} ${enabled ? "on" : "off"}`);
  }

  function syncAudioUi() {
    syncAudioButton(els.musicButton, "Music", audioState.musicEnabled);
    syncAudioButton(els.sfxButton, "SFX", audioState.sfxEnabled);
    if (els.settingsModal && !els.settingsModal.classList.contains("hidden")) renderSettings();
  }

  function chooseMusicTrack() {
    const available = audioState.musicTracks.filter((track) => !audioState.failedMusicTracks.has(track));
    if (!available.length) return "";
    if (available.length === 1) return available[0];

    const choices = available.filter((track) => track !== audioState.currentMusicSrc);
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function stopMusicTrack() {
    if (!audioState.music) return;
    audioState.music.pause();
    audioState.music = null;
  }

  function startMusicTrack(src) {
    if (!src) return;
    stopMusicTrack();
    audioState.currentMusicSrc = src;
    const trackAudio = makeAudio(src, false, AUDIO_VOLUMES.music);
    audioState.music = trackAudio;
    trackAudio.addEventListener("ended", () => {
      if (audioState.music === trackAudio) playNextMusic();
    });
    trackAudio.addEventListener("error", () => {
      if (audioState.music !== trackAudio) return;
      audioState.failedMusicTracks.add(src);
      playNextMusic();
    });
    trackAudio.play().catch(() => {});
  }

  function playNextMusic() {
    if (!audioState.musicEnabled) return;
    initAudio();
    startMusicTrack(chooseMusicTrack());
  }

  function playMusic() {
    if (!audioState.musicEnabled) return;
    initAudio();
    if (audioState.music) {
      audioState.music.play().catch(() => {});
      return;
    }
    playNextMusic();
  }

  function pauseMusic() {
    if (audioState.music) audioState.music.pause();
  }

  function toggleMusic() {
    audioState.musicEnabled = !audioState.musicEnabled;
    saveAudioPreference();
    syncAudioUi();
    if (audioState.musicEnabled) {
      playMusic();
    } else {
      pauseMusic();
    }
  }

  function toggleSfx() {
    audioState.sfxEnabled = !audioState.sfxEnabled;
    saveAudioPreference();
    syncAudioUi();
    if (audioState.sfxEnabled) unlockAudio();
  }

  function sfxPlaybackRate(name) {
    if (!PITCHED_SFX.has(name)) return 1;
    return 1 + (Math.random() * 2 - 1) * CARD_SFX_PITCH_VARIANCE;
  }

  function applyAudioPitch(clip, rate) {
    try {
      clip.playbackRate = rate;
      clip.preservesPitch = false;
      clip.mozPreservesPitch = false;
      clip.webkitPreservesPitch = false;
    } catch (error) {
      // Pitch changes are best effort on older mobile browsers.
    }
  }

  function playSfx(name) {
    if (!audioState.sfxEnabled) return;
    initAudio();
    resumeAudioContext();

    const src = AUDIO_FILES[name];
    const context = audioContext();
    const buffer = src && audioState.sfxBuffers[src];
    const rate = sfxPlaybackRate(name);
    if (context && buffer) {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.playbackRate.value = rate;
      gain.gain.value = AUDIO_VOLUMES[name] || 0.5;
      source.connect(gain);
      gain.connect(context.destination);
      source.start(0);
      return;
    }

    loadSfxBuffer(name);
    const pool = audioState.sfx[name];
    if (!pool || !pool.length) return;
    const clip = pool.find((candidate) => candidate.paused || candidate.ended) || pool[0];
    try {
      clip.pause();
      clip.currentTime = 0;
    } catch (error) {
      // The fallback audio tag may be locked until the next user gesture.
    }
    applyAudioPitch(clip, rate);
    clip.volume = AUDIO_VOLUMES[name] || 0.5;
    clip.play().catch(() => {});
  }

  function syncFullscreenUi() {
    const active = Boolean(fullscreenElement()) || fallbackFullscreen;
    document.body.classList.toggle("fullscreen-mode", active);

    if (els.fullscreenButton) {
      els.fullscreenButton.textContent = active ? "↙" : "⛶";
      els.fullscreenButton.title = active ? "Exit fullscreen" : "Fullscreen";
      els.fullscreenButton.setAttribute("aria-label", active ? "Exit fullscreen" : "Fullscreen");
    }

    if (els.modeFullscreen) {
      els.modeFullscreen.textContent = active ? "Exit fullscreen" : "Fullscreen";
    }

    if (els.settingsModal && !els.settingsModal.classList.contains("hidden")) renderSettings();
    setAppHeight();
    window.setTimeout(setAppHeight, 90);
  }

  async function openFullscreen() {
    fallbackFullscreen = false;
    setAppHeight();
    const root = document.documentElement;
    const request = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;

    if (request) {
      try {
        await request.call(root, { navigationUI: "hide" });
      } catch (firstError) {
        try {
          await request.call(root);
        } catch (secondError) {
          fallbackFullscreen = true;
          if (state) setStatus("Fullscreen was blocked, so the board was fitted to this screen.");
        }
      }
    } else {
      fallbackFullscreen = true;
      if (state) setStatus("Fullscreen is not supported here, so the board was fitted to this screen.");
    }

    syncFullscreenUi();
  }

  async function closeFullscreen() {
    fallbackFullscreen = false;
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (fullscreenElement() && exit) {
      try {
        await exit.call(document);
      } catch (error) {
        fallbackFullscreen = false;
      }
    }
    syncFullscreenUi();
  }

  function toggleFullscreen() {
    if (fullscreenElement() || fallbackFullscreen) {
      closeFullscreen();
      return;
    }
    openFullscreen();
  }

  function createPlayer(name) {
    return {
      name,
      targetSize: 10,
      coins: 0,
      items: [],
      slots: [],
      maxChain: 0,
      discardPlace: false,
      faceTrashed: false,
      itemUsedThisRound: false,
      insuranceFraud: false,
      doubleDown: false,
      nextRoundSize: null
    };
  }

  function startMatch(mode, playType = "offline") {
    if (playType === "online") {
      selectedPlayType = "online";
      selectedMenuMode = mode || selectedMenuMode || "classic";
      renderPlayMenu("mode");
      return;
    }

    unlockAudio();
    state = {
      mode,
      playType,
      online: playType === "online",
      round: 1,
      deck: [],
      discard: [],
      held: null,
      turn: human,
      phase: "draw",
      over: false,
      drawSource: null,
      turnPlacements: 0,
      matchStartedAt: Date.now(),
      pendingItem: null,
      pendingPurchase: null,
      shopOffers: [],
      shopLocked: false,
      shopReadySeats: [],
      shopDeadlineBySeat: [0, 0],
      timeoutMissesBySeat: [0, 0],
      timeoutChain: [],
      timeoutPenaltySeats: [],
      turnDeadlineAt: 0,
      turnTimerStartedAt: 0,
      matchEndReason: "",
      roundWinnerSeat: null,
      matchOver: false,
      players: [createPlayer("You"), createPlayer("Bot")]
    };
    els.modeScreen.classList.add("hidden");
    els.gameShell.classList.remove("hidden");
    setAppHeight();
    hideAllModals();
    playMusic();
    startRound();
  }

  function startRound() {
    const deck = makeDeck(state && state.online ? seededRandom(onlineRoundSeed("deck")) : Math.random);
    const roundSizes = state.players.map((player) => player.nextRoundSize || player.targetSize);
    state.deck = deck;
    state.discard = [];
    state.held = null;
    state.turn = state.online ? playerIndexForSeat(0) : human;
    state.phase = "draw";
    state.over = false;
    state.drawSource = null;
    state.turnPlacements = 0;
    state.pendingItem = null;
    if (state.online) resetOnlineShopFlow();
    state.roundWinnerSeat = null;
    state.matchOver = false;
    state.matchEndReason = "";
    state.timeoutPenaltySeats = [];
    state.recycleCount = 0;
    state.players.forEach((player) => {
      player.slots = [];
      player.maxChain = 0;
      player.discardPlace = false;
      player.faceTrashed = false;
      player.itemUsedThisRound = false;
    });
    if (state.online) {
      dealOnlineSlots(deck, roundSizes);
    } else {
      state.players.forEach((player, index) => {
        player.slots = dealSlots(deck, roundSizes[index]);
      });
    }
    state.players.forEach((player) => {
      player.nextRoundSize = null;
    });
    state.discard.push(drawDeckCard());
    if (state.online) startOnlineTurnTimer(state.turn);
    hideAllModals();
    setStatus(state.turn === human ? "Draw a card, then drag it to a slot or discard." : `${state.players[bot].name} starts. Waiting for their move.`);
    render();
  }

  function makeDeck(random = Math.random) {
    const deck = [];
    for (const suit of suits) {
      ranks.forEach((rank, index) => {
        deck.push({
          rank,
          suit,
          value: index + 1,
          red: suit === "♥" || suit === "♦"
        });
      });
    }
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function onlineRoundSeed(label) {
    const room = state && state.onlineRoom;
    return `${room?.code || "room"}:${room?.startedAt || "start"}:${state?.round || 1}:${label}`;
  }

  function hashSeed(value) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRandom(seedText) {
    let seed = hashSeed(seedText);
    return () => {
      seed += 0x6D2B79F5;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function playerIndexForSeat(seatIndex) {
    if (!state || !state.onlineRoom) return seatIndex === 0 ? human : bot;
    return state.onlineRoom.localSeat === seatIndex ? human : bot;
  }

  function dealOnlineSlots(deck, roundSizes) {
    const seatSlots = [];
    [0, 1].forEach((seatIndex) => {
      const playerIndex = playerIndexForSeat(seatIndex);
      seatSlots[seatIndex] = dealSlots(deck, roundSizes[playerIndex]);
    });
    state.players[human].slots = seatSlots[state.onlineRoom.localSeat];
    state.players[bot].slots = seatSlots[state.onlineRoom.opponentSeat];
  }

  function shuffleInPlace(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function dealSlots(deck, count) {
    return Array.from({ length: count }, () => ({
      card: deck.pop(),
      up: false,
      peeked: false
    }));
  }

  function drawDeckCard() {
    if (state.deck.length === 0) recycleDiscard();
    return state.deck.pop();
  }

  function drawBottomCard() {
    if (state.deck.length === 0) recycleDiscard();
    return state.deck.shift();
  }

  function recycleDiscard() {
    if (state.discard.length <= 1) return;
    const top = state.discard.pop();
    state.deck = state.discard;
    state.discard = [top];
    const random = state.online ? seededRandom(onlineRoundSeed(`recycle:${state.recycleCount += 1}`)) : Math.random;
    for (let i = state.deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }
  }

  function cardLabel(card) {
    return card ? `${card.rank}${card.suit}` : "";
  }

  function isCrownMode() {
    return state && state.mode === "crown";
  }

  function gameTitle() {
    return state && state.mode === "crown" ? "Trash: Crown Debt" : "Classic Trash";
  }

  function isPlayable(card, playerIndex) {
    if (!card || card.value < 1) return false;
    const slots = state.players[playerIndex].slots;
    if (card.value > slots.length) return false;
    return !slots[card.value - 1].up;
  }

  function canPlaceHeldFor(playerIndex, index) {
    const slot = state && state.players[playerIndex] && state.players[playerIndex].slots[index];
    return Boolean(
      state &&
      !state.over &&
      state.turn === playerIndex &&
      state.phase === "place" &&
      state.held &&
      slot &&
      state.held.value === index + 1 &&
      isPlayable(state.held, playerIndex)
    );
  }

  function canHumanDraw() {
    return state && !state.over && state.turn === human && state.phase === "draw";
  }

  function setStatus(text) {
    els.statusText.textContent = text;
  }

  function showCoinPop(playerIndex, amount, reason) {
    const target = playerIndex === human ? els.humanCoinPop : els.botCoinPop;
    if (!target || amount <= 0) return;
    target.textContent = `+${amount} ${reason}`;
    target.classList.remove("show");
    void target.offsetWidth;
    target.classList.add("show");
  }

  function renderCoinHud() {
    if (!state) return;
    els.humanCoins.textContent = state.players[human].coins;
    els.botCoins.textContent = state.players[bot].coins;
  }

  function drawFromDeck() {
    if (!canHumanDraw()) return;
    drawFrom("deck", els.deckPile.getBoundingClientRect(), human);
  }

  function drawFromDiscard() {
    if (!canHumanDraw() || state.discard.length === 0) return;
    drawFrom("discard", els.discardPile.getBoundingClientRect(), human);
  }

  function drawFrom(source, sourceRect, playerIndex, broadcast = true) {
    const drawn = source === "discard" ? state.discard.pop() : drawDeckCard();
    state.held = drawn;
    state.phase = "place";
    state.drawSource = source;
    state.turnPlacements = 0;
    markOnlineActivity(playerIndex);
    afterDraw(playerIndex, false);
    render();
    animateCard(drawn, sourceRect, currentRect(), "draw");
    playSfx("draw");
    if (broadcast && state.online && playerIndex === human) {
      sendOnlineAction("draw", { source });
    }
  }

  function afterDraw(playerIndex, shouldRender = true) {
    if (playerIndex !== human) {
      if (shouldRender) render();
      return;
    }
    if (isPlayable(state.held, human)) {
      setStatus(`Drag ${cardLabel(state.held)} to slot ${state.held.value}.`);
    } else {
      setStatus(`${cardLabel(state.held)} cannot be placed. Drag it to discard.`);
    }
    if (shouldRender) render();
  }

  function placeHeld(index, sourceRectOverride = null, playerIndex = human, broadcast = true) {
    if (!canPlaceHeldFor(playerIndex, index)) return false;

    const sourceRect = sourceRectOverride || currentRect();
    const targetRect = cardRect(playerIndex, index);
    const placed = state.held;
    const slot = state.players[playerIndex].slots[index];
    const bumped = slot.card;
    slot.card = placed;
    slot.up = true;
    slot.peeked = false;
    state.held = bumped;

    if (state.drawSource === "discard" && state.turnPlacements === 0) {
      state.players[playerIndex].discardPlace = true;
    }
    state.turnPlacements += 1;
    state.players[playerIndex].maxChain = Math.max(state.players[playerIndex].maxChain, state.turnPlacements);
    markOnlineActivity(playerIndex);

    if (checkWinner(playerIndex)) {
      endRound(playerIndex);
      if (broadcast && state.online && playerIndex === human) {
        sendOnlineAction("place", { index });
      }
      return true;
    }

    if (playerIndex === human) {
      if (isPlayable(state.held, human)) {
        setStatus(`Keep going: drag ${cardLabel(state.held)} to slot ${state.held.value}.`);
      } else {
        setStatus(`${cardLabel(state.held)} is trash. Drag it to discard.`);
      }
    }
    render();
    animateCard(placed, sourceRect, targetRect, "place");
    bumpElement(els.currentCard);
    playSfx("place");
    if (broadcast && state.online && playerIndex === human) {
      sendOnlineAction("place", { index });
    }
    return true;
  }

  function trashHeld() {
    if (state.over || state.turn !== human || state.phase !== "place" || !state.held) return;
    if (state.online) {
      discardHeld(human, currentRect(), els.discardPile.getBoundingClientRect());
      finishOnlineTurn(human);
      sendOnlineAction("discard");
      return;
    }
    discardHeld(human, currentRect(), els.discardPile.getBoundingClientRect());
    state.phase = "waiting";
    setStatus("Bot is playing...");
    render();
    window.setTimeout(runBotTurn, 720);
  }

  function discardHeld(playerIndex, sourceRect, targetRect) {
    const trashed = state.held;
    if (!trashed) return;
    if (trashed.value > 10) state.players[playerIndex].faceTrashed = true;
    state.discard.push(trashed);
    state.held = null;
    state.drawSource = null;
    animateCard(trashed, sourceRect, targetRect, "trash");
    bumpElement(els.discardPile);
    playSfx("discard");
  }

  function finishOnlineTurn(playerIndex) {
    if (!state || !state.online || state.over) return;
    const next = playerIndex === human ? bot : human;
    state.turn = next;
    state.phase = "draw";
    state.drawSource = null;
    state.turnPlacements = 0;
    startOnlineTurnTimer(next);
    setStatus(next === human
      ? "Your turn. Draw a card, then drag it to a slot or discard."
      : `${state.players[bot].name}'s turn. Waiting for their move.`);
    render();
  }

  function runBotTurn() {
    if (state.over) return;
    state.turn = bot;
    state.phase = "place";
    state.turnPlacements = 0;
    render();

    botMaybeUseMirrorCurse();
    if (state.over) return;
    botMaybeUseLuckyMatch();
    if (state.over) return;
    botMaybeUseChaosCut();
    botMaybeUseBurn();
    const topDiscard = state.discard[state.discard.length - 1];
    const useDiscard = isPlayable(topDiscard, bot);
    state.drawSource = useDiscard ? "discard" : "deck";
    if (useDiscard) {
      state.held = state.discard.pop();
    } else if (!botMaybeUseLoadedDraw() && !botMaybeUseBottomDeal()) {
      state.held = drawDeckCard();
    }
    const origin = useDiscard ? els.discardPile.getBoundingClientRect() : els.deckPile.getBoundingClientRect();
    render();
    animateCard(state.held, origin, currentRect(), "draw");

    const playStep = () => {
      if (state.over) return;
      if (!isPlayable(state.held, bot)) {
        if (botMaybeRedraw()) {
          render();
          window.setTimeout(playStep, 420);
          return;
        }
        discardHeld(bot, currentRect(), els.discardPile.getBoundingClientRect());
        state.turn = human;
        state.phase = "draw";
        state.drawSource = null;
        setStatus("Your turn. Draw a card, then drag it to a slot or discard.");
        render();
        return;
      }

      placeHeld(state.held.value - 1, currentRect(), bot);
      if (!state.over) window.setTimeout(playStep, 460);
    };

    window.setTimeout(playStep, 620);
  }

  function botMaybeUseBurn() {
    if (!isCrownMode()) return false;
    const itemIndex = state.players[bot].items.indexOf("burn");
    const topDiscard = state.discard[state.discard.length - 1];
    if (itemIndex < 0 || !topDiscard || isPlayable(topDiscard, bot)) return false;
    state.discard.pop();
    const fresh = drawDeckCard();
    if (fresh) state.discard.push(fresh);
    consumeItem(bot, itemIndex);
    return true;
  }

  function drawLoadedCards(playerIndex) {
    const cards = [drawDeckCard(), drawDeckCard()].filter(Boolean);
    if (!cards.length) return null;
    const playable = cards.filter((card) => isPlayable(card, playerIndex));
    const keep = playable.length
      ? playable.sort((a, b) => a.value - b.value)[0]
      : cards[0];
    cards.forEach((card) => {
      if (card !== keep) state.discard.push(card);
    });
    return keep;
  }

  function loadedDraw(playerIndex, itemIndex) {
    const keep = drawLoadedCards(playerIndex);
    if (!keep) {
      setStatus("The deck is empty.");
      return false;
    }
    state.held = keep;
    state.phase = "place";
    state.drawSource = "deck";
    state.turnPlacements = 0;
    consumeItem(playerIndex, itemIndex);
    if (playerIndex === human) {
      setStatus(`Loaded Draw kept ${cardLabel(keep)}.`);
      afterDraw(human);
      broadcastOnlineSnapshot("itemLoadedDraw");
    }
    return true;
  }

  function botMaybeUseLoadedDraw() {
    if (!isCrownMode()) return false;
    const itemIndex = state.players[bot].items.indexOf("loadedDraw");
    if (itemIndex < 0) return false;
    return loadedDraw(bot, itemIndex);
  }

  function botMaybeUseBottomDeal() {
    if (!isCrownMode()) return false;
    const itemIndex = state.players[bot].items.indexOf("bottomDeal");
    if (itemIndex < 0) return false;
    return useBottomDeal(bot, itemIndex);
  }

  function correctHiddenSlots(playerIndex) {
    return state.players[playerIndex].slots
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot, index }) => !slot.up && slot.card.value === index + 1);
  }

  function faceUpSlots(playerIndex) {
    return state.players[playerIndex].slots
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => slot.up);
  }

  function hiddenSlots(playerIndex) {
    return state.players[playerIndex].slots
      .map((slot, index) => ({ slot, index, playerIndex }))
      .filter(({ slot }) => !slot.up);
  }

  function useLuckyMatch(playerIndex, itemIndex) {
    const targets = hiddenSlots(playerIndex);
    if (!targets.length) return false;
    const { slot, index } = targets[Math.floor(Math.random() * targets.length)];
    const matched = slot.card.value === index + 1;
    slot.up = matched;
    slot.peeked = !matched && playerIndex === human;
    consumeItem(playerIndex, itemIndex);
    if (matched && checkWinner(playerIndex)) {
      endRound(playerIndex);
      if (playerIndex === human) broadcastOnlineSnapshot("itemLuckyMatch");
      return true;
    }
    if (playerIndex === human) {
      setStatus(matched ? `Lucky Match hit slot ${index + 1}.` : `Lucky Match missed slot ${index + 1}.`);
    }
    render();
    bumpElement(cardElement(playerIndex, index));
    if (playerIndex === human) broadcastOnlineSnapshot("itemLuckyMatch");
    if (!matched && playerIndex === human) {
      window.setTimeout(() => {
        if (!state || state.over || slot.up) return;
        slot.peeked = false;
        render();
        broadcastOnlineSnapshot("itemLuckyMatchReset");
      }, 900);
    } else if (!matched) {
      slot.peeked = false;
    }
    return true;
  }

  function useMirrorCurse(playerIndex, itemIndex) {
    const humanTargets = faceUpSlots(human);
    const botTargets = faceUpSlots(bot);
    if (!humanTargets.length || !botTargets.length) return false;
    const picks = [
      { playerIndex: human, ...humanTargets[Math.floor(Math.random() * humanTargets.length)] },
      { playerIndex: bot, ...botTargets[Math.floor(Math.random() * botTargets.length)] }
    ];
    picks.forEach(({ slot }) => {
      slot.up = false;
      slot.peeked = false;
    });
    consumeItem(playerIndex, itemIndex);
    if (playerIndex === human) setStatus("Mirror Curse flipped one completed slot on each board.");
    render();
    picks.forEach(({ playerIndex: owner, index }) => bumpElement(cardElement(owner, index)));
    if (playerIndex === human) broadcastOnlineSnapshot("itemMirrorCurse");
    return true;
  }

  function useRiggedDiscard(playerIndex, itemIndex) {
    if (!state.held) return false;
    const rigged = state.held;
    const fresh = drawDeckCard();
    if (!fresh) return false;
    state.discard.push(rigged);
    state.held = fresh;
    state.drawSource = "deck";
    consumeItem(playerIndex, itemIndex);
    if (playerIndex === human) {
      setStatus(`Rigged Discard traded ${cardLabel(rigged)} for ${cardLabel(fresh)}.`);
      afterDraw(human);
      broadcastOnlineSnapshot("itemRiggedDiscard");
    }
    return true;
  }

  function useBottomDeal(playerIndex, itemIndex) {
    const drawn = drawBottomCard();
    if (!drawn) return false;
    state.held = drawn;
    state.phase = "place";
    state.drawSource = "deck";
    state.turnPlacements = 0;
    consumeItem(playerIndex, itemIndex);
    if (playerIndex === human) {
      setStatus(`Bottom Deal drew ${cardLabel(drawn)}.`);
      afterDraw(human);
      broadcastOnlineSnapshot("itemBottomDeal");
    }
    return true;
  }

  function useRoyalGambit(playerIndex, itemIndex, guessIndex) {
    const player = state.players[playerIndex];
    const slot = player.slots[guessIndex];
    if (!slot || slot.up) return false;
    const revealed = drawDeckCard();
    if (!revealed) return false;
    consumeItem(playerIndex, itemIndex);
    if (revealed.value === guessIndex + 1) {
      const bumped = slot.card;
      slot.card = revealed;
      slot.up = true;
      slot.peeked = false;
      state.held = bumped;
      state.phase = "place";
      state.drawSource = "deck";
      state.turnPlacements = 1;
      player.maxChain = Math.max(player.maxChain, state.turnPlacements);
      if (checkWinner(playerIndex)) {
        endRound(playerIndex);
      } else if (playerIndex === human) {
        setStatus(`Royal Gambit hit slot ${guessIndex + 1}.`);
      }
    } else {
      state.discard.push(revealed);
      state.held = null;
      state.phase = "draw";
      state.drawSource = null;
      state.turnPlacements = 0;
      if (playerIndex === human) setStatus(`Royal Gambit missed with ${cardLabel(revealed)}. Draw normally.`);
    }
    render();
    bumpElement(cardElement(playerIndex, guessIndex));
    if (playerIndex === human) broadcastOnlineSnapshot("itemRoyalGambit");
    return true;
  }

  function useBoardSizeSwap(playerIndex, targetIndex, itemIndex) {
    if (state.players[playerIndex].targetSize - state.players[targetIndex].targetSize < 2) return false;
    const nextPlayerSize = state.players[targetIndex].targetSize;
    const nextTargetSize = state.players[playerIndex].targetSize;
    state.players[playerIndex].nextRoundSize = nextPlayerSize;
    state.players[targetIndex].nextRoundSize = nextTargetSize;
    consumeItem(playerIndex, itemIndex);
    if (playerIndex === human) {
      els.shopStatus.textContent = `Debt Swap armed. Next round: you play ${nextPlayerSize}, opponent plays ${nextTargetSize}.`;
    }
    renderShop();
    render();
    if (playerIndex === human) broadcastOnlineSnapshot("shopDebtSwap");
    return true;
  }

  function useInsuranceFraud(playerIndex, itemIndex) {
    const player = state.players[playerIndex];
    if (player.coins < 1 || player.insuranceFraud) return false;
    player.coins -= 1;
    player.insuranceFraud = true;
    consumeItem(playerIndex, itemIndex);
    if (playerIndex === human) {
      els.shopStatus.textContent = "Insurance Fraud armed. Lose next round for +3 bonus coins.";
    }
    renderShop();
    render();
    if (playerIndex === human) broadcastOnlineSnapshot("shopInsuranceFraud");
    return true;
  }

  function useDoubleDown(playerIndex, itemIndex) {
    const player = state.players[playerIndex];
    if (player.doubleDown) return false;
    player.doubleDown = true;
    consumeItem(playerIndex, itemIndex);
    if (playerIndex === human) {
      els.shopStatus.textContent = "Double Down armed. Win next round for +5 coins, lose for no payout.";
    }
    renderShop();
    render();
    if (playerIndex === human) broadcastOnlineSnapshot("shopDoubleDown");
    return true;
  }

  function useBlackMarket(playerIndex, itemIndex) {
    consumeItem(playerIndex, itemIndex);
    state.shopOffers = generateShopOffers({ blackMarket: true }).filter((itemId) => itemId !== "blackMarket");
    const fallbackPool = [...SHOP_TIERS.uncommon, ...SHOP_TIERS.rare, ...(state.round >= 3 ? SHOP_TIERS.legendary : [])]
      .filter((itemId) => itemId !== "blackMarket");
    while (state.shopOffers.length < 3) addShopOffer(state.shopOffers, fallbackPool);
    if (playerIndex === human) {
      els.shopStatus.textContent = "Black Market refreshed the shop with hotter odds.";
    }
    renderShop();
    render();
    if (playerIndex === human) broadcastOnlineSnapshot("shopBlackMarket");
    return true;
  }

  function placeFlexibleHeld(index, itemIndex, label, syncReason) {
    if (state.over || state.turn !== human || state.phase !== "place" || !state.held || state.players[human].slots[index].up) return false;
    const sourceRect = currentRect();
    const targetRect = cardRect(human, index);
    const placed = state.held;
    const slot = state.players[human].slots[index];
    const bumped = slot.card;
    slot.card = placed;
    slot.up = true;
    slot.peeked = false;
    state.held = bumped;
    state.turnPlacements += 1;
    state.players[human].maxChain = Math.max(state.players[human].maxChain, state.turnPlacements);
    consumeItem(human, itemIndex);

    if (checkWinner(human)) {
      endRound(human);
      broadcastOnlineSnapshot(syncReason);
      return true;
    }

    if (isPlayable(state.held, human)) {
      setStatus(`${label} landed. Keep going with ${cardLabel(state.held)}.`);
    } else {
      setStatus(`${label} landed. ${cardLabel(state.held)} is trash.`);
    }
    render();
    animateCard(placed, sourceRect, targetRect, "place");
    bumpElement(els.currentCard);
    playSfx("place");
    broadcastOnlineSnapshot(syncReason);
    return true;
  }

  function useJokersFavor(index, itemIndex) {
    return placeFlexibleHeld(index, itemIndex, "Joker's Favor", "itemJokersFavor");
  }

  function useWildSealSlot(index, itemIndex) {
    if (!state.held || state.held.value <= 10 || index > 4) return false;
    return placeFlexibleHeld(index, itemIndex, "Wild Seal", "itemWildSeal");
  }

  function useChaosCut(playerIndex, itemIndex) {
    const targets = [human, bot].flatMap((index) => hiddenSlots(index));
    if (targets.length < 2) return false;
    const cards = shuffleInPlace(targets.map(({ slot }) => slot.card));
    targets.forEach(({ slot }, index) => {
      slot.card = cards[index];
      slot.peeked = false;
    });
    consumeItem(playerIndex, itemIndex);
    if (playerIndex === human) setStatus("Chaos Cut shuffled every face-down card on both boards.");
    render();
    if (playerIndex === human) broadcastOnlineSnapshot("itemChaosCut");
    return true;
  }

  function useTaxCollector(attackerIndex, targetIndex, itemIndex) {
    const amount = Math.min(3, state.players[targetIndex].coins);
    if (amount <= 0) return false;
    state.players[targetIndex].coins -= amount;
    state.players[attackerIndex].coins += amount;
    consumeItem(attackerIndex, itemIndex);
    if (attackerIndex === human) {
      els.shopStatus.textContent = `Tax Collector stole ${amount} coins from Bot.`;
      showCoinPop(human, amount, "tax");
    }
    renderShop();
    render();
    if (attackerIndex === human) broadcastOnlineSnapshot("shopTaxCollector");
    return true;
  }

  function botMaybeUseLuckyMatch() {
    if (!isCrownMode()) return false;
    const itemIndex = state.players[bot].items.indexOf("luckyMatch");
    if (itemIndex < 0 || !correctHiddenSlots(bot).length) return false;
    return useLuckyMatch(bot, itemIndex);
  }

  function botMaybeUseMirrorCurse() {
    if (!isCrownMode()) return false;
    const itemIndex = state.players[bot].items.indexOf("mirrorCurse");
    const botUp = faceUpSlots(bot).length;
    const humanUp = faceUpSlots(human).length;
    if (itemIndex < 0 || humanUp < 2 || botUp < 1 || humanUp <= botUp) return false;
    return useMirrorCurse(bot, itemIndex);
  }

  function botMaybeUseChaosCut() {
    if (!isCrownMode()) return false;
    const itemIndex = state.players[bot].items.indexOf("chaosCut");
    const botUp = faceUpSlots(bot).length;
    const humanUp = faceUpSlots(human).length;
    if (itemIndex < 0 || humanUp <= botUp || hiddenSlots(human).length + hiddenSlots(bot).length < 4) return false;
    return useChaosCut(bot, itemIndex);
  }

  function botMaybeRedraw() {
    if (!isCrownMode() || !state.held) return false;
    const riggedIndex = state.players[bot].items.indexOf("riggedDiscard");
    const pardonIndex = state.players[bot].items.indexOf("pardon");
    const graveIndex = state.players[bot].items.indexOf("graveGrab");
    if (riggedIndex >= 0 && useRiggedDiscard(bot, riggedIndex)) return true;
    if (graveIndex >= 0 && state.discard.length && !isPlayable(state.held, bot) && isPlayable(state.discard[state.discard.length - 1], bot)) {
      const grabbed = state.discard.pop();
      state.discard.push(state.held);
      state.held = grabbed;
      state.drawSource = "discard";
      consumeItem(bot, graveIndex);
      return true;
    }
    if (pardonIndex < 0) return false;
    state.discard.push(state.held);
    state.held = drawDeckCard();
    state.drawSource = "deck";
    consumeItem(bot, pardonIndex);
    return true;
  }

  function checkWinner(playerIndex) {
    return state.players[playerIndex].slots.every((slot) => slot.up);
  }

  function endRound(winner) {
    state.over = true;
    state.phase = "over";
    state.held = null;
    if (state.online) clearOnlineTurnTimer();
    const loser = winner === human ? bot : human;
    const winnerName = winner === human ? "You" : state.players[winner].name;
    const winnerWasBehind = state.players[winner].targetSize > state.players[loser].targetSize;
    const matchWon = state.players[winner].targetSize === 1;
    state.roundWinnerSeat = state.players[winner].seatIndex ?? winner;
    state.matchOver = matchWon;
    const rewards = isCrownMode() ? awardCoins(winner, winnerWasBehind) : [];

    render();

    if (matchWon) {
      submitMatchResult(winner);
      showRoundModal(
        `${winnerName} won the match.`,
        `${winnerName} cleared the final 1-card board.`,
        rewards,
        "Choose mode",
        () => showModeSelect(),
        "victory"
      );
      return;
    }

    state.players[winner].targetSize -= 1;
    const summary = `${winnerName} won the round. ${winner === human ? "Your" : `${winnerName}'s`} next board is ${state.players[winner].targetSize} cards.`;

    if (isCrownMode()) {
      if (state.players[winner].items.length >= 2) {
        if (winner === human) {
          showForcedDiscard();
        } else if (state.online) {
          showShop(`${winnerName} won while holding two items. Waiting for ${winnerName} to discard one.`, {
            generate: false,
            reset: false
          });
        } else {
          const removed = botDiscardWeakestItem();
          showShop(`${state.players[bot].name} discarded ${ITEMS[removed].name} after winning with two items.`);
        }
      } else {
        showShop(summary);
      }
      return;
    }

    showRoundModal(
      `${winnerName} won the round.`,
      summary,
      [],
      "Next round",
      continueToNextRound
    );
  }

  function endRoundUiIsHidden() {
    return els.roundModal.classList.contains("hidden")
      && els.shopModal.classList.contains("hidden")
      && els.discardModal.classList.contains("hidden");
  }

  function roundWinnerIndex() {
    if (!state || !state.players) return null;
    if (state.roundWinnerSeat !== null && state.roundWinnerSeat !== undefined) {
      return playerIndexForSeat(state.roundWinnerSeat);
    }
    const index = state.players.findIndex((player) => player.slots.length && player.slots.every((slot) => slot.up));
    return index >= 0 ? index : null;
  }

  function isWaitingForRemoteDiscard() {
    if (!state || !state.online || !isCrownMode() || state.phase !== "over" || state.matchOver) return false;
    if (state.roundWinnerSeat !== state.onlineRoom?.opponentSeat) return false;
    return state.players[bot].items.length >= 2;
  }

  function showSyncedEndRoundUi() {
    const winner = roundWinnerIndex();
    if (winner === null) return;
    const winnerName = winner === human ? "You" : state.players[winner].name;
    const summary = state.matchOver
      ? `${winnerName} cleared the final 1-card board.`
      : `${winnerName} won the round. ${winner === human ? "Your" : `${winnerName}'s`} next board is ${state.players[winner].targetSize} cards.`;

    if (state.matchOver) {
      showRoundModal(
        `${winnerName} won the match.`,
        summary,
        [],
        "Choose mode",
        () => showModeSelect(),
        "victory"
      );
      return;
    }

    if (isCrownMode()) {
      if (winner === human && state.players[human].items.length >= 2) {
        showForcedDiscard();
      } else if (isWaitingForRemoteDiscard()) {
        showShop(`${winnerName} won while holding two items. Waiting for ${winnerName} to discard one.`, {
          generate: false,
          reset: false
        });
      } else {
        showShop(summary, {
          generate: state.shopOffers.length === 0,
          reset: false
        });
      }
      return;
    }

    showRoundModal(
      `${winnerName} won the round.`,
      summary,
      [],
      "Next round",
      continueToNextRound
    );
  }

  function awardCoins(winner, winnerWasBehind) {
    const lines = [];
    state.players.forEach((player, index) => {
      let coins = index === winner ? 4 : 1;
      const parts = [index === winner ? "+4 round win" : "+1 stayed in it"];
      if (player.maxChain >= 3) {
        coins += 1;
        parts.push("+1 chain");
      }
      if (player.discardPlace) {
        coins += 1;
        parts.push("+1 discard play");
      }
      if (player.faceTrashed) {
        coins += 1;
        parts.push("+1 face trash");
      }
      if (index === winner && winnerWasBehind) {
        coins += 2;
        parts.push("+2 comeback");
      }
      if (index === winner && !player.itemUsedThisRound) {
        coins += 1;
        parts.push("+1 no item used");
      }
      if (player.doubleDown) {
        if (index === winner) {
          coins += 5;
          parts.push("+5 double down");
        } else {
          coins = 0;
          parts.length = 0;
          parts.push("double down lost");
        }
        player.doubleDown = false;
      }
      if (player.insuranceFraud) {
        if (index !== winner) {
          coins += 3;
          parts.push("+3 insurance");
        }
        player.insuranceFraud = false;
      }
      player.coins += coins;
      showCoinPop(index, coins, "round");
      lines.push(`${player.name}: +${coins} coins (${parts.join(", ")})`);
    });
    return lines;
  }

  function showRoundModal(title, summary, rewards, buttonText, action, sfxName = "") {
    modalAction = action;
    els.roundTitle.textContent = title;
    els.roundSummary.textContent = summary;
    els.playAgain.textContent = buttonText;
    els.roundRewards.replaceChildren(...rewards.map((line) => {
      const div = document.createElement("div");
      div.textContent = line;
      return div;
    }));
    hideAllModals();
    els.roundModal.classList.remove("hidden");
    if (sfxName) playSfx(sfxName);
  }

  function showForcedDiscard() {
    if (state.online) ensureOnlineShopTimers(false);
    hideAllModals();
    els.discardChoices.replaceChildren(...state.players[human].items.map((itemId, index) => {
      const card = itemCard(itemId, `Discard ${ITEMS[itemId].name}`, () => {
        state.players[human].items.splice(index, 1);
        markOnlineActivity(human, { shop: true });
        showShop("You discarded an item after winning with two.");
        broadcastOnlineSnapshot("forcedItemDiscard");
      });
      return card;
    }));
    els.discardModal.classList.remove("hidden");
  }

  function showShop(message, options = {}) {
    const generate = options.generate !== false;
    const reset = options.reset !== false;
    if (generate && !state.shopOffers.length) state.shopOffers = generateShopOffers();
    if (reset) {
      state.shopLocked = false;
      state.pendingPurchase = null;
      if (state.online) {
        state.shopReadySeats = [];
        state.shopDeadlineBySeat = [0, 0];
      }
    }
    if (state.online) ensureOnlineShopTimers(reset);
    hideAllModals();
    els.shopModal.classList.remove("hidden");
    els.shopStatus.textContent = message || "Buy, replace, claim, use Debt of the Crown, or skip ahead.";
    renderShop();
    render();
    playSfx("shop");
  }

  function generateShopOffers(options = {}) {
    const offers = [];
    const commonPool = SHOP_TIERS.common.filter((itemId) => itemId !== "coinPurse");
    const coinPurseRoll = Math.random() < COIN_PURSE_SHOP_CHANCE;
    addShopOffer(offers, commonPool);
    if (!options.blackMarket) addShopOffer(offers, commonPool);
    if (coinPurseRoll) {
      const commonIndexes = offers
        .map((itemId, index) => (commonPool.includes(itemId) ? index : -1))
        .filter((index) => index >= 0);
      const replaceIndex = commonIndexes[Math.floor(Math.random() * commonIndexes.length)];
      if (replaceIndex !== undefined) offers[replaceIndex] = "coinPurse";
    }

    const legendaryRoll = state.round >= 3 && Math.random() < (options.blackMarket ? 0.16 : 0.08);
    if (legendaryRoll) {
      addShopOffer(offers, SHOP_TIERS.legendary);
    } else {
      addShopOffer(offers, Math.random() < (options.blackMarket ? 0.65 : 0.35) ? SHOP_TIERS.rare : SHOP_TIERS.uncommon);
    }

    if (options.blackMarket) {
      addShopOffer(offers, Math.random() < 0.65 ? SHOP_TIERS.rare : SHOP_TIERS.uncommon);
    }

    const fallbackPool = options.blackMarket
      ? [...SHOP_TIERS.uncommon, ...SHOP_TIERS.rare, ...(state.round >= 3 ? SHOP_TIERS.legendary : [])]
      : [...commonPool, ...SHOP_TIERS.uncommon, ...SHOP_TIERS.rare];
    while (offers.length < 3) addShopOffer(offers, fallbackPool);
    return offers;
  }

  function addShopOffer(offers, pool) {
    const candidates = pool.filter((itemId) => !offers.includes(itemId));
    if (!candidates.length) return;
    offers.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }

  function renderShop() {
    const player = state.players[human];
    const waitingForRemoteDiscard = isWaitingForRemoteDiscard();
    const ready = localShopReady();
    const onlineShop = Boolean(state.online && isCrownMode());
    els.coinText.textContent = `Coins: ${player.coins}`;
    els.roundText.textContent = `Round ${state.round}`;
    els.nextRound.disabled = waitingForRemoteDiscard || ready;
    els.nextRound.textContent = waitingForRemoteDiscard
      ? "Waiting..."
      : onlineShop
        ? ready ? "Ready..." : "Ready for next round"
        : "Next round";
    if (els.shopTimerText) {
      els.shopTimerText.hidden = !onlineShop;
    }
    renderTimerUi();

    const inventoryNodes = player.items.length
      ? player.items.map((itemId, index) => shopInventoryCard(itemId, index))
      : [emptyItemCard("No items held.")];
    els.shopInventory.replaceChildren(...inventoryNodes);

    els.shopOffers.replaceChildren(...state.shopOffers.map((itemId) => shopOfferCard(itemId)));
  }

  function shopInventoryCard(itemId, index) {
    const actions = [];
    const locked = isWaitingForRemoteDiscard() || localShopReady();
    if (state.pendingPurchase) {
      actions.push({
        text: `Replace with ${ITEMS[state.pendingPurchase].name}`,
        primary: true,
        disabled: locked,
        handler: () => replaceItem(index)
      });
    }
    if (itemId === "debt") {
      actions.push({
        text: "Use",
        primary: true,
        disabled: locked || state.players[bot].targetSize >= 10,
        handler: () => useDebt(index)
      });
    }
    if (ITEMS[itemId].shopUse) {
      actions.push({
        text: "Use",
        primary: true,
        disabled: locked || !canUseShopItem(itemId, human),
        handler: () => useShopItem(itemId, index, human, bot)
      });
    }
    if (itemId === "shield") {
      actions.push({
        text: "Passive",
        disabled: true
      });
    }
    return itemCard(itemId, actions);
  }

  function canUseShopItem(itemId, playerIndex) {
    const targetIndex = playerIndex === human ? bot : human;
    if (itemId === "taxCollector") return state.players[targetIndex].coins > 0;
    if (itemId === "insuranceFraud") return state.players[playerIndex].coins > 0 && !state.players[playerIndex].insuranceFraud;
    if (itemId === "blackMarket") return state.shopOffers.length > 0;
    if (itemId === "doubleDown") return !state.players[playerIndex].doubleDown;
    if (itemId === "debtSwap") return state.players[playerIndex].targetSize - state.players[targetIndex].targetSize >= 2;
    return false;
  }

  function useShopItem(itemId, itemIndex, playerIndex, targetIndex) {
    if (playerIndex === human && localShopReady()) {
      els.shopStatus.textContent = "You are ready. Waiting for the other player.";
      return;
    }
    if (isWaitingForRemoteDiscard()) {
      els.shopStatus.textContent = `Waiting for ${state.players[bot].name} to discard an item.`;
      return;
    }
    if (itemId === "taxCollector") {
      if (!useTaxCollector(playerIndex, targetIndex, itemIndex) && playerIndex === human) {
        els.shopStatus.textContent = "Bot has no coins to steal.";
      }
    } else if (itemId === "insuranceFraud") {
      if (!useInsuranceFraud(playerIndex, itemIndex) && playerIndex === human) {
        els.shopStatus.textContent = "Insurance Fraud needs 1 coin and cannot stack.";
      }
    } else if (itemId === "blackMarket") {
      useBlackMarket(playerIndex, itemIndex);
    } else if (itemId === "doubleDown") {
      if (!useDoubleDown(playerIndex, itemIndex) && playerIndex === human) {
        els.shopStatus.textContent = "Double Down is already armed.";
      }
    } else if (itemId === "debtSwap") {
      if (!useBoardSizeSwap(playerIndex, targetIndex, itemIndex) && playerIndex === human) {
        els.shopStatus.textContent = "Debt Swap only works when you are behind by 2 or more cards.";
      }
    }
  }

  function shopOfferCard(itemId) {
    const item = ITEMS[itemId];
    const canAfford = state.players[human].coins >= item.cost;
    const full = state.players[human].items.length >= 2 && !item.immediate;
    const locked = isWaitingForRemoteDiscard() || localShopReady();
    const actionText = itemId === "coinPurse" ? "Claim +3" : full ? "Replace..." : `Buy for ${item.cost}`;
    return itemCard(itemId, [{
      text: actionText,
      primary: true,
      disabled: locked || !canAfford || state.shopLocked,
      handler: () => buyOffer(itemId)
    }]);
  }

  function emptyItemCard(text) {
    const div = document.createElement("div");
    div.className = "item-card empty";
    div.innerHTML = `<p>${text}</p>`;
    return div;
  }

  function itemClass(itemId) {
    return itemId.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  }

  function itemCard(itemId, actions, legacyHandler = null) {
    const item = ITEMS[itemId];
    const itemClassName = itemClass(itemId);
    const card = document.createElement("div");
    card.className = `item-card item-${itemClassName}${item.legendary ? " legendary" : ""}`;
    card.title = item.text;
    card.setAttribute("aria-label", `${item.name}. ${item.cost} coins. ${item.text}`);
    const icon = document.createElement("span");
    icon.className = `item-icon item-icon-${itemClassName}`;
    icon.setAttribute("aria-hidden", "true");
    const title = document.createElement("strong");
    title.className = "item-title";
    title.textContent = item.name;
    const cost = document.createElement("span");
    cost.className = "item-cost";
    cost.textContent = item.cost === 0 ? "Free" : item.legendary ? `${item.cost} coins · Legendary` : `${item.cost} coins`;
    const text = document.createElement("p");
    text.className = "item-text";
    text.textContent = item.text;
    const head = document.createElement("div");
    head.className = "item-head";
    head.append(icon, title);
    card.append(head, text);

    const actionWrap = document.createElement("div");
    actionWrap.className = "item-actions";
    const foot = document.createElement("div");
    foot.className = "item-foot";
    foot.append(cost, actionWrap);

    if (typeof actions === "string") {
      const button = document.createElement("button");
      button.textContent = actions;
      button.className = "primary";
      button.addEventListener("click", legacyHandler);
      actionWrap.appendChild(button);
      card.appendChild(foot);
      return card;
    }

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.textContent = action.text;
      if (action.primary) button.classList.add("primary");
      button.disabled = Boolean(action.disabled);
      if (typeof action.handler === "function") button.addEventListener("click", action.handler);
      actionWrap.appendChild(button);
    });
    card.appendChild(foot);
    return card;
  }

  function buyOffer(itemId) {
    const player = state.players[human];
    const item = ITEMS[itemId];
    if (localShopReady()) {
      els.shopStatus.textContent = "You are ready. Waiting for the other player.";
      return;
    }
    if (isWaitingForRemoteDiscard()) {
      els.shopStatus.textContent = `Waiting for ${state.players[bot].name} to discard an item.`;
      return;
    }
    if (state.shopLocked) {
      els.shopStatus.textContent = "Coin Purse already paid out. Start the next round when ready.";
      return;
    }
    if (player.coins < item.cost) {
      els.shopStatus.textContent = "Not enough coins.";
      return;
    }
    if (itemId === "coinPurse") {
      player.coins += 3;
      state.shopLocked = true;
      state.pendingPurchase = null;
      state.shopOffers = state.shopOffers.filter((offer) => offer !== itemId);
      markOnlineActivity(human, { shop: true });
      els.shopStatus.textContent = "Claimed Coin Purse for +3 coins. The shop is closed for buying.";
      renderShop();
      render();
      showCoinPop(human, 3, "purse");
      broadcastOnlineSnapshot("shopCoinPurse");
      return;
    }
    if (player.items.length >= 2) {
      state.pendingPurchase = itemId;
      markOnlineActivity(human, { shop: true });
      els.shopStatus.textContent = `Choose an item to replace with ${item.name}.`;
      renderShop();
      return;
    }
    player.coins -= item.cost;
    player.items.push(itemId);
    state.shopOffers = state.shopOffers.filter((offer) => offer !== itemId);
    markOnlineActivity(human, { shop: true });
    els.shopStatus.textContent = `Bought ${item.name}.`;
    renderShop();
    render();
    broadcastOnlineSnapshot("shopBuy");
  }

  function replaceItem(index) {
    const itemId = state.pendingPurchase;
    const item = ITEMS[itemId];
    const player = state.players[human];
    if (localShopReady()) {
      els.shopStatus.textContent = "You are ready. Waiting for the other player.";
      return;
    }
    if (isWaitingForRemoteDiscard()) {
      els.shopStatus.textContent = `Waiting for ${state.players[bot].name} to discard an item.`;
      return;
    }
    if (!itemId || player.coins < item.cost) return;
    const old = player.items[index];
    player.coins -= item.cost;
    player.items[index] = itemId;
    state.shopOffers = state.shopOffers.filter((offer) => offer !== itemId);
    state.pendingPurchase = null;
    markOnlineActivity(human, { shop: true });
    els.shopStatus.textContent = `Replaced ${ITEMS[old].name} with ${item.name}.`;
    renderShop();
    render();
    broadcastOnlineSnapshot("shopReplace");
  }

  function consumeNamedItem(playerIndex, itemId) {
    const itemIndex = state.players[playerIndex].items.indexOf(itemId);
    if (itemIndex < 0) return false;
    state.players[playerIndex].items.splice(itemIndex, 1);
    state.players[playerIndex].itemUsedThisRound = true;
    return true;
  }

  function applyDebt(attackerIndex, targetIndex) {
    const target = state.players[targetIndex];
    if (consumeNamedItem(targetIndex, "shield")) {
      return "blocked";
    }
    if (target.targetSize >= 10) return "max";
    target.targetSize += 1;
    state.players[attackerIndex].itemUsedThisRound = true;
    return "hit";
  }

  function useDebt(index) {
    if (localShopReady()) {
      els.shopStatus.textContent = "You are ready. Waiting for the other player.";
      return;
    }
    if (isWaitingForRemoteDiscard()) {
      els.shopStatus.textContent = `Waiting for ${state.players[bot].name} to discard an item.`;
      return;
    }
    const result = applyDebt(human, bot);
    if (result === "max") {
      els.shopStatus.textContent = "Bot is already back at 10 cards.";
      return;
    }
    state.players[human].items.splice(index, 1);
    markOnlineActivity(human, { shop: true });
    els.shopStatus.textContent = result === "blocked"
      ? "Debt of the Crown was blocked by Bot's Crown Shield."
      : `Debt of the Crown hit. Bot now needs ${state.players[bot].targetSize}.`;
    renderShop();
    render();
    broadcastOnlineSnapshot("shopDebt");
  }

  function botDiscardWeakestItem() {
    return discardWeakestItem(bot);
  }

  function discardWeakestItem(playerIndex) {
    const items = state.players[playerIndex].items;
    if (!items.length) return null;
    let weakestIndex = 0;
    items.forEach((itemId, index) => {
      if (ITEMS[itemId].cost < ITEMS[items[weakestIndex]].cost) weakestIndex = index;
    });
    return items.splice(weakestIndex, 1)[0];
  }

  function botShop() {
    if (!isCrownMode()) return;
    const botPlayer = state.players[bot];
    const debtIndex = botPlayer.items.indexOf("debt");
    if (debtIndex >= 0 && state.players[human].targetSize < 10) {
      botPlayer.items.splice(debtIndex, 1);
      applyDebt(bot, human);
    }
    const taxIndex = botPlayer.items.indexOf("taxCollector");
    if (taxIndex >= 0 && state.players[human].coins > 0) {
      useTaxCollector(bot, human, taxIndex);
    }
    const swapIndex = botPlayer.items.indexOf("debtSwap");
    if (swapIndex >= 0 && botPlayer.targetSize - state.players[human].targetSize >= 2) {
      useBoardSizeSwap(bot, human, swapIndex);
    }
    const doubleIndex = botPlayer.items.indexOf("doubleDown");
    if (doubleIndex >= 0 && !botPlayer.doubleDown && botPlayer.targetSize <= state.players[human].targetSize) {
      useDoubleDown(bot, doubleIndex);
    }
    const insuranceIndex = botPlayer.items.indexOf("insuranceFraud");
    if (insuranceIndex >= 0 && botPlayer.coins > 0 && !botPlayer.insuranceFraud && botPlayer.targetSize > state.players[human].targetSize) {
      useInsuranceFraud(bot, insuranceIndex);
    }

    const offers = generateShopOffers()
      .filter((itemId) => BOT_SHOP_ITEMS.has(itemId))
      .filter((itemId) => botPlayer.coins >= ITEMS[itemId].cost)
      .filter((itemId) => itemId !== "debt" || state.players[human].targetSize < 10)
      .filter((itemId) => itemId !== "debtSwap" || botPlayer.targetSize - state.players[human].targetSize >= 2)
      .filter((itemId) => itemId !== "coinPurse" || botPlayer.items.length >= 2)
      .sort((a, b) => ITEMS[b].cost - ITEMS[a].cost);
    if (botPlayer.items.length >= 2 && offers.includes("coinPurse")) {
      botPlayer.coins += 3;
    } else if (botPlayer.items.length < 2 && offers.length) {
      const pick = offers.find((itemId) => itemId !== "coinPurse");
      if (!pick) return;
      botPlayer.items.push(pick);
      botPlayer.coins -= ITEMS[pick].cost;
    }
  }

  function continueToNextRound(reason = "nextRound") {
    state.round += 1;
    state.shopOffers = [];
    state.shopLocked = false;
    state.pendingPurchase = null;
    if (state.online) resetOnlineShopFlow();
    startRound();
    if (state.online) broadcastOnlineSnapshot(reason);
  }

  function hideAllModals() {
    els.playModal.classList.add("hidden");
    els.leaderboardModal.classList.add("hidden");
    els.settingsModal.classList.add("hidden");
    els.authModal.classList.add("hidden");
    els.helpModal.classList.add("hidden");
    els.releaseModal.classList.add("hidden");
    els.roundModal.classList.add("hidden");
    els.discardModal.classList.add("hidden");
    els.shopModal.classList.add("hidden");
  }

  function showHelp() {
    hideAllModals();
    els.helpModal.classList.remove("hidden");
  }

  function showReleases() {
    hideAllModals();
    els.releaseModal.classList.remove("hidden");
    if (!releasesLoaded) {
      releasesLoaded = true;
      loadReleases();
    }
  }

  function loadReleases() {
    renderReleases(RELEASE_FALLBACKS);
  }

  function renderReleaseStatus(message) {
    const item = document.createElement("div");
    item.className = "release-item";
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    item.appendChild(paragraph);
    els.releaseList.replaceChildren(item);
  }

  function renderReleases(releases, notice = "") {
    const nodes = [];
    if (notice) {
      const item = document.createElement("div");
      item.className = "release-item";
      const paragraph = document.createElement("p");
      paragraph.textContent = notice;
      item.appendChild(paragraph);
      nodes.push(item);
    }
    releases.slice(0, 6).forEach((release) => nodes.push(releaseCard(release)));
    els.releaseList.replaceChildren(...nodes);
  }

  function releaseCard(release) {
    const item = document.createElement("article");
    item.className = "release-item";

    const title = document.createElement("h3");
    title.textContent = release.name || release.tag_name || "Release";
    item.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "release-meta";
    const tag = document.createElement("span");
    tag.textContent = release.tag_name || "version";
    meta.appendChild(tag);
    const published = release.published_at || release.created_at;
    if (published) {
      const date = document.createElement("span");
      date.textContent = formatReleaseDate(published);
      meta.appendChild(date);
    }
    item.appendChild(meta);

    const body = document.createElement("div");
    body.className = "release-body";
    renderReleaseBody(body, release.body || "No release notes yet.", release.name || release.tag_name);
    item.appendChild(body);

    return item;
  }

  function renderReleaseBody(container, bodyText, releaseTitle = "") {
    let list = null;
    bodyText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).forEach((line, index) => {
      if (index === 0 && releaseTitle && line.toLowerCase() === releaseTitle.toLowerCase()) return;

      if (line.startsWith("## ")) {
        list = null;
        const heading = document.createElement("h4");
        heading.textContent = line.slice(3);
        container.appendChild(heading);
        return;
      }

      if (/^[A-Za-z ]+:$/.test(line)) {
        list = null;
        const heading = document.createElement("h4");
        heading.textContent = line.slice(0, -1);
        container.appendChild(heading);
        return;
      }

      if (line.startsWith("- ")) {
        if (!list) {
          list = document.createElement("ul");
          container.appendChild(list);
        }
        const point = document.createElement("li");
        point.textContent = line.slice(2);
        list.appendChild(point);
        return;
      }

      list = null;
      const paragraph = document.createElement("p");
      paragraph.textContent = line.replace(/^#+\s*/, "");
      container.appendChild(paragraph);
    });
  }

  function formatReleaseDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function showModeSelect() {
    if (state && state.online) closeRoomSocket();
    state = null;
    hideAllModals();
    els.gameShell.classList.add("hidden");
    els.modeScreen.classList.remove("hidden");
    setAppHeight();
  }

  function useItem(index) {
    if (!isCrownMode()) return;
    const itemId = state.players[human].items[index];
    if (!itemId || state.turn !== human || state.over) return;

    if (itemId === "burn") {
      if (state.phase !== "draw" || state.discard.length === 0) {
        setStatus("Burn Pile can be used before you draw.");
        return;
      }
      state.discard.pop();
      const fresh = drawDeckCard();
      if (fresh) state.discard.push(fresh);
      consumeItem(human, index);
      setStatus("Burned the discard pile. Choose your draw.");
      render();
      broadcastOnlineSnapshot("itemBurn");
      return;
    }

    if (itemId === "luckyMatch") {
      if (!useLuckyMatch(human, index)) setStatus("Lucky Match needs at least one hidden card.");
      return;
    }

    if (itemId === "bottomDeal") {
      if (state.phase !== "draw") {
        setStatus("Bottom Deal can be used before you draw.");
        return;
      }
      if (!useBottomDeal(human, index)) setStatus("The deck is empty.");
      return;
    }

    if (itemId === "mirrorCurse") {
      if (!useMirrorCurse(human, index)) setStatus("Mirror Curse needs both players to have a completed slot.");
      return;
    }

    if (itemId === "chaosCut") {
      if (state.phase !== "draw") {
        setStatus("Chaos Cut can be used before you draw.");
        return;
      }
      if (!useChaosCut(human, index)) setStatus("Chaos Cut needs at least two face-down cards on the table.");
      return;
    }

    if (itemId === "pardon") {
      if (state.phase !== "place" || !state.held || isPlayable(state.held, human)) {
        setStatus("Royal Pardon needs an unplayable current card.");
        return;
      }
      state.discard.push(state.held);
      state.held = drawDeckCard();
      state.drawSource = "deck";
      consumeItem(human, index);
      afterDraw(human);
      broadcastOnlineSnapshot("itemPardon");
      return;
    }

    if (itemId === "graveGrab") {
      if (state.phase !== "place" || !state.held || isPlayable(state.held, human) || state.discard.length === 0) {
        setStatus("Grave Grab needs an unplayable current card and a discard to steal.");
        return;
      }
      const grabbed = state.discard.pop();
      state.discard.push(state.held);
      state.held = grabbed;
      state.drawSource = "discard";
      consumeItem(human, index);
      afterDraw(human);
      broadcastOnlineSnapshot("itemGraveGrab");
      return;
    }

    if (itemId === "riggedDiscard") {
      if (state.phase !== "place" || !state.held) {
        setStatus("Rigged Discard needs a current card.");
        return;
      }
      if (!useRiggedDiscard(human, index)) setStatus("The deck is empty.");
      return;
    }

    if (itemId === "loadedDraw") {
      if (state.phase !== "draw") {
        setStatus("Loaded Draw can be used before you draw.");
        return;
      }
      loadedDraw(human, index);
      return;
    }

    if (itemId === "wildSeal") {
      if (state.phase !== "place" || !state.held || state.held.value <= 10) {
        setStatus("Wild Seal needs a face card as your current card.");
        return;
      }
      state.pendingItem = { type: "wildSeal", index };
      setStatus("Tap an empty slot 1-5 for the sealed face card.");
      render();
      return;
    }

    if (itemId === "royalGambit") {
      if (state.phase !== "draw") {
        setStatus("Royal Gambit can be used before you draw.");
        return;
      }
      state.pendingItem = { type: "royalGambit", index };
      setStatus("Tap a hidden slot to guess that number.");
      render();
      return;
    }

    if (itemId === "jokersFavor") {
      if (state.phase !== "place" || !state.held) {
        setStatus("Joker's Favor needs a current card.");
        return;
      }
      state.pendingItem = { type: "jokersFavor", index };
      setStatus("Tap any empty slot for Joker's Favor.");
      render();
      return;
    }

    if (itemId === "shield") {
      setStatus("Crown Shield blocks the next Debt of the Crown automatically.");
      return;
    }

    if (itemId === "debt") {
      setStatus("Use Debt of the Crown in the shop between rounds.");
      return;
    }

    if (itemId === "taxCollector") {
      setStatus("Use Tax Collector in the shop between rounds.");
      return;
    }

    if (itemId === "insuranceFraud") {
      setStatus("Use Insurance Fraud in the shop between rounds.");
      return;
    }

    if (itemId === "blackMarket") {
      setStatus("Use Black Market in the shop between rounds.");
      return;
    }

    if (itemId === "doubleDown") {
      setStatus("Use Double Down in the shop between rounds.");
      return;
    }

    if (itemId === "debtSwap") {
      setStatus("Use Debt Swap in the shop between rounds.");
    }
  }

  function handleItemSlot(index) {
    if (state.turn !== human || state.over || state.phase === "waiting") return false;
    if (!state.pendingItem) return false;
    const pending = state.pendingItem;
    const slots = state.players[human].slots;
    const slot = slots[index];
    if (!slot || slot.up) return true;

    if (pending.type === "wildSeal") {
      if (!useWildSealSlot(index, pending.index)) setStatus("Wild Seal can only use empty slots 1-5.");
      return true;
    }

    if (pending.type === "royalGambit") {
      useRoyalGambit(human, pending.index, index);
      return true;
    }

    if (pending.type === "jokersFavor") {
      useJokersFavor(index, pending.index);
      return true;
    }

    return false;
  }

  function canUsePendingItemOnSlot(index, slot) {
    if (!state.pendingItem || !slot || slot.up) return false;
    if (state.pendingItem.type === "wildSeal") return index < 5;
    if (state.pendingItem.type === "royalGambit") return state.phase === "draw";
    if (state.pendingItem.type === "jokersFavor") return state.phase === "place";
    return false;
  }

  function consumeItem(playerIndex, index) {
    state.players[playerIndex].items.splice(index, 1);
    state.players[playerIndex].itemUsedThisRound = true;
    state.pendingItem = null;
    markOnlineActivity(playerIndex, { shop: state.phase === "over" });
  }

  function renderCard(slot, index, owner) {
    const button = document.createElement("button");
    const humanCanAct = owner === human && state.turn === human && !state.over && state.phase !== "waiting";
    const itemSelectable = humanCanAct && canUsePendingItemOnSlot(index, slot);
    const playable = humanCanAct && canPlaceHeldFor(human, index);
    const visible = slot.up || slot.peeked;
    button.className = `card ${visible ? "face-up" : "face-down"}${playable ? " target" : ""}${itemSelectable ? " item-selectable" : ""}`;
    button.type = "button";
    button.disabled = owner !== human || (!playable && !itemSelectable);
    button.dataset.slotIndex = String(index);
    if (owner === human) button.dataset.dragTarget = "slot";
    button.setAttribute("aria-label", `${owner === human ? "Your" : state.players[owner].name} slot ${index + 1}`);
    button.addEventListener("click", () => {
      if (handleItemSlot(index)) return;
      placeHeld(index);
    });

    const number = document.createElement("span");
    number.className = "slot-number";
    number.textContent = index + 1;
    button.appendChild(number);

    if (visible) {
      if (slot.card.value > 10) button.classList.add("dead");
      if (slot.card.red) button.classList.add("red");

      const rank = document.createElement("span");
      rank.className = "rank";
      rank.textContent = slot.card.rank;
      button.appendChild(rank);

      const suit = document.createElement("span");
      suit.className = "suit";
      suit.textContent = slot.card.suit;
      button.appendChild(suit);
    }

    return button;
  }

  function renderMini(target, card) {
    target.className = `mini-card${card && card.red ? " red" : ""}`;
    target.textContent = cardLabel(card);
  }

  function renderInventoryBar() {
    if (!isCrownMode()) {
      els.inventoryBar.classList.add("hidden");
      els.inventoryBar.replaceChildren();
      return;
    }
    els.inventoryBar.classList.remove("hidden");
    const buttons = state.players[human].items.map((itemId, index) => {
      const button = document.createElement("button");
      button.className = "item-chip";
      button.type = "button";
      button.textContent = ITEMS[itemId].name;
      button.disabled = state.turn !== human || state.over || state.phase === "waiting";
      button.addEventListener("click", () => useItem(index));
      return button;
    });
    els.inventoryBar.replaceChildren(...buttons);
  }

  function currentRect() {
    return els.currentCard.querySelector(".mini-card").getBoundingClientRect();
  }

  function cardRect(owner, index) {
    const grid = owner === human ? els.humanGrid : els.botGrid;
    return grid.children[index].getBoundingClientRect();
  }

  function cardElement(owner, index) {
    const grid = owner === human ? els.humanGrid : els.botGrid;
    return grid.children[index];
  }

  function animateCard(card, fromRect, toRect, kind) {
    if (!card || !fromRect || !toRect || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ghost = document.createElement("div");
    ghost.className = `fly-card${card.red ? " red" : ""}`;
    ghost.textContent = cardLabel(card);
    const startWidth = Math.max(44, Math.min(92, fromRect.width || 70));
    const startHeight = startWidth * 1.4;
    ghost.style.width = `${startWidth}px`;
    ghost.style.height = `${startHeight}px`;
    ghost.style.left = `${fromRect.left + fromRect.width / 2 - startWidth / 2}px`;
    ghost.style.top = `${fromRect.top + fromRect.height / 2 - startHeight / 2}px`;
    document.body.appendChild(ghost);

    const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
    const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
    const rotate = kind === "trash" ? 8 : kind === "place" ? -5 : 4;
    const scaleX = Math.max(0.75, toRect.width / startWidth);
    const scaleY = Math.max(0.75, toRect.height / startHeight);
    const animation = ghost.animate([
      { opacity: 0, transform: "translate3d(0, 0, 0) scale(0.92) rotate(0deg)" },
      { opacity: 1, transform: `translate3d(${dx * 0.52}px, ${dy * 0.34 - 18}px, 0) scale(1.04) rotate(${rotate}deg)`, offset: 0.58 },
      { opacity: 0, transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY}) rotate(0deg)` }
    ], {
      duration: kind === "draw" ? 430 : 390,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      fill: "forwards"
    });
    animation.onfinish = () => ghost.remove();
  }

  function bumpElement(element) {
    if (!element) return;
    element.classList.remove("bump");
    void element.offsetWidth;
    element.classList.add("bump");
  }

  function beginPileDrag(event, source) {
    if (!canHumanDraw() || (source === "discard" && state.discard.length === 0)) return;
    event.preventDefault();
    const sourceElement = source === "discard" ? els.discardPile : els.deckPile;
    const previewCard = source === "discard" ? state.discard[state.discard.length - 1] : null;
    startDrag({
      event,
      mode: "draw",
      source,
      sourceElement,
      sourceRect: sourceElement.getBoundingClientRect(),
      card: previewCard,
      label: previewCard ? cardLabel(previewCard) : "",
      isBack: source === "deck",
      validText: source === "discard"
        ? "Drop on the matching slot, or release to take it."
        : "Release to draw a card.",
      fallback: () => drawFrom(source, sourceElement.getBoundingClientRect(), human),
      commit: (target) => {
        if (source === "discard" && target.type === "slot" && target.valid) {
          if (state.online) sendOnlineAction("draw", { source: "discard" });
          state.held = state.discard.pop();
          state.phase = "place";
          state.drawSource = "discard";
          state.turnPlacements = 0;
          placeHeld(target.index, sourceElement.getBoundingClientRect(), human);
          return true;
        }
        drawFrom(source, sourceElement.getBoundingClientRect(), human);
        return true;
      }
    });
  }

  function beginHeldDrag(event) {
    if (state.over || state.turn !== human || state.phase !== "place" || !state.held) return;
    event.preventDefault();
    const held = state.held;
    startDrag({
      event,
      mode: "held",
      sourceElement: els.currentCard.querySelector(".mini-card"),
      sourceRect: currentRect(),
      card: held,
      label: cardLabel(held),
      isBack: false,
      validText: isPlayable(held, human)
        ? `Drop on slot ${held.value} or discard.`
        : "Drop on discard.",
      fallback: () => {},
      commit: (target) => {
        if (target.type === "discard") {
          trashHeld();
          return true;
        }
        if (target.type === "slot" && target.index === held.value - 1 && isPlayable(held, human)) {
          placeHeld(target.index);
          return true;
        }
        return false;
      }
    });
  }

  function startDrag(config) {
    drag = {
      ...config,
      pointerId: config.event.pointerId,
      startX: config.event.clientX,
      startY: config.event.clientY,
      lastX: config.event.clientX,
      lastY: config.event.clientY,
      raf: 0,
      moved: false,
      hotElement: null,
      dropRects: readDropRects(),
      ghost: makeDragGhost(config)
    };
    drag.sourceElement.classList.add("dragging-source");
    document.body.appendChild(drag.ghost);
    moveDragGhost(config.event.clientX, config.event.clientY);
    setStatus(config.validText);
    window.addEventListener("pointermove", moveDrag, { passive: false });
    window.addEventListener("pointerup", endDrag, { passive: false });
    window.addEventListener("pointercancel", cancelDrag, { passive: false });
  }

  function makeDragGhost(config) {
    const ghost = document.createElement("div");
    ghost.className = `drag-card${config.isBack ? " back" : ""}${config.card && config.card.red ? " red" : ""}`;
    ghost.textContent = config.isBack ? "" : config.label;
    const rect = config.sourceRect;
    const width = Math.max(48, Math.min(92, rect.width || 78));
    ghost.style.width = `${width}px`;
    ghost.style.height = `${width * 1.4}px`;
    return ghost;
  }

  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    const movedDistance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    drag.moved = drag.moved || movedDistance > 7;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;

    if (!drag.raf) {
      drag.raf = window.requestAnimationFrame(() => {
        if (!drag) return;
        drag.raf = 0;
        moveDragGhost(drag.lastX, drag.lastY);
        updateDropHighlight(dropTargetAt(drag.lastX, drag.lastY));
      });
    }
  }

  function moveDragGhost(x, y) {
    if (!drag) return;
    drag.ghost.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(-3deg) scale(1.04)`;
  }

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    const activeDrag = drag;
    const target = dropTargetAt(event.clientX, event.clientY);
    cleanupDrag();
    suppressClick = true;
    window.setTimeout(() => {
      suppressClick = false;
    }, 90);

    if (!activeDrag.moved) {
      activeDrag.fallback();
      return;
    }
    if (activeDrag.commit(target)) return;
    setStatus(activeDrag.mode === "draw" ? "Release to draw that card." : activeDrag.validText);
  }

  function cancelDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    cleanupDrag();
  }

  function cleanupDrag() {
    if (!drag) return;
    if (drag.raf) window.cancelAnimationFrame(drag.raf);
    drag.sourceElement.classList.remove("dragging-source");
    updateDropHighlight(null);
    drag.ghost.remove();
    drag = null;
    window.removeEventListener("pointermove", moveDrag);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", cancelDrag);
  }

  function updateDropHighlight(target) {
    if (!drag) return;
    const next = target && target.valid ? target.element : null;
    if (drag.hotElement === next) return;
    if (drag.hotElement) drag.hotElement.classList.remove("drop-hot");
    drag.hotElement = next;
    if (drag.hotElement) drag.hotElement.classList.add("drop-hot");
  }

  function dropTargetAt(x, y) {
    if (!drag) return { type: "none", valid: false, element: null };
    const rects = drag.dropRects || readDropRects();

    if (drag.mode === "draw") {
      if (drag.source === "discard") {
        const preview = state.discard[state.discard.length - 1];
        for (let i = 0; i < rects.slots.length; i += 1) {
          if (!rectContains(rects.slots[i].rect, x, y)) continue;
          const valid = preview && preview.value === i + 1 && isPlayable(preview, human);
          return { type: "slot", index: i, valid, element: valid ? rects.slots[i].element : null };
        }
      }
      return { type: "draw", valid: true, element: null };
    }

    if (rectContains(rects.discard, x, y)) {
      return { type: "discard", valid: true, element: els.discardPile };
    }

    for (let i = 0; i < rects.slots.length; i += 1) {
      if (!rectContains(rects.slots[i].rect, x, y)) continue;
      const valid = state.held && state.held.value === i + 1 && isPlayable(state.held, human);
      return { type: "slot", index: i, valid, element: valid ? rects.slots[i].element : null };
    }

    return { type: "none", valid: false, element: null };
  }

  function readDropRects() {
    return {
      discard: els.discardPile.getBoundingClientRect(),
      slots: Array.from(els.humanGrid.children).map((element) => ({
        element,
        rect: element.getBoundingClientRect()
      }))
    };
  }

  function rectContains(rect, x, y) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function render() {
    if (!state) return;
    const crownMode = isCrownMode();
    els.modeName.textContent = gameTitle();
    els.coinStrip.hidden = !crownMode;
    if (els.humanName) els.humanName.textContent = state.players[human].name || "You";
    if (els.botName) els.botName.textContent = state.players[bot].name || "Bot";
    document.body.classList.toggle("crown-mode", crownMode);
    document.body.classList.toggle("classic-mode", !crownMode);
    renderGrid(els.humanGrid, human);
    renderGrid(els.botGrid, bot);

    const humanUp = state.players[human].slots.filter((slot) => slot.up).length;
    const botUp = state.players[bot].slots.filter((slot) => slot.up).length;
    renderCoinHud();
    els.humanTrack.style.width = `${(humanUp / state.players[human].slots.length) * 100}%`;
    els.botTrack.style.width = `${(botUp / state.players[bot].slots.length) * 100}%`;
    if (state.phase === "over") {
      els.turnPill.textContent = "Round over";
      els.humanTurnText.textContent = checkWinner(human) ? "Won" : "Done";
      els.botTurnText.textContent = checkWinner(bot) ? "Won" : "Done";
      document.body.classList.remove("bot-turn");
    } else {
      els.turnPill.textContent = state.turn === human && state.phase !== "waiting" ? "Your turn" : `${state.players[bot].name || "Bot"} turn`;
      els.humanTurnText.textContent = state.turn === human && state.phase !== "waiting" ? (state.phase === "draw" ? "Draw" : "Place") : "Waiting";
      els.botTurnText.textContent = state.turn === bot || state.phase === "waiting" ? "Playing" : "Waiting";
      document.body.classList.toggle("bot-turn", state.turn === bot || state.phase === "waiting");
    }
    els.deckCount.textContent = state.deck.length;
    renderMini(els.discardCard, state.discard[state.discard.length - 1]);
    renderMini(els.currentCard.querySelector(".mini-card"), state.held);

    els.currentCard.classList.toggle("empty", !state.held);
    const canDropDiscard = state.turn === human && state.phase === "place" && state.held;
    const canDrawFromDeck = canHumanDraw();
    const canDrawFromDiscard = canHumanDraw() && state.discard.length > 0;
    els.discardPile.classList.toggle("discard-target", Boolean(canDropDiscard));
    els.deckPile.classList.toggle("draw-source", canDrawFromDeck);
    els.discardPile.classList.toggle("draw-source", canDrawFromDiscard);
    els.deckPile.disabled = !canDrawFromDeck;
    els.discardPile.disabled = !(canDrawFromDiscard || canDropDiscard);
    renderInventoryBar();
    renderTimerUi();
  }

  function renderGrid(grid, playerIndex) {
    grid.replaceChildren(...state.players[playerIndex].slots.map((slot, index) => renderCard(slot, index, playerIndex)));
  }

  enablePerformanceMode();
  loadSavedAuth();
  renderServerStatus();
  checkServerStatus();
  window.setInterval(checkServerStatus, 60000);

  els.menuModeButtons.forEach((button) => {
    button.addEventListener("click", () => showPlayMenu(button.dataset.menuMode));
  });
  document.querySelectorAll("[data-play-type]").forEach((button) => {
    button.addEventListener("click", () => choosePlayType(button.dataset.playType));
  });
  document.querySelectorAll("[data-start-mode]").forEach((button) => {
    button.addEventListener("click", () => startSelectedMode(button.dataset.startMode));
  });
  els.playBack.addEventListener("click", () => renderPlayMenu("type"));
  els.closePlay.addEventListener("click", () => els.playModal.classList.add("hidden"));
  els.playChosenButton.addEventListener("click", () => startSelectedMode(selectedMenuMode));
  els.onlineAuthButton.addEventListener("click", showAuth);
  els.createRoomButton.addEventListener("click", createOnlineRoom);
  els.joinRoomButton.addEventListener("click", joinOnlineRoom);
  els.roomReadyButton.addEventListener("click", toggleRoomReady);
  els.roomLeaveButton.addEventListener("click", () => closeRoomSocket());
  els.joinRoomCode.addEventListener("input", () => {
    els.joinRoomCode.value = normalizeRoomCode(els.joinRoomCode.value);
  });
  els.joinRoomCode.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      joinOnlineRoom();
    }
  });
  els.leaderboardButton.addEventListener("click", showLeaderboard);
  els.leaderboardTabs.forEach((button) => {
    button.addEventListener("click", () => loadLeaderboard(button.dataset.leaderboardMode));
  });
  els.closeLeaderboard.addEventListener("click", () => els.leaderboardModal.classList.add("hidden"));
  els.settingsButton.addEventListener("click", showSettings);
  els.settingsMusic.addEventListener("click", () => {
    toggleMusic();
    renderSettings();
  });
  els.settingsSfx.addEventListener("click", () => {
    toggleSfx();
    renderSettings();
  });
  els.settingsFullscreen.addEventListener("click", () => {
    toggleFullscreen();
    renderSettings();
  });
  if (els.settingsPerformance) els.settingsPerformance.addEventListener("click", cyclePerformanceMode);
  els.closeSettings.addEventListener("click", () => els.settingsModal.classList.add("hidden"));

  els.modeFullscreen.addEventListener("click", toggleFullscreen);
  els.fullscreenButton.addEventListener("click", toggleFullscreen);
  els.musicButton.addEventListener("click", toggleMusic);
  els.sfxButton.addEventListener("click", toggleSfx);
  els.serverStatusButton.addEventListener("click", checkServerStatus);
  if (els.accountButton) els.accountButton.addEventListener("click", showAuth);
  els.authForm.addEventListener("submit", handleAuthSubmit);
  els.authLoginTab.addEventListener("click", () => setAuthMode("login"));
  els.authSignupTab.addEventListener("click", () => setAuthMode("signup"));
  if (els.authRefresh) els.authRefresh.addEventListener("click", () => refreshAuthProfile(false));
  els.authLogout.addEventListener("click", logoutAuth);
  els.closeAuth.addEventListener("click", () => els.authModal.classList.add("hidden"));
  els.helpButton.addEventListener("click", showHelp);
  els.closeHelp.addEventListener("click", () => els.helpModal.classList.add("hidden"));
  els.releaseButtons.forEach((button) => button.addEventListener("click", showReleases));
  els.closeRelease.addEventListener("click", () => els.releaseModal.classList.add("hidden"));
  els.deckPile.addEventListener("pointerdown", (event) => beginPileDrag(event, "deck"));
  els.discardPile.addEventListener("pointerdown", (event) => beginPileDrag(event, "discard"));
  els.currentCard.querySelector(".mini-card").addEventListener("pointerdown", beginHeldDrag);
  els.deckPile.addEventListener("click", () => {
    if (suppressClick) return;
    drawFromDeck();
  });
  els.discardPile.addEventListener("click", () => {
    if (suppressClick) return;
    if (state && state.turn === human && state.phase === "place" && state.held) {
      trashHeld();
      return;
    }
    drawFromDiscard();
  });
  els.newGame.addEventListener("click", showModeSelect);
  els.playAgain.addEventListener("click", () => {
    if (modalAction) modalAction();
  });
  els.nextRound.addEventListener("click", () => {
    if (isWaitingForRemoteDiscard()) {
      els.shopStatus.textContent = `Waiting for ${state.players[bot].name} to discard an item.`;
      return;
    }
    if (state.online) {
      handleOnlineShopReadyClick();
      return;
    }
    if (!state.online) botShop();
    state.pendingPurchase = null;
    state.shopOffers = [];
    continueToNextRound();
  });
  ["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
    document.addEventListener(eventName, unlockAudio, { once: true, passive: true });
  });

  window.addEventListener("resize", setAppHeight);
  window.addEventListener("resize", enablePerformanceMode);
  window.addEventListener("online", checkServerStatus);
  window.addEventListener("offline", checkServerStatus);
  window.addEventListener("orientationchange", () => window.setTimeout(setAppHeight, 120));
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setAppHeight);
    window.visualViewport.addEventListener("scroll", setAppHeight);
  }
  document.addEventListener("fullscreenchange", syncFullscreenUi);
  document.addEventListener("webkitfullscreenchange", syncFullscreenUi);
  document.addEventListener("msfullscreenchange", syncFullscreenUi);
  setAppHeight();
  syncAudioUi();
  syncFullscreenUi();
}());
