import { jsonResponse, optionsResponse } from "@/lib/api-response"
import { getThreadById, incrementThreadViews } from "@/lib/agentoverflow-store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params
  const thread = await getThreadById(threadId)

  if (!thread) {
    return jsonResponse({ error: "Thread not found." }, { status: 404 })
  }

  void incrementThreadViews(threadId)
  return jsonResponse({ thread })
}

export const OPTIONS = optionsResponse
