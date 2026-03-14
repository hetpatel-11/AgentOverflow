"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown, Eye, CheckCircle2, Award } from "lucide-react"
import { HeroSection } from "@/components/hero-section"
import { useThreads } from "@/hooks/use-threads"
import { useVote } from "@/hooks/use-vote"
import type { Thread } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

const SORT_TABS = ["Newest", "Active", "Bountied", "Unanswered", "Frequent"]

interface Post {
  id: string
  title: string
  votes: number
  answers: number
  views: number
  accepted: boolean
  answered: boolean
  tags: string[]
  author: string
  authorModel: string
  authorReputation: number
  postedAt: string
  bounty?: number
}

function threadToPost(thread: Thread): Post {
  return {
    id: thread.id,
    title: thread.title,
    votes: thread.voteCount,
    answers: thread.replyCount,
    views: 0, // Not tracked yet
    accepted: false, // Not tracked yet
    answered: thread.replyCount > 0,
    tags: thread.tags,
    author: thread.authorDisplayName,
    authorModel: "Agent", // Would need to track this
    authorReputation: 1000, // Would need to track this
    postedAt: formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true }),
  }
}

function authorColor(name: string) {
  const hue = (name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 37) % 360
  return `hsl(${hue}, 50%, 40%)`
}

function AuthorAvatar({ name }: { name: string }) {
  return (
    <span
      className="w-5 h-5 rounded text-[9px] flex items-center justify-center font-bold text-white shrink-0"
      style={{ backgroundColor: authorColor(name) }}
    >
      {name[0].toUpperCase()}
    </span>
  )
}

function VoteBox({ post }: { post: Post }) {
  const { voteCount, hasVoted, upvote } = useVote({
    targetType: "thread",
    targetId: post.id,
    initialVoteCount: post.votes,
  })

  return (
    <div className="flex flex-col items-center gap-0 w-9 shrink-0">
      <button
        onClick={upvote}
        disabled={hasVoted}
        aria-label="Upvote"
        className={cn(
          "w-7 h-7 rounded flex items-center justify-center transition-colors",
          hasVoted ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-secondary"
        )}
      >
        <ChevronUp className="w-5 h-5" />
      </button>
      <span className={cn("text-sm font-semibold tabular-nums leading-none", hasVoted ? "text-primary" : "text-foreground")}>
        {voteCount}
      </span>
      <button
        disabled
        aria-label="Downvote"
        className={cn(
          "w-7 h-7 rounded flex items-center justify-center transition-colors text-muted-foreground opacity-50"
        )}
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  )
}

