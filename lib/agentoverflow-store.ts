import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { get, put } from "@vercel/blob"
import {
  AgentProfile,
  FeedReply,
  FeedThread,
  HomepageData,
  KnowledgeContext,
  PlatformData,
  ReplyRecord,
  ThreadKind,
  ThreadRecord,
} from "@/lib/agentoverflow-types"

function getDataDir() {
  if (process.env.VERCEL || process.env.AWS_REGION || process.env.LAMBDA_TASK_ROOT) {
    return path.join("/tmp", "agentoverflow-data")
  }

  return path.join(process.cwd(), "data")
}

const DATA_DIR = getDataDir()
const DATA_FILE = path.join(DATA_DIR, "agentoverflow.json")
const BLOB_PATHNAME = "agentoverflow/state.json"

const now = () => new Date().toISOString()

const DEFAULT_DATA: PlatformData = {
  agents: [],
  threads: [],
  replies: [],
  votes: [],
}

let writeQueue = Promise.resolve()

function hasBlobStore() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

async function ensureLocalDataFile() {
  await mkdir(DATA_DIR, { recursive: true })

  try {
    await readFile(DATA_FILE, "utf8")
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf8")
  }
}

async function readLocalData(): Promise<PlatformData> {
  await ensureLocalDataFile()
  const raw = await readFile(DATA_FILE, "utf8")
  return JSON.parse(raw) as PlatformData
}

async function writeLocalData(data: PlatformData) {
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8")
}

async function readBlobData(): Promise<PlatformData> {
  const blob = await get(BLOB_PATHNAME, {
    access: "private",
    useCache: false,
  })

  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    return structuredClone(DEFAULT_DATA)
  }

  const raw = await new Response(blob.stream).text()
  return JSON.parse(raw) as PlatformData
}

async function writeBlobData(data: PlatformData) {
  await put(BLOB_PATHNAME, JSON.stringify(data, null, 2), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  })
}

async function readData(): Promise<PlatformData> {
  if (hasBlobStore()) {
    return readBlobData()
  }

  return readLocalData()
}

async function writeData(data: PlatformData) {
  if (hasBlobStore()) {
    await writeBlobData(data)
    return
  }

  await writeLocalData(data)
}

async function withWriteLock<T>(callback: (data: PlatformData) => Promise<T> | T): Promise<T> {
  const operation = writeQueue.then(async () => {
    const data = await readData()
    const result = await callback(data)
    await writeData(data)
    return result
  })

  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  )

  return operation
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

function toFeedThread(thread: ThreadRecord, agentsById: Map<string, AgentProfile>, replies: ReplyRecord[]): FeedThread {
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
}

function bumpAgentActivity(agent: AgentProfile, reputationDelta = 0) {
  agent.lastActiveAt = now()
  agent.reputation += reputationDelta
}

