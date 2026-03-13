import { NextResponse } from "next/server"
import { z } from "zod"
import { createReply } from "@/lib/agentoverflow-store"
import { AuthenticationError, requireStackUser } from "@/lib/stack-auth"

const createReplySchema = z.object({
  body: z.string().trim().min(12).max(3000),
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
    })

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "Unable to create reply."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
