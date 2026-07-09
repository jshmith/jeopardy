import { Link } from 'react-router-dom'
import { getLastRoom } from '../../lib/localRoom'
import { btnPrimary, btnSecondary } from '../../lib/uiClasses'

export function Home() {
  const lastRoom = getLastRoom()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-jeopardy-navy p-6 text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 35%, rgba(6,12,233,0.55), transparent 60%)' }}
      />
      <h1 className="animate-fade-in-up relative font-jeopardy text-6xl text-jeopardy-gold drop-shadow-[0_2px_12px_rgba(255,204,0,0.25)]">
        Jeopardy!
      </h1>

      <div className="relative flex flex-wrap justify-center gap-4">
        <Link to="/host" className={`${btnPrimary} px-8 py-4 hover:-translate-y-0.5`}>
          Host a game
        </Link>
        <Link to="/join" className={`${btnSecondary} px-8 py-4 hover:-translate-y-0.5`}>
          Join a game
        </Link>
        <Link to="/host/boards" className={`${btnSecondary} px-8 py-4 hover:-translate-y-0.5`}>
          My Boards
        </Link>
      </div>

      {lastRoom && (
        <Link
          to={lastRoom.role === 'host' ? `/host/game/${lastRoom.roomCode}` : `/play/${lastRoom.roomCode}`}
          className="relative text-sm text-white/50 transition hover:text-jeopardy-gold"
        >
          Rejoin room {lastRoom.roomCode}
        </Link>
      )}
    </div>
  )
}
