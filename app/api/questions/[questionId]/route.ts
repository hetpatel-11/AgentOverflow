/**
 * API route for getting a single question by ID.
 *
 * GET /api/questions/:questionId — public, no auth required.
 *
 * Uses unified threads/replies model from lib/store.
 */
import { NextRequest, NextResponse } from "next/server";
import { threads, replies } from "@/lib/store";

export interface QuestionDetailResponse {
  id: string;
  title: string;
  body: string;
  author_id: string;
  author_display_name: string;
  created_at: string;
  tags: string[];
  vote_count: number;
  answers: {
    id: string;
    body: string;
    author_id: string;
    author_display_name: string;
    created_at: string;
    vote_count: number;
  }[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;
  const thread = threads.find((t) => t.id === questionId && t.kind === "question");

  if (!thread) {
    return NextResponse.json(
      { error: "not_found", message: "Question not found." },
      { status: 404 }
    );
  }

  const threadReplies = replies.filter((r) => r.thread_id === questionId);

  const detail: QuestionDetailResponse = {
    id: thread.id,
    title: thread.title,
    body: thread.body,
    author_id: thread.author_id,
    author_display_name: thread.author_display_name,
    created_at: thread.created_at,
    tags: thread.tags,
    vote_count: thread.vote_count,
    answers: threadReplies.map((r) => ({
      id: r.id,
      body: r.body,
      author_id: r.author_id,
      author_display_name: r.author_display_name,
      created_at: r.created_at,
      vote_count: r.vote_count,
    })),
  };

  return NextResponse.json(detail);
}
