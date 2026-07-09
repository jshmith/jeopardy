import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthUid } from '../../lib/useAuthUid'
import { formatUpdated } from '../../lib/formatUpdated'
import { card, cardHover } from '../../lib/uiClasses'
import { Spinner } from '../../components/Spinner'
import { listBoards } from '../board/boardApi'
import type { Board } from '../../types/game'

/** Pick a board to host a game with. Board management lives in My Boards. */
export function HostGamePicker() {
  const uid = useAuthUid()
  const navigate = useNavigate()
  const [boards, setBoards] = useState<Board[] | null>(null)

  useEffect(() => {
    if (!uid) return
    listBoards(uid).then(setBoards)
  }, [uid])

  return (
    <div className="min-h-screen bg-jeopardy-navy p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center justify-between">
          <Link to="/" className="text-sm text-white/60 transition hover:text-jeopardy-gold">
            &larr; Home
          </Link>
          <h1 className="font-jeopardy text-2xl text-jeopardy-gold">Host a Game</h1>
          <span className="w-16" />
        </div>
        <p className="mb-8 text-center text-sm text-white/50">Pick a board to host with.</p>

        {!boards ? (
          <div className="flex items-center gap-3 text-white/60">
            <Spinner /> Loading…
          </div>
        ) : boards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-white/50">
            No boards yet — head to{' '}
            <Link to="/host/boards" className="text-jeopardy-gold underline-offset-2 hover:underline">
              My Boards
            </Link>{' '}
            to create one.
          </p>
        ) : (
          <ul className="space-y-3">
            {boards.map((b) => (
              <li key={b.id} className="animate-fade-in-up">
                <button
                  onClick={() => navigate(`/host/new-game/${b.id}`)}
                  className={`flex w-full items-center justify-between p-4 text-left ${card} ${cardHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jeopardy-gold/70`}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-white">{b.name}</span>
                    {formatUpdated(b) && (
                      <span className="mt-0.5 text-xs text-white/35">Updated {formatUpdated(b)}</span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-lg bg-gradient-to-b from-jeopardy-gold-light to-jeopardy-gold px-4 py-1.5 text-sm font-semibold text-jeopardy-blue-dark shadow">
                    Host game
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
