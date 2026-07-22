import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/useAuth'
import { formatUpdated } from '../../lib/formatUpdated'
import { btnPrimary, btnQuiet, btnSecondary, card, cardHover, inputBase } from '../../lib/uiClasses'
import { Spinner } from '../../components/Spinner'
import { createBoardFromData, deleteBoard, listBoards, renameBoard } from './boardApi'
import { downloadBoardAsFile, parseImportedBoard } from './boardImportExport'
import type { Board } from '../../types/game'

export function BoardList() {
  const { user, signOut } = useAuth()
  const uid = user?.uid ?? null
  const navigate = useNavigate()
  const [boards, setBoards] = useState<Board[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!uid) return
    listBoards(uid).then(setBoards)
  }, [uid])

  async function handleDelete(boardId: string) {
    setConfirmingDeleteId(null)
    await deleteBoard(boardId)
    setBoards((prev) => prev?.filter((b) => b.id !== boardId) ?? null)
  }

  function startRename(b: Board) {
    setRenamingId(b.id)
    setRenameValue(b.name)
  }

  async function commitRename(boardId: string) {
    setRenamingId(null)
    const name = renameValue.trim()
    if (!name) return
    await renameBoard(boardId, name)
    setBoards((prev) => prev?.map((b) => (b.id === boardId ? { ...b, name } : b)) ?? null)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !uid) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = parseImportedBoard(text)
      const id = await createBoardFromData(uid, data)
      navigate(`/host/boards/${id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import board.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen crt-page p-6 text-crt-cream">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="text-sm text-crt-cream/60 transition hover:text-crt-amber-light">
            &larr; Home
          </Link>
          <h1 className="font-display text-2xl font-medium text-crt-amber-light">My Boards</h1>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className={`${btnSecondary} flex items-center gap-2`}
            >
              {importing && <Spinner className="h-4 w-4" />}
              {importing ? 'Importing…' : 'Import'}
            </button>
            <button onClick={() => navigate('/host/boards/new')} className={btnPrimary}>
              + New board
            </button>
          </div>
        </div>

        {!boards ? (
          <div className="flex items-center gap-3 text-crt-cream/60">
            <Spinner /> Loading…
          </div>
        ) : boards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-crt-cream/15 p-8 text-center text-crt-cream/50">
            No boards yet — create one to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {boards.map((b) => (
              <li
                key={b.id}
                className={`animate-fade-in-up flex items-center justify-between p-4 ${card} ${cardHover}`}
              >
                <div className="flex min-w-0 flex-col">
                  {renamingId === b.id ? (
                    <input
                      className={`${inputBase} px-2 py-1 font-semibold`}
                      value={renameValue}
                      autoFocus
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(b.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(b.id)
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                    />
                  ) : (
                    <span className="flex items-center gap-2">
                      <Link
                        to={`/host/boards/${b.id}`}
                        className="truncate font-semibold text-crt-cream transition hover:text-crt-amber-light"
                      >
                        {b.name}
                      </Link>
                      <button
                        onClick={() => startRename(b)}
                        title="Rename board"
                        className="cursor-pointer rounded p-1 text-crt-cream/40 transition hover:bg-crt-cream/10 hover:text-crt-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crt-cream/30"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {formatUpdated(b) && (
                    <span className="mt-0.5 text-xs text-crt-cream/35">Updated {formatUpdated(b)}</span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {confirmingDeleteId === b.id ? (
                    <>
                      <span className="text-sm text-crt-cream/60">Delete this board?</span>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="cursor-pointer rounded-lg bg-red-600/90 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
                      >
                        Delete
                      </button>
                      <button onClick={() => setConfirmingDeleteId(null)} className={btnQuiet}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => navigate(`/host/boards/${b.id}`)} className={btnQuiet}>
                        Edit
                      </button>
                      <button onClick={() => downloadBoardAsFile(b)} className={btnQuiet}>
                        Export
                      </button>
                      <button onClick={() => setConfirmingDeleteId(b.id)} className={btnQuiet}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {user && (
          <div className="mt-8 flex items-center justify-center gap-3 text-xs text-crt-cream/40">
            <span>Signed in as {user.displayName ?? user.email ?? user.uid}</span>
            <button onClick={() => signOut()} className={btnQuiet}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
