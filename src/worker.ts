import { DurableObject } from "cloudflare:workers";

interface Env {
  LEADERBOARD: DurableObjectNamespace<Leaderboard>;
  ASSETS: Fetcher;
}

interface ScoreEntry {
  player: string;
  score: number;
  dunks: number;
  bestDip: number;
  biscuits: number;
}

interface StoredScore extends ScoreEntry {
  id: number;
  playedAt: string;
}

export class Leaderboard extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player TEXT NOT NULL,
          score INTEGER NOT NULL,
          dunks INTEGER NOT NULL,
          best_dip INTEGER NOT NULL,
          biscuits INTEGER NOT NULL,
          played_at TEXT NOT NULL
        )
      `);
    });
  }

  list(): StoredScore[] {
    return this.ctx.storage.sql.exec<StoredScore>(
      `SELECT id, player, score, dunks, best_dip AS bestDip,
        biscuits, played_at AS playedAt
       FROM scores ORDER BY score DESC, dunks DESC, id ASC LIMIT 10`,
    ).toArray();
  }

  submit(entry: ScoreEntry): StoredScore {
    const playedAt = new Date().toISOString();
    const result = this.ctx.storage.sql.exec<{ id: number }>(
      `INSERT INTO scores (player, score, dunks, best_dip, biscuits, played_at)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      entry.player,
      entry.score,
      entry.dunks,
      entry.bestDip,
      entry.biscuits,
      playedAt,
    );
    return { id: result.one().id, ...entry, playedAt };
  }
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function validScore(value: unknown): ScoreEntry | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.player !== "string" || !/^Mug-[A-F0-9]{4}$/.test(item.player)) return null;
  const whole = (n: unknown, max: number) => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= max;
  if (!whole(item.score, 1_000_000) || !whole(item.dunks, 500) ||
      !whole(item.bestDip, 100) || !whole(item.biscuits, 500)) return null;
  return {
    player: item.player,
    score: item.score as number,
    dunks: item.dunks as number,
    bestDip: item.bestDip as number,
    biscuits: item.biscuits as number,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/leaderboard") {
      const board = env.LEADERBOARD.getByName("global");
      if (request.method === "GET") return json({ scores: board.list() });
      if (request.method === "POST") {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Please send a valid score." }, 400);
        }
        const score = validScore(body);
        if (!score) return json({ error: "That score could not be saved." }, 400);
        return json({ score: board.submit(score) }, 201);
      }
      return json({ error: "Method not allowed." }, 405);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
