import type { Player } from '../types/game'

type Props = {
  players: Player[]
  buzzWinnerId?: string | null
  lockedOutPlayerIds?: string[]
  controlPlayerId?: string | null
  highlightUid?: string
}

export function Scoreboard({ players, buzzWinnerId, lockedOutPlayerIds, controlPlayerId, highlightUid }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {players.map((p) => {
        const isWinner = buzzWinnerId === p.uid
        const isLockedOut = lockedOutPlayerIds?.includes(p.uid)
        const isInControl = controlPlayerId === p.uid
        return (
          <div
            key={p.uid}
            className={`flex min-w-36 items-center gap-3 rounded-xl border px-3 py-2.5 shadow-md shadow-black/10 transition-all duration-300 ${
              isWinner
                ? 'animate-pulse-ring border-crt-amber bg-crt-amber/15'
                : isLockedOut
                  ? 'border-red-500/30 bg-red-500/10'
                  : 'border-crt-cream/10 bg-crt-cream/5'
            } ${highlightUid === p.uid ? 'ring-2 ring-crt-amber/60' : ''}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-crt-teal-light to-crt-teal text-sm font-bold text-crt-cream shadow-inner shadow-black/20">
              {p.displayName.trim().charAt(0).toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 truncate text-sm font-semibold text-crt-cream">
                {p.displayName}
                {isInControl && <span className="text-crt-amber-light">&#9733;</span>}
              </div>
              <div
                className={`font-jeopardy text-lg leading-tight transition-colors duration-300 ${p.score < 0 ? 'text-red-400' : 'text-crt-amber-light'}`}
              >
                ${p.score}
              </div>
              {!p.connected && <div className="text-[10px] text-crt-cream/40">disconnected</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
