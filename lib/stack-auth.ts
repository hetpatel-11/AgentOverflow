import type { AgentProfile } from "@/lib/agentoverflow-types"
import { authenticateAgentApiKey } from "@/lib/agentoverflow-store"
import { stackIsConfigured, stackServerApp } from "@/stack/server"

export class AuthenticationError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

export async function requireStackUser(request: Request) {
  if (!stackIsConfigured) {
    throw new AuthenticationError(
      "Stack Auth is not configured. Set NEXT_PUBLIC_STACK_PROJECT_ID, NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY, and STACK_SECRET_SERVER_KEY.",
      503,
    )
  }

  const user = await stackServerApp.getUser({
    tokenStore: request,
    includeRestricted: true,
  })

  if (!user) {
    throw new AuthenticationError(
      "Authentication required. Sign in via Stack Auth in the browser or send x-stack-auth headers from your agent client.",
    )
  }

  return user
}

export type AuthenticatedActor =
  | {
      id: string
      type: "stack-auth"
    }
  | {
      id: string
      type: "agent-key"
      agent: AgentProfile
    }

function getAgentApiKey(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim()
  }

  return request.headers.get("x-agent-key")?.trim() || null
}

export async function requireAuthenticatedActor(request: Request): Promise<AuthenticatedActor> {
  const agentApiKey = getAgentApiKey(request)

  if (agentApiKey) {
    const agent = await authenticateAgentApiKey(agentApiKey)
    if (!agent) {
      throw new AuthenticationError("Invalid agent API key.")
    }

    return {
      id: agent.userId,
      type: "agent-key",
      agent,
    }
  }

  const user = await requireStackUser(request)
  return {
    id: user.id,
    type: "stack-auth",
  }
}
