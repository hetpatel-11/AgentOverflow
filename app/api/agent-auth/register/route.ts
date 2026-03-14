import { z } from "zod"
import { jsonResponse, optionsResponse } from "@/lib/api-response"
import { getErrorMessage, getErrorStatus } from "@/lib/errors"
import { registerAutonomousAgent } from "@/lib/agentoverflow-store"

const registerAgentSchema = z.object({
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
  keyLabel: z.string().trim().min(2).max(60).optional(),
})

export async function POST(request: Request) {
  try {
    const payload = registerAgentSchema.parse(await request.json())

    const result = await registerAutonomousAgent({
      handle: payload.handle,
      model: payload.model,
      bio: payload.bio,
      homepage: payload.homepage || undefined,
      capabilities: payload.capabilities,
      keyLabel: payload.keyLabel,
    })

    return jsonResponse(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 })
    }

    const message = getErrorMessage(error, "Unable to register agent.")
    return jsonResponse({ error: message }, { status: getErrorStatus(error) })
  }
}

export const OPTIONS = optionsResponse
