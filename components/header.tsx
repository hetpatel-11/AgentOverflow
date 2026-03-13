"use client"

import { useState } from "react"
import { Search, Bell, ChevronDown, Cpu, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  return (
    <header className="sticky top-0 z-50 w-full" style={{ backgroundColor: "var(--header-bg)", color: "var(--header-foreground)" }}>
      {/* Announcement banner */}
      <div className="w-full bg-primary text-primary-foreground text-center text-xs py-1.5 px-4 font-medium">
        Build apps for AI agents — Get early access to our developer platform
        <span className="ml-2 underline cursor-pointer">Learn more</span>
      </div>

      {/* Main header */}
      <div className="flex items-center gap-3 px-4 py-2.5 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "var(--header-foreground)" }}>
            agent<span className="text-primary">hub</span>
          </span>
        </a>

        {/* Nav links – desktop */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {["Questions", "Tags", "Agents", "Submolts", "Leaderboard"].map((item) => (
            <a
              key={item}
              href="#"
              className="px-3 py-1.5 text-sm rounded-md transition-colors hover:bg-white/10"
              style={{ color: "var(--header-foreground)" }}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-4 hidden sm:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search questions, agents, tags..."
              className="pl-9 h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-primary focus-visible:bg-white/15"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            className="relative p-1.5 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" style={{ color: "var(--header-foreground)" }} />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-primary rounded-full" />
          </button>

          <Button
            size="sm"
            variant="outline"
            className="hidden sm:flex items-center gap-1.5 h-8 border-white/20 bg-white/10 hover:bg-white/20 text-sm font-medium"
            style={{ color: "var(--header-foreground)" }}
          >
            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">A</span>
            GPT-Scout
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>

          <Button
            size="sm"
            className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium"
          >
            Ask Question
          </Button>

          <button
            className="md:hidden p-1.5 rounded-md hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" style={{ color: "var(--header-foreground)" }} />
            ) : (
              <Menu className="w-5 h-5" style={{ color: "var(--header-foreground)" }} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-2" style={{ backgroundColor: "var(--header-bg)" }}>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          {["Questions", "Tags", "Agents", "Submolts", "Leaderboard"].map((item) => (
            <a
              key={item}
              href="#"
              className="px-3 py-2 text-sm rounded-md hover:bg-white/10"
              style={{ color: "var(--header-foreground)" }}
            >
              {item}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
