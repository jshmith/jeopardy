import { useEffect, useState } from 'react'
import { tryBuzz } from './useBuzz'
import type { BuzzState } from '../../types/game'

const EARLY_BUZZ_LOCKOUT_MS = 1000

type Props = {
  roomCode: string
  playerId: string
  buzz: BuzzState
}

export function BuzzerButton({ roomCode, playerId, buzz }: Props) {
  const [pending, setPending] = useState(false)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [, setTick] = useState(0)

  const earlyLocked = Date.now() < lockedUntil

  // Re-render once the early-buzz penalty expires so the button un-greys itself.
  useEffect(() => {
    if (!earlyLocked) return
    const t = setTimeout(() => setTick((n) => n + 1), lockedUntil - Date.now())
    return () => clearTimeout(t)
  }, [lockedUntil, earlyLocked])

  const lockedOut = buzz.lockedOutPlayerIds.includes(playerId)
  const isWinner = buzz.winnerId === playerId
  const someoneElseWon = buzz.winnerId !== null && buzz.winnerId !== playerId
  const open = buzz.isOpen && buzz.winnerId === null
  const canBuzz = open && !lockedOut && !pending && !earlyLocked

  async function handleClick() {
    if (isWinner || someoneElseWon || lockedOut || pending || earlyLocked) return
    if (!buzz.isOpen) {
      // Buzzed before the host opened the buzzers: 1s local penalty.
      setLockedUntil(Date.now() + EARLY_BUZZ_LOCKOUT_MS)
      return
    }
    setPending(true)
    await tryBuzz(roomCode, playerId, buzz.token)
    setPending(false)
  }

  let label = 'BUZZ'
  let hint = 'Buzz when it turns green!'
  if (isWinner) {
    label = "YOU'RE IN!"
    hint = ''
  } else if (someoneElseWon) {
    label = 'Locked out'
    hint = ''
  } else if (lockedOut) {
    label = 'Already tried'
    hint = ''
  } else if (earlyLocked) {
    label = 'Too soon!'
    hint = 'Locked for buzzing early…'
  } else if (open) {
    label = 'BUZZ!'
    hint = 'Buzzers are open!'
  }

  const colorClasses = isWinner
    ? 'animate-pulse-ring bg-gradient-to-b from-jeopardy-gold-light to-jeopardy-gold text-jeopardy-blue-dark shadow-jeopardy-gold/30'
    : canBuzz
      ? 'bg-gradient-to-b from-green-400 to-green-600 text-white shadow-black/40 hover:brightness-110 hover:shadow-2xl active:scale-95 active:shadow-inner focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300/50 animate-pulse-ring'
      : someoneElseWon || lockedOut || earlyLocked
        ? 'bg-white/5 text-white/30 shadow-inner shadow-black/30'
        : 'bg-gradient-to-b from-red-800 to-red-950 text-white/60 shadow-black/40 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400/30'

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isWinner || someoneElseWon || lockedOut || pending || earlyLocked}
        className={`h-40 w-40 rounded-full font-jeopardy text-2xl font-bold shadow-xl transition-all duration-150 sm:h-56 sm:w-56 sm:text-3xl ${colorClasses}`}
      >
        {label}
      </button>
      {hint && <p className="text-sm text-white/40">{hint}</p>}
    </div>
  )
}
