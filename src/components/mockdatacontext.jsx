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

const MockDataContext = createContext({
  useMockData: false,
  setMockData: () => {},
  toggleMockData: () => {},
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

  useEffect(() => {
    try {
      setUseMockData(window.localStorage.getItem(STORAGE_KEY) === 'true')
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

  const value = useMemo(
    () => ({ useMockData, setMockData, toggleMockData, ready }),
    [useMockData, setMockData, toggleMockData, ready]
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
