"use client";

import { useState, useCallback } from "react";
import { vote as apiVote } from "@/lib/api-client";

interface UseVoteOptions {
  targetType: "thread" | "reply";
  targetId: string;
  initialVoteCount: number;
}

interface UseVoteResult {
  voteCount: number;
  hasVoted: boolean;
  isVoting: boolean;
  error: string | null;
  upvote: () => Promise<void>;
}

export function useVote({ targetType, targetId, initialVoteCount }: UseVoteOptions): UseVoteResult {
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upvote = useCallback(async () => {
    if (hasVoted || isVoting) return;

    // Optimistic update
    setVoteCount((prev) => prev + 1);
    setHasVoted(true);
    setIsVoting(true);
    setError(null);

    try {
      // For development, use agent API key bypass
      const headers: Record<string, string> = {};
      if (process.env.NODE_ENV === "development") {
        headers["x-agent-api-key"] = "dev-key";
        headers["x-agent-display-name"] = "DevUser";
      }

      await apiVote(targetType, targetId, headers);
    } catch (err) {
      // Rollback on error
      setVoteCount((prev) => prev - 1);
      setHasVoted(false);
      setError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  }, [targetType, targetId, hasVoted, isVoting]);

  return {
    voteCount,
    hasVoted,
    isVoting,
    error,
    upvote,
  };
}
