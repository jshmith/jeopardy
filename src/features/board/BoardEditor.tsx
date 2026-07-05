import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuthUid } from '../../lib/useAuthUid'
import { btnPrimary, inputBase } from '../../lib/uiClasses'
import { Spinner } from '../../components/Spinner'
import { blankBoard, createBoard, getBoard, saveBoard } from './boardApi'
import { ClueEditor } from './ClueEditor'
import type { Board, BoardCategory, BoardClue, FinalJeopardyClue } from '../../types/game'

type EditableBoard = Omit<Board, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>

export function BoardEditor() {
  const { boardId } = useParams<{ boardId: string }>()
  const uid = useAuthUid()
  const navigate = useNavigate()

  const [board, setBoard] = useState<EditableBoard | null>(null)
  const [round, setRound] = useState<'single' | 'double' | 'final'>('single')
  const [editing, setEditing] = useState<{ round: 'single' | 'double'; catIndex: number; clueIndex: number } | null>(
    null,
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!uid || !boardId) return

    if (boardId === 'new') {
      createBoard(uid).then((id) => navigate(`/host/boards/${id}`, { replace: true }))
      return
    }

    getBoard(boardId).then((b) => {
      if (b) {
        const { id: _id, ownerUid: _o, createdAt: _c, updatedAt: _u, ...rest } = b
        setBoard(rest)
      } else {
        setBoard(blankBoard())
      }
    })
  }, [uid, boardId, navigate])

  if (!board || !boardId || boardId === 'new') {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/70">
        <Spinner /> <span className="ml-3">Loading board…</span>
      </div>
    )
  }

  const categories = round === 'double' ? board.doubleCategories : board.categories

  function updateCategoryTitle(catIndex: number, title: string) {
    setBoard((prev) => {
      if (!prev) return prev
      const key = round === 'double' ? 'doubleCategories' : 'categories'
      const next: BoardCategory[] = prev[key].map((c, i) => (i === catIndex ? { ...c, title } : c))
      return { ...prev, [key]: next }
    })
  }

  function updateClue(catIndex: number, clueIndex: number, clue: BoardClue) {
    setBoard((prev) => {
      if (!prev) return prev
      const key = round === 'double' ? 'doubleCategories' : 'categories'
      const next: BoardCategory[] = prev[key].map((c, i) =>
        i === catIndex ? { ...c, clues: c.clues.map((cl, j) => (j === clueIndex ? clue : cl)) } : c,
      )
      return { ...prev, [key]: next }
    })
  }

  function updateFinal(patch: Partial<FinalJeopardyClue>) {
    setBoard((prev) => (prev ? { ...prev, finalJeopardy: { ...prev.finalJeopardy, ...patch } } : prev))
  }

  async function handleSave() {
    if (!uid || !board || !boardId) return
    setSaving(true)
    try {
      await saveBoard(boardId, uid, board)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-jeopardy-navy p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/host/boards"
            className="text-sm text-white/60 transition hover:text-jeopardy-gold"
          >
            &larr; Back to boards
          </Link>
          <button onClick={handleSave} disabled={saving} className={`${btnPrimary} flex items-center gap-2`}>
            {saving && <Spinner className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save board'}
          </button>
        </div>

        <input
          className={`mb-5 w-full ${inputBase} text-xl font-jeopardy text-jeopardy-gold`}
          value={board.name}
          onChange={(e) => setBoard((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
        />

        <div className="mb-5 inline-flex gap-1 rounded-xl bg-white/5 p-1">
          {(['single', 'double', 'final'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRound(r)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition duration-150 ${
                round === r
                  ? 'bg-jeopardy-gold text-jeopardy-blue-dark shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {r === 'final' ? 'Final Jeopardy' : `${r} Jeopardy`}
            </button>
          ))}
        </div>

        {round !== 'final' ? (
          <div className="grid grid-cols-6 gap-2">
            {categories.map((cat, catIndex) => (
              <div key={catIndex} className="flex flex-col gap-2">
                <input
                  className={`${inputBase} rounded-xl bg-jeopardy-blue/60 p-2 text-center text-xs font-bold uppercase tracking-wide`}
                  value={cat.title}
                  onChange={(e) => updateCategoryTitle(catIndex, e.target.value)}
                  placeholder={`Category ${catIndex + 1}`}
                />
                {cat.clues.map((clue, clueIndex) => (
                  <button
                    key={clueIndex}
                    onClick={() => setEditing({ round, catIndex, clueIndex })}
                    className="relative rounded-xl bg-gradient-to-b from-jeopardy-blue to-jeopardy-blue-dark p-3 text-center font-jeopardy text-jeopardy-gold shadow-md shadow-black/20 transition duration-150 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jeopardy-gold/70"
                  >
                    ${clue.value}
                    {clue.isDailyDouble && (
                      <span className="absolute right-1.5 top-1.5 rounded bg-jeopardy-gold/90 px-1 text-[9px] font-bold text-jeopardy-blue-dark">
                        DD
                      </span>
                    )}
                    {!clue.text && (
                      <span className="absolute left-1.5 top-1.5 text-[9px] text-white/40">empty</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-lg space-y-4">
            <label className="block text-sm text-white/70">
              Category
              <input
                className={`mt-1 w-full ${inputBase}`}
                value={board.finalJeopardy.category}
                onChange={(e) => updateFinal({ category: e.target.value })}
              />
            </label>
            <label className="block text-sm text-white/70">
              Clue text
              <textarea
                className={`mt-1 w-full ${inputBase}`}
                rows={3}
                value={board.finalJeopardy.text}
                onChange={(e) => updateFinal({ text: e.target.value })}
              />
            </label>
            <label className="block text-sm text-white/70">
              Image URL (optional)
              <input
                className={`mt-1 w-full ${inputBase}`}
                value={board.finalJeopardy.imageUrl ?? ''}
                onChange={(e) => updateFinal({ imageUrl: e.target.value.trim() ? e.target.value : null })}
              />
            </label>
            <label className="block text-sm text-white/70">
              Correct answer
              <input
                className={`mt-1 w-full ${inputBase}`}
                value={board.finalJeopardy.answer}
                onChange={(e) => updateFinal({ answer: e.target.value })}
              />
            </label>
          </div>
        )}
      </div>

      {editing && (
        <ClueEditor
          clue={(editing.round === 'double' ? board.doubleCategories : board.categories)[editing.catIndex].clues[
            editing.clueIndex
          ]}
          onSave={(clue) => updateClue(editing.catIndex, editing.clueIndex, clue)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
