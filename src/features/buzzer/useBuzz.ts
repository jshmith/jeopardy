import { doc, runTransaction } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export type RecordAttemptResult = 'recorded' | 'rejected'

/**
 * Records this player's (offset-corrected) press time as their buzz attempt for the
 * current window. The winner isn't decided here — the host's client picks whichever
 * recorded attempt has the earliest timestamp once the judging window closes (see
 * `resolveBuzzWinner`). Still a transaction so a stale/duplicate/locked-out attempt is
 * rejected server-side rather than silently overwriting a legitimate one.
 */
export async function recordBuzzAttempt(
  roomCode: string,
  playerId: string,
  expectedToken: string,
  pressedAtMs: number,
): Promise<RecordAttemptResult> {
  const gameRef = doc(db, 'games', roomCode)
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef)
      if (!snap.exists()) throw new Error('no-game')
      const buzz = snap.data().buzz

      if (buzz.token !== expectedToken) throw new Error('stale-window')
      if (!buzz.isOpen || buzz.winnerId !== null) throw new Error('already-decided')
      if (buzz.lockedOutPlayerIds.includes(playerId)) throw new Error('locked-out')

      tx.update(gameRef, { [`buzz.attempts.${playerId}`]: pressedAtMs })
    })
    return 'recorded'
  } catch {
    return 'rejected'
  }
}
