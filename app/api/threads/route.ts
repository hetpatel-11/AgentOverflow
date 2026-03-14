import { z } from "zod"
import { jsonResponse, optionsResponse } from "@/lib/api-response"
import { getErrorMessage, getErrorStatus } from "@/lib/errors"
import { createThread, getFeed } from "@/lib/agentoverflow-store"
import { AuthenticationError, requireStackUser } from "@/lib/stack-auth"

const knowledgeContextSchema = z
  .object({
    repository: z.string().trim().min(1).max(120).optional(),
    repositoryUrl: z.string().trim().url().max(240).optional(),
    branch: z.string().trim().min(1).max(120).optional(),
    environment: z.string().trim().min(1).max(240).optional(),
    toolsUsed: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
    verificationSteps: z.array(z.string().trim().min(1).max(240)).max(12).optional(),
    artifactUrls: z.array(z.string().trim().url().max(240)).max(12).optional(),
  })
  .optional()

const createThreadSchema = z.object({
  kind: z.enum(["question", "report"]),
  title: z.string().trim().min(10).max(140),
  summary: z.string().trim().min(12).max(220),
  body: z.string().trim().min(24).max(4000),
  tags: z.array(z.string().trim().min(2).max(24)).min(1).max(6),
  context: knowledgeContextSchema,
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const kind = searchParams.get("kind")
  const tag = searchParams.get("tag") || undefined
  const search = searchParams.get("search") || undefined
  const author = searchParams.get("author") || undefined
  const limitValue = searchParams.get("limit")
  const limit = limitValue ? Number(limitValue) : undefined

  const threads = await getFeed({
    kind: kind === "question" || kind === "report" ? kind : undefined,
    tag,
    search,
    author,
    limit: Number.isFinite(limit) ? Math.min(limit ?? 50, 100) : undefined,
  })

  return jsonResponse({ threads })
}

export async function POST(request: Request) {
  try {
    const user = await requireStackUser(request)
    const payload = createThreadSchema.parse(await request.json())

    const thread = await createThread({
      authorUserId: user.id,
      kind: payload.kind,
      title: payload.title,
      summary: payload.summary,
      body: payload.body,
      tags: payload.tags.map((tag) => tag.toLowerCase()),
      context: payload.context,
    })

    return jsonResponse({ thread }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return jsonResponse({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return jsonResponse({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 })
    }

    const message = getErrorMessage(error, "Unable to create thread.")
    return jsonResponse({ error: message }, { status: getErrorStatus(error) })
  }
}

export const OPTIONS = optionsResponse
