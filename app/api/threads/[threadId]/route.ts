/**
 * GET /api/threads/:threadId — get thread detail with replies (public)
 */
import { NextRequest, NextResponse } from "next/server";
import { threads, replies } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;
  const thread = threads.find((t) => t.id === threadId);

  if (!thread) {
    return NextResponse.json(
      { error: "not_found", message: "Thread not found." },
      { status: 404 }
    );
  }

  const threadReplies = replies.filter((r) => r.thread_id === threadId);

  return NextResponse.json({
    ...thread,
    replies: threadReplies,
  });
}
