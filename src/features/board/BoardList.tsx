import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthUid } from '../../lib/useAuthUid'
import { btnPrimary, btnQuiet, card, cardHover } from '../../lib/uiClasses'
import { Spinner } from '../../components/Spinner'
import { deleteBoard, listBoards } from './boardApi'
import type { Board } from '../../types/game'

export function BoardList() {
  const uid = useAuthUid()
  const navigate = useNavigate()
  const [boards, setBoards] = useState<Board[] | null>(null)

  useEffect(() => {
    if (!uid) return
    listBoards(uid).then(setBoards)
  }, [uid])

  async function handleDelete(boardId: string) {
    if (!confirm('Delete this board? This cannot be undone.')) return
    await deleteBoard(boardId)
    setBoards((prev) => prev?.filter((b) => b.id !== boardId) ?? null)
  }

  return (
    <div className="min-h-screen bg-jeopardy-navy p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/host" className="text-sm text-white/60 transition hover:text-jeopardy-gold">
            &larr; Host home
          </Link>
          <h1 className="font-jeopardy text-2xl text-jeopardy-gold">My Boards</h1>
          <button onClick={() => navigate('/host/boards/new')} className={btnPrimary}>
            + New board
          </button>
        </div>

        {!boards ? (
          <div className="flex items-center gap-3 text-white/60">
            <Spinner /> Loading…
          </div>
        ) : boards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-white/50">
            No boards yet — create one to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {boards.map((b) => (
              <li
                key={b.id}
                className={`animate-fade-in-up flex items-center justify-between p-4 ${card} ${cardHover}`}
              >
                <Link to={`/host/boards/${b.id}`} className="font-semibold text-white transition hover:text-jeopardy-gold">
                  {b.name}
                </Link>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/host/new-game/${b.id}`)}
                    className="rounded-lg bg-jeopardy-gold px-3 py-1.5 text-sm font-semibold text-jeopardy-blue-dark shadow transition hover:brightness-105 active:scale-[0.98]"
                  >
                    Host game
                  </button>
                  <button onClick={() => handleDelete(b.id)} className={btnQuiet}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
