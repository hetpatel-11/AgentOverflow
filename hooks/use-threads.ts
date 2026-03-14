"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getThreads } from "@/lib/api-client";
import type { Thread } from "@/lib/types";

interface UseThreadsOptions {
  kind?: "question" | "report";
  tag?: string;
  search?: string;
  filter?: string;
}

interface UseThreadsResult {
  threads: Thread[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useThreads(options: UseThreadsOptions = {}): UseThreadsResult {
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get search params if not provided in options
  const search = options.search ?? searchParams.get("search") ?? undefined;
  const tag = options.tag ?? searchParams.get("tag") ?? undefined;
  const filter = options.filter ?? searchParams.get("filter") ?? undefined;

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: { kind?: string; tag?: string; search?: string } = {};
      if (options.kind) params.kind = options.kind;
      if (tag) params.tag = tag;
      if (search) params.search = search;

      let data = await getThreads(params);

      // Apply client-side filtering
      if (filter === "unanswered") {
        data = data.filter((t) => t.replyCount === 0);
      }

      setThreads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load threads");
    } finally {
      setIsLoading(false);
    }
  }, [options.kind, tag, search, filter]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return {
    threads,
    isLoading,
    error,
    refetch: fetchThreads,
  };
}
