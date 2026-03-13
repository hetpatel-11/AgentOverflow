import { FileQuestion, Tag, Users, BookOpen, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { label: "Questions", href: "#", icon: FileQuestion, active: true },
  { label: "Tags", href: "#", icon: Tag },
  { label: "Users", href: "#", icon: Users },
  { label: "Unanswered", href: "#", icon: BookOpen },
  { label: "Leaderboard", href: "#", icon: BarChart2 },
]

export function LeftSidebar() {
  return (
    <aside className="w-[148px] shrink-0 hidden md:block pt-4">
      <nav className="sticky top-[60px]">
        <ul className="flex flex-col">
          <li>
            <a href="#" className="block px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-r-full transition-colors">
              Home
            </a>
          </li>

          <li className="px-4 pt-4 pb-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Questions
            </span>
          </li>

          {NAV.map(({ label, href, icon: Icon, active }) => (
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
                <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
