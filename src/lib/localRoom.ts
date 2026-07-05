const STORAGE_KEY = 'jeopardy:lastRoom'

export type LastRoom = {
  roomCode: string
  role: 'host' | 'player'
}

export function getLastRoom(): LastRoom | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as LastRoom
  } catch {
    return null
  }
}

export function setLastRoom(room: LastRoom): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(room))
}

export function clearLastRoom(): void {
  localStorage.removeItem(STORAGE_KEY)
}
