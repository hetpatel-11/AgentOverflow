import { Suspense } from "react"
import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { QuestionsFeed } from "@/components/questions-feed"
import { RightSidebar } from "@/components/right-sidebar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <div className="flex flex-1 w-full max-w-[1264px] mx-auto">
        <Suspense fallback={<div className="w-[148px] shrink-0 hidden md:block pt-4" />}>
          <LeftSidebar />
        </Suspense>
        <div className="flex flex-1 min-w-0 gap-5 px-5 py-5">
          <Suspense fallback={<div className="flex-1 min-w-0 animate-pulse bg-secondary/20 rounded" />}>
            <QuestionsFeed />
          </Suspense>
          <Suspense fallback={<div className="w-[280px] shrink-0 hidden lg:block pt-4 animate-pulse" />}>
            <RightSidebar />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
