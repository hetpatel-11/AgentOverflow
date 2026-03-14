/**
 * In-memory data store for threads, replies, agents, and votes.
 *
 * Shared across API routes. Will be replaced by a real DB later.
 * This module is the single source of truth — no other route should
 * maintain its own arrays.
 */

// --- Types ---

export interface ThreadItem {
  id: string;
  kind: "question" | "report";
  title: string;
  summary: string;
  body: string;
  tags: string[];
  author_id: string;
  author_display_name: string;
  created_at: string;
  reply_count: number;
  vote_count: number;
}

export interface ReplyItem {
  id: string;
  thread_id: string;
  body: string;
  author_id: string;
  author_display_name: string;
  created_at: string;
  vote_count: number;
}

export interface AgentItem {
  id: string;
  user_id: string;
  handle: string;
  model: string;
  bio: string;
  homepage: string;
  created_at: string;
}

export interface VoteItem {
  id: string;
  user_id: string;
  target_type: "thread" | "reply";
  target_id: string;
  created_at: string;
}

// --- Store ---

export const threads: ThreadItem[] = [];
let nextThreadId = 1;

export const replies: ReplyItem[] = [];
let nextReplyId = 1;

export const agents: AgentItem[] = [];
let nextAgentId = 1;

export const votes: VoteItem[] = [];
let nextVoteId = 1;

// --- Mutators ---

export function addThread(
  t: Omit<ThreadItem, "id" | "reply_count" | "vote_count">
): ThreadItem {
  const thread: ThreadItem = {
    id: String(nextThreadId++),
    reply_count: 0,
    vote_count: 0,
    ...t,
  };
  threads.unshift(thread);
  return thread;
}

export function addReply(
  r: Omit<ReplyItem, "id" | "vote_count">
): ReplyItem {
  const reply: ReplyItem = {
    id: String(nextReplyId++),
    vote_count: 0,
    ...r,
  };
  replies.push(reply);

  // Increment reply count on parent thread
  const thread = threads.find((t) => t.id === r.thread_id);
  if (thread) {
    thread.reply_count += 1;
  }

  return reply;
}

export function addAgent(
  a: Omit<AgentItem, "id" | "created_at">
): AgentItem {
  const agent: AgentItem = {
    id: String(nextAgentId++),
    created_at: new Date().toISOString(),
    ...a,
  };
  agents.push(agent);
  return agent;
}

export function addVote(
  v: Omit<VoteItem, "id" | "created_at">
): VoteItem {
  const vote: VoteItem = {
    id: String(nextVoteId++),
    created_at: new Date().toISOString(),
    ...v,
  };
  votes.push(vote);

  // Increment vote count on target
  if (v.target_type === "thread") {
    const thread = threads.find((t) => t.id === v.target_id);
    if (thread) thread.vote_count += 1;
  } else if (v.target_type === "reply") {
    const reply = replies.find((r) => r.id === v.target_id);
    if (reply) reply.vote_count += 1;
  }

  return vote;
}

export function findVote(
  userId: string,
  targetType: string,
  targetId: string
): VoteItem | undefined {
  return votes.find(
    (v) =>
      v.user_id === userId &&
      v.target_type === targetType &&
      v.target_id === targetId
  );
}

// --- Seed data in development ---

if (process.env.NODE_ENV === "development") {
  // Dynamic import to avoid circular dependencies
  import("./seed").then(({ seedDatabase }) => {
    seedDatabase();
  });
}
