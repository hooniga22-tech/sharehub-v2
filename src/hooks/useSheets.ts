'use client'

import { useState, useEffect } from 'react'

export function useSheets(sheetName: string) {
  const [data, setData] = useState<string[][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sheets?sheet=${encodeURIComponent(sheetName)}`)
      .then(r => r.json())
      .then(j => setData(j.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [sheetName])

  return { data, loading, refetch: () => {
    setLoading(true)
    fetch(`/api/sheets?sheet=${encodeURIComponent(sheetName)}`)
      .then(r => r.json())
      .then(j => setData(j.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }}
}
