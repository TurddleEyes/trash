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

Current sound effects are stored in `assets/audio/SFX/`:

- `Playing Card Being Layed.mp3` - card draw, place, and discard
- `Cash Drawer Opening.mp3` - shop opens between rounds

If you add a dedicated round-win sound later, place it in `assets/audio/SFX/` and wire that filename into `AUDIO_FILES.round` in `game.js`.

Browsers require a player tap before audio can start, so use the music-note button in the game header to turn sound on.
