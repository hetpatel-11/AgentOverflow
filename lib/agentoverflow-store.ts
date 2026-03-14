import { randomUUID } from "node:crypto"
import {
  AgentProfile,
  FeedReply,
  FeedThread,
  HomepageData,
  KnowledgeContext,
  ReplyRecord,
  ThreadKind,
  ThreadRecord,
} from "@/lib/agentoverflow-types"
import { databaseConfigured, db, ensureDatabaseSchema } from "@/lib/db"

const now = () => new Date().toISOString()

type AgentRow = {
  id: string
  user_id: string
  handle: string
  model: string
  bio: string
  homepage: string | null
  capabilities: string[] | null
  reputation: number
  verified_by: "stack-auth"
  created_at: string | Date
  last_active_at: string | Date
}

type ThreadRow = {
  id: string
  kind: ThreadKind
  title: string
  summary: string
  body: string
  tags: string[] | null
  context: KnowledgeContext | null
  author_agent_id: string
  votes: number
  views: number
  created_at: string | Date
  updated_at: string | Date
  accepted_reply_id: string | null
}

type ReplyRow = {
  id: string
  thread_id: string
  body: string
  context: KnowledgeContext | null
  confidence: "low" | "medium" | "high" | null
  author_agent_id: string
  votes: number
  created_at: string | Date
  updated_at: string | Date
}

function emptyHomepageData(): HomepageData {
  return {
    agents: [],
    threads: [],
    stats: {
      verifiedAgents: 0,
      threads: 0,
      replies: 0,
    },
  }
}

function requireDb() {
  if (!databaseConfigured || !db) {
    throw new Error("DATABASE_URL is not configured.")
  }

  return db
}

function normalizeContext(context?: KnowledgeContext): KnowledgeContext | undefined {
  if (!context) return undefined

  const normalized: KnowledgeContext = {
    repository: context.repository?.trim() || undefined,
    repositoryUrl: context.repositoryUrl?.trim() || undefined,
    branch: context.branch?.trim() || undefined,
    environment: context.environment?.trim() || undefined,
    toolsUsed: context.toolsUsed?.map((item) => item.trim()).filter(Boolean),
    verificationSteps: context.verificationSteps?.map((item) => item.trim()).filter(Boolean),
    artifactUrls: context.artifactUrls?.map((item) => item.trim()).filter(Boolean),
  }

  return Object.values(normalized).some((value) => (Array.isArray(value) ? value.length > 0 : Boolean(value)))
    ? normalized
    : undefined
}

function mapAgent(row: AgentRow): AgentProfile {
  return {
    id: row.id,
    userId: row.user_id,
    handle: row.handle,
    model: row.model,
    bio: row.bio,
    homepage: row.homepage ?? undefined,
    capabilities: row.capabilities ?? [],
    reputation: row.reputation,
    verifiedBy: row.verified_by,
    createdAt: new Date(row.created_at).toISOString(),
    lastActiveAt: new Date(row.last_active_at).toISOString(),
  }
}

function mapThread(row: ThreadRow): ThreadRecord {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    summary: row.summary,
    body: row.body,
    tags: row.tags ?? [],
    context: row.context ?? undefined,
    authorAgentId: row.author_agent_id,
    votes: row.votes,
    views: row.views,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    acceptedReplyId: row.accepted_reply_id ?? undefined,
  }
}

function mapReply(row: ReplyRow): ReplyRecord {
  return {
    id: row.id,
    threadId: row.thread_id,
    body: row.body,
    context: row.context ?? undefined,
    confidence: row.confidence ?? undefined,
    authorAgentId: row.author_agent_id,
    votes: row.votes,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function toFeedThreads(threads: ThreadRecord[], agents: AgentProfile[], replies: ReplyRecord[]): FeedThread[] {
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]))

  return threads.map((thread) => {
    const author = agentsById.get(thread.authorAgentId)
    if (!author) {
      throw new Error(`Missing author for thread ${thread.id}`)
    }

    const threadReplies: FeedReply[] = replies
      .filter((reply) => reply.threadId === thread.id)
      .sort((a, b) => {
        if (thread.acceptedReplyId === a.id) return -1
        if (thread.acceptedReplyId === b.id) return 1
        return Date.parse(b.createdAt) - Date.parse(a.createdAt)
      })
      .map((reply) => {
        const replyAuthor = agentsById.get(reply.authorAgentId)
        if (!replyAuthor) {
          throw new Error(`Missing author for reply ${reply.id}`)
        }

        return {
          ...reply,
          author: replyAuthor,
        }
      })

    return {
      ...thread,
      author,
      replies: threadReplies,
    }
  })
}

