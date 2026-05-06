(function () {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const human = 0;
  const bot = 1;

  const els = {
    botGrid: document.getElementById("botGrid"),
    humanGrid: document.getElementById("humanGrid"),
    botProgress: document.getElementById("botProgress"),
    humanProgress: document.getElementById("humanProgress"),
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
    statusText: document.getElementById("statusText"),
    newGame: document.getElementById("newGame"),
    roundModal: document.getElementById("roundModal"),
    roundTitle: document.getElementById("roundTitle"),
    roundSummary: document.getElementById("roundSummary"),
    playAgain: document.getElementById("playAgain")
  };

  let state;
  let drag = null;
  let suppressClick = false;

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

  function newRound() {
    const deck = makeDeck();
    state = {
      deck,
      discard: [],
      held: null,
      turn: human,
      phase: "draw",
      over: false,
      players: [
        { name: "You", slots: dealSlots(deck) },
        { name: "Bot", slots: dealSlots(deck) }
      ]
    };
    state.discard.push(drawDeckCard());
    els.roundModal.classList.add("hidden");
    setStatus("Draw a card, then drag it to a slot or discard.");
    render();
  }

  function dealSlots(deck) {
    return Array.from({ length: 10 }, () => ({
      card: deck.pop(),
      up: false
    }));
  }

  function drawDeckCard() {
    if (state && state.deck.length === 0) {
      recycleDiscard();
    }
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

  function isPlayable(card, playerIndex) {
    if (!card || card.value < 1 || card.value > 10) return false;
    return !state.players[playerIndex].slots[card.value - 1].up;
  }

  function setStatus(text) {
    els.statusText.textContent = text;
  }

  function drawFromDeck() {
    if (!canHumanDraw()) return;
    const sourceRect = els.deckPile.getBoundingClientRect();
    drawFrom("deck", sourceRect);
  }

  function drawFromDiscard() {
    if (!canHumanDraw() || state.discard.length === 0) return;
    const sourceRect = els.discardPile.getBoundingClientRect();
    drawFrom("discard", sourceRect);
  }

  function drawFrom(source, sourceRect) {
    const drawn = source === "discard" ? state.discard.pop() : drawDeckCard();
    state.held = drawn;
    state.phase = "place";
    afterHumanDraw(false);
    render();
    animateCard(drawn, sourceRect, currentRect(), "draw");
  }

  function afterHumanDraw(shouldRender = true) {
    if (isPlayable(state.held, human)) {
      const target = state.held.value;
      setStatus(`Drag ${cardLabel(state.held)} to slot ${target}.`);
    } else {
      setStatus(`${cardLabel(state.held)} cannot be placed. Drag it to discard.`);
    }
    if (shouldRender) render();
  }

  function canHumanDraw() {
    return !state.over && state.turn === human && state.phase === "draw";
  }

  function placeHeld(index, sourceRectOverride = null) {
    if (state.over || state.turn !== human || state.phase !== "place" || !state.held) return;
    if (state.held.value !== index + 1 || state.players[human].slots[index].up) return;
    const sourceRect = sourceRectOverride || currentRect();
    const targetRect = cardRect(human, index);
    const placed = state.held;
    const slot = state.players[human].slots[index];
    const bumped = slot.card;
    slot.card = state.held;
    slot.up = true;
    state.held = bumped;

    if (checkWinner(human)) return endRound(human);

    if (isPlayable(state.held, human)) {
      setStatus(`Keep going: drag ${cardLabel(state.held)} to slot ${state.held.value}.`);
    } else {
      setStatus(`${cardLabel(state.held)} is trash. Drag it to discard.`);
    }
    render();
    animateCard(placed, sourceRect, targetRect, "place");
    bumpElement(els.currentCard);
  }

  function trashHeld() {
    if (state.over || state.turn !== human || state.phase !== "place" || !state.held) return;
    const sourceRect = currentRect();
    const targetRect = els.discardPile.getBoundingClientRect();
    const trashed = state.held;
    state.discard.push(state.held);
    state.held = null;
    state.phase = "waiting";
    setStatus("Bot is playing...");
    render();
    animateCard(trashed, sourceRect, targetRect, "trash");
    bumpElement(els.discardPile);
    window.setTimeout(runBotTurn, 720);
  }

  function runBotTurn() {
    if (state.over) return;
    state.turn = bot;
    state.phase = "place";
    render();

    const topDiscard = state.discard[state.discard.length - 1];
    state.held = isPlayable(topDiscard, bot) ? state.discard.pop() : drawDeckCard();
    const origin = isPlayable(topDiscard, bot) ? els.discardPile.getBoundingClientRect() : els.deckPile.getBoundingClientRect();
    render();
    animateCard(state.held, origin, currentRect(), "draw");

    let safety = 20;
    const playStep = () => {
      if (state.over) return;
      if (!isPlayable(state.held, bot) || safety <= 0) {
        if (state.held) {
          const trashed = state.held;
          const sourceRect = currentRect();
          const targetRect = els.discardPile.getBoundingClientRect();
          state.discard.push(state.held);
          state.held = null;
          state.turn = human;
          state.phase = "draw";
          setStatus("Your turn. Draw a card, then drag it to a slot or discard.");
          render();
          animateCard(trashed, sourceRect, targetRect, "trash");
          bumpElement(els.discardPile);
          return;
        }
        state.turn = human;
        state.phase = "draw";
        setStatus("Your turn. Draw a card, then drag it to a slot or discard.");
        render();
        return;
      }

      const sourceRect = currentRect();
      const targetRect = cardRect(bot, state.held.value - 1);
      const placed = state.held;
      const slot = state.players[bot].slots[state.held.value - 1];
      const bumped = slot.card;
      slot.card = state.held;
      slot.up = true;
      state.held = bumped;
      safety -= 1;
      if (checkWinner(bot)) return endRound(bot);
      render();
      animateCard(placed, sourceRect, targetRect, "place");
      window.setTimeout(playStep, 460);
    };

    window.setTimeout(playStep, 620);
  }

  function checkWinner(playerIndex) {
    return state.players[playerIndex].slots.every((slot) => slot.up);
  }

  function endRound(winner) {
    state.over = true;
    state.phase = "over";
    state.held = null;
    render();
    els.roundTitle.textContent = winner === human ? "You won." : "Bot won.";
    els.roundSummary.textContent = winner === human
      ? "Clean sweep: all ten slots are locked A through 10."
      : "The bot filled every slot first. Rematch?";
    els.roundModal.classList.remove("hidden");
  }

  function renderCard(slot, index, owner) {
    const button = document.createElement("button");
    const playable = owner === human && state.phase === "place" && state.held && state.held.value === index + 1 && !slot.up;
    button.className = `card ${slot.up ? "face-up" : "face-down"}${playable ? " target" : ""}`;
    button.type = "button";
    button.disabled = owner !== human || !playable;
    button.dataset.slotIndex = String(index);
    if (owner === human) button.dataset.dragTarget = "slot";
    button.setAttribute("aria-label", `${owner === human ? "Your" : "Bot"} slot ${index + 1}`);
    button.addEventListener("click", () => placeHeld(index));

    const number = document.createElement("span");
    number.className = "slot-number";
    number.textContent = index + 1;
    button.appendChild(number);

    if (slot.up) {
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
    const startWidth = Math.max(54, Math.min(92, fromRect.width || 70));
    const startHeight = Math.max(66, Math.min(116, fromRect.height || 84));
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
      fallback: () => drawFrom(source, sourceElement.getBoundingClientRect()),
      commit: (target) => {
        if (source === "discard" && target.type === "slot" && target.valid) {
          const drawn = state.discard.pop();
          state.held = drawn;
          state.phase = "place";
          placeHeld(target.index, sourceElement.getBoundingClientRect());
          return true;
        }
        drawFrom(source, sourceElement.getBoundingClientRect());
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
    ghost.style.width = `${Math.max(64, Math.min(96, rect.width || 78))}px`;
    ghost.style.height = `${Math.max(72, Math.min(120, rect.height || 90))}px`;
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
    els.humanGrid.replaceChildren(...state.players[human].slots.map((slot, i) => renderCard(slot, i, human)));
    els.botGrid.replaceChildren(...state.players[bot].slots.map((slot, i) => renderCard(slot, i, bot)));

    const humanUp = state.players[human].slots.filter((slot) => slot.up).length;
    const botUp = state.players[bot].slots.filter((slot) => slot.up).length;
    els.humanProgress.textContent = `${humanUp}/10`;
    els.botProgress.textContent = `${botUp}/10`;
    els.humanTrack.style.width = `${humanUp * 10}%`;
    els.botTrack.style.width = `${botUp * 10}%`;
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
    els.discardPile.classList.toggle("discard-target", canDropDiscard);
    els.deckPile.classList.toggle("draw-source", canDrawFromDeck);
    els.discardPile.classList.toggle("draw-source", canDrawFromDiscard);
    els.deckPile.disabled = !canDrawFromDeck;
    els.discardPile.disabled = !(canDrawFromDiscard || canDropDiscard);
  }

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
  els.newGame.addEventListener("click", newRound);
  els.playAgain.addEventListener("click", newRound);

  newRound();
}());
