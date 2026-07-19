import { initializeApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import {
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)

/** Set when required Firebase config env vars are missing, so the app can show a
 * setup message instead of a blank page (getAuth() throws synchronously on a bad config,
 * which would otherwise crash the whole module graph before anything renders). */
export const firebaseConfigError =
  missingKeys.length > 0
    ? `Missing Firebase config: ${missingKeys.join(', ')}. Copy .env.example to .env and fill in your Firebase project's web app config, then restart the dev server.`
    : null

export const app = initializeApp(firebaseConfig)
export const db = (firebaseConfigError ? null : getFirestore(app)) as Firestore
export const auth = (firebaseConfigError ? null : getAuth(app)) as Auth

/** Subscribe to auth-state changes. Fires immediately with the current user (or null if
 * signed out), then again on every sign-in/sign-out. Returns an unsubscribe function.
 * Firebase's default local persistence keeps the session across refreshes. */
export function subscribeToAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb)
}

/** Silently signs in an anonymous user so joining/playing a game never requires a
 * Google account — only board management and hosting need a real identity. */
export function signInAnonymouslyUser(): Promise<unknown> {
  return signInAnonymously(auth)
}

/** Opens the Google sign-in popup, replacing any anonymous session with the Google
 * identity (not linked — a Google account's boards must follow the account across
 * devices/browsers, which an anonymous uid can't do). */
export function signInWithGoogle(): Promise<unknown> {
  return signInWithPopup(auth, new GoogleAuthProvider())
}

/** Signs the current user out. The auth-state listener notices and re-establishes an
 * anonymous session so the rest of the app keeps working. */
export function signOutUser(): Promise<void> {
  return signOut(auth)
}
