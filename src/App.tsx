import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { firebaseConfigError } from './lib/firebase'
import { AuthProvider, useAuth } from './lib/useAuth'
import { btnPrimary, card } from './lib/uiClasses'
import { Spinner } from './components/Spinner'
import { Home } from './features/home/Home'
import { BoardList } from './features/board/BoardList'
import { HostGamePicker } from './features/host/HostGamePicker'
import { BoardEditor } from './features/board/BoardEditor'
import { NewGame } from './features/host/NewGame'
import { HostControl } from './features/host/HostControl'
import { PlayerJoin } from './features/player/PlayerJoin'
import { PlayerView } from './features/player/PlayerView'

function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center crt-page p-6 text-crt-cream">
      <div className={`animate-fade-in-up max-w-md p-8 text-center ${card}`}>
        <h1 className="mb-4 font-display text-2xl font-medium text-crt-amber-light">Setup needed</h1>
        <p className="text-sm text-crt-cream/70">{firebaseConfigError}</p>
      </div>
    </div>
  )
}

function SignInScreen() {
  const { signInWithGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  async function handleSignIn() {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      setError('Sign-in was cancelled or failed. Please try again.')
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center crt-page p-6 text-crt-cream">
      <div className={`animate-fade-in-up max-w-md p-8 text-center ${card}`}>
        <h1 className="mb-2 font-jeopardy text-4xl text-crt-amber-light">Jeopardy!</h1>
        <p className="mb-6 text-sm text-crt-cream/70">Sign in with Google to manage boards and host games.</p>
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className={`flex w-full items-center justify-center gap-2 ${btnPrimary}`}
        >
          {signingIn && <Spinner className="h-4 w-4" />}
          {signingIn ? 'Signing in…' : 'Sign in with Google'}
        </button>
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <Link to="/" className="mt-4 block text-sm text-crt-cream/40 transition hover:text-crt-cream/70">
          &larr; Back to home
        </Link>
      </div>
    </div>
  )
}

/** Gates board management and hosting behind Google sign-in. Joining/playing a game
 * works on the app-wide anonymous session and never hits this. */
function RequireGoogleAuth({ children }: { children: React.ReactNode }) {
  const { loading, isGoogleUser } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 crt-page text-crt-cream/70">
        <Spinner /> Loading…
      </div>
    )
  }
  if (!isGoogleUser) return <SignInScreen />
  return <>{children}</>
}

function App() {
  if (firebaseConfigError) return <SetupNeeded />

  return (
    <AuthProvider>
      <div className="crt-overlay" aria-hidden="true" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/host"
            element={
              <RequireGoogleAuth>
                <HostGamePicker />
              </RequireGoogleAuth>
            }
          />
          <Route
            path="/host/boards"
            element={
              <RequireGoogleAuth>
                <BoardList />
              </RequireGoogleAuth>
            }
          />
          <Route
            path="/host/boards/:boardId"
            element={
              <RequireGoogleAuth>
                <BoardEditor />
              </RequireGoogleAuth>
            }
          />
          <Route
            path="/host/new-game/:boardId"
            element={
              <RequireGoogleAuth>
                <NewGame />
              </RequireGoogleAuth>
            }
          />
          <Route
            path="/host/game/:roomCode"
            element={
              <RequireGoogleAuth>
                <HostControl />
              </RequireGoogleAuth>
            }
          />
          <Route path="/join" element={<PlayerJoin />} />
          <Route path="/play/:roomCode" element={<PlayerView />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
