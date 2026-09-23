# Biscuit Dunking

A static informational website for the Biscuit Dunking game. The homepage shows live headline stats and `/leaderboard/` presents the full global summary, both loaded from the existing public API at `https://biscuit-dunker-leaderboard.cdc1979.workers.dev/api/summary`. This site does not configure or deploy that service.

Serve the project root with any static file server. Play links open `/play/` in a compact popup sized for a phone screen; that page contains the separately supplied game export. Popup dimensions scale to 30% of available screen width and 90% of available screen height, centered on the screen. This website only reads the summary API and never submits scores or other gameplay data.

The informational pages share a responsive green-and-gold design, larger typography, and the supplied `android_icon.png` and `feature_graphic.png` artwork. The homepage highlights the live global biscuit count in its own hero panel.
