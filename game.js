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
      text: "Flip one hidden card that is already in its correct slot."
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
    sabotage: {
      name: "Sabotage",
      cost: 12,
      tier: "rare",
      text: "Flip one random opponent placed card back face-down."
    },
    chaosCut: {
      name: "Chaos Cut",
      cost: 11,
      tier: "rare",
      text: "Shuffle every face-down card on both boards."
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
      text: "Place one face card into any empty slot."
    },
    debt: {
      name: "Debt of the Crown",
      cost: 28,
      tier: "legendary",
      legendary: true,
      text: "Opponent adds 1 required card next round. Rare after round 3."
    }
  };

  const SHOP_TIERS = {
    common: ["burn", "coinPurse", "luckyMatch"],
    uncommon: ["pardon", "graveGrab", "loadedDraw", "taxCollector"],
    rare: ["sabotage", "chaosCut", "shield", "wildSeal"],
    legendary: ["debt"]
  };
  const BOT_SHOP_ITEMS = new Set(["burn", "coinPurse", "luckyMatch", "pardon", "graveGrab", "loadedDraw", "taxCollector", "sabotage", "chaosCut", "shield", "debt"]);
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

  const els = {
    modeScreen: document.getElementById("modeScreen"),
    gameShell: document.getElementById("gameShell"),
    musicButton: document.getElementById("musicButton"),
    sfxButton: document.getElementById("sfxButton"),
    modeFullscreen: document.getElementById("modeFullscreen"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    helpButton: document.getElementById("helpButton"),
    helpModal: document.getElementById("helpModal"),
    closeHelp: document.getElementById("closeHelp"),
    modeName: document.getElementById("modeName"),
    coinStrip: document.getElementById("coinStrip"),
    botGrid: document.getElementById("botGrid"),
    humanGrid: document.getElementById("humanGrid"),
    botCoins: document.getElementById("botCoins"),
    humanCoins: document.getElementById("humanCoins"),
    botCoinPop: document.getElementById("botCoinPop"),
    humanCoinPop: document.getElementById("humanCoinPop"),
    botTrack: document.getElementById("botTrack"),
    humanTrack: document.getElementById("humanTrack"),
    botTurnText: document.getElementById("botTurnText"),
    humanTurnText: document.getElementById("humanTurnText"),
    turnPill: document.getElementById("turnPill"),
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
    shopInventory: document.getElementById("shopInventory"),
    shopOffers: document.getElementById("shopOffers"),
    nextRound: document.getElementById("nextRound")
  };

  let state = null;
  let drag = null;
  let suppressClick = false;
  let modalAction = null;
  let fallbackFullscreen = false;
  const audioState = {
    musicEnabled: false,
    sfxEnabled: false,
    initialized: false,
    musicTracks: [],
    currentMusicSrc: "",
    failedMusicTracks: new Set(),
    music: null,
    sfx: {}
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
      audioState.sfx[key] = makeAudio(AUDIO_FILES[key], false, AUDIO_VOLUMES[key]);
    });
    audioState.initialized = true;
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
  }

  function playSfx(name) {
    if (!audioState.sfxEnabled) return;
    initAudio();
    const base = audioState.sfx[name];
    if (!base) return;
    const clip = base.cloneNode(true);
    clip.volume = base.volume;
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
      els.modeFullscreen.textContent = active ? "Fullscreen on" : "Open fullscreen";
    }

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
      itemUsedThisRound: false
    };
  }

  function startMatch(mode) {
    state = {
      mode,
      round: 1,
      deck: [],
      discard: [],
      held: null,
      turn: human,
      phase: "draw",
      over: false,
      drawSource: null,
      turnPlacements: 0,
      pendingItem: null,
      pendingPurchase: null,
      shopOffers: [],
      shopLocked: false,
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
    const deck = makeDeck();
    state.deck = deck;
    state.discard = [];
    state.held = null;
    state.turn = human;
    state.phase = "draw";
    state.over = false;
    state.drawSource = null;
    state.turnPlacements = 0;
    state.pendingItem = null;
    state.players.forEach((player) => {
      player.slots = dealSlots(deck, player.targetSize);
      player.maxChain = 0;
      player.discardPlace = false;
      player.faceTrashed = false;
      player.itemUsedThisRound = false;
    });
    state.discard.push(drawDeckCard());
    hideAllModals();
    setStatus("Draw a card, then drag it to a slot or discard.");
    render();
  }

  function makeDeck() {
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
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
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

  function recycleDiscard() {
    if (state.discard.length <= 1) return;
    const top = state.discard.pop();
    state.deck = state.discard;
    state.discard = [top];
    for (let i = state.deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
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

  function drawFrom(source, sourceRect, playerIndex) {
    const drawn = source === "discard" ? state.discard.pop() : drawDeckCard();
    state.held = drawn;
    state.phase = "place";
    state.drawSource = source;
    state.turnPlacements = 0;
    afterDraw(playerIndex, false);
    render();
    animateCard(drawn, sourceRect, currentRect(), "draw");
    playSfx("draw");
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

  function placeHeld(index, sourceRectOverride = null, playerIndex = human) {
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

    if (checkWinner(playerIndex)) {
      endRound(playerIndex);
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
    return true;
  }

  function trashHeld() {
    if (state.over || state.turn !== human || state.phase !== "place" || !state.held) return;
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

  function runBotTurn() {
    if (state.over) return;
    state.turn = bot;
    state.phase = "place";
    state.turnPlacements = 0;
    render();

    botMaybeUseSabotage();
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
    } else if (!botMaybeUseLoadedDraw()) {
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
    }
    return true;
  }

  function botMaybeUseLoadedDraw() {
    if (!isCrownMode()) return false;
    const itemIndex = state.players[bot].items.indexOf("loadedDraw");
    if (itemIndex < 0) return false;
    return loadedDraw(bot, itemIndex);
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
    const matches = correctHiddenSlots(playerIndex);
    if (!matches.length) return false;
    const { slot, index } = matches[Math.floor(Math.random() * matches.length)];
    slot.up = true;
    slot.peeked = false;
    consumeItem(playerIndex, itemIndex);
    if (checkWinner(playerIndex)) {
      endRound(playerIndex);
      return true;
    }
    if (playerIndex === human) setStatus(`Lucky Match flipped slot ${index + 1}.`);
    render();
    bumpElement(cardElement(playerIndex, index));
    return true;
  }

  function useSabotage(attackerIndex, targetIndex, itemIndex) {
    const targets = faceUpSlots(targetIndex);
    if (!targets.length) return false;
    const { slot, index } = targets[Math.floor(Math.random() * targets.length)];
    slot.up = false;
    slot.peeked = false;
    consumeItem(attackerIndex, itemIndex);
    if (attackerIndex === human) setStatus(`Sabotage flipped Bot slot ${index + 1} face-down.`);
    render();
    bumpElement(cardElement(targetIndex, index));
    return true;
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
    return true;
  }

  function botMaybeUseLuckyMatch() {
    if (!isCrownMode()) return false;
    const itemIndex = state.players[bot].items.indexOf("luckyMatch");
    if (itemIndex < 0 || !correctHiddenSlots(bot).length) return false;
    return useLuckyMatch(bot, itemIndex);
  }

  function botMaybeUseSabotage() {
    if (!isCrownMode()) return false;
    const itemIndex = state.players[bot].items.indexOf("sabotage");
    const botUp = faceUpSlots(bot).length;
    const humanUp = faceUpSlots(human).length;
    if (itemIndex < 0 || humanUp < 2 || humanUp <= botUp) return false;
    return useSabotage(bot, human, itemIndex);
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
    const pardonIndex = state.players[bot].items.indexOf("pardon");
    const graveIndex = state.players[bot].items.indexOf("graveGrab");
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
    const loser = winner === human ? bot : human;
    const winnerName = winner === human ? "You" : "Bot";
    const winnerWasBehind = state.players[winner].targetSize > state.players[loser].targetSize;
    const matchWon = state.players[winner].targetSize === 1;
    const rewards = isCrownMode() ? awardCoins(winner, winnerWasBehind) : [];

    render();

    if (matchWon) {
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
    const summary = `${winnerName} won the round. ${winnerName === "You" ? "Your" : "Bot's"} next board is ${state.players[winner].targetSize} cards.`;

    if (isCrownMode()) {
      if (state.players[winner].items.length >= 2) {
        if (winner === human) {
          showForcedDiscard();
        } else {
          const removed = botDiscardWeakestItem();
          showShop(`Bot discarded ${ITEMS[removed].name} after winning with two items.`);
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
    hideAllModals();
    els.discardChoices.replaceChildren(...state.players[human].items.map((itemId, index) => {
      const card = itemCard(itemId, `Discard ${ITEMS[itemId].name}`, () => {
        state.players[human].items.splice(index, 1);
        showShop("You discarded an item after winning with two.");
      });
      return card;
    }));
    els.discardModal.classList.remove("hidden");
  }

  function showShop(message) {
    if (!state.shopOffers.length) state.shopOffers = generateShopOffers();
    state.shopLocked = false;
    state.pendingPurchase = null;
    hideAllModals();
    els.shopModal.classList.remove("hidden");
    els.shopStatus.textContent = message || "Buy, replace, claim, use Debt of the Crown, or skip ahead.";
    renderShop();
    render();
    playSfx("shop");
  }

  function generateShopOffers() {
    const offers = [];
    addShopOffer(offers, SHOP_TIERS.common);
    addShopOffer(offers, SHOP_TIERS.common);

    const legendaryRoll = state.round >= 3 && Math.random() < 0.08;
    if (legendaryRoll) {
      addShopOffer(offers, SHOP_TIERS.legendary);
    } else {
      addShopOffer(offers, Math.random() < 0.35 ? SHOP_TIERS.rare : SHOP_TIERS.uncommon);
    }

    const fallbackPool = [...SHOP_TIERS.common, ...SHOP_TIERS.uncommon, ...SHOP_TIERS.rare];
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
    els.coinText.textContent = `Coins: ${player.coins}`;
    els.roundText.textContent = `Round ${state.round}`;

    const inventoryNodes = player.items.length
      ? player.items.map((itemId, index) => shopInventoryCard(itemId, index))
      : [emptyItemCard("No items held.")];
    els.shopInventory.replaceChildren(...inventoryNodes);

    els.shopOffers.replaceChildren(...state.shopOffers.map((itemId) => shopOfferCard(itemId)));
  }

  function shopInventoryCard(itemId, index) {
    const actions = [];
    if (state.pendingPurchase) {
      actions.push({
        text: `Replace with ${ITEMS[state.pendingPurchase].name}`,
        primary: true,
        handler: () => replaceItem(index)
      });
    }
    if (itemId === "debt") {
      actions.push({
        text: "Use",
        primary: true,
        disabled: state.players[bot].targetSize >= 10,
        handler: () => useDebt(index)
      });
    }
    if (ITEMS[itemId].shopUse) {
      actions.push({
        text: "Use",
        primary: true,
        disabled: !canUseShopItem(itemId, human),
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
    return false;
  }

  function useShopItem(itemId, itemIndex, playerIndex, targetIndex) {
    if (itemId === "taxCollector") {
      if (!useTaxCollector(playerIndex, targetIndex, itemIndex) && playerIndex === human) {
        els.shopStatus.textContent = "Bot has no coins to steal.";
      }
    }
  }

  function shopOfferCard(itemId) {
    const item = ITEMS[itemId];
    const canAfford = state.players[human].coins >= item.cost;
    const full = state.players[human].items.length >= 2 && !item.immediate;
    const actionText = itemId === "coinPurse" ? "Claim +3" : full ? "Replace..." : `Buy for ${item.cost}`;
    return itemCard(itemId, [{
      text: actionText,
      primary: true,
      disabled: !canAfford || state.shopLocked,
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
      els.shopStatus.textContent = "Claimed Coin Purse for +3 coins. The shop is closed for buying.";
      renderShop();
      render();
      showCoinPop(human, 3, "purse");
      return;
    }
    if (player.items.length >= 2) {
      state.pendingPurchase = itemId;
      els.shopStatus.textContent = `Choose an item to replace with ${item.name}.`;
      renderShop();
      return;
    }
    player.coins -= item.cost;
    player.items.push(itemId);
    state.shopOffers = state.shopOffers.filter((offer) => offer !== itemId);
    els.shopStatus.textContent = `Bought ${item.name}.`;
    renderShop();
    render();
  }

  function replaceItem(index) {
    const itemId = state.pendingPurchase;
    const item = ITEMS[itemId];
    const player = state.players[human];
    if (!itemId || player.coins < item.cost) return;
    const old = player.items[index];
    player.coins -= item.cost;
    player.items[index] = itemId;
    state.shopOffers = state.shopOffers.filter((offer) => offer !== itemId);
    state.pendingPurchase = null;
    els.shopStatus.textContent = `Replaced ${ITEMS[old].name} with ${item.name}.`;
    renderShop();
    render();
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
    const result = applyDebt(human, bot);
    if (result === "max") {
      els.shopStatus.textContent = "Bot is already back at 10 cards.";
      return;
    }
    state.players[human].items.splice(index, 1);
    els.shopStatus.textContent = result === "blocked"
      ? "Debt of the Crown was blocked by Bot's Crown Shield."
      : `Debt of the Crown hit. Bot now needs ${state.players[bot].targetSize}.`;
    renderShop();
    render();
  }

  function botDiscardWeakestItem() {
    const items = state.players[bot].items;
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

    const offers = generateShopOffers()
      .filter((itemId) => BOT_SHOP_ITEMS.has(itemId))
      .filter((itemId) => botPlayer.coins >= ITEMS[itemId].cost)
      .filter((itemId) => itemId !== "debt" || state.players[human].targetSize < 10)
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

  function continueToNextRound() {
    state.round += 1;
    state.shopOffers = [];
    state.shopLocked = false;
    state.pendingPurchase = null;
    startRound();
  }

  function hideAllModals() {
    els.helpModal.classList.add("hidden");
    els.roundModal.classList.add("hidden");
    els.discardModal.classList.add("hidden");
    els.shopModal.classList.add("hidden");
  }

  function showHelp() {
    els.helpModal.classList.remove("hidden");
  }

  function showModeSelect() {
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
      return;
    }

    if (itemId === "luckyMatch") {
      if (!useLuckyMatch(human, index)) setStatus("Lucky Match needs a hidden card already in the right slot.");
      return;
    }

    if (itemId === "sabotage") {
      if (!useSabotage(human, bot, index)) setStatus("Sabotage needs Bot to have at least one placed card.");
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
      setStatus("Tap any empty slot for the sealed face card.");
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
      if (!state.held || state.held.value <= 10) return true;
      placeWildSeal(index, pending.index);
      return true;
    }

    return false;
  }

  function placeWildSeal(index, itemIndex) {
    if (state.over || state.turn !== human || state.phase !== "place" || !state.held || state.players[human].slots[index].up) return;
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

    if (checkWinner(human)) return endRound(human);

    if (isPlayable(state.held, human)) {
      setStatus(`Wild Seal landed. Keep going with ${cardLabel(state.held)}.`);
    } else {
      setStatus(`Wild Seal landed. ${cardLabel(state.held)} is trash.`);
    }
    render();
    animateCard(placed, sourceRect, targetRect, "place");
    bumpElement(els.currentCard);
    playSfx("place");
  }

  function consumeItem(playerIndex, index) {
    state.players[playerIndex].items.splice(index, 1);
    state.players[playerIndex].itemUsedThisRound = true;
    state.pendingItem = null;
  }

  function renderCard(slot, index, owner) {
    const button = document.createElement("button");
    const humanCanAct = owner === human && state.turn === human && !state.over && state.phase !== "waiting";
    const itemSelectable = humanCanAct && state.pendingItem && !slot.up;
    const playable = humanCanAct && canPlaceHeldFor(human, index);
    const visible = slot.up || slot.peeked;
    button.className = `card ${visible ? "face-up" : "face-down"}${playable ? " target" : ""}${itemSelectable ? " item-selectable" : ""}`;
    button.type = "button";
    button.disabled = owner !== human || (!playable && !itemSelectable);
    button.dataset.slotIndex = String(index);
    if (owner === human) button.dataset.dragTarget = "slot";
    button.setAttribute("aria-label", `${owner === human ? "Your" : "Bot"} slot ${index + 1}`);
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
      moved: false,
      hotElement: null,
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
    moveDragGhost(event.clientX, event.clientY);
    updateDropHighlight(dropTargetAt(event.clientX, event.clientY));
  }

  function moveDragGhost(x, y) {
    if (!drag) return;
    drag.ghost.style.left = `${x}px`;
    drag.ghost.style.top = `${y}px`;
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

    if (drag.mode === "draw") {
      if (drag.source === "discard") {
        const slots = Array.from(els.humanGrid.children);
        const preview = state.discard[state.discard.length - 1];
        for (let i = 0; i < slots.length; i += 1) {
          if (!rectContains(slots[i].getBoundingClientRect(), x, y)) continue;
          const valid = preview && preview.value === i + 1 && isPlayable(preview, human);
          return { type: "slot", index: i, valid, element: valid ? slots[i] : null };
        }
      }
      return { type: "draw", valid: true, element: null };
    }

    if (rectContains(els.discardPile.getBoundingClientRect(), x, y)) {
      return { type: "discard", valid: true, element: els.discardPile };
    }

    const slots = Array.from(els.humanGrid.children);
    for (let i = 0; i < slots.length; i += 1) {
      if (!rectContains(slots[i].getBoundingClientRect(), x, y)) continue;
      const valid = state.held && state.held.value === i + 1 && isPlayable(state.held, human);
      return { type: "slot", index: i, valid, element: valid ? slots[i] : null };
    }

    return { type: "none", valid: false, element: null };
  }

  function rectContains(rect, x, y) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function render() {
    if (!state) return;
    const crownMode = isCrownMode();
    els.modeName.textContent = gameTitle();
    els.coinStrip.hidden = !crownMode;
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
      els.turnPill.textContent = state.turn === human && state.phase !== "waiting" ? "Your turn" : "Bot turn";
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
  }

  function renderGrid(grid, playerIndex) {
    grid.replaceChildren(...state.players[playerIndex].slots.map((slot, index) => renderCard(slot, index, playerIndex)));
  }

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => startMatch(button.dataset.mode));
  });

  els.modeFullscreen.addEventListener("click", toggleFullscreen);
  els.fullscreenButton.addEventListener("click", toggleFullscreen);
  els.musicButton.addEventListener("click", toggleMusic);
  els.sfxButton.addEventListener("click", toggleSfx);
  els.helpButton.addEventListener("click", showHelp);
  els.closeHelp.addEventListener("click", () => els.helpModal.classList.add("hidden"));
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
    botShop();
    state.pendingPurchase = null;
    state.shopOffers = [];
    continueToNextRound();
  });

  window.addEventListener("resize", setAppHeight);
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
