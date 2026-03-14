/**
 * API Client for frontend.
 *
 * Handles:
 * - Prefixing /api/ to paths
 * - Converting snake_case responses to camelCase
 * - Converting camelCase request bodies to snake_case
 * - Error handling with consistent ApiError type
 * - Optional auth headers
 */
import type {
  Thread,
  Reply,
  ThreadDetail,
  CreateThreadInput,
  Vote,
  ApiError,
  Stats,
} from "./types";

// --- Case conversion utilities ---

function toCamelCase<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase) as T;
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(value);
  }
  return result as T;
}

function toSnakeCase<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase) as T;
  if (typeof obj !== "object") return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnakeCase(value);
  }
  return result as T;
}

// --- API Client ---

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClientError extends Error {
  status: number;
  error: string;

  constructor(status: number, apiError: ApiError) {
    super(apiError.message);
    this.name = "ApiClientError";
    this.status = status;
    this.error = apiError.error;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  // Build absolute URL for both client and server-side fetches
  const apiPath = path.startsWith("/api/") ? path : `/api/${path}`;
  const baseUrl = typeof window === "undefined"
    ? `http://localhost:${process.env.PORT || 3000}`
    : "";
  const url = `${baseUrl}${apiPath}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(toSnakeCase(body));
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: "unknown_error",
      message: "An unknown error occurred",
    }));
    throw new ApiClientError(response.status, errorData);
  }

  const data = await response.json();
  return toCamelCase<T>(data);
}

// --- Public API ---

export async function getThreads(params?: {
  kind?: string;
  tag?: string;
  search?: string;
}): Promise<Thread[]> {
  const searchParams = new URLSearchParams();
  if (params?.kind) searchParams.set("kind", params.kind);
  if (params?.tag) searchParams.set("tag", params.tag);
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  return request<Thread[]>(`threads${query ? `?${query}` : ""}`);
}

export async function getThread(id: string): Promise<ThreadDetail> {
  return request<ThreadDetail>(`threads/${id}`);
}

export async function createThread(
  data: CreateThreadInput,
  headers?: Record<string, string>
): Promise<Thread> {
  return request<Thread>("threads", { method: "POST", body: data, headers });
}

export async function getReplies(threadId: string): Promise<Reply[]> {
  return request<Reply[]>(`threads/${threadId}/replies`);
}

export async function createReply(
  threadId: string,
  body: string,
  headers?: Record<string, string>
): Promise<Reply> {
  return request<Reply>(`threads/${threadId}/replies`, {
    method: "POST",
    body: { body },
    headers,
  });
}

export async function vote(
  targetType: "thread" | "reply",
  targetId: string,
  headers?: Record<string, string>
): Promise<Vote> {
  return request<Vote>("votes", {
    method: "POST",
    body: { targetType, targetId },
    headers,
  });
}

export async function getStats(): Promise<Stats> {
  // Fetch all threads and calculate stats client-side
  // In production, this would be a dedicated endpoint
  const threads = await getThreads();
  const agents = await request<{ id: string }[]>("agents");

  return {
    threadCount: threads.length,
    replyCount: threads.reduce((sum, t) => sum + t.replyCount, 0),
    agentCount: agents.length,
  };
}

export { ApiClientError };
