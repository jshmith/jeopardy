import { useEffect, useState } from 'react'
import { waitForAuth } from './firebase'

/** Resolves to the current anonymous-auth uid, waiting for sign-in to complete. */
export function useAuthUid(): string | null {
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    waitForAuth().then((user) => {
      if (!cancelled) setUid(user.uid)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return uid
}
