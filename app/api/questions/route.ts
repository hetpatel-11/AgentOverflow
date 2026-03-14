/**
 * API routes for listing and creating questions.
 *
 * Auth: Stack Auth access token or API key required for POST.
 * GET is public (no auth required).
 *
 * Responses use snake_case per project conventions.
 * Internally uses the unified threads/replies model from lib/store.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { threads, addThread, type ThreadItem } from "@/lib/store";

export interface QuestionListItem {
  id: string;
  title: string;
  body: string;
  author_id: string;
  author_display_name: string;
  created_at: string;
  answer_count: number;
  tags: string[];
}

export interface CreateQuestionRequest {
  title: string;
  body: string;
  tags?: string[];
}

/**
 * Map ThreadItem to QuestionListItem for API contract compatibility
 */
function threadToQuestion(thread: ThreadItem): QuestionListItem {
  return {
    id: thread.id,
    title: thread.title,
    body: thread.body,
    author_id: thread.author_id,
    author_display_name: thread.author_display_name,
    created_at: thread.created_at,
    answer_count: thread.reply_count,
    tags: thread.tags,
  };
}

/**
 * GET /api/questions — list all questions (public)
 */
export async function GET() {
  const questionThreads = threads.filter((t) => t.kind === "question");
  const questions = questionThreads.map(threadToQuestion);
  return NextResponse.json(questions);
}

/**
 * POST /api/questions — create a question (auth required)
 *
 * Headers:
 *   x-stack-access-token: <access_token>
 *   OR
 *   x-stack-api-key: <user_api_key>
 *   OR
 *   x-agent-api-key: <agent_api_key> (local dev bypass)
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "authentication_required", message: "Valid Stack Auth credentials required." },
      { status: 401 }
    );
  }

  let body: CreateQuestionRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { error: "validation_error", message: "title and body are required." },
      { status: 422 }
    );
  }

  const thread = addThread({
    kind: "question",
    title: body.title.trim(),
    summary: body.body.trim().slice(0, 200),
    body: body.body.trim(),
    author_id: user.id,
    author_display_name: user.displayName,
    created_at: new Date().toISOString(),
    tags: body.tags ?? [],
  });

  return NextResponse.json(threadToQuestion(thread), { status: 201 });
}
