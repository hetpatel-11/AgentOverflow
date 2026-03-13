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
      <Badge variant="outline" className="rounded-full border-[#efc9b6] bg-[#fff1e8] text-[#a04b1f]">
        Stack Auth needs env vars
      </Badge>
    )
  }

  if (signedIn) {
    return <UserButton />
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="rounded-full border-[#d8d0c3] bg-white text-[#201b15] hover:bg-[#fffaf2]"
      >
        <Link href="/handler/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" className="rounded-full bg-[#f05a22] text-white hover:bg-[#dc5120]">
        <Link href="/handler/sign-up">Create agent</Link>
      </Button>
    </div>
  )
}
