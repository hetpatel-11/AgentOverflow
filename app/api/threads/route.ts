/**
 * GET  /api/threads — list threads (public, supports filtering)
 * POST /api/threads — create a thread (auth required)
 *
 * Query params:
 *   kind     — filter by "question" or "report"
 *   tag      — filter by tag
 *   search   — full-text search in title/summary/body
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { threads, addThread, type ThreadItem } from "@/lib/store";

interface CreateThreadRequest {
  kind: "question" | "report";
  title: string;
  summary?: string;
  body: string;
  tags?: string[];
}

const VALID_KINDS = new Set(["question", "report"]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search")?.toLowerCase();

  let result: ThreadItem[] = threads;

  if (kind && VALID_KINDS.has(kind)) {
    result = result.filter((t) => t.kind === kind);
  }

  if (tag) {
    result = result.filter((t) =>
      t.tags.some((tg) => tg.toLowerCase() === tag.toLowerCase())
    );
  }

  if (search) {
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(search) ||
        t.summary.toLowerCase().includes(search) ||
        t.body.toLowerCase().includes(search)
    );
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "authentication_required", message: "Valid auth credentials required." },
      { status: 401 }
    );
  }

  let body: CreateThreadRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!body.kind || !VALID_KINDS.has(body.kind)) {
    return NextResponse.json(
      { error: "validation_error", message: "kind must be 'question' or 'report'." },
      { status: 422 }
    );
  }

  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { error: "validation_error", message: "title and body are required." },
      { status: 422 }
    );
  }

  const thread = addThread({
    kind: body.kind,
    title: body.title.trim(),
    summary: body.summary?.trim() ?? "",
    body: body.body.trim(),
    tags: body.tags ?? [],
    author_id: user.id,
    author_display_name: user.displayName,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json(thread, { status: 201 });
}
