import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useGameDoc, usePlayers, usePrivateBoard } from '../game/useGame'
import { BoardGrid } from '../../components/BoardGrid'
import { Scoreboard } from '../../components/Scoreboard'
import { ClueDisplay } from '../../components/ClueDisplay'
import { Spinner } from '../../components/Spinner'
import { btnCorrect, btnIncorrect, btnPrimary, btnQuiet, inputBase } from '../../lib/uiClasses'
import {
  awardHostControlClue,
  backToBoard,
  forceRevealAnswer,
  judgeBuzzIn,
  judgeDailyDouble,
  openBuzzer,
  revealClue,
  revealDailyDoubleClue,
  setDailyDoubleController,
  setRound,
  startFinalJeopardy,
} from '../game/gameStateMachine'
import { FinalJeopardyHost } from './FinalJeopardyHost'
import type { BoardClue, PrivateBoard, CurrentClue } from '../../types/game'

function clueFromBoard(board: PrivateBoard, clue: CurrentClue): BoardClue {
  const category = (clue.round === 'double' ? board.doubleCategories : board.categories)[clue.categoryIndex]
  return category.clues[clue.clueIndex]
}

/** Host-only answer peek: blurred until hovered, click toggles for touch screens. */
function PeekAnswer({ answer }: { answer: string }) {
  const [pinned, setPinned] = useState(false)
  return (
    <button
      onClick={() => setPinned((p) => !p)}
      title="Hover or tap to peek at the answer"
      className="group w-full max-w-xl rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center transition hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jeopardy-gold/50"
    >
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">
        Answer — hover to peek
      </span>
      <span
        className={`block text-lg text-jeopardy-gold transition duration-150 ${
          pinned ? '' : 'select-none blur-md group-hover:blur-none'
        }`}
      >
        {answer || '(no answer set)'}
      </span>
    </button>
  )
}

export function HostControl() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const game = useGameDoc(roomCode)
  const players = usePlayers(roomCode)
  const board = usePrivateBoard(roomCode)

  if (game === undefined || board === undefined)
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-jeopardy-navy text-white/70">
        <Spinner /> Loading…
      </div>
    )
  if (game === null)
    return <div className="flex min-h-screen items-center justify-center bg-jeopardy-navy text-white/70">Game not found.</div>
  if (!roomCode || !board) return null

  if (game.round === 'final') {
    return <FinalJeopardyHost roomCode={roomCode} game={game} players={players} board={board} />
  }

  const boardMeta = game.boardMeta[game.round]
  const allAnswered = boardMeta.every((cat) => cat.clues.every((c) => c.state === 'answered'))
  const clue = game.currentClue
  const answerText = clue ? clueFromBoard(board, clue).answer : ''

  return (
    <div className="min-h-screen bg-jeopardy-navy p-4 text-white md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 shadow-inner shadow-black/20">
            <span className="text-xs uppercase tracking-wide text-white/50">Room code</span>
            <div className="font-jeopardy text-3xl tracking-widest text-jeopardy-gold">{roomCode}</div>
          </div>
          <Scoreboard
            players={players}
            buzzWinnerId={game.buzz.winnerId}
            lockedOutPlayerIds={game.buzz.lockedOutPlayerIds}
            controlPlayerId={game.controlPlayerId}
          />
        </div>

        {!clue ? (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm capitalize text-white/80">
                {game.round} Jeopardy
              </span>
              {game.round === 'single' && (
                <button onClick={() => roomCode && setRound(roomCode, 'double')} className={btnPrimary}>
                  Start Double Jeopardy
                </button>
              )}
              {game.round === 'double' && (
                <button onClick={() => roomCode && startFinalJeopardy(roomCode)} className={btnPrimary}>
                  Start Final Jeopardy
                </button>
              )}
              {allAnswered && (
                <span className="animate-fade-in-up rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/50">
                  Board complete — ready for next round
                </span>
              )}
            </div>
            <BoardGrid
              categories={boardMeta}
              onSelectClue={(catIndex, clueIndex) =>
                roomCode &&
                revealClue(roomCode, board, boardMeta, game.round as 'single' | 'double', catIndex, clueIndex)
              }
            />
          </>
        ) : (
          <HostClueView
            roomCode={roomCode}
            board={board}
            clue={clue}
            answerText={answerText}
            players={players}
            controlPlayerId={game.controlPlayerId}
            buzzWinnerId={game.buzz.winnerId}
            phase={game.phase}
            dailyDoubleControllingPlayerId={game.dailyDouble?.controllingPlayerId ?? null}
            dailyDoubleWager={game.dailyDouble?.wager ?? null}
            dailyDoubleWagerSubmitted={game.dailyDouble?.wagerSubmitted ?? false}
          />
        )}
      </div>
    </div>
  )
}

type HostClueViewProps = {
  roomCode: string
  board: PrivateBoard
  clue: CurrentClue
  answerText: string
  players: ReturnType<typeof usePlayers>
  controlPlayerId: string | null
  buzzWinnerId: string | null
  phase: string
  dailyDoubleControllingPlayerId: string | null
  dailyDoubleWager: number | null
  dailyDoubleWagerSubmitted: boolean
}

