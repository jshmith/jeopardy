import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { subscribeToAuth, signInAnonymouslyUser, signInWithGoogle, signOutUser } from './firebase'

type AuthContextValue = {
  user: User | null
  loading: boolean
  /** True once signed in with a real Google account, as opposed to the anonymous
   * session everyone gets automatically. Board management and hosting require this. */
  isGoogleUser: boolean
  signInWithGoogle: () => Promise<unknown>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Subscribes to Firebase auth once and exposes the current user + sign-in/out actions
 * to the whole tree. Everyone gets a silent anonymous session so joining/playing a game
 * never requires an account; signing in with Google (or signing back out of it) is only
 * needed for board management and hosting. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return subscribeToAuth((u) => {
      if (u) {
        setUser(u)
        setLoading(false)
      } else {
        signInAnonymouslyUser().catch(() => setLoading(false))
      }
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isGoogleUser: !!user && !user.isAnonymous,
      signInWithGoogle,
      signOut: signOutUser,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
