import { Link } from 'react-router-dom'
import { getLastRoom } from '../../lib/localRoom'
import { useAuth } from '../../lib/useAuth'

export function Home() {
  const lastRoom = getLastRoom()
  const { user, isGoogleUser, signOut } = useAuth()

  return (
    <div className="crt-page relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden p-6 text-crt-cream">
      {isGoogleUser && (
        <div className="relative flex items-center gap-3 text-xs text-crt-cream/50">
          <span>Signed in as {user?.displayName ?? user?.email}</span>
          <button onClick={() => signOut()} className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-crt-cream/60 transition duration-150 hover:bg-crt-cream/10 hover:text-crt-cream/80">
            Sign out
          </button>
        </div>
      )}

      <h1 className="animate-fade-in-up text-crt-glow relative font-jeopardy text-8xl text-crt-amber-light">
        Jeopardy!
      </h1>

      <div className="relative flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/join"
          className="whitespace-nowrap rounded-xl bg-gradient-to-b from-crt-amber-light to-crt-amber px-6 py-4 font-semibold text-crt-bg shadow-md shadow-black/30 transition duration-150 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98] sm:px-8"
        >
          Join a game
        </Link>

        <div className="relative flex gap-3 rounded-2xl border border-crt-cream/10 bg-crt-surface/60 p-3">
          <Link
            to="/host"
            className="whitespace-nowrap rounded-xl bg-crt-bg-light px-6 py-4 font-semibold text-crt-cream shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-crt-surface active:scale-[0.98] sm:px-8"
          >
            Host a game
          </Link>
          <Link
            to="/host/boards"
            className="whitespace-nowrap rounded-xl bg-crt-bg-light px-6 py-4 font-semibold text-crt-cream shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-crt-surface active:scale-[0.98] sm:px-8"
          >
            My Boards
          </Link>
          {!isGoogleUser && (
            <span className="absolute top-full left-1/2 mt-1.5 -translate-x-1/2 whitespace-nowrap text-[11px] text-crt-cream/35">
              Google sign-in required
            </span>
          )}
        </div>
      </div>

      {lastRoom && (
        <Link
          to={lastRoom.role === 'host' ? `/host/game/${lastRoom.roomCode}` : `/play/${lastRoom.roomCode}`}
          className="relative text-sm text-crt-cream/50 transition hover:text-crt-amber-light"
        >
          Rejoin room {lastRoom.roomCode}
        </Link>
      )}
    </div>
  )
}
