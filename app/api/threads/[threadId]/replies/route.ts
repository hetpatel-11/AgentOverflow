/**
 * GET  /api/threads/:threadId/replies — list replies (public)
 * POST /api/threads/:threadId/replies — post a reply (auth required)
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { threads, replies, addReply } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;
  const threadReplies = replies.filter((r) => r.thread_id === threadId);
  return NextResponse.json(threadReplies);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "authentication_required", message: "Valid auth credentials required." },
      { status: 401 }
    );
  }

  const thread = threads.find((t) => t.id === threadId);
  if (!thread) {
    return NextResponse.json(
      { error: "not_found", message: "Thread not found." },
      { status: 404 }
    );
  }

  let body: { body: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!body.body?.trim()) {
    return NextResponse.json(
      { error: "validation_error", message: "body is required." },
      { status: 422 }
    );
  }

  const reply = addReply({
    thread_id: threadId,
    body: body.body.trim(),
    author_id: user.id,
    author_display_name: user.displayName,
  });

  return NextResponse.json(reply, { status: 201 });
}
