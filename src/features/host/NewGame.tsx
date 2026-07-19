import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthUid } from '../../lib/useAuthUid'
import { setLastRoom } from '../../lib/localRoom'
import { Spinner } from '../../components/Spinner'
import { createGame } from '../game/gameApi'

export function NewGame() {
  const { boardId } = useParams<{ boardId: string }>()
  const uid = useAuthUid()
  const navigate = useNavigate()
  const started = useRef(false)

  useEffect(() => {
    if (!uid || !boardId || started.current) return
    started.current = true
    createGame(uid, boardId).then((roomCode) => {
      setLastRoom({ roomCode, role: 'host' })
      navigate(`/host/game/${roomCode}`, { replace: true })
    })
  }, [uid, boardId, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center gap-3 crt-page text-crt-cream/70">
      <Spinner /> Creating game…
    </div>
  )
}
