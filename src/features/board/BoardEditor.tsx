import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuthUid } from '../../lib/useAuthUid'
import { parseMediaUrl } from '../../lib/mediaSource'
import { boardCategoryInput, boardClueTile, btnPrimary, inputBase } from '../../lib/uiClasses'
import { Spinner } from '../../components/Spinner'
import { blankBoard, createBoard, getBoard, saveBoard } from './boardApi'
import { ClueEditor } from './ClueEditor'
import type { Board, BoardCategory, BoardClue, FinalJeopardyClue } from '../../types/game'

type EditableBoard = Omit<Board, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>

const AUTOSAVE_DELAY_MS = 1000

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export function BoardEditor() {
  const { boardId } = useParams<{ boardId: string }>()
  const uid = useAuthUid()
  const navigate = useNavigate()

  const [board, setBoard] = useState<EditableBoard | null>(null)
  const [round, setRound] = useState<'single' | 'double' | 'final'>('single')
  const [editing, setEditing] = useState<{ round: 'single' | 'double'; catIndex: number; clueIndex: number } | null>(
    null,
  )
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [finalImageError, setFinalImageError] = useState(false)
  const skipNextAutosave = useRef(true)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!uid || !boardId) return

    if (boardId === 'new') {
      createBoard(uid).then((id) => navigate(`/host/boards/${id}`, { replace: true }))
      return
    }

    getBoard(boardId).then((b) => {
      skipNextAutosave.current = true
      setStatus('idle')
      if (b) {
        const { id: _id, ownerUid: _o, createdAt: _c, updatedAt: _u, ...rest } = b
        setBoard(rest)
      } else {
        setBoard(blankBoard())
      }
    })
  }, [uid, boardId, navigate])

  const performSave = useCallback(
    async (current: EditableBoard) => {
      if (!uid || !boardId) return
      setStatus('saving')
      try {
        await saveBoard(boardId, uid, current)
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    },
    [uid, boardId],
  )

  useEffect(() => {
    if (!board || !uid || !boardId || boardId === 'new') return
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false
      return
    }

    setStatus('pending')
    saveTimeoutRef.current = setTimeout(() => {
      void performSave(board)
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [board, uid, boardId, performSave])

  async function handleManualSave() {
    if (!board) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    await performSave(board)
  }

  if (!board || !boardId || boardId === 'new') {
    return (
      <div className="flex min-h-screen items-center justify-center text-crt-cream/70">
        <Spinner /> <span className="ml-3">Loading board…</span>
      </div>
    )
  }

  const categories = round === 'double' ? board.doubleCategories : board.categories

  const finalUrl = (board.finalJeopardy.imageUrl ?? '').trim()
  const finalMediaIsVideo = finalUrl !== '' && parseMediaUrl(finalUrl).kind !== 'image'
  const finalImagePreviewUrl = finalUrl !== '' && !finalMediaIsVideo ? finalUrl : ''

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

  return (
    <div className="min-h-screen crt-page p-6 text-crt-cream">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/host/boards"
            className="text-sm text-crt-cream/60 transition hover:text-crt-amber-light"
          >
            &larr; Back to boards
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-crt-cream/40">
              {status === 'pending' && 'Unsaved changes'}
              {status === 'saving' && 'Saving…'}
              {status === 'saved' && 'All changes saved'}
              {status === 'error' && 'Failed to save'}
            </span>
            <button
              onClick={handleManualSave}
              disabled={status === 'saving'}
              className={`${btnPrimary} flex items-center gap-2`}
            >
              {status === 'saving' && <Spinner className="h-4 w-4" />}
              {status === 'error' ? 'Retry save' : status === 'saving' ? 'Saving…' : 'Save now'}
            </button>
          </div>
        </div>

        <input
          className={`mb-5 w-full ${inputBase} font-display text-2xl font-medium text-crt-amber-light`}
          value={board.name}
          onChange={(e) => setBoard((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
        />

        <div className="mb-5 inline-flex gap-1 rounded-xl bg-crt-cream/5 p-1">
          {(['single', 'double', 'final'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRound(r)}
              className={`cursor-pointer rounded-lg px-5 py-2.5 text-base font-semibold capitalize transition duration-150 ${
                round === r
                  ? 'bg-crt-amber text-crt-bg shadow-md'
                  : 'text-crt-cream/70 hover:bg-crt-cream/10 hover:text-crt-cream'
              }`}
            >
              {r === 'final' ? 'Final Jeopardy' : `${r} Jeopardy`}
            </button>
          ))}
        </div>

        {round !== 'final' ? (
          <div className="grid grid-cols-6 gap-2 md:gap-3">
            {categories.map((cat, catIndex) => (
              <div key={catIndex} className="flex flex-col gap-2 md:gap-3">
                <input
                  className={boardCategoryInput}
                  value={cat.title}
                  onChange={(e) => updateCategoryTitle(catIndex, e.target.value)}
                  placeholder={`Category ${catIndex + 1}`}
                />
                {cat.clues.map((clue, clueIndex) => (
                  <button
                    key={clueIndex}
                    onClick={() => setEditing({ round, catIndex, clueIndex })}
                    className={`${boardClueTile} relative cursor-pointer bg-gradient-to-b from-crt-bg-light to-crt-bg text-crt-amber-light shadow-md shadow-black/20 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crt-amber/70`}
                  >
                    ${clue.value}
                    {clue.isDailyDouble && (
                      <span className="absolute right-1.5 top-1.5 rounded-md bg-crt-amber px-2 py-1 font-display text-xs font-bold text-crt-bg shadow">
                        DD
                      </span>
                    )}
                    {clue.mode === 'host_control' && !clue.isDailyDouble && (
                      <span
                        title="Host's choice — no buzzers"
                        className="absolute right-1.5 top-1.5 rounded-md bg-purple-400 px-2 py-1 font-display text-xs font-bold text-crt-bg shadow"
                      >
                        HC
                      </span>
                    )}
                    {!clue.text && (
                      <span className="absolute left-1.5 top-1.5 font-display text-[11px] text-crt-cream/40">
                        empty
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-3xl space-y-6">
            <label className="block text-base text-crt-cream/70">
              Category
              <input
                className={`mt-1.5 w-full ${inputBase} text-lg`}
                value={board.finalJeopardy.category}
                onChange={(e) => updateFinal({ category: e.target.value })}
              />
            </label>
            <label className="block text-base text-crt-cream/70">
              Clue text
              <textarea
                className={`mt-1.5 w-full ${inputBase} text-lg`}
                rows={4}
                value={board.finalJeopardy.text}
                onChange={(e) => updateFinal({ text: e.target.value })}
              />
            </label>
            <label className="block text-base text-crt-cream/70">
              Image or video URL (optional)
              <input
                className={`mt-1.5 w-full ${inputBase} text-lg`}
                value={board.finalJeopardy.imageUrl ?? ''}
                onChange={(e) => {
                  setFinalImageError(false)
                  updateFinal({ imageUrl: e.target.value.trim() ? e.target.value : null })
                }}
                placeholder="https://... (image, YouTube link, or .mp4)"
              />
              {finalImagePreviewUrl && (
                <div className="mt-3 overflow-hidden rounded-lg border border-crt-cream/10 bg-black/20">
                  {finalImageError ? (
                    <p className="p-3 text-sm text-crt-cream/40">Couldn't load image from this URL</p>
                  ) : (
                    <img
                      src={finalImagePreviewUrl}
                      alt="Final Jeopardy preview"
                      className="max-h-64 w-full object-contain"
                      onError={() => setFinalImageError(true)}
                      onLoad={() => setFinalImageError(false)}
                    />
                  )}
                </div>
              )}
            </label>
            {board.finalJeopardy.imageUrl &&
              parseMediaUrl(board.finalJeopardy.imageUrl).kind !== 'image' && (
                <label className="flex items-center justify-between text-base text-crt-cream/70">
                  <span>
                    Audio only for players
                    <span className="block text-sm text-crt-cream/40">
                      Players get a black screen with sound — you still see the video
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={board.finalJeopardy.hideVideoFromPlayers ?? false}
                    onClick={() =>
                      updateFinal({ hideVideoFromPlayers: !(board.finalJeopardy.hideVideoFromPlayers ?? false) })
                    }
                    className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crt-amber/60 ${
                      board.finalJeopardy.hideVideoFromPlayers ? 'bg-crt-amber' : 'bg-crt-cream/15'
                    }`}
                  >
                    <span
                      className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        board.finalJeopardy.hideVideoFromPlayers ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </label>
              )}
            <label className="block text-base text-crt-cream/70">
              Correct answer
              <input
                className={`mt-1.5 w-full ${inputBase} text-lg`}
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
