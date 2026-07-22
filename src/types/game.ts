import type { Timestamp } from 'firebase/firestore'

export const CATEGORIES_PER_ROUND = 6
export const CLUES_PER_CATEGORY = 5
export const SINGLE_VALUES = [200, 400, 600, 800, 1000]
export const DOUBLE_VALUES = [400, 800, 1200, 1600, 2000]
export const MIN_WAGER = 5

export type Round = 'single' | 'double' | 'final'

export type GamePhase =
  | 'pitch_game'
  | 'board'
  | 'clue_revealed'
  | 'daily_double_wager'
  | 'buzzer_open'
  | 'awaiting_judgment'
  | 'answer_revealed'
  | 'final_category'
  | 'final_wagering'
  | 'final_answering'
  | 'final_judging'
  | 'final_reveal'
  | 'game_over'

// ---- Board template (host's reusable library) ----

/** How a clue plays out: players race to buzz in, or the host directly awards a player. */
export type ClueMode = 'standard' | 'host_control'

export type BoardClue = {
  value: number
  text: string
  /** Media URL: image, YouTube link, or direct video file — detected at render time. */
  imageUrl: string | null
  answer: string
  isDailyDouble: boolean
  /** Absent on boards saved before clue modes existed — treat as 'standard'. */
  mode?: ClueMode
  /** Host's choice clues only: players get a text box to type a guess instead of just watching. */
  allowTextInput?: boolean
  /** Video clues only: players get a black screen with audio (host still sees video). */
  hideVideoFromPlayers?: boolean
}

export type BoardCategory = {
  title: string
  clues: BoardClue[] // length CLUES_PER_CATEGORY
}

export type FinalJeopardyClue = {
  category: string
  text: string
  /** Media URL: image, YouTube link, or direct video file — detected at render time. */
  imageUrl: string | null
  answer: string
  /** Video clues only: players get a black screen with audio (host still sees video). */
  hideVideoFromPlayers?: boolean
}

export type Board = {
  id: string
  ownerUid: string
  name: string
  createdAt: Timestamp
  updatedAt: Timestamp
  categories: BoardCategory[] // Single Jeopardy, length CATEGORIES_PER_ROUND
  doubleCategories: BoardCategory[] // Double Jeopardy, length CATEGORIES_PER_ROUND
  finalJeopardy: FinalJeopardyClue
}

// ---- Live game (public doc) ----

export type ClueState = 'hidden' | 'revealed' | 'answered'

export type BoardMetaClue = {
  value: number
  state: ClueState
}

export type BoardMetaCategory = {
  title: string
  clues: BoardMetaClue[]
}

export type CurrentClue = {
  round: 'single' | 'double'
  categoryIndex: number
  clueIndex: number
  value: number
  text: string
  imageUrl: string | null
  isDailyDouble: boolean
  mode: ClueMode
  /** Host's choice clues only: players get a text box to type a guess instead of just watching. */
  allowTextInput?: boolean
  /** Players' typed guesses for a host's-choice clue with text input enabled, keyed by uid. */
  textAnswers?: Record<string, string>
  /** Absent on games started before this option existed — treat as false. */
  hideVideoFromPlayers?: boolean
  revealedAnswer: string | null
}

/** Opening minigame: match a random pitch, closest player gets board control. */
export type PitchGameState = {
  /** MIDI note number of the target pitch (C3–C5 range). */
  targetMidi: number
}

export type PitchResult = {
  detectedHz: number
  /** Signed cents off the target, octave-folded to [-600, 600]. */
  centsOff: number
  submittedAt: Timestamp
}

/** Host-driven video playback state; viewers' players follow it. */
export type VideoSyncState = {
  status: 'playing' | 'paused'
  /** Video position (seconds) when this state was written. */
  time: number
  /** Server-clock timestamp this state was written — not any device's local clock —
   * so viewers can extrapolate position while playing without trusting either their
   * own or the host's device clock to be accurate. */
  setAt: Timestamp
}

export type BuzzState = {
  token: string
  /** Server-time estimate (ms) at which buzzing becomes fair game. Every client arms
   * its own buzzer against this instant instead of reacting to whenever `isOpen`
   * happens to propagate to it, so slower connections don't see the buzzer late. */
  opensAtMs: number
  isOpen: boolean
  winnerId: string | null
  winnerAt: Timestamp | null
  lockedOutPlayerIds: string[]
  /** Offset-corrected press-time estimates (ms), collected from every player who buzzes
   * during the short judging window after opening — the earliest one wins. */
  attempts: Record<string, number>
}

export type DailyDoubleState = {
  controllingPlayerId: string | null
  wager: number | null
  wagerSubmitted: boolean
}

export type FinalJeopardyMeta = {
  category: string
  revealed: boolean
}

export type Game = {
  hostUid: string
  boardId: string
  round: Round
  phase: GamePhase
  boardMeta: {
    single: BoardMetaCategory[]
    double: BoardMetaCategory[]
  }
  currentClue: CurrentClue | null
  /** Absent on games created before video sync existed — treat as null. */
  videoSync?: VideoSyncState | null
  /** Set while the pitch minigame is running; absent on older games. */
  pitchGame?: PitchGameState | null
  buzz: BuzzState
  controlPlayerId: string | null
  dailyDouble: DailyDoubleState | null
  finalJeopardyMeta: FinalJeopardyMeta
  finalAnswerDeadline: number | null
  finalRevealOrder: string[] | null
  finalRevealIndex: number
  playerCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type PrivateBoard = {
  categories: BoardCategory[]
  doubleCategories: BoardCategory[]
  finalJeopardy: FinalJeopardyClue
}

export type Player = {
  uid: string
  displayName: string
  score: number
  joinedAt: Timestamp
  connected: boolean
  lastSeenAt: Timestamp
}

export type FinalWager = {
  value: number
  submittedAt: Timestamp
}

export type FinalAnswer = {
  value: string
  submittedAt: Timestamp
}
