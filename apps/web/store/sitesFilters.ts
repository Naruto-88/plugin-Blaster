"use client"
import { create } from 'zustand'

export type StatusFilter = 'ok'|'unreachable'|'auth_failed'|'unknown'

type State = {
  q: string
  tags: string[]
  statuses: StatusFilter[]
  page: number
  pageSize: number
}

type Actions = {
  setQ: (q: string) => void
  setTags: (tags: string[]) => void
  toggleStatus: (s: StatusFilter) => void
  setPage: (p: number) => void
  setPageSize: (n: number) => void
  reset: () => void
}

export const useSitesFilters = create<State & Actions>((set, get) => ({
  q: '',
  tags: [],
  statuses: [],
  page: 1,
  pageSize: 50,
  setQ: (q) => set({ q, page: 1 }),
  setTags: (tags) => set({ tags, page: 1 }),
  toggleStatus: (s) => {
    const cur = get().statuses
    set({ statuses: cur.includes(s) ? cur.filter(x => x!==s) : [...cur, s], page: 1 })
  },
  setPage: (p) => set({ page: Math.max(1, p) }),
  setPageSize: (n) => set({ pageSize: n, page: 1 }),
  reset: () => set({ q: '', tags: [], statuses: [], page: 1, pageSize: 50 })
}))

