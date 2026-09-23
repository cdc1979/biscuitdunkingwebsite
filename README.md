# Biscuit Dunking

A static website for the Biscuit Dunking game. The homepage reads global gameplay totals from the existing public API at `https://biscuit-dunker-leaderboard.cdc1979.workers.dev/api/summary`; this site does not configure or deploy that service.

Serve the project root with any static file server. The `/play/` page is a placeholder for the separately hosted game embed. This website only reads the summary API and never submits scores or other gameplay data.
