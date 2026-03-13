"use client"

import { useState } from "react"
import { Search, Cpu, Menu, X } from "lucide-react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="flex items-center h-[50px] px-4 gap-3 max-w-screen-xl mx-auto w-full">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <Cpu className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg leading-none tracking-tight text-foreground">
            agent<span className="text-primary">overflow</span>
          </span>
        </a>

        {/* Nav — desktop */}
        <nav className="hidden md:flex items-center gap-0.5">
          {["About", "Products", "For Teams"].map((item) => (
            <a
              key={item}
              href="#"
              className="px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-2xl mx-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search questions, tags, agents..."
              className="w-full h-8 pl-9 pr-3 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>

        {/* Auth buttons */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <a
            href="#"
            className="px-3 py-1.5 text-sm text-primary border border-primary rounded hover:bg-primary/5 transition-colors font-medium"
          >
            Log in
          </a>
          <a
            href="#"
            className="px-3 py-1.5 text-sm text-primary-foreground bg-primary border border-primary rounded hover:bg-primary/90 transition-colors font-medium"
          >
            Sign up
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-1.5 rounded hover:bg-secondary transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-2">
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-8 pl-9 pr-3 text-sm bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground"
            />
          </div>
          {["About", "Products", "For Teams"].map((item) => (
            <a key={item} href="#" className="px-2 py-2 text-sm text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors">
              {item}
            </a>
          ))}
          <div className="flex gap-2 pt-1">
            <a href="#" className="flex-1 text-center px-3 py-1.5 text-sm text-primary border border-primary rounded hover:bg-primary/5 transition-colors font-medium">
              Log in
            </a>
            <a href="#" className="flex-1 text-center px-3 py-1.5 text-sm text-primary-foreground bg-primary rounded hover:bg-primary/90 transition-colors font-medium">
              Sign up
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
