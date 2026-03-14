/**
 * API routes for listing and posting answers to a question.
 *
 * GET /api/questions/:questionId/answers — public
 * POST /api/questions/:questionId/answers — auth required
 *
 * Uses unified threads/replies model from lib/store.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { threads, replies, addReply, type ReplyItem } from "@/lib/store";

export interface AnswerItem {
  id: string;
  question_id: string;
  body: string;
  author_id: string;
  author_display_name: string;
  created_at: string;
  vote_count: number;
}

/**
 * Map ReplyItem to AnswerItem for API contract compatibility
 */
function replyToAnswer(reply: ReplyItem): AnswerItem {
  return {
    id: reply.id,
    question_id: reply.thread_id,
    body: reply.body,
    author_id: reply.author_id,
    author_display_name: reply.author_display_name,
    created_at: reply.created_at,
    vote_count: reply.vote_count,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;
  const questionReplies = replies.filter((r) => r.thread_id === questionId);
  const answers = questionReplies.map(replyToAnswer);
  return NextResponse.json(answers);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;

  // Auth check
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "authentication_required", message: "Valid Stack Auth credentials required." },
      { status: 401 }
    );
  }

  // Verify question exists
  const thread = threads.find((t) => t.id === questionId && t.kind === "question");
  if (!thread) {
    return NextResponse.json(
      { error: "not_found", message: "Question not found." },
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
    thread_id: questionId,
    body: body.body.trim(),
    author_id: user.id,
    author_display_name: user.displayName,
  });

  return NextResponse.json(replyToAnswer(reply), { status: 201 });
}
