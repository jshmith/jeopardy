import { useMemo } from 'react'
import type { Timestamp } from 'firebase/firestore'

/** Rough estimate of (server clock − this device's clock), in ms, resampled each time a
 * fresh server timestamp arrives. Lets clients extrapolate "now, in server time" without
 * trusting any one device's own clock to be accurate — used to keep synced video playback
 * from drifting because a host's or player's device clock is off. */
export function useClockOffsetMs(serverTimestamp: Timestamp | null | undefined): number {
  const serverTimeMs = serverTimestamp?.toMillis()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (serverTimeMs != null ? serverTimeMs - Date.now() : 0), [serverTimeMs])
}
