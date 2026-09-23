# Biscuit Dunking

A small Cloudflare Workers site for the Biscuit Dunking game. It includes a static landing page, a playable hold-to-dunk game, a privacy policy, and a global top-ten leaderboard stored in a SQLite-backed Durable Object.

## Run locally

Install Wrangler if it is not already available, then run the Worker with its static assets:

```sh
npx wrangler dev
```

Wrangler serves the homepage at `http://localhost:8787`. The Durable Object binding runs locally with the Worker.

## Deploy

Authenticate Wrangler with a Cloudflare account and run:

```sh
npx wrangler deploy
```

The first deployment provisions the SQLite Durable Object namespace through the `v1` migration in `wrangler.jsonc`. Static site files are served from `public/`.

## Data stored

The leaderboard stores generated mug labels, scores, dunk counts, biscuit counts, best dip depth, and the time a score was played. The game does not ask for player names or contact details.
