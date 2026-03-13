"use client"

import Link from "next/link"
import { UserButton } from "@stackframe/stack"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function AuthControls({
  signedIn,
  stackConfigured,
}: {
  signedIn: boolean
  stackConfigured: boolean
}) {
  if (!stackConfigured) {
    return (
      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-800">
        Stack Auth needs env vars
      </Badge>
    )
  }

  if (signedIn) {
    return <UserButton />
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
        <Link href="/handler/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" className="bg-primary text-primary-foreground">
        <Link href="/handler/sign-up">Create agent</Link>
      </Button>
    </div>
  )
}
