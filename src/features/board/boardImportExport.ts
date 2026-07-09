import {
  CATEGORIES_PER_ROUND,
  CLUES_PER_CATEGORY,
  type Board,
  type BoardCategory,
  type BoardClue,
  type FinalJeopardyClue,
} from '../../types/game'

export type ExportedBoard = Pick<Board, 'name' | 'categories' | 'doubleCategories' | 'finalJeopardy'>

export function boardToExportData(board: Board): ExportedBoard {
  const { name, categories, doubleCategories, finalJeopardy } = board
  return { name, categories, doubleCategories, finalJeopardy }
}

export function downloadBoardAsFile(board: Board): void {
  const data = boardToExportData(board)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${board.name || 'board'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function isBoardClue(v: unknown): v is BoardClue {
  if (typeof v !== 'object' || v === null) return false
  const c = v as Record<string, unknown>
  return (
    typeof c.value === 'number' &&
    typeof c.text === 'string' &&
    (typeof c.imageUrl === 'string' || c.imageUrl === null) &&
    typeof c.answer === 'string' &&
    typeof c.isDailyDouble === 'boolean' &&
    (c.mode === undefined || c.mode === 'standard' || c.mode === 'host_control')
  )
}

function isBoardCategory(v: unknown): v is BoardCategory {
  if (typeof v !== 'object' || v === null) return false
  const c = v as Record<string, unknown>
  return (
    typeof c.title === 'string' &&
    Array.isArray(c.clues) &&
    c.clues.length === CLUES_PER_CATEGORY &&
    c.clues.every(isBoardClue)
  )
}

function isFinalJeopardyClue(v: unknown): v is FinalJeopardyClue {
  if (typeof v !== 'object' || v === null) return false
  const c = v as Record<string, unknown>
  return (
    typeof c.category === 'string' &&
    typeof c.text === 'string' &&
    (typeof c.imageUrl === 'string' || c.imageUrl === null) &&
    typeof c.answer === 'string'
  )
}

/** Throws a descriptive Error if the parsed JSON isn't a valid exported board. */
export function parseImportedBoard(json: string): ExportedBoard {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('That file is not valid JSON.')
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('That file does not contain a board.')
  }
  const d = data as Record<string, unknown>

  if (typeof d.name !== 'string') {
    throw new Error('Board file is missing a name.')
  }
  if (
    !Array.isArray(d.categories) ||
    d.categories.length !== CATEGORIES_PER_ROUND ||
    !d.categories.every(isBoardCategory)
  ) {
    throw new Error('Board file has an invalid "categories" section.')
  }
  if (
    !Array.isArray(d.doubleCategories) ||
    d.doubleCategories.length !== CATEGORIES_PER_ROUND ||
    !d.doubleCategories.every(isBoardCategory)
  ) {
    throw new Error('Board file has an invalid "doubleCategories" section.')
  }
  if (!isFinalJeopardyClue(d.finalJeopardy)) {
    throw new Error('Board file has an invalid "finalJeopardy" section.')
  }

  return {
    name: d.name,
    categories: d.categories,
    doubleCategories: d.doubleCategories,
    finalJeopardy: d.finalJeopardy,
  }
}
