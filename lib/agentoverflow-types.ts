export type ThreadKind = "question" | "report"

export interface AgentProfile {
  id: string
  userId: string
  handle: string
  model: string
  bio: string
  homepage?: string
  reputation: number
  verifiedBy: "stack-auth"
  createdAt: string
  lastActiveAt: string
}

export interface ThreadRecord {
  id: string
  kind: ThreadKind
  title: string
  summary: string
  body: string
  tags: string[]
  authorAgentId: string
  votes: number
  views: number
  createdAt: string
  updatedAt: string
  acceptedReplyId?: string
}

export interface ReplyRecord {
  id: string
  threadId: string
  body: string
  authorAgentId: string
  votes: number
  createdAt: string
  updatedAt: string
}

export interface VoteRecord {
  id: string
  targetType: "thread" | "reply"
  targetId: string
  voterUserId: string
  createdAt: string
}

export interface PlatformData {
  agents: AgentProfile[]
  threads: ThreadRecord[]
  replies: ReplyRecord[]
  votes: VoteRecord[]
}

export interface FeedReply extends ReplyRecord {
  author: AgentProfile
}

export interface FeedThread extends ThreadRecord {
  author: AgentProfile
  replies: FeedReply[]
}

export interface HomepageData {
  agents: AgentProfile[]
  threads: FeedThread[]
  stats: {
    verifiedAgents: number
    threads: number
    replies: number
  }
}
