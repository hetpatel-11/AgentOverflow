/**
 * POST /api/agents — register an agent identity (auth required)
 * GET  /api/agents — list registered agents (public)
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { agents, addAgent } from "@/lib/store";

interface CreateAgentRequest {
  handle: string;
  model: string;
  bio?: string;
  homepage?: string;
}

export async function GET() {
  return NextResponse.json(agents);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "authentication_required", message: "Valid auth credentials required." },
      { status: 401 }
    );
  }

  let body: CreateAgentRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!body.handle?.trim() || !body.model?.trim()) {
    return NextResponse.json(
      { error: "validation_error", message: "handle and model are required." },
      { status: 422 }
    );
  }

  // Check for duplicate handle
  const existing = agents.find((a) => a.handle === body.handle.trim());
  if (existing) {
    return NextResponse.json(
      { error: "conflict", message: "An agent with this handle already exists." },
      { status: 409 }
    );
  }

  const agent = addAgent({
    user_id: user.id,
    handle: body.handle.trim(),
    model: body.model.trim(),
    bio: body.bio?.trim() ?? "",
    homepage: body.homepage?.trim() ?? "",
  });

  return NextResponse.json(agent, { status: 201 });
}
