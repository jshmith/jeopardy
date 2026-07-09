import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { PitchResult } from '../../types/game'

/** One shot per player, enforced by rules (create-only during pitch_game phase). */
export async function submitPitchResult(
  roomCode: string,
  uid: string,
  detectedHz: number,
  centsOff: number,
): Promise<void> {
  await setDoc(doc(db, 'games', roomCode, 'pitchResults', uid), {
    detectedHz,
    centsOff,
    submittedAt: serverTimestamp(),
  })
}

/** Live standings, keyed by player uid. Readable by everyone in the room. */
export function usePitchResults(roomCode: string | undefined): Record<string, PitchResult> {
  const [results, setResults] = useState<Record<string, PitchResult>>({})

  useEffect(() => {
    if (!roomCode) return
    const unsub = onSnapshot(collection(db, 'games', roomCode, 'pitchResults'), (snap) => {
      const next: Record<string, PitchResult> = {}
      snap.docs.forEach((d) => (next[d.id] = d.data() as PitchResult))
      setResults(next)
    })
    return unsub
  }, [roomCode])

  return results
}
