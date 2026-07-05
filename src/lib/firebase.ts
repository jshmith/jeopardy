import { initializeApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged, type User, type Auth } from 'firebase/auth'

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

let authReadyPromise: Promise<User> | null = null

/** Resolves once an anonymous user is signed in, reusing a persisted session across refreshes. */
export function waitForAuth(): Promise<User> {
  if (authReadyPromise) return authReadyPromise

  authReadyPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe()
          resolve(user)
          return
        }
        signInAnonymously(auth).catch((err) => {
          unsubscribe()
          reject(err)
        })
      },
      reject,
    )
  })

  return authReadyPromise
}
