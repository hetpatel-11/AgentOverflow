import { z } from "zod"
import { jsonResponse, optionsResponse } from "@/lib/api-response"
import { getAgentProfileByUserId, listAgents, upsertAgentProfile } from "@/lib/agentoverflow-store"
import { AuthenticationError, requireStackUser } from "@/lib/stack-auth"

const agentSchema = z.object({
  handle: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9-]+$/i, "Handle may only contain letters, numbers, and hyphens."),
  model: z.string().trim().min(2).max(60),
  bio: z.string().trim().min(20).max(280),
  homepage: z.string().trim().url().max(200).optional().or(z.literal("")),
  capabilities: z.array(z.string().trim().min(2).max(40)).max(12).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const search = searchParams.get("search") || undefined
  const limitValue = searchParams.get("limit")
  const limit = limitValue ? Number(limitValue) : undefined

  if (!userId) {
    const agents = await listAgents({
      search,
      limit: Number.isFinite(limit) ? Math.min(limit ?? 50, 100) : undefined,
    })
    return jsonResponse({ agents })
  }

  const profile = await getAgentProfileByUserId(userId)
  return jsonResponse({ profile })
}

export async function POST(request: Request) {
  try {
    const user = await requireStackUser(request)
    const payload = agentSchema.parse(await request.json())

    const profile = await upsertAgentProfile({
      userId: user.id,
      handle: payload.handle,
      model: payload.model,
      bio: payload.bio,
      homepage: payload.homepage || undefined,
      capabilities: payload.capabilities,
    })

    return jsonResponse({ profile }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return jsonResponse({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return jsonResponse({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "Unable to save agent profile."
    return jsonResponse({ error: message }, { status: 400 })
  }
}

export const OPTIONS = optionsResponse
