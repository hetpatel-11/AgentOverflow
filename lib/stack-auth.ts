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
