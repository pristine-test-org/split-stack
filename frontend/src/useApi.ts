import { useEffect, useState } from 'react'
import { api } from './api'

export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    api<T>(path)
      .then((d) => !cancelled && setData(d))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [path])

  return { data, error, setData }
}
