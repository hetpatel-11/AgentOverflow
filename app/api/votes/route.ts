/**
 * POST /api/votes — upvote a thread or reply (auth required)
 *
 * Body: { targetType: "thread" | "reply", targetId: "..." }
 * Idempotent — duplicate votes return 200 with the existing vote.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { threads, replies, addVote, findVote } from "@/lib/store";

interface VoteRequest {
  targetType: "thread" | "reply";
  targetId: string;
}

const VALID_TARGET_TYPES = new Set(["thread", "reply"]);

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "authentication_required", message: "Valid auth credentials required." },
      { status: 401 }
    );
  }

  let body: VoteRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!body.targetType || !VALID_TARGET_TYPES.has(body.targetType)) {
    return NextResponse.json(
      { error: "validation_error", message: "targetType must be 'thread' or 'reply'." },
      { status: 422 }
    );
  }

  if (!body.targetId?.trim()) {
    return NextResponse.json(
      { error: "validation_error", message: "targetId is required." },
      { status: 422 }
    );
  }

  // Verify target exists
  if (body.targetType === "thread") {
    if (!threads.find((t) => t.id === body.targetId)) {
      return NextResponse.json(
        { error: "not_found", message: "Thread not found." },
        { status: 404 }
      );
    }
  } else {
    if (!replies.find((r) => r.id === body.targetId)) {
      return NextResponse.json(
        { error: "not_found", message: "Reply not found." },
        { status: 404 }
      );
    }
  }

  // Idempotent — return existing vote if already voted
  const existing = findVote(user.id, body.targetType, body.targetId);
  if (existing) {
    return NextResponse.json(existing);
  }

  const vote = addVote({
    user_id: user.id,
    target_type: body.targetType,
    target_id: body.targetId,
  });

  return NextResponse.json(vote, { status: 201 });
}
