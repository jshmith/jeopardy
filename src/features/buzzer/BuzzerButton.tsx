import { useState } from 'react'
import { tryBuzz } from './useBuzz'
import type { BuzzState } from '../../types/game'

type Props = {
  roomCode: string
  playerId: string
  buzz: BuzzState
}

export function BuzzerButton({ roomCode, playerId, buzz }: Props) {
  const [pending, setPending] = useState(false)

  const lockedOut = buzz.lockedOutPlayerIds.includes(playerId)
  const isWinner = buzz.winnerId === playerId
  const someoneElseWon = buzz.winnerId !== null && buzz.winnerId !== playerId
  const canBuzz = buzz.isOpen && buzz.winnerId === null && !lockedOut && !pending

  async function handleClick() {
    if (!canBuzz) return
    setPending(true)
    await tryBuzz(roomCode, playerId, buzz.token)
    setPending(false)
  }

  let label = 'BUZZ'
  if (isWinner) label = "YOU'RE IN!"
  else if (someoneElseWon) label = 'Locked out'
  else if (lockedOut) label = 'Already tried'
  else if (!buzz.isOpen) label = 'Wait…'

  return (
    <button
      onClick={handleClick}
      disabled={!canBuzz}
      className={`h-40 w-40 rounded-full font-jeopardy text-2xl font-bold shadow-xl transition-all duration-150 sm:h-56 sm:w-56 sm:text-3xl ${
        isWinner
          ? 'animate-pulse-ring bg-gradient-to-b from-jeopardy-gold-light to-jeopardy-gold text-jeopardy-blue-dark shadow-jeopardy-gold/30'
          : canBuzz
            ? 'bg-gradient-to-b from-red-500 to-red-700 text-white shadow-black/40 hover:brightness-110 hover:shadow-2xl active:scale-95 active:shadow-inner focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300/50 animate-pulse-ring'
            : 'bg-white/5 text-white/30 shadow-inner shadow-black/30'
      }`}
    >
      {label}
    </button>
  )
}
