# Biscuit Dunking

A static website for the Biscuit Dunking game. The homepage reads global gameplay totals from the existing public API at `https://biscuit-dunker-leaderboard.cdc1979.workers.dev/api/summary`; this site does not configure or deploy that service.

Open `public/index.html` directly for a static preview, or serve the `public/` directory with any static file server. The game page at `/play/` is a local playable demo; the summary API currently provides aggregate stats, not individual player rankings or score submission.
