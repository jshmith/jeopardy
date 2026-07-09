import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuthUid } from '../../lib/useAuthUid'
import { setLastRoom } from '../../lib/localRoom'
import { useGameDoc, usePlayers } from '../game/useGame'
import { BoardGrid } from '../../components/BoardGrid'
import { Scoreboard } from '../../components/Scoreboard'
import { ClueDisplay } from '../../components/ClueDisplay'
import { Spinner } from '../../components/Spinner'
import { BuzzerButton } from '../buzzer/BuzzerButton'
import { DailyDoubleWagerPlayer } from './DailyDoubleWagerPlayer'
import { FinalJeopardyPlayer } from './FinalJeopardyPlayer'
import { PitchGamePlayer } from '../pitch/PitchGamePlayer'

function CenteredLoader({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-3 bg-jeopardy-navy text-white/70">
      <Spinner /> {text}
    </div>
  )
}

export function PlayerView() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const uid = useAuthUid()
  const game = useGameDoc(roomCode)
  const players = usePlayers(roomCode)

  useEffect(() => {
    if (roomCode) setLastRoom({ roomCode, role: 'player' })
  }, [roomCode])

  if (!roomCode || game === undefined || !uid) return <CenteredLoader text="Loading…" />
  if (game === null)
    return <div className="flex min-h-screen items-center justify-center bg-jeopardy-navy text-white/70">Game not found.</div>

  const me = players.find((p) => p.uid === uid)
  if (players.length > 0 && !me) {
    return <Navigate to={`/join?code=${roomCode}`} replace />
  }
  if (!me) return <CenteredLoader text="Loading…" />

  if (game.round === 'final') {
    return (
      <div className="min-h-screen bg-jeopardy-navy p-4 text-white md:p-6">
        <FinalJeopardyPlayer roomCode={roomCode} game={game} players={players} uid={uid} />
      </div>
    )
  }

  const boardMeta = game.boardMeta[game.round]
  const clue = game.currentClue
  const isDailyDoubleController =
    game.phase === 'daily_double_wager' &&
    game.dailyDouble?.controllingPlayerId === uid &&
    !game.dailyDouble.wagerSubmitted

  return (
    <div className="min-h-screen bg-jeopardy-navy p-4 text-white md:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <Scoreboard
            players={players}
            buzzWinnerId={game.buzz.winnerId}
            lockedOutPlayerIds={game.buzz.lockedOutPlayerIds}
            controlPlayerId={game.controlPlayerId}
            highlightUid={uid}
          />
        </div>

        {game.phase === 'pitch_game' && game.pitchGame ? (
          <PitchGamePlayer
            roomCode={roomCode}
            uid={uid}
            players={players}
            targetMidi={game.pitchGame.targetMidi}
          />
        ) : !clue ? (
          <>
            <p className="mb-3 text-center text-sm capitalize tracking-wide text-white/50">{game.round} Jeopardy</p>
            <BoardGrid categories={boardMeta} />
          </>
        ) : isDailyDoubleController ? (
          <DailyDoubleWagerPlayer roomCode={roomCode} round={game.round} myScore={me.score} />
        ) : game.phase === 'daily_double_wager' ? (
          <p className="animate-fade-in-up text-center text-white/70">Daily Double! Waiting on the wager…</p>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <ClueDisplay clue={clue} video={{ role: 'viewer', sync: game.videoSync ?? null }} />
            {(game.phase === 'clue_revealed' || game.phase === 'buzzer_open') &&
              (clue.mode === 'host_control' ? (
                <p className="animate-fade-in-up text-center text-white/60">
                  No buzzers on this one — the host picks who gets the money.
                </p>
              ) : (
                <BuzzerButton roomCode={roomCode} playerId={uid} buzz={game.buzz} />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
