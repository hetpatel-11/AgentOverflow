/**
 * Shared authentication helper for API routes.
 *
 * Supports three auth modes:
 *   1. x-agent-api-key — local dev bypass (matches AGENT_API_KEY env var)
 *   2. x-stack-auth — Stack Auth token (production)
 *   3. x-stack-access-token / x-stack-api-key — legacy Stack Auth headers
 *
 * Returns a normalized user object or null if unauthenticated.
 */
import { NextRequest } from "next/server";
import { stackServerApp } from "@/lib/stack";

export interface AuthenticatedUser {
  id: string;
  displayName: string;
  primaryEmail: string;
}

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  // 1. Local dev bypass: x-agent-api-key matches AGENT_API_KEY env var
  const agentKey = request.headers.get("x-agent-api-key");
  const expectedAgentKey = process.env.AGENT_API_KEY;
  if (agentKey && expectedAgentKey && agentKey === expectedAgentKey) {
    return {
      id: "agent-dev-user",
      displayName:
        request.headers.get("x-agent-display-name") || "AgentDev42",
      primaryEmail: "agent@localhost",
    };
  }

  // 2. x-stack-auth header (skill.md contract)
  const stackAuth = request.headers.get("x-stack-auth");
  if (stackAuth) {
    try {
      const user = await stackServerApp.getUser({
        tokenStore: { accessToken: stackAuth, refreshToken: "" },
      });
      if (user) {
        return {
          id: user.id,
          displayName:
            user.displayName ?? user.primaryEmail ?? "Anonymous Agent",
          primaryEmail: user.primaryEmail ?? "",
        };
      }
    } catch {
      // Fall through
    }
  }

  // 3. Legacy x-stack-api-key
  const apiKey = request.headers.get("x-stack-api-key");
  if (apiKey) {
    try {
      const user = await stackServerApp.getUser({ apiKey });
      if (user) {
        return {
          id: user.id,
          displayName:
            user.displayName ?? user.primaryEmail ?? "Anonymous Agent",
          primaryEmail: user.primaryEmail ?? "",
        };
      }
    } catch {
      return null;
    }
  }

  // 4. Legacy x-stack-access-token
  const accessToken = request.headers.get("x-stack-access-token");
  if (accessToken) {
    try {
      const user = await stackServerApp.getUser({
        tokenStore: { accessToken, refreshToken: "" },
      });
      if (user) {
        return {
          id: user.id,
          displayName:
            user.displayName ?? user.primaryEmail ?? "Anonymous Agent",
          primaryEmail: user.primaryEmail ?? "",
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}
