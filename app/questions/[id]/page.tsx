import { notFound } from "next/navigation"
import { getThread } from "@/lib/api-client"
import { ReplyForm } from "./reply-form"
import { formatDistanceToNow } from "date-fns"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuestionPage({ params }: PageProps) {
  const { id } = await params

  let thread
  try {
    thread = await getThread(id)
  } catch {
    notFound()
  }

  if (thread.kind !== "question") {
    notFound()
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Back link */}
      <a href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <span>← Back to Questions</span>
      </a>

      {/* Question header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground mb-3">{thread.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Asked {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
          <span>·</span>
          <span>{thread.voteCount} votes</span>
          <span>·</span>
          <span>{thread.replyCount} answers</span>
        </div>
      </div>

      {/* Question body */}
      <div className="flex gap-4 mb-6 pb-6 border-b border-border">
        {/* Vote buttons */}
        <div className="flex flex-col items-center gap-1 w-12 shrink-0">
          <div className="text-center py-2 px-3 border border-border rounded bg-card">
            <div className="text-lg font-bold text-foreground">{thread.voteCount}</div>
            <div className="text-xs text-muted-foreground">votes</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="prose prose-sm max-w-none text-foreground">
            {thread.body.split("\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-4">
            {thread.tags.map((tag) => (
              <a
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="text-[11px] bg-[oklch(0.94_0.02_220)] text-[oklch(0.4_0.09_220)] hover:bg-primary/10 hover:text-primary px-2 py-0.5 rounded border border-[oklch(0.87_0.03_220)] hover:border-primary/30 transition-colors"
              >
                {tag}
              </a>
            ))}
          </div>

          {/* Author info */}
          <div className="mt-4 flex justify-end">
            <div className="bg-secondary rounded px-3 py-2 text-xs">
              <div className="text-muted-foreground mb-1">asked {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</div>
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded text-[9px] flex items-center justify-center font-bold text-white"
                  style={{
                    backgroundColor: `hsl(${(thread.authorDisplayName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 37) % 360}, 50%, 40%)`
                  }}
                >
                  {thread.authorDisplayName[0]?.toUpperCase() || "?"}
                </span>
                <span className="text-primary font-medium">{thread.authorDisplayName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {thread.replyCount} {thread.replyCount === 1 ? "Answer" : "Answers"}
        </h2>

        {thread.replies.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded">
            No answers yet. Be the first to answer!
          </div>
        ) : (
          <div className="divide-y divide-border">
            {thread.replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} />
            ))}
          </div>
        )}
      </div>

      {/* Reply form */}
      <ReplyForm threadId={thread.id} />
    </div>
  )
}

function ReplyCard({ reply }: { reply: { id: string; body: string; authorDisplayName: string; createdAt: string; voteCount: number } }) {
  return (
    <div className="flex gap-4 py-4">
      {/* Vote buttons */}
      <div className="flex flex-col items-center gap-1 w-12 shrink-0">
        <div className="text-center py-2 px-3 border border-border rounded bg-card">
          <div className="text-lg font-bold text-foreground">{reply.voteCount}</div>
          <div className="text-xs text-muted-foreground">votes</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="prose prose-sm max-w-none text-foreground">
          {reply.body.split("\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* Author info */}
        <div className="mt-4 flex justify-end">
          <div className="bg-secondary rounded px-3 py-2 text-xs">
            <div className="text-muted-foreground mb-1">answered {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</div>
            <div className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded text-[9px] flex items-center justify-center font-bold text-white"
                style={{
                  backgroundColor: `hsl(${(reply.authorDisplayName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 37) % 360}, 50%, 40%)`
                }}
              >
                {reply.authorDisplayName[0]?.toUpperCase() || "?"}
              </span>
              <span className="text-primary font-medium">{reply.authorDisplayName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
