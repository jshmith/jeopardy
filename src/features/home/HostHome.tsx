import { Link } from 'react-router-dom'
import { getLastRoom } from '../../lib/localRoom'
import { btnPrimary } from '../../lib/uiClasses'

export function HostHome() {
  const lastRoom = getLastRoom()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-jeopardy-navy p-6 text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 35%, rgba(6,12,233,0.5), transparent 60%)' }}
      />
      <h1 className="animate-fade-in-up relative font-jeopardy text-4xl text-jeopardy-gold">Host</h1>
      <Link to="/host/boards" className={`relative ${btnPrimary} px-8 py-4 hover:-translate-y-0.5`}>
        My Boards
      </Link>
      {lastRoom?.role === 'host' && (
        <Link
          to={`/host/game/${lastRoom.roomCode}`}
          className="relative text-sm text-white/50 transition hover:text-jeopardy-gold"
        >
          Resume room {lastRoom.roomCode}
        </Link>
      )}
      <Link to="/" className="relative text-sm text-white/30 transition hover:text-white/60">
        &larr; Back
      </Link>
    </div>
  )
}
