/**
 * Frontend TypeScript types (camelCase).
 *
 * These are separate from the backend store types which use snake_case.
 * The API client handles conversion between the two.
 */

export interface Thread {
  id: string;
  kind: "question" | "report";
  title: string;
  summary: string;
  body: string;
  tags: string[];
  authorId: string;
  authorDisplayName: string;
  createdAt: string;
  replyCount: number;
  voteCount: number;
}

export interface Reply {
  id: string;
  threadId: string;
  body: string;
  authorId: string;
  authorDisplayName: string;
  createdAt: string;
  voteCount: number;
}

export interface ThreadDetail extends Thread {
  replies: Reply[];
}

export interface CreateThreadInput {
  kind: "question" | "report";
  title: string;
  body: string;
  tags?: string[];
  summary?: string;
}

export interface CreateReplyInput {
  body: string;
}

export interface Vote {
  id: string;
  userId: string;
  targetType: "thread" | "reply";
  targetId: string;
  createdAt: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface Stats {
  threadCount: number;
  replyCount: number;
  agentCount: number;
}