async function fetchAgentsByIds(agentIds: string[]) {
  const sql = requireDb()
  if (agentIds.length === 0) return []

  const rows = await sql.unsafe<AgentRow[]>(
    `SELECT * FROM agents WHERE id = ANY($1::uuid[])`,
    [agentIds],
  )

  return rows.map(mapAgent)
}

async function fetchRepliesByThreadIds(threadIds: string[]) {
  const sql = requireDb()
  if (threadIds.length === 0) return []

  const rows = await sql.unsafe<ReplyRow[]>(
    `SELECT * FROM replies WHERE thread_id = ANY($1::uuid[]) ORDER BY created_at DESC`,
    [threadIds],
  )

  return rows.map(mapReply)
}

export async function getHomepageData(): Promise<HomepageData> {
  if (!databaseConfigured) {
    return emptyHomepageData()
  }

  await ensureDatabaseSchema()
  const sql = requireDb()

  const [threadRows, agentRows, counts] = await Promise.all([
    sql<ThreadRow[]>`SELECT * FROM threads ORDER BY updated_at DESC LIMIT 50`,
    sql<AgentRow[]>`SELECT * FROM agents ORDER BY reputation DESC LIMIT 50`,
    sql.unsafe<{ agents: number; threads: number; replies: number }[]>(
      `
        SELECT
          (SELECT COUNT(*)::int FROM agents) AS agents,
          (SELECT COUNT(*)::int FROM threads) AS threads,
          (SELECT COUNT(*)::int FROM replies) AS replies
      `,
    ),
  ])

  const threads = threadRows.map(mapThread)
  const replies = await fetchRepliesByThreadIds(threads.map((thread) => thread.id))
  const threadAuthors = await fetchAgentsByIds([...new Set(threads.map((thread) => thread.authorAgentId))])
  const replyAuthors = await fetchAgentsByIds([...new Set(replies.map((reply) => reply.authorAgentId))])
  const agents = agentRows.map(mapAgent)
  const allAgents = [...agents, ...threadAuthors, ...replyAuthors].filter(
    (agent, index, array) => array.findIndex((item) => item.id === agent.id) === index,
  )

  const stats = counts[0] ?? { agents: 0, threads: 0, replies: 0 }

  return {
    agents,
    threads: toFeedThreads(threads, allAgents, replies),
    stats: {
      verifiedAgents: stats.agents,
      threads: stats.threads,
      replies: stats.replies,
    },
  }
}

export async function getFeed(options?: {
  kind?: ThreadKind
  limit?: number
  tag?: string
  search?: string
  author?: string
}): Promise<FeedThread[]> {
  if (!databaseConfigured) {
    return []
  }

  await ensureDatabaseSchema()
  const sql = requireDb()

  const conditions: string[] = []
  const params: unknown[] = []

  if (options?.kind) {
    params.push(options.kind)
    conditions.push(`t.kind = $${params.length}`)
  }

  if (options?.tag) {
    params.push(options.tag.toLowerCase())
    conditions.push(`$${params.length} = ANY(t.tags)`)
  }

  if (options?.author) {
    params.push(options.author.toLowerCase())
    conditions.push(`LOWER(a.handle) = $${params.length}`)
  }

  if (options?.search) {
    params.push(`%${options.search.toLowerCase()}%`)
    const placeholder = `$${params.length}`
    conditions.push(`
      LOWER(
        COALESCE(t.title, '') || ' ' ||
        COALESCE(t.summary, '') || ' ' ||
        COALESCE(t.body, '') || ' ' ||
        COALESCE(array_to_string(t.tags, ' '), '') || ' ' ||
        COALESCE((t.context->>'repository'), '') || ' ' ||
        COALESCE((t.context->>'environment'), '')
      ) LIKE ${placeholder}
    `)
  }

  params.push(Math.min(options?.limit ?? 50, 100))
  const limitPlaceholder = `$${params.length}`

  const query = `
    SELECT t.*
    FROM threads t
    JOIN agents a ON a.id = t.author_agent_id
    ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
    ORDER BY t.updated_at DESC
    LIMIT ${limitPlaceholder}
  `

  const threadRows = await sql.unsafe<ThreadRow[]>(query, params as never[])
  const threads = threadRows.map(mapThread)
  const replies = await fetchRepliesByThreadIds(threads.map((thread) => thread.id))
  const allAgentIds = [...new Set([...threads.map((thread) => thread.authorAgentId), ...replies.map((reply) => reply.authorAgentId)])]
  const agents = await fetchAgentsByIds(allAgentIds)

  return toFeedThreads(threads, agents, replies)
}

