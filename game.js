(function () {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const human = 0;
  const bot = 1;

  const ITEMS = {
    peek: {
      name: "Peek",
      cost: 3,
      text: "Briefly reveal one of your face-down cards."
    },
    secondDraw: {
      name: "Second Draw",
      cost: 5,
      text: "If your current card cannot be placed, discard it and draw again."
    },
    burn: {
      name: "Burn Pile",
      cost: 4,
      text: "Burn the top discard and flip a fresh card onto the pile."
    },
    swap: {
      name: "Swap",
      cost: 6,
      text: "Swap two face-down cards on your board."
    },
    wild: {
      name: "Wild Chance",
      cost: 7,
      text: "Discard a face card and draw again."
    },
    debt: {
      name: "Debt of the Crown",
      cost: 30,
      legendary: true,
      text: "Opponent adds 1 required card next round. Cannot exceed 10."
    }
  };

  const shopPool = ["peek", "peek", "secondDraw", "burn", "burn", "swap", "wild", "debt"];

  const els = {
    modeScreen: document.getElementById("modeScreen"),
    gameShell: document.getElementById("gameShell"),
    modeFullscreen: document.getElementById("modeFullscreen"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    modeName: document.getElementById("modeName"),
    botGrid: document.getElementById("botGrid"),
    humanGrid: document.getElementById("humanGrid"),
    botProgress: document.getElementById("botProgress"),
    humanProgress: document.getElementById("humanProgress"),
    botNeed: document.getElementById("botNeed"),
    humanNeed: document.getElementById("humanNeed"),
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

  function setAppHeight() {
    const visualHeight = window.visualViewport && window.visualViewport.height;
    const height = Math.max(320, Math.round(visualHeight || window.innerHeight || document.documentElement.clientHeight));
    document.documentElement.style.setProperty("--app-height", `${height}px`);
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
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
      players: [createPlayer("You"), createPlayer("Bot")]
    };
    els.modeScreen.classList.add("hidden");
    els.gameShell.classList.remove("hidden");
    setAppHeight();
    hideAllModals();
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

  function isPlayable(card, playerIndex) {
    if (!card || card.value < 1) return false;
    const slots = state.players[playerIndex].slots;
    if (card.value > slots.length) return false;
    return !slots[card.value - 1].up;
  }

  function canHumanDraw() {
    return state && !state.over && state.turn === human && state.phase === "draw";
  }

  function setStatus(text) {
    els.statusText.textContent = text;
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
    if (state.over || state.phase !== "place" || !state.held) return;
    if (state.held.value !== index + 1 || state.players[playerIndex].slots[index].up) return;

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

    if (checkWinner(playerIndex)) return endRound(playerIndex);

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
  }

  function runBotTurn() {
    if (state.over) return;
    state.turn = bot;
    state.phase = "place";
    state.turnPlacements = 0;
    render();

    botMaybeUseBurn();
    const topDiscard = state.discard[state.discard.length - 1];
    const useDiscard = isPlayable(topDiscard, bot);
    state.drawSource = useDiscard ? "discard" : "deck";
    state.held = useDiscard ? state.discard.pop() : drawDeckCard();
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

  function botMaybeRedraw() {
    if (!isCrownMode() || !state.held) return false;
    const secondIndex = state.players[bot].items.indexOf("secondDraw");
    const wildIndex = state.players[bot].items.indexOf("wild");
    const usableIndex = secondIndex >= 0 ? secondIndex : (state.held.value > 10 ? wildIndex : -1);
    if (usableIndex < 0) return false;
    state.discard.push(state.held);
    state.held = drawDeckCard();
    state.drawSource = "deck";
    consumeItem(bot, usableIndex);
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
        () => showModeSelect()
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
      let coins = index === winner ? 5 : 2;
      const parts = [index === winner ? "+5 round win" : "+2 stayed in it"];
      if (player.maxChain >= 3) {
        coins += 2;
        parts.push("+2 chain");
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
        coins += 4;
        parts.push("+4 comeback");
      }
      if (index === winner && !player.itemUsedThisRound) {
        coins += 2;
        parts.push("+2 no item used");
      }
      player.coins += coins;
      lines.push(`${player.name}: +${coins} coins (${parts.join(", ")})`);
    });
    return lines;
  }

  function showRoundModal(title, summary, rewards, buttonText, action) {
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
    hideAllModals();
    els.shopModal.classList.remove("hidden");
    els.shopStatus.textContent = message || "Buy, replace, use Debt of the Crown, or skip ahead.";
    renderShop();
    render();
  }

  function generateShopOffers() {
    const offers = [];
    const pool = [...shopPool];
    while (offers.length < 3 && pool.length) {
      const id = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (!offers.includes(id)) offers.push(id);
    }
    return offers;
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
    return itemCard(itemId, actions);
  }

  function shopOfferCard(itemId) {
    const item = ITEMS[itemId];
    const canAfford = state.players[human].coins >= item.cost;
    const full = state.players[human].items.length >= 2;
    return itemCard(itemId, [{
      text: full ? "Replace..." : `Buy for ${item.cost}`,
      primary: true,
      disabled: !canAfford,
      handler: () => buyOffer(itemId)
    }]);
  }

  function emptyItemCard(text) {
    const div = document.createElement("div");
    div.className = "item-card";
    div.innerHTML = `<p>${text}</p>`;
    return div;
  }

  function itemCard(itemId, actions, legacyHandler = null) {
    const item = ITEMS[itemId];
    const card = document.createElement("div");
    card.className = `item-card${item.legendary ? " legendary" : ""}`;
    const title = document.createElement("strong");
    title.textContent = item.name;
    const cost = document.createElement("span");
    cost.textContent = item.legendary ? `${item.cost} coins · Legendary` : `${item.cost} coins`;
    const text = document.createElement("p");
    text.textContent = item.text;
    card.append(title, cost, text);

    if (typeof actions === "string") {
      const button = document.createElement("button");
      button.textContent = actions;
      button.className = "primary";
      button.addEventListener("click", legacyHandler);
      card.appendChild(button);
      return card;
    }

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.textContent = action.text;
      if (action.primary) button.classList.add("primary");
      button.disabled = Boolean(action.disabled);
      button.addEventListener("click", action.handler);
      card.appendChild(button);
    });
    return card;
  }

  function buyOffer(itemId) {
    const player = state.players[human];
    const item = ITEMS[itemId];
    if (player.coins < item.cost) {
      els.shopStatus.textContent = "Not enough coins.";
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

  function useDebt(index) {
    if (state.players[bot].targetSize >= 10) {
      els.shopStatus.textContent = "Bot is already back at 10 cards.";
      return;
    }
    state.players[bot].targetSize += 1;
    state.players[human].items.splice(index, 1);
    els.shopStatus.textContent = `Debt of the Crown hit. Bot now needs ${state.players[bot].targetSize}.`;
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
      state.players[human].targetSize += 1;
    }

    const offers = generateShopOffers()
      .filter((itemId) => botPlayer.coins >= ITEMS[itemId].cost)
      .filter((itemId) => itemId !== "debt" || state.players[human].targetSize < 10)
      .sort((a, b) => ITEMS[b].cost - ITEMS[a].cost);
    if (botPlayer.items.length < 2 && offers.length) {
      const pick = offers[0];
      botPlayer.items.push(pick);
      botPlayer.coins -= ITEMS[pick].cost;
    }
  }

  function continueToNextRound() {
    state.round += 1;
    startRound();
  }

  function hideAllModals() {
    els.roundModal.classList.add("hidden");
    els.discardModal.classList.add("hidden");
    els.shopModal.classList.add("hidden");
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

    if (itemId === "peek") {
      state.pendingItem = { type: "peek", index };
      setStatus("Tap a face-down card to peek.");
      render();
      return;
    }

    if (itemId === "swap") {
      state.pendingItem = { type: "swap", index, picks: [] };
      setStatus("Tap two face-down cards to swap.");
      render();
      return;
    }

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

    if (itemId === "secondDraw") {
      if (state.phase !== "place" || !state.held || isPlayable(state.held, human)) {
        setStatus("Second Draw needs an unplayable current card.");
        return;
      }
      state.discard.push(state.held);
      state.held = drawDeckCard();
      state.drawSource = "deck";
      consumeItem(human, index);
      afterDraw(human);
      return;
    }

    if (itemId === "wild") {
      if (state.phase !== "place" || !state.held || state.held.value <= 10) {
        setStatus("Wild Chance needs a face card.");
        return;
      }
      state.discard.push(state.held);
      state.held = drawDeckCard();
      state.drawSource = "deck";
      consumeItem(human, index);
      afterDraw(human);
      return;
    }

    if (itemId === "debt") {
      setStatus("Use Debt of the Crown in the shop between rounds.");
    }
  }

  function handleItemSlot(index) {
    if (!state.pendingItem) return false;
    const pending = state.pendingItem;
    const slots = state.players[human].slots;
    const slot = slots[index];
    if (!slot || slot.up) return true;

    if (pending.type === "peek") {
      slot.peeked = true;
      consumeItem(human, pending.index);
      setStatus(`Slot ${index + 1} hides ${cardLabel(slot.card)}.`);
      render();
      window.setTimeout(() => {
        if (!slot.up) {
          slot.peeked = false;
          render();
        }
      }, 1600);
      return true;
    }

    if (pending.type === "swap") {
      if (pending.picks.includes(index)) return true;
      pending.picks.push(index);
      if (pending.picks.length < 2) {
        setStatus("Choose the second face-down card.");
        render();
        return true;
      }
      const [first, second] = pending.picks;
      [slots[first].card, slots[second].card] = [slots[second].card, slots[first].card];
      slots[first].peeked = false;
      slots[second].peeked = false;
      consumeItem(human, pending.index);
      setStatus(`Swapped slots ${first + 1} and ${second + 1}.`);
      render();
      return true;
    }

    return false;
  }

  function consumeItem(playerIndex, index) {
    state.players[playerIndex].items.splice(index, 1);
    state.players[playerIndex].itemUsedThisRound = true;
    state.pendingItem = null;
  }

  function renderCard(slot, index, owner) {
    const button = document.createElement("button");
    const itemSelectable = owner === human && state.pendingItem && !slot.up;
    const playable = owner === human && state.phase === "place" && state.held && state.held.value === index + 1 && !slot.up;
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
    els.modeName.textContent = state.mode === "crown" ? "Trash: Crown Debt" : "Trash";
    renderGrid(els.humanGrid, human);
    renderGrid(els.botGrid, bot);

    const humanUp = state.players[human].slots.filter((slot) => slot.up).length;
    const botUp = state.players[bot].slots.filter((slot) => slot.up).length;
    els.humanProgress.textContent = `${humanUp}/${state.players[human].slots.length}`;
    els.botProgress.textContent = `${botUp}/${state.players[bot].slots.length}`;
    els.humanNeed.textContent = isCrownMode()
      ? `Need ${state.players[human].targetSize} · ${state.players[human].coins}c`
      : `Need ${state.players[human].targetSize}`;
    els.botNeed.textContent = isCrownMode()
      ? `Need ${state.players[bot].targetSize} · ${state.players[bot].coins}c`
      : `Need ${state.players[bot].targetSize}`;
    els.humanTrack.style.width = `${(humanUp / state.players[human].slots.length) * 100}%`;
    els.botTrack.style.width = `${(botUp / state.players[bot].slots.length) * 100}%`;
    els.turnPill.textContent = state.turn === human ? "Your turn" : "Bot turn";
    els.humanTurnText.textContent = state.turn === human ? (state.phase === "draw" ? "Draw" : "Place") : "Waiting";
    els.botTurnText.textContent = state.turn === bot || state.phase === "waiting" ? "Playing" : "Waiting";
    document.body.classList.toggle("bot-turn", state.turn === bot || state.phase === "waiting");
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
  els.deckPile.addEventListener("pointerdown", (event) => beginPileDrag(event, "deck"));
  els.discardPile.addEventListener("pointerdown", (event) => beginPileDrag(event, "discard"));
  els.currentCard.querySelector(".mini-card").addEventListener("pointerdown", beginHeldDrag);
  els.deckPile.addEventListener("click", () => {
    if (suppressClick) return;
    drawFromDeck();
  });
  els.discardPile.addEventListener("click", () => {
    if (suppressClick) return;
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
  syncFullscreenUi();
}());
