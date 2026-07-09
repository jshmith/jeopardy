import type { Board } from '../types/game'

/** "Updated" date for a board row, e.g. "Jul 9" or "Dec 12, 2025" if not this year. */
export function formatUpdated(b: Board): string | null {
  const ts = b.updatedAt ?? b.createdAt
  if (!ts) return null
  const date = ts.toDate()
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}
