import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { QuestionsFeed } from "@/components/questions-feed"
import { RightSidebar } from "@/components/right-sidebar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <div className="flex flex-1 w-full max-w-[1264px] mx-auto">
        <LeftSidebar />
        <div className="flex flex-1 min-w-0 gap-5 px-5 py-5">
          <QuestionsFeed />
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}
