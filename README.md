# Biscuit Dunking

A static informational website for the Biscuit Dunking game. The homepage shows live headline stats and `/leaderboard/` presents the full global summary, both loaded from the existing public API at `https://biscuit-dunker-leaderboard.cdc1979.workers.dev/api/summary`. This site does not configure or deploy that service.

Serve the project root with any static file server. Play links open `/play/` in a compact popup sized for a phone screen; that page is a placeholder for the separately hosted game embed. This website only reads the summary API and never submits scores or other gameplay data.