function HostClueView({
  roomCode,
  clue,
  answerText,
  players,
  buzzWinnerId,
  phase,
  dailyDoubleControllingPlayerId,
  dailyDoubleWager,
  dailyDoubleWagerSubmitted,
}: HostClueViewProps) {
  const [selectedController, setSelectedController] = useState('')

  if (phase === 'daily_double_wager') {
    const controller = players.find((p) => p.uid === dailyDoubleControllingPlayerId)
    return (
      <div className="animate-clue-in rounded-2xl border border-white/10 bg-gradient-to-b from-jeopardy-blue to-jeopardy-blue-dark p-8 text-center shadow-2xl shadow-black/40">
        <p className="mb-4 font-jeopardy text-3xl text-jeopardy-gold">DAILY DOUBLE</p>
        {!dailyDoubleControllingPlayerId ? (
          <div className="mx-auto flex max-w-sm flex-col gap-3">
            <p className="text-white/80">Who found the Daily Double?</p>
            <select
              className={inputBase}
              value={selectedController}
              onChange={(e) => setSelectedController(e.target.value)}
            >
              <option value="">Select player…</option>
              {players.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.displayName}
                </option>
              ))}
            </select>
            <button
              disabled={!selectedController}
              onClick={() => setDailyDoubleController(roomCode, selectedController)}
              className={btnPrimary}
            >
              Confirm
            </button>
          </div>
        ) : !dailyDoubleWagerSubmitted ? (
          <p className="text-white/70">Waiting for {controller?.displayName ?? '…'} to enter their wager…</p>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/80">
              {controller?.displayName} wagers <span className="text-jeopardy-gold">${dailyDoubleWager}</span>
            </p>
            <button onClick={() => revealDailyDoubleClue(roomCode)} className={btnPrimary}>
              Reveal Clue
            </button>
          </div>
        )}
      </div>
    )
  }

  const controllerName = players.find((p) => p.uid === dailyDoubleControllingPlayerId)?.displayName
  const winnerName = players.find((p) => p.uid === buzzWinnerId)?.displayName

  return (
    <div className="flex flex-col items-center gap-5">
      <ClueDisplay clue={clue} video={{ role: 'host', roomCode }} />

      {phase !== 'answer_revealed' && <PeekAnswer answer={answerText} />}

      {phase === 'answer_revealed' ? (
        <button onClick={() => backToBoard(roomCode)} className={btnPrimary}>
          Back to board
        </button>
      ) : clue.isDailyDouble ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-white/80">
            Judging <span className="text-jeopardy-gold">{controllerName}</span> for ${dailyDoubleWager}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() =>
                dailyDoubleControllingPlayerId &&
                judgeDailyDouble(roomCode, dailyDoubleControllingPlayerId, true, dailyDoubleWager ?? 0, answerText)
              }
              className={btnCorrect}
            >
              Correct
            </button>
            <button
              onClick={() =>
                dailyDoubleControllingPlayerId &&
                judgeDailyDouble(roomCode, dailyDoubleControllingPlayerId, false, dailyDoubleWager ?? 0, answerText)
              }
              className={btnIncorrect}
            >
              Incorrect
            </button>
          </div>
        </div>
      ) : phase === 'clue_revealed' && clue.mode === 'host_control' ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-white/80">
            Host&apos;s choice — award <span className="text-jeopardy-gold">${clue.value}</span> to:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((p) => (
              <button
                key={p.uid}
                onClick={() => awardHostControlClue(roomCode, p.uid, clue.value, answerText)}
                className={btnCorrect}
              >
                {p.displayName}
              </button>
            ))}
          </div>
          {players.length === 0 && <p className="text-sm text-white/50">No players have joined yet.</p>}
          <button onClick={() => forceRevealAnswer(roomCode, answerText)} className={btnQuiet}>
            No one — reveal answer &amp; move on
          </button>
        </div>
      ) : phase === 'clue_revealed' ? (
        <button onClick={() => openBuzzer(roomCode)} className={btnPrimary}>
          Open Buzzers
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {buzzWinnerId ? (
            <>
              <p className="text-white/80">
                <span className="text-jeopardy-gold">{winnerName}</span> buzzed in for ${clue.value}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => judgeBuzzIn(roomCode, buzzWinnerId, true, clue.value, answerText)}
                  className={btnCorrect}
                >
                  Correct
                </button>
                <button
                  onClick={() => judgeBuzzIn(roomCode, buzzWinnerId, false, clue.value, answerText)}
                  className={btnIncorrect}
                >
                  Incorrect
                </button>
              </div>
            </>
          ) : (
            <p className="animate-fade-in-up text-white/60">Buzzers open — waiting for a buzz…</p>
          )}
          <button onClick={() => forceRevealAnswer(roomCode, answerText)} className={btnQuiet}>
            Reveal answer &amp; move on
          </button>
        </div>
      )}
    </div>
  )
}
