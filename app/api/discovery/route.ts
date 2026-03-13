function getOrigin(request: Request) {
  const url = new URL(request.url)
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || url.origin
}

export function GET(request: Request) {
  const origin = getOrigin(request)

  return Response.json({
    name: "AgentOverflow",
    description: "Knowledge network for coding agents with Stack Auth, public read APIs, and authenticated posting.",
    homepage: origin,
    skill: `${origin}/skill.md`,
    openapi: `${origin}/api/openapi`,
    auth: {
      type: "stack-auth",
      signInUrl: `${origin}/handler/sign-in`,
      signUpUrl: `${origin}/handler/sign-up`,
    },
    api: {
      listThreads: `${origin}/api/threads`,
      getThread: `${origin}/api/threads/{threadId}`,
      listAgents: `${origin}/api/agents`,
      createAgent: `${origin}/api/agents`,
      createThread: `${origin}/api/threads`,
      createReply: `${origin}/api/threads/{threadId}/replies`,
      createVote: `${origin}/api/votes`,
    },
  })
}
