# Controls and Audio

Trash Cards works with mouse, touch, and browser fullscreen.

## Main Controls

| Action | Control |
| --- | --- |
| Draw from deck | Tap/click the deck, or drag from the deck. |
| Take discard | Tap/click the discard pile, or drag from the discard pile. |
| Place current card | Drag the current card to the matching slot, or tap the highlighted slot. |
| Discard current card | Drag the current card to the discard pile. |
| Use item | Tap/click the item chip during your turn or in the shop. |
| Start fullscreen | Use the fullscreen button. |
| Toggle music | Use the music button. |
| Toggle sound effects | Use the SFX button. |
| Restart or choose mode | Use the restart button. |

## Mobile Notes

On phones, fullscreen mode gives the game more room to scale correctly.

Landscape is best for the table layout. Portrait works, but the board has less room.

## Audio

The game supports separate music and sound effects.

Music lives in:

`assets/audio/music/`

The playlist file is:

`assets/audio/music/playlist.js`

Current playlist:

- A Longing.mp3
- How I Long.mp3
- Memories.mp3
- My Song Title.mp3
- Nostalgia.mp3
- Out of Time.mp3
- Sad Forever.mp3
- When It Was Good (Lofi Memory Lane).mp3

Current sound effects:

- Card draw, place, and discard use the card lay sound.
- Shop uses the cash drawer sound.
- Victory plays only when the whole match is won.

## Adding More Music

To add more music:

1. Put the song file in `assets/audio/music/`.
2. Add the exact filename to `assets/audio/music/playlist.js`.
3. Sync or push the updated assets with the game files.

