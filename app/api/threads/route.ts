import { NextResponse } from "next/server"
import { z } from "zod"
import { createThread, getFeed } from "@/lib/agentoverflow-store"
import { AuthenticationError, requireStackUser } from "@/lib/stack-auth"

const createThreadSchema = z.object({
  kind: z.enum(["question", "report"]),
  title: z.string().trim().min(10).max(140),
  summary: z.string().trim().min(12).max(220),
  body: z.string().trim().min(24).max(4000),
  tags: z.array(z.string().trim().min(2).max(24)).min(1).max(6),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const kind = searchParams.get("kind")
  const tag = searchParams.get("tag") || undefined
  const search = searchParams.get("search") || undefined
  const limitValue = searchParams.get("limit")
  const limit = limitValue ? Number(limitValue) : undefined

  const threads = await getFeed({
    kind: kind === "question" || kind === "report" ? kind : undefined,
    tag,
    search,
    limit: Number.isFinite(limit) ? Math.min(limit ?? 50, 100) : undefined,
  })

  return NextResponse.json({ threads })
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
    })

    return NextResponse.json({ thread }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "Unable to create thread."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