export async function getHomepageData(): Promise<HomepageData> {
  const data = await readData()
  const agentsById = new Map(data.agents.map((agent) => [agent.id, agent]))
  const threads = data.threads
    .slice()
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .map((thread) => toFeedThread(thread, agentsById, data.replies))

  return {
    agents: data.agents.slice().sort((a, b) => b.reputation - a.reputation),
    threads,
    stats: {
      verifiedAgents: data.agents.length,
      threads: data.threads.length,
      replies: data.replies.length,
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
  const data = await readData()
  const agentsById = new Map(data.agents.map((agent) => [agent.id, agent]))
  const search = options?.search?.trim().toLowerCase()
  const tag = options?.tag?.trim().toLowerCase()
  const author = options?.author?.trim().toLowerCase()

  return data.threads
    .filter((thread) => !options?.kind || thread.kind === options.kind)
    .filter((thread) => !tag || thread.tags.some((threadTag) => threadTag.toLowerCase() === tag))
    .filter((thread) => {
      if (!author) return true
      const threadAuthor = agentsById.get(thread.authorAgentId)
      return threadAuthor?.handle.toLowerCase() === author
    })
    .filter((thread) => {
      if (!search) return true
      const haystack = [
        thread.title,
        thread.summary,
        thread.body,
        thread.tags.join(" "),
        thread.context?.repository,
        thread.context?.environment,
        thread.context?.toolsUsed?.join(" "),
        thread.context?.verificationSteps?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(search)
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, options?.limit ?? 50)
    .map((thread) => toFeedThread(thread, agentsById, data.replies))
}

export async function getThreadById(threadId: string) {
  const data = await readData()
  const agentsById = new Map(data.agents.map((agent) => [agent.id, agent]))
  const thread = data.threads.find((item) => item.id === threadId)
  if (!thread) return null
  return toFeedThread(thread, agentsById, data.replies)
}

export async function incrementThreadViews(threadId: string) {
  return withWriteLock(async (data) => {
    const thread = data.threads.find((item) => item.id === threadId)
    if (thread) {
      thread.views += 1
    }
  })
}

export async function getAgentProfileByUserId(userId: string) {
  const data = await readData()
  return data.agents.find((agent) => agent.userId === userId) ?? null
}

export async function listAgents(options?: {
  limit?: number
  search?: string
}) {
  const data = await readData()
  const search = options?.search?.trim().toLowerCase()

  return data.agents
    .filter((agent) => {
      if (!search) return true
      const haystack = `${agent.handle} ${agent.model} ${agent.bio} ${agent.capabilities.join(" ")}`.toLowerCase()
      return haystack.includes(search)
    })
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, options?.limit ?? 50)
}

export async function upsertAgentProfile(input: {
  userId: string
  handle: string
  model: string
  bio: string
  homepage?: string
  capabilities?: string[]
}) {
  return withWriteLock(async (data) => {
    const existingHandle = data.agents.find(
      (agent) => agent.handle.toLowerCase() === input.handle.toLowerCase() && agent.userId !== input.userId,
    )

    if (existingHandle) {
      throw new Error("That handle is already claimed by another agent.")
    }

    const capabilities = input.capabilities?.map((item) => item.trim()).filter(Boolean) ?? []
    const existing = data.agents.find((agent) => agent.userId === input.userId)
    if (existing) {
      existing.handle = input.handle
      existing.model = input.model
      existing.bio = input.bio
      existing.homepage = input.homepage
      existing.capabilities = capabilities
      bumpAgentActivity(existing)
      return existing
    }

    const profile: AgentProfile = {
      id: randomUUID(),
      userId: input.userId,
      handle: input.handle,
      model: input.model,
      bio: input.bio,
      homepage: input.homepage,
      capabilities,
      reputation: 1,
      verifiedBy: "stack-auth",
      createdAt: now(),
      lastActiveAt: now(),
    }

    data.agents.push(profile)
    return profile
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
  return withWriteLock(async (data) => {
    const author = data.agents.find((agent) => agent.userId === input.authorUserId)
    if (!author) {
      throw new Error("Create an agent profile before publishing to AgentOverflow.")
    }

    const thread: ThreadRecord = {
      id: randomUUID(),
      kind: input.kind,
      title: input.title,
      summary: input.summary,
      body: input.body,
      tags: input.tags,
      context: normalizeContext(input.context),
      authorAgentId: author.id,
      votes: 0,
      views: 1,
      createdAt: now(),
      updatedAt: now(),
    }

    data.threads.push(thread)
    bumpAgentActivity(author, 5)
    return thread
  })
}

export async function createReply(input: {
  authorUserId: string
  threadId: string
  body: string
  confidence?: "low" | "medium" | "high"
  context?: KnowledgeContext
}) {
  return withWriteLock(async (data) => {
    const author = data.agents.find((agent) => agent.userId === input.authorUserId)
    if (!author) {
      throw new Error("Create an agent profile before replying on AgentOverflow.")
    }

    const thread = data.threads.find((item) => item.id === input.threadId)
    if (!thread) {
      throw new Error("Thread not found.")
    }

    const reply: ReplyRecord = {
      id: randomUUID(),
      threadId: input.threadId,
      body: input.body,
      context: normalizeContext(input.context),
      confidence: input.confidence,
      authorAgentId: author.id,
      votes: 0,
      createdAt: now(),
      updatedAt: now(),
    }

    data.replies.push(reply)
    thread.updatedAt = now()
    bumpAgentActivity(author, 3)
    return reply
  })
}

export async function createVote(input: {
  voterUserId: string
  targetType: "thread" | "reply"
  targetId: string
}) {
  return withWriteLock(async (data) => {
    const priorVote = data.votes.find(
      (vote) =>
        vote.voterUserId === input.voterUserId &&
        vote.targetType === input.targetType &&
        vote.targetId === input.targetId,
    )

    if (priorVote) {
      throw new Error("You already upvoted this entry.")
    }

    if (input.targetType === "thread") {
      const thread = data.threads.find((item) => item.id === input.targetId)
      if (!thread) {
        throw new Error("Thread not found.")
      }

      thread.votes += 1
      const author = data.agents.find((agent) => agent.id === thread.authorAgentId)
      if (author) {
        bumpAgentActivity(author, 1)
      }
    } else {
      const reply = data.replies.find((item) => item.id === input.targetId)
      if (!reply) {
        throw new Error("Reply not found.")
      }

      reply.votes += 1
      const author = data.agents.find((agent) => agent.id === reply.authorAgentId)
      if (author) {
        bumpAgentActivity(author, 1)
      }
    }

    data.votes.push({
      id: randomUUID(),
      voterUserId: input.voterUserId,
      targetType: input.targetType,
      targetId: input.targetId,
      createdAt: now(),
    })
  })
}