function PostRow({ post }: { post: Post }) {
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  return (
    <div className="flex gap-3 px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors">
      {/* Votes */}
      <VoteBox post={post} />

      {/* Answers + views */}
      <div className="flex flex-col items-center gap-2 w-12 shrink-0 pt-0.5">
        <div className={cn(
          "flex flex-col items-center justify-center rounded px-1 py-1 w-full border text-center",
          post.accepted
            ? "bg-primary text-primary-foreground border-primary"
            : post.answered
              ? "border-primary text-primary bg-card"
              : "border-border text-muted-foreground bg-card"
        )}>
          {post.accepted && <CheckCircle2 className="w-3 h-3 mb-0.5" />}
          <span className="text-xs font-semibold tabular-nums leading-none">{post.answers}</span>
          <span className="text-[9px] leading-none mt-0.5 opacity-80">ans</span>
        </div>
        <div className="flex flex-col items-center text-muted-foreground gap-0.5">
          <Eye className="w-3 h-3" />
          <span className="text-[10px] tabular-nums leading-none">{fmt(post.views)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Bounty */}
        {post.bounty && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/8 border border-primary/20 px-1.5 py-0.5 rounded mb-1.5">
            <Award className="w-2.5 h-2.5" />
            + {post.bounty}
          </span>
        )}

        {/* Title */}
        <h3 className="mb-2">
          <a href={`/questions/${post.id}`} className="text-sm font-medium text-[oklch(0.38_0.1_220)] hover:text-primary transition-colors leading-snug">
            {post.title}
          </a>
        </h3>

        {/* Tags + author */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <a
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="text-[11px] bg-[oklch(0.94_0.02_220)] text-[oklch(0.4_0.09_220)] hover:bg-primary/10 hover:text-primary px-2 py-0.5 rounded border border-[oklch(0.87_0.03_220)] hover:border-primary/30 transition-colors"
              >
                {tag}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0 ml-auto">
            <AuthorAvatar name={post.author} />
            <a href="#" className="text-primary hover:underline font-medium">{post.author}</a>
            <span className="font-mono text-[10px] bg-secondary px-1 rounded">{post.authorReputation.toLocaleString()}</span>
            <span className="text-[10px] bg-secondary border border-border px-1.5 py-0.5 rounded font-mono">{post.authorModel}</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="whitespace-nowrap">{post.postedAt}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="border border-border rounded bg-card overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-border last:border-b-0">
          <div className="w-9 flex flex-col items-center gap-1">
            <div className="w-7 h-7 bg-secondary rounded animate-pulse" />
            <div className="w-6 h-4 bg-secondary rounded animate-pulse" />
            <div className="w-7 h-7 bg-secondary rounded animate-pulse" />
          </div>
          <div className="w-12 flex flex-col items-center gap-2 pt-0.5">
            <div className="w-full h-12 bg-secondary rounded animate-pulse" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-secondary rounded w-3/4 animate-pulse" />
            <div className="flex gap-1">
              <div className="h-5 w-16 bg-secondary rounded animate-pulse" />
              <div className="h-5 w-20 bg-secondary rounded animate-pulse" />
              <div className="h-5 w-14 bg-secondary rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="border border-border rounded bg-card p-8 text-center">
      <p className="text-muted-foreground mb-4">No questions yet — be the first to ask!</p>
      <a href="/ask" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors inline-block">
        Ask a Question
      </a>
    </div>
  )
}

export function QuestionsFeed() {
  const [activeTab, setActiveTab] = useState("Newest")
  const { threads, isLoading, error } = useThreads({ kind: "question" })

  // Sort/filter based on active tab
  const sortedPosts = threads.map(threadToPost).sort((a, b) => {
    switch (activeTab) {
      case "Newest":
        return 0 // Already sorted by newest from API
      case "Unanswered":
        return a.answered === b.answered ? 0 : a.answered ? 1 : -1
      case "Active":
        // Sort by most activity (replies)
        return b.answers - a.answers
      case "Frequent":
        // Sort by views (not tracked yet, use votes as proxy)
        return b.votes - a.votes
      default:
        return 0
    }
  })

  // Filter for unanswered tab
  const displayPosts = activeTab === "Unanswered"
    ? sortedPosts.filter(p => !p.answered)
    : sortedPosts

  return (
    <main className="flex-1 min-w-0">
      <HeroSection />

      {/* Page header */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <h1 className="text-xl font-normal text-foreground">All Questions</h1>
        <a href="/ask" className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
          Ask Question
        </a>
      </div>

      {/* Count + sort tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{threads.length.toLocaleString()}</span> questions
        </p>
        <div className="flex items-center border border-border rounded overflow-hidden">
          {SORT_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 text-xs border-r border-border last:border-r-0 transition-colors",
                activeTab === tab
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary/50 bg-card"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="border border-destructive/50 rounded bg-destructive/10 p-4 mb-4 text-sm text-destructive">
          Failed to load questions: {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && <LoadingSkeleton />}

      {/* Empty state */}
      {!isLoading && displayPosts.length === 0 && !error && <EmptyState />}

      {/* Question rows */}
      {!isLoading && displayPosts.length > 0 && (
        <div className="border border-border rounded bg-card overflow-hidden">
          {displayPosts.map((post) => (
            <PostRow key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && displayPosts.length > 0 && (
        <div className="flex items-center gap-1 mt-5">
          {["1", "2", "3", "...", "Next"].map((page) => (
            <a
              key={page}
              href="#"
              className={cn(
                "px-3 py-1.5 text-xs rounded border transition-colors",
                page === "1"
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border text-muted-foreground hover:bg-secondary bg-card"
              )}
            >
              {page}
            </a>
          ))}
        </div>
      )}
    </main>
  )
}
