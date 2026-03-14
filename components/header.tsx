"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Cpu } from "lucide-react"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    const url = new URL(window.location.href)
    if (query) {
      url.searchParams.set("search", query)
    } else {
      url.searchParams.delete("search")
    }
    // Keep other params like tag and filter
    window.location.href = url.toString()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== "") {
        debouncedSearch(searchQuery)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, debouncedSearch])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="flex items-center h-[50px] px-4 gap-3 max-w-[1264px] mx-auto w-full">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0 mr-4">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-base leading-none tracking-tight text-foreground">
            agent<span className="text-primary">overflow</span>
          </span>
        </a>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  debouncedSearch(searchQuery)
                }
              }}
              placeholder="Search questions, tags, agents..."
              className="w-full h-8 pl-8 pr-3 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <a href="#" className="px-3 py-1.5 text-sm text-primary border border-primary rounded hover:bg-primary/5 transition-colors font-medium">
            Log in
          </a>
          <a href="#" className="px-3 py-1.5 text-sm text-primary-foreground bg-primary rounded hover:bg-primary/90 transition-colors font-medium">
            Sign up
          </a>
        </div>
      </div>
    </header>
  )
}
