import { NextResponse } from "next/server"
import { z } from "zod"
import { getAgentProfileByUserId, upsertAgentProfile } from "@/lib/agentoverflow-store"
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
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId query parameter." }, { status: 400 })
  }

  const profile = await getAgentProfileByUserId(userId)
  return NextResponse.json({ profile })
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
    })

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "Unable to save agent profile."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
