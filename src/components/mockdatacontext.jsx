'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'luotain:mock-data'
const DELETED_KEY = 'luotain:mock-deleted'

const MockDataContext = createContext({
  useMockData: false,
  setMockData: () => {},
  toggleMockData: () => {},
  deletedUrls: [],
  deleteMockLink: () => {},
  recoverMockLink: () => {},
  ready: false,
})

export function MockDataProvider({ children }) {
  const [useMockData, setUseMockData] = useState(false)
  // Whether the saved preference has been read yet. This exists to stop
  // pages firing a real API request on load and then immediately
  // throwing the result away: localStorage can only be read on the
  // client, so the first render always says "mock off" regardless of
  // what's actually saved. Without this flag every reload with mock on
  // would hit the network pointlessly and flash real (or empty) data
  // before switching over.
  const [ready, setReady] = useState(false)
  // Links deleted during this mock session. Shared here rather than
  // held per-page because deleting has to be visible everywhere at
  // once: the link leaves the table, joins the trash, drops out of the
  // totals, and its own page switches to the archived state. Held
  // per-page, a delete from the detail page changed nothing anywhere
  // else — which is exactly how it was behaving.
  const [deletedUrls, setDeletedUrls] = useState([])

  useEffect(() => {
    try {
      setUseMockData(window.localStorage.getItem(STORAGE_KEY) === 'true')
      const saved = window.localStorage.getItem(DELETED_KEY)
      if (saved) setDeletedUrls(JSON.parse(saved))
    } catch {
      // Private browsing and some embedded webviews throw on access
      // rather than returning null. Mock off is the correct fallback.
    }
    setReady(true)
  }, [])

  const setMockData = useCallback((next) => {
    setUseMockData(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false')
    } catch {
      // Not persisting is survivable — it just won't outlive the tab.
    }
  }, [])

  const toggleMockData = useCallback(() => {
    setUseMockData((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false')
      } catch {}
      return next
    })
  }, [])

  const persistDeleted = useCallback((next) => {
    try {
      window.localStorage.setItem(DELETED_KEY, JSON.stringify(next))
    } catch {}
    return next
  }, [])

  const deleteMockLink = useCallback(
    (url) => {
      setDeletedUrls((prev) =>
        prev.includes(url) ? prev : persistDeleted([...prev, url])
      )
    },
    [persistDeleted]
  )

  const recoverMockLink = useCallback(
    (url) => {
      setDeletedUrls((prev) => persistDeleted(prev.filter((u) => u !== url)))
    },
    [persistDeleted]
  )

  const value = useMemo(
    () => ({
      useMockData,
      setMockData,
      toggleMockData,
      deletedUrls,
      deleteMockLink,
      recoverMockLink,
      ready,
    }),
    [
      useMockData,
      setMockData,
      toggleMockData,
      deletedUrls,
      deleteMockLink,
      recoverMockLink,
      ready,
    ]
  )

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  )
}

export function useMockDataState() {
  return useContext(MockDataContext)
}