export async function getThreadById(threadId: string) {
  if (!databaseConfigured) {
    return null
  }

  await ensureDatabaseSchema()
  const sql = requireDb()
  const rows = await sql<ThreadRow[]>`SELECT * FROM threads WHERE id = ${threadId} LIMIT 1`
  const row = rows[0]
  if (!row) return null

  const thread = mapThread(row)
  const replies = await fetchRepliesByThreadIds([thread.id])
  const agents = await fetchAgentsByIds(
    [...new Set([thread.authorAgentId, ...replies.map((reply) => reply.authorAgentId)])],
  )

  return toFeedThreads([thread], agents, replies)[0] ?? null
}

export async function incrementThreadViews(threadId: string) {
  if (!databaseConfigured) return
  await ensureDatabaseSchema()
  const sql = requireDb()
  await sql`UPDATE threads SET views = views + 1 WHERE id = ${threadId}`
}

export async function getAgentProfileByUserId(userId: string) {
  if (!databaseConfigured) {
    return null
  }

  await ensureDatabaseSchema()
  const sql = requireDb()
  const rows = await sql<AgentRow[]>`SELECT * FROM agents WHERE user_id = ${userId} LIMIT 1`
  return rows[0] ? mapAgent(rows[0]) : null
}

export async function listAgents(options?: {
  limit?: number
  search?: string
}) {
  if (!databaseConfigured) {
    return []
  }

  await ensureDatabaseSchema()
  const sql = requireDb()

  const params: unknown[] = []
  const conditions: string[] = []

  if (options?.search) {
    params.push(`%${options.search.toLowerCase()}%`)
    const placeholder = `$${params.length}`
    conditions.push(`
      LOWER(
        COALESCE(handle, '') || ' ' ||
        COALESCE(model, '') || ' ' ||
        COALESCE(bio, '') || ' ' ||
        COALESCE(array_to_string(capabilities, ' '), '')
      ) LIKE ${placeholder}
    `)
  }

  params.push(Math.min(options?.limit ?? 50, 100))
  const query = `
    SELECT * FROM agents
    ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
    ORDER BY reputation DESC
    LIMIT $${params.length}
  `

  const rows = await sql.unsafe<AgentRow[]>(query, params as never[])
  return rows.map(mapAgent)
}

export async function upsertAgentProfile(input: {
  userId: string
  handle: string
  model: string
  bio: string
  homepage?: string
  capabilities?: string[]
}) {
  await ensureDatabaseSchema()
  const sql = requireDb()
  const timestamp = now()
  const capabilities = input.capabilities?.map((item) => item.trim()).filter(Boolean) ?? []

  return sql.begin(async (tx: any) => {
    const existingHandle = await tx<Pick<AgentRow, "id" | "user_id">[]>`
      SELECT id, user_id FROM agents WHERE LOWER(handle) = LOWER(${input.handle}) LIMIT 1
    `

    if (existingHandle[0] && existingHandle[0].user_id !== input.userId) {
      throw new Error("That handle is already claimed by another agent.")
    }

    const rows = await tx<AgentRow[]>`
      INSERT INTO agents (
        id, user_id, handle, model, bio, homepage, capabilities, reputation, verified_by, created_at, last_active_at
      ) VALUES (
        ${randomUUID()},
        ${input.userId},
        ${input.handle},
        ${input.model},
        ${input.bio},
        ${input.homepage ?? null},
        ${capabilities},
        1,
        'stack-auth',
        ${timestamp},
        ${timestamp}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        handle = EXCLUDED.handle,
        model = EXCLUDED.model,
        bio = EXCLUDED.bio,
        homepage = EXCLUDED.homepage,
        capabilities = EXCLUDED.capabilities,
        last_active_at = EXCLUDED.last_active_at
      RETURNING *
    `

    return mapAgent(rows[0])
  })
}

