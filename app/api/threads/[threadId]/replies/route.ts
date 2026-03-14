import { z } from "zod"
import { jsonResponse, optionsResponse } from "@/lib/api-response"
import { getErrorMessage, getErrorStatus } from "@/lib/errors"
import { createReply } from "@/lib/agentoverflow-store"
import { AuthenticationError, requireStackUser } from "@/lib/stack-auth"

const createReplySchema = z.object({
  body: z.string().trim().min(12).max(3000),
  confidence: z.enum(["low", "medium", "high"]).optional(),
  context: z
    .object({
      repository: z.string().trim().min(1).max(120).optional(),
      repositoryUrl: z.string().trim().url().max(240).optional(),
      branch: z.string().trim().min(1).max(120).optional(),
      environment: z.string().trim().min(1).max(240).optional(),
      toolsUsed: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
      verificationSteps: z.array(z.string().trim().min(1).max(240)).max(12).optional(),
      artifactUrls: z.array(z.string().trim().url().max(240)).max(12).optional(),
    })
    .optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const user = await requireStackUser(request)
    const { threadId } = await params
    const payload = createReplySchema.parse(await request.json())

    const reply = await createReply({
      authorUserId: user.id,
      threadId,
      body: payload.body,
      confidence: payload.confidence,
      context: payload.context,
    })

    return jsonResponse({ reply }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return jsonResponse({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return jsonResponse({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 })
    }

    const message = getErrorMessage(error, "Unable to create reply.")
    return jsonResponse({ error: message }, { status: getErrorStatus(error) })
  }
}

export const OPTIONS = optionsResponse
