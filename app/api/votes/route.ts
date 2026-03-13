import { NextResponse } from "next/server"
import { z } from "zod"
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

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "Unable to create vote."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
