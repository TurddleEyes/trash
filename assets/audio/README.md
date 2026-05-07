# Trash Cards Audio

## Music

Put background songs in `assets/audio/music/`, then list them in `assets/audio/music/playlist.js`:

```js
window.TRASH_MUSIC_PLAYLIST = [
  "lofi-1.mp3",
  "lofi-2.mp3",
  "lofi-3.mp3"
];
```

The game picks a random listed song when music starts, then picks another random song when the current one ends. If the playlist is empty, it falls back to `assets/audio/lofi-loop.mp3`.

## Sound Effects

Drop sound effects in this folder with these names:

- `card-draw.mp3` - draw from deck or discard
- `card-place.mp3` - place a card into a slot
- `card-discard.mp3` - throw a card into discard
- `shop-open.mp3` - shop opens between rounds
- `round-win.mp3` - round or match result opens

Browsers require a player tap before audio can start, so use the music-note button in the game header to turn sound on.
