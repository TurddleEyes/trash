# Testing Guide

This page is for anyone who wants to help test Trash Cards.

The goal is simple: try to break the game, then report what happened clearly enough that it can be fixed.

## Play Link

[https://turddleeyes.github.io/trash/](https://turddleeyes.github.io/trash/)

## What To Test First

Focus on the places where bugs are most likely.

### Card Movement

- Drag from the deck quickly.
- Drag from the discard pile directly into a slot.
- Drag the current card into a slot.
- Drag the current card into the discard pile.
- Click/tap cards instead of dragging.
- Try actions while the bot is playing.
- Try very fast clicks during animations.

### Round Flow

- Win a normal round.
- Lose a normal round.
- Reach 1 required card.
- Win the final 1-card round.
- Restart during different parts of the game.
- Switch modes after a match ends.

### Trash: Crown Debt

- Buy each item.
- Use each item.
- Try to buy with not enough coins.
- Try to buy while holding 2 items.
- Win while holding 2 items and confirm the forced discard appears.
- Use Debt of the Crown against an opponent below 10 cards.
- Use Crown Shield against Debt of the Crown.
- Let the bot buy and use items.

### Mobile Layout

Test on phones if possible.

- Portrait mode.
- Landscape mode.
- Browser fullscreen.
- Normal browser mode.
- Small screens.
- Buttons at the top.
- Shop menu sizing.
- Card size and spacing.

### Audio

- Toggle music on and off.
- Toggle sound effects on and off.
- Confirm card sounds do not spam on unrelated actions.
- Confirm shop sound plays when the shop opens.
- Confirm victory sound only plays when the whole match is won.

## Exploit Testing

Try to find unfair advantages.

Good exploit targets:

- Taking cards during the bot turn.
- Placing cards on the wrong board.
- Drawing more than once per turn.
- Keeping an unplayable card without discarding.
- Using an item after it should be consumed.
- Getting coins more than once from the same reward.
- Skipping the forced item discard after winning with 2 items.
- Making Debt of the Crown hit more than once.

## Bug Report Format

When reporting a bug, include:

- What happened.
- What you expected to happen.
- Steps to repeat it.
- Game mode.
- Browser and device.
- Screenshot or video if possible.

Example:

```md
What happened:
I dragged from the discard pile during the bot turn and placed a card on my board.

Expected:
I should not be able to move cards during the bot turn.

Steps:
1. Start Trash: Crown Debt.
2. Draw a card and discard it.
3. While Bot is playing, rapidly tap my slot 4.
4. My board accepts Bot's card.

Device:
Samsung Browser on Android, landscape fullscreen.
```

## Useful Screenshots

Screenshots help most when they show:

- The whole board.
- The current game mode.
- The shop or item being used.
- The exact strange state.
- Browser/device if the issue is visual.

Videos are even better for animation, drag, and fast-tap bugs.

## Testing Priorities

Highest priority:

- Crashes.
- Softlocks.
- Impossible-to-finish rounds.
- Exploits that let a player cheat cards, coins, or items.
- Broken mobile layout that blocks gameplay.

Medium priority:

- Confusing item behavior.
- Audio bugs.
- Animation weirdness.
- Shop balance issues.

Low priority:

- Small text polish.
- Minor visual alignment.
- Ideas for future items.

## Where To Report

Use GitHub Issues:

[https://github.com/TurddleEyes/trash/issues](https://github.com/TurddleEyes/trash/issues)

Choose the template that best matches what you found.

