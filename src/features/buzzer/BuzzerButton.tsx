import { useEffect, useState } from 'react'
import { recordBuzzAttempt } from './useBuzz'
import type { BuzzState } from '../../types/game'

type Props = {
  roomCode: string
  playerId: string
  buzz: BuzzState
  /** This device's clock offset from the server's, so "armed" fires at the same real
   * moment for every player regardless of whose listener heard about it first. */
  clockOffsetMs: number
}

export function BuzzerButton({ roomCode, playerId, buzz, clockOffsetMs }: Props) {
  const [pending, setPending] = useState(false)
  const [, setTick] = useState(0)

  const armed = buzz.isOpen && Date.now() + clockOffsetMs >= buzz.opensAtMs

  // Re-render the instant this player's local clock reaches opensAtMs, so the
  // button goes live at the same real moment for everyone, not whenever each
  // client happens to notice.
  useEffect(() => {
    if (armed || !buzz.isOpen) return
    const delay = buzz.opensAtMs - (Date.now() + clockOffsetMs)
    const t = setTimeout(() => setTick((n) => n + 1), Math.max(0, delay))
    return () => clearTimeout(t)
  }, [armed, buzz.isOpen, buzz.opensAtMs, clockOffsetMs])

  const hasAttempted = buzz.attempts?.[playerId] !== undefined
  const lockedOut = buzz.lockedOutPlayerIds.includes(playerId)
  const isWinner = buzz.winnerId === playerId
  const someoneElseWon = buzz.winnerId !== null && buzz.winnerId !== playerId
  const canBuzz = armed && buzz.winnerId === null && !hasAttempted && !lockedOut && !pending

  async function handleClick() {
    if (!canBuzz) return
    setPending(true)
    await recordBuzzAttempt(roomCode, playerId, buzz.token, Date.now() + clockOffsetMs)
    setPending(false)
  }

  let label = 'BUZZ'
  let hint = 'Wait for it…'
  if (isWinner) {
    label = "YOU'RE IN!"
    hint = ''
  } else if (someoneElseWon) {
    label = 'Locked out'
    hint = ''
  } else if (lockedOut) {
    label = 'Already tried'
    hint = ''
  } else if (hasAttempted) {
    label = 'Buzzed!'
    hint = 'Waiting to see who was first…'
  } else if (canBuzz) {
    label = 'BUZZ!'
    hint = 'Buzzers are open!'
  } else if (buzz.isOpen) {
    hint = 'Get ready…'
  }

  const colorClasses = isWinner
    ? 'animate-pulse-ring bg-gradient-to-b from-crt-amber-light to-crt-amber text-crt-bg shadow-crt-amber/30'
    : canBuzz
      ? 'cursor-pointer bg-gradient-to-b from-green-400 to-green-600 text-white shadow-black/40 hover:brightness-110 hover:shadow-2xl active:scale-95 active:shadow-inner focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300/50 animate-pulse-ring'
      : someoneElseWon || lockedOut || hasAttempted
        ? 'bg-crt-cream/5 text-crt-cream/30 shadow-inner shadow-black/30'
        : 'bg-gradient-to-b from-red-800 to-red-950 text-crt-cream/60 shadow-black/40'

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        disabled={!canBuzz}
        className={`h-40 w-40 rounded-full font-display text-xl font-bold shadow-xl transition-all duration-150 sm:h-56 sm:w-56 sm:text-2xl disabled:cursor-not-allowed ${colorClasses}`}
      >
        {label}
      </button>
      {hint && <p className="text-sm text-crt-cream/40">{hint}</p>}
    </div>
  )
}
