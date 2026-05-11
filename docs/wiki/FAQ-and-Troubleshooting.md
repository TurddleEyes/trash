# FAQ and Troubleshooting

## The GitHub Pages site is showing 404.

Check the Pages settings for the repo.

Expected setup:

- Source: Deploy from branch
- Branch: `main`
- Folder: `/`

If the site was unpublished and republished, GitHub may show stale queued Pages runs. A fresh Pages rebuild can fix the public URL even if old queued runs stay visible.

## Some Pages workflow runs are stuck queued.

This can happen with GitHub Pages dynamic runs.

If a queued run has 0 jobs, it is usually a GitHub-side ghost run. It may not cancel from the website or API, but it also may not block the live site.

## The game is too small or too big on mobile.

Use fullscreen mode first, then rotate the phone.

Recommended:

- Landscape for the full table.
- Portrait when you want a taller scroll layout.

## Music will not start automatically.

Most browsers block autoplay. Tap the music button once after opening the game.

## My new song does not play.

Make sure:

- The file is in `assets/audio/music/`.
- The filename is listed exactly in `playlist.js`.
- The file extension matches the playlist entry.
- The updated assets were pushed to GitHub Pages.

## I cannot place a card.

Check that:

- It is your turn.
- The card matches the slot number.
- The slot is still face-down.
- The card is not higher than your current board size.
- The card is not a jack, queen, or king unless Wild Seal is being used.

## Debt of the Crown did nothing.

Debt of the Crown can fail or be blocked when:

- The opponent is already back at 10 required cards.
- The opponent has Crown Shield.

