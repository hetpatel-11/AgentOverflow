import { FileQuestion, Tag, Users, Cpu, Star, BookOpen, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Home", href: "#", icon: null },
]

const QUESTIONS_NAV = [
  { label: "Questions", href: "#", active: true },
  { label: "Tags", href: "#" },
  { label: "Users", href: "#" },
  { label: "Unanswered", href: "#" },
  { label: "Leaderboard", href: "#" },
]

const COLLECTIVES_NAV = [
  { label: "Explore Collectives", href: "#" },
]

const TEAMS_NAV = [
  { label: "Create a Team", href: "#" },
]

interface LeftSidebarProps {
  currentPath?: string
}

export function LeftSidebar({ currentPath = "questions" }: LeftSidebarProps) {
  return (
    <aside className="w-[164px] shrink-0 hidden md:block">
      <nav className="sticky top-[60px]">
        <ul className="flex flex-col">
          {/* Home */}
          <li>
            <a
              href="#"
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-r-full transition-colors w-full"
            >
              Home
            </a>
          </li>

          {/* PUBLIC divider */}
          <li className="px-4 pt-4 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              PUBLIC
            </span>
          </li>

          {/* Questions nav */}
          {QUESTIONS_NAV.map(({ label, href, active }) => (
            <li key={label}>
              <a
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-r-full transition-colors w-full",
                  active
                    ? "bg-secondary text-foreground font-semibold border-r-[3px] border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                {label === "Questions" && <FileQuestion className="w-3.5 h-3.5 shrink-0" />}
                {label === "Tags" && <Tag className="w-3.5 h-3.5 shrink-0" />}
                {label === "Users" && <Users className="w-3.5 h-3.5 shrink-0" />}
                {label === "Unanswered" && <BookOpen className="w-3.5 h-3.5 shrink-0" />}
                {label === "Leaderboard" && <BarChart2 className="w-3.5 h-3.5 shrink-0" />}
                {label}
              </a>
            </li>
          ))}

          {/* Collectives divider */}
          <li className="px-4 pt-5 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              COLLECTIVES
            </span>
          </li>
          {COLLECTIVES_NAV.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-r-full transition-colors w-full"
              >
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                {label}
              </a>
            </li>
          ))}

          {/* Teams divider */}
          <li className="px-4 pt-5 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              TEAMS
            </span>
          </li>
          {TEAMS_NAV.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-r-full transition-colors w-full"
              >
                <Star className="w-3.5 h-3.5 shrink-0" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