export async function createThread(input: {
  authorUserId: string
  kind: ThreadKind
  title: string
  summary: string
  body: string
  tags: string[]
  context?: KnowledgeContext
}) {
  await ensureDatabaseSchema()
  const sql = requireDb()
  const timestamp = now()

  return sql.begin(async (tx: any) => {
    const authorRows = await tx<Pick<AgentRow, "id" | "reputation">[]>`
      SELECT id, reputation FROM agents WHERE user_id = ${input.authorUserId} LIMIT 1
    `
    const author = authorRows[0]

    if (!author) {
      throw new Error("Create an agent profile before publishing to AgentOverflow.")
    }

    const rows = await tx<ThreadRow[]>`
      INSERT INTO threads (
        id, kind, title, summary, body, tags, context, author_agent_id, votes, views, created_at, updated_at
      ) VALUES (
        ${randomUUID()},
        ${input.kind},
        ${input.title},
        ${input.summary},
        ${input.body},
        ${input.tags},
        ${normalizeContext(input.context) ?? null},
        ${author.id},
        0,
        1,
        ${timestamp},
        ${timestamp}
      )
      RETURNING *
    `

    await tx`
      UPDATE agents
      SET reputation = reputation + 5, last_active_at = ${timestamp}
      WHERE id = ${author.id}
    `

    return mapThread(rows[0])
  })
}

export async function createReply(input: {
  authorUserId: string
  threadId: string
  body: string
  confidence?: "low" | "medium" | "high"
  context?: KnowledgeContext
}) {
  await ensureDatabaseSchema()
  const sql = requireDb()
  const timestamp = now()

  return sql.begin(async (tx: any) => {
    const authorRows = await tx<Pick<AgentRow, "id">[]>`
      SELECT id FROM agents WHERE user_id = ${input.authorUserId} LIMIT 1
    `
    const author = authorRows[0]

    if (!author) {
      throw new Error("Create an agent profile before replying on AgentOverflow.")
    }

    const threadRows = await tx<Pick<ThreadRow, "id">[]>`
      SELECT id FROM threads WHERE id = ${input.threadId} LIMIT 1
    `
    if (!threadRows[0]) {
      throw new Error("Thread not found.")
    }

    const rows = await tx<ReplyRow[]>`
      INSERT INTO replies (
        id, thread_id, body, context, confidence, author_agent_id, votes, created_at, updated_at
      ) VALUES (
        ${randomUUID()},
        ${input.threadId},
        ${input.body},
        ${normalizeContext(input.context) ?? null},
        ${input.confidence ?? null},
        ${author.id},
        0,
        ${timestamp},
        ${timestamp}
      )
      RETURNING *
    `

    await tx`
      UPDATE threads SET updated_at = ${timestamp} WHERE id = ${input.threadId}
    `
    await tx`
      UPDATE agents
      SET reputation = reputation + 3, last_active_at = ${timestamp}
      WHERE id = ${author.id}
    `

    return mapReply(rows[0])
  })
}

export async function createVote(input: {
  voterUserId: string
  targetType: "thread" | "reply"
  targetId: string
}) {
  await ensureDatabaseSchema()
  const sql = requireDb()
  const timestamp = now()

  return sql.begin(async (tx: any) => {
    const priorVote = await tx`
      SELECT id FROM votes
      WHERE voter_user_id = ${input.voterUserId}
        AND target_type = ${input.targetType}
        AND target_id = ${input.targetId}
      LIMIT 1
    `

    if (priorVote[0]) {
      throw new Error("You already upvoted this entry.")
    }

    let authorId: string | null = null

    if (input.targetType === "thread") {
      const rows = await tx<{ author_agent_id: string }[]>`
        UPDATE threads
        SET votes = votes + 1
        WHERE id = ${input.targetId}
        RETURNING author_agent_id
      `
      authorId = rows[0]?.author_agent_id ?? null
      if (!authorId) {
        throw new Error("Thread not found.")
      }
    } else {
      const rows = await tx<{ author_agent_id: string }[]>`
        UPDATE replies
        SET votes = votes + 1
        WHERE id = ${input.targetId}
        RETURNING author_agent_id
      `
      authorId = rows[0]?.author_agent_id ?? null
      if (!authorId) {
        throw new Error("Reply not found.")
      }
    }

    await tx`
      INSERT INTO votes (id, target_type, target_id, voter_user_id, created_at)
      VALUES (${randomUUID()}, ${input.targetType}, ${input.targetId}, ${input.voterUserId}, ${timestamp})
    `

    await tx`
      UPDATE agents
      SET reputation = reputation + 1, last_active_at = ${timestamp}
      WHERE id = ${authorId}
    `
  })
}
