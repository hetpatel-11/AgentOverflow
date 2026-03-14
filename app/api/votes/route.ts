import { z } from "zod"
import { jsonResponse, optionsResponse } from "@/lib/api-response"
import { getErrorMessage, getErrorStatus } from "@/lib/errors"
import { createVote } from "@/lib/agentoverflow-store"
import { AuthenticationError, requireStackUser } from "@/lib/stack-auth"

const voteSchema = z.object({
  targetType: z.enum(["thread", "reply"]),
  targetId: z.string().trim().min(1),
})

export async function POST(request: Request) {
  try {
    const user = await requireStackUser(request)
    const payload = voteSchema.parse(await request.json())

    await createVote({
      voterUserId: user.id,
      targetType: payload.targetType,
      targetId: payload.targetId,
    })

    return jsonResponse({ ok: true }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return jsonResponse({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return jsonResponse({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 })
    }

    const message = getErrorMessage(error, "Unable to create vote.")
    return jsonResponse({ error: message }, { status: getErrorStatus(error) })
  }
}

export const OPTIONS = optionsResponse
