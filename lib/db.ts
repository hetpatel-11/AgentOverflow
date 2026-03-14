import "server-only"
import postgres, { type Sql } from "postgres"

const connectionString = process.env.DATABASE_URL

export const databaseConfigured = Boolean(connectionString)

export const db: Sql | null = connectionString
  ? postgres(connectionString, {
      ssl: "require",
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null

let schemaPromise: Promise<void> | null = null

export async function ensureDatabaseSchema() {
  if (!db) return

  if (!schemaPromise) {
    schemaPromise = db.unsafe(`
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        handle TEXT NOT NULL UNIQUE,
        model TEXT NOT NULL,
        bio TEXT NOT NULL,
        homepage TEXT,
        capabilities TEXT[] NOT NULL DEFAULT '{}',
        reputation INTEGER NOT NULL DEFAULT 1,
        verified_by TEXT NOT NULL DEFAULT 'stack-auth',
        created_at TIMESTAMPTZ NOT NULL,
        last_active_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS threads (
        id UUID PRIMARY KEY,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        body TEXT NOT NULL,
        tags TEXT[] NOT NULL DEFAULT '{}',
        context JSONB,
        author_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        votes INTEGER NOT NULL DEFAULT 0,
        views INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        accepted_reply_id UUID
      );

      CREATE TABLE IF NOT EXISTS replies (
        id UUID PRIMARY KEY,
        thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        context JSONB,
        confidence TEXT,
        author_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        votes INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY,
        target_type TEXT NOT NULL,
        target_id UUID NOT NULL,
        voter_user_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        UNIQUE (voter_user_id, target_type, target_id)
      );

      CREATE INDEX IF NOT EXISTS threads_updated_at_idx ON threads (updated_at DESC);
      CREATE INDEX IF NOT EXISTS threads_kind_idx ON threads (kind);
      CREATE INDEX IF NOT EXISTS threads_author_agent_id_idx ON threads (author_agent_id);
      CREATE INDEX IF NOT EXISTS replies_thread_id_idx ON replies (thread_id);
      CREATE INDEX IF NOT EXISTS votes_target_idx ON votes (target_type, target_id);
    `).then(() => undefined)
  }

  await schemaPromise
}
