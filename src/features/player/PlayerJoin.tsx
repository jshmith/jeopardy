import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthUid } from '../../lib/useAuthUid'
import { setLastRoom } from '../../lib/localRoom'
import { btnPrimary, card, inputBase } from '../../lib/uiClasses'
import { Spinner } from '../../components/Spinner'
import { joinGame } from '../game/gameApi'

export function PlayerJoin() {
  const uid = useAuthUid()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [roomCode, setRoomCode] = useState(searchParams.get('code')?.toUpperCase() ?? '')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!uid || !roomCode.trim() || !name.trim()) return
    setJoining(true)
    setError('')
    const code = roomCode.trim().toUpperCase()
    const result = await joinGame(code, uid, name.trim())
    setJoining(false)
    if (result.ok) {
      setLastRoom({ roomCode: code, role: 'player' })
      navigate(`/play/${code}`)
    } else if (result.reason === 'full') {
      setError('That game already has 4 players.')
    } else {
      setError('No game found with that room code.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-jeopardy-navy p-4 text-white">
      <form onSubmit={handleSubmit} className={`animate-fade-in-up w-full max-w-sm p-8 ${card}`}>
        <h1 className="mb-6 text-center font-jeopardy text-3xl text-jeopardy-gold">Join Game</h1>

        <label className="mb-4 block text-sm text-white/70">
          Room code
          <input
            className={`mt-1 w-full ${inputBase} text-center font-jeopardy text-2xl uppercase tracking-[0.3em]`}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            autoFocus
          />
        </label>

        <label className="mb-5 block text-sm text-white/70">
          Your name
          <input
            className={`mt-1 w-full ${inputBase}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
        </label>

        {error && (
          <p className="animate-fade-in-up mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={joining || !uid}
          className={`flex w-full items-center justify-center gap-2 ${btnPrimary}`}
        >
          {joining && <Spinner className="h-4 w-4" />}
          {joining ? 'Joining…' : 'Join'}
        </button>
      </form>
      <Link to="/" className="text-sm text-white/40 transition hover:text-white/70">
        &larr; Back to home
      </Link>
    </div>
  )
}
