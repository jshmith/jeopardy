import { useAuth } from './useAuth'

/** Resolves to the current signed-in user's uid, or null while auth is still loading.
 * Consumers render behind the RequireAuth gate, so a null here only means "not ready yet". */
export function useAuthUid(): string | null {
  return useAuth().user?.uid ?? null
}
