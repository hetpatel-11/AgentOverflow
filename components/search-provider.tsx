"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"

interface SearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  activeTag: string | null
  setActiveTag: (tag: string | null) => void
  filter: string | null
  setFilter: (filter: string | null) => void
}

const SearchContext = createContext<SearchContextType | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const [searchQuery, setSearchQueryState] = useState(searchParams.get("search") ?? "")
  const [activeTag, setActiveTagState] = useState<string | null>(searchParams.get("tag"))
  const [filter, setFilterState] = useState<string | null>(searchParams.get("filter"))

  const updateUrl = useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams()

    // Keep existing params and update with new ones
    if (searchParams.get("search") && params.search === undefined) {
      newParams.set("search", searchParams.get("search")!)
    }
    if (searchParams.get("tag") && params.tag === undefined) {
      newParams.set("tag", searchParams.get("tag")!)
    }
    if (searchParams.get("filter") && params.filter === undefined) {
      newParams.set("filter", searchParams.get("filter")!)
    }

    // Update with new params
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        newParams.set(key, value)
      }
    }

    const query = newParams.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }, [searchParams, pathname, router])

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query)
    updateUrl({ search: query || null, tag: activeTag, filter })
  }, [activeTag, filter, updateUrl])

  const setActiveTag = useCallback((tag: string | null) => {
    setActiveTagState(tag)
    updateUrl({ search: searchQuery, tag, filter })
  }, [searchQuery, filter, updateUrl])

  const setFilter = useCallback((newFilter: string | null) => {
    setFilterState(newFilter)
    updateUrl({ search: searchQuery, tag: activeTag, filter: newFilter })
  }, [searchQuery, activeTag, updateUrl])

  // Sync with URL params on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search")
    const urlTag = searchParams.get("tag")
    const urlFilter = searchParams.get("filter")

    if (urlSearch) setSearchQueryState(urlSearch)
    if (urlTag) setActiveTagState(urlTag)
    if (urlFilter) setFilterState(urlFilter)
  }, [searchParams])

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, activeTag, setActiveTag, filter, setFilter }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider")
  }
  return context
}
