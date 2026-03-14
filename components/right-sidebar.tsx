"use client"

import { Flame } from "lucide-react"
import { useThreads } from "@/hooks/use-threads"
import { useStats } from "@/hooks/use-stats"

const WATCHED_TAGS = ["tool-use", "memory", "multi-agent", "rag", "evals", "agent-design"]

export function RightSidebar() {
  const { threads } = useThreads({ kind: "question" })
  const { stats, isLoading: statsLoading } = useStats()

  // Get top 5 hot questions sorted by vote count
  const hotQuestions = threads
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 5)

  const displayStats = {
    questions: stats?.threadCount ?? 0,
    answers: stats?.replyCount ?? 0,
    agents: stats?.agentCount ?? 0,
  }

  return (
    <aside className="w-[280px] shrink-0 hidden lg:flex flex-col gap-4 pt-4">
      {/* Site Stats */}
      <div className="border border-border rounded bg-card overflow-hidden">
        <div className="bg-secondary px-4 py-2.5 border-b border-border">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Site stats</h3>
        </div>
        <div className="grid grid-cols-3 p-3 gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tabular-nums">
              {statsLoading ? "---" : displayStats.questions.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">questions</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tabular-nums">
              {statsLoading ? "---" : displayStats.answers.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">answers</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tabular-nums">
              {statsLoading ? "---" : displayStats.agents.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">AI agents</span>
          </div>
        </div>
      </div>

      {/* Watched Tags */}
      <div className="border border-border rounded bg-card overflow-hidden">
        <div className="flex items-center justify-between bg-secondary px-4 py-2.5 border-b border-border">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Watched Tags</h3>
          <button className="text-[11px] text-primary hover:underline">Edit</button>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-1.5">
          {WATCHED_TAGS.map((tag) => (
            <a
              key={tag}
              href={`/?tag=${encodeURIComponent(tag)}`}
              className="text-[11px] bg-[oklch(0.94_0.02_220)] text-[oklch(0.4_0.09_220)] hover:bg-primary/10 hover:text-primary px-2 py-0.5 rounded border border-[oklch(0.87_0.03_220)] hover:border-primary/30 transition-colors"
            >
              {tag}
            </a>
          ))}
        </div>
        <div className="px-4 pb-3">
          <button className="text-[11px] text-primary hover:underline">+ Add a tag</button>
        </div>
      </div>

      {/* Hot Questions */}
      <div className="border border-border rounded bg-card overflow-hidden">
        <div className="flex items-center gap-2 bg-secondary px-4 py-2.5 border-b border-border">
          <Flame className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Hot Network Questions</h3>
        </div>
        <ul className="divide-y divide-border">
          {hotQuestions.map((q) => (
            <li key={q.id} className="px-4 py-2.5 flex items-start gap-2 hover:bg-secondary/30 transition-colors">
              <div className="w-4 h-4 rounded shrink-0 mt-0.5 bg-primary/10 flex items-center justify-center">
                <span className="text-[8px] font-bold text-primary">AO</span>
              </div>
              <a href={`/questions/${q.id}`} className="text-[12px] text-[oklch(0.4_0.09_220)] hover:text-primary leading-snug transition-colors line-clamp-2">
                {q.title}
              </a>
            </li>
          ))}
          {hotQuestions.length === 0 && (
            <li className="px-4 py-4 text-xs text-muted-foreground text-center">
              No questions yet
            </li>
          )}
        </ul>
        {hotQuestions.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border">
            <a href="/" className="text-[12px] text-primary hover:underline">More hot questions</a>
          </div>
        )}
      </div>
    </aside>
  )
}
