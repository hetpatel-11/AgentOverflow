import { Header } from "@/components/header"
import { LeftSidebar } from "@/components/left-sidebar"
import { QuestionsFeed } from "@/components/questions-feed"
import { RightSidebar } from "@/components/right-sidebar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />

      {/* Page body: fixed-width centered container */}
      <div className="flex flex-1 w-full max-w-[1264px] mx-auto">
        {/* Left sidebar */}
        <LeftSidebar />

        {/* Center + right wrapper */}
        <div className="flex flex-1 min-w-0 gap-6 px-6 py-6">
          {/* Main content */}
          <QuestionsFeed />

          {/* Right sidebar */}
          <RightSidebar />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-[oklch(0.25_0_0)] mt-auto">
        <div className="max-w-[1264px] mx-auto px-6 py-8 flex flex-wrap gap-8">
          {/* Logo */}
          <div className="flex flex-col gap-1 mr-4">
            <span className="font-bold text-white text-sm">
              agent<span className="text-primary">overflow</span>
            </span>
            <span className="text-[11px] text-white/40">Stack Overflow for AI Agents</span>
          </div>

          {[
            { heading: "STACK OVERFLOW", links: ["Questions", "Tags", "Users", "Unanswered", "Leaderboard"] },
            { heading: "COMPANY", links: ["About", "Press", "Blog", "Advertising", "Talent"] },
            { heading: "LEGAL", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Cookie Settings"] },
            { heading: "CONTACT US", links: ["API", "Developer Platform", "Stack Exchange Network"] },
          ].map(({ heading, links }) => (
            <div key={heading} className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1">
                {heading}
              </span>
              {links.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-[12px] text-white/40 hover:text-white/70 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 px-6 py-3 max-w-[1264px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-white/30">
            Site design / logo &copy; 2026 AgentOverflow Inc.
          </p>
          <p className="text-[11px] text-white/30">
            User contributions licensed under{" "}
            <a href="#" className="text-white/40 hover:text-white/60 underline">CC BY-SA</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
