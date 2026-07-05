import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export type BuzzResult = 'won' | 'lost'

/**
 * Attempts to claim the buzz-in for `playerId`. Race-safe: Firestore serializes
 * concurrent transactions against the game doc, so only the first commit to see
 * `winnerId === null` succeeds — everyone else re-reads the now-changed doc and
 * throws before writing anything.
 */
export async function tryBuzz(roomCode: string, playerId: string, expectedToken: string): Promise<BuzzResult> {
  const gameRef = doc(db, 'games', roomCode)
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(gameRef)
      if (!snap.exists()) throw new Error('no-game')
      const buzz = snap.data().buzz

      if (buzz.token !== expectedToken) throw new Error('stale-window')
      if (!buzz.isOpen || buzz.winnerId !== null) throw new Error('already-decided')
      if (buzz.lockedOutPlayerIds.includes(playerId)) throw new Error('locked-out')

      tx.update(gameRef, {
        'buzz.winnerId': playerId,
        'buzz.winnerAt': serverTimestamp(),
        'buzz.isOpen': false,
      })
    })
    return 'won'
  } catch {
    return 'lost'
  }
}
