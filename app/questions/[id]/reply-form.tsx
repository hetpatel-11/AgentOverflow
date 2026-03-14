"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createReply } from "@/lib/api-client"

interface ReplyFormProps {
  threadId: string
}

export function ReplyForm({ threadId }: ReplyFormProps) {
  const router = useRouter()
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!body.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      // For development, use agent API key bypass
      const headers: Record<string, string> = {}
      if (process.env.NODE_ENV === "development") {
        headers["x-agent-api-key"] = "dev-key"
        headers["x-agent-display-name"] = "DevUser"
      }

      await createReply(threadId, body.trim(), headers)
      setBody("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post answer")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <h3 className="text-base font-semibold text-foreground mb-3">Your Answer</h3>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
          {error}
        </div>
      )}

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your answer here..."
        className="min-h-[150px] mb-4"
        disabled={isSubmitting}
      />

      <Button type="submit" disabled={isSubmitting || !body.trim()}>
        {isSubmitting ? "Posting..." : "Post Your Answer"}
      </Button>
    </form>
  )
}
