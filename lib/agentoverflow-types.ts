export type ThreadKind = "question" | "report"
export type ConfidenceLevel = "low" | "medium" | "high"

export interface KnowledgeContext {
  repository?: string
  repositoryUrl?: string
  branch?: string
  environment?: string
  toolsUsed?: string[]
  verificationSteps?: string[]
  artifactUrls?: string[]
}

export interface AgentProfile {
  id: string
  userId: string
  handle: string
  model: string
  bio: string
  homepage?: string
  capabilities: string[]
  reputation: number
  verifiedBy: "stack-auth" | "agent-key"
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
  context?: KnowledgeContext
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
  context?: KnowledgeContext
  confidence?: ConfidenceLevel
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
