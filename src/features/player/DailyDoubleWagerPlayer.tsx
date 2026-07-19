import { useState } from 'react'
import { MIN_WAGER } from '../../types/game'
import { btnPrimary, card, inputBase } from '../../lib/uiClasses'
import { submitDailyDoubleWager } from './playerActions'

type Props = {
  roomCode: string
  round: 'single' | 'double'
  myScore: number
}

export function DailyDoubleWagerPlayer({ roomCode, round, myScore }: Props) {
  const maxWager = Math.max(myScore, round === 'double' ? 2000 : 1000)
  const [wager, setWager] = useState(MIN_WAGER)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    setSubmitted(true)
    await submitDailyDoubleWager(roomCode, wager)
  }

  if (submitted) {
    return <p className="animate-fade-in-up text-center text-crt-cream/70">Wager submitted — waiting for host…</p>
  }

  return (
    <div className={`animate-clue-in mx-auto flex max-w-sm flex-col items-center gap-4 p-8 text-center ${card}`}>
      <p className="font-display text-2xl font-bold text-crt-amber-light">DAILY DOUBLE!</p>
      <p className="text-crt-cream/80">You found it — enter your wager.</p>
      <input
        type="number"
        min={MIN_WAGER}
        max={maxWager}
        value={wager}
        onChange={(e) => setWager(Number(e.target.value))}
        className={`w-32 ${inputBase} text-center font-jeopardy text-xl`}
      />
      <p className="text-xs text-crt-cream/50">
        Between ${MIN_WAGER} and ${maxWager}
      </p>
      <button onClick={handleSubmit} disabled={wager < MIN_WAGER || wager > maxWager} className={btnPrimary}>
        Lock in wager
      </button>
    </div>
  )
}
