import { doc, increment, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../../lib/firebase'
import type { BoardMetaCategory, ClueState, PrivateBoard, VideoSyncState } from '../../types/game'

function gameRef(roomCode: string) {
  return doc(db, 'games', roomCode)
}

function playerRef(roomCode: string, playerId: string) {
  return doc(db, 'games', roomCode, 'players', playerId)
}

/** Gap between "host opens the buzzer" and the fairness window actually starting —
 * gives every client's realtime listener a chance to receive the new `opensAtMs`
 * and arm itself before any buzz can count, so listener-latency differences between
 * players don't translate into who gets to react first. */
const BUZZ_ARM_DELAY_MS = 600

/** How long buzz attempts are collected after `opensAtMs` before the earliest one is
 * declared the winner, instead of resolving instantly on whoever's write lands first. */
export const BUZZ_JUDGE_WINDOW_MS = 400

function freshBuzzState(clockOffsetMs: number, lockedOutPlayerIds: string[] = []) {
  return {
    token: uuidv4(),
    opensAtMs: Date.now() + clockOffsetMs + BUZZ_ARM_DELAY_MS,
    isOpen: true,
    winnerId: null,
    winnerAt: null,
    lockedOutPlayerIds,
    attempts: {},
  }
}

/** Firestore's dot-path update syntax can only traverse map fields, not array indices
 * (`boardMeta.single.0.state` would silently turn the array into a map) — so a single
 * clue's state is updated by rewriting the whole round's category array immutably. */
function withClueState(
  categories: BoardMetaCategory[],
  categoryIndex: number,
  clueIndex: number,
  state: ClueState,
): BoardMetaCategory[] {
  return categories.map((cat, ci) =>
    ci !== categoryIndex
      ? cat
      : { ...cat, clues: cat.clues.map((c, cli) => (cli !== clueIndex ? c : { ...c, state })) },
  )
}

export async function revealClue(
  roomCode: string,
  board: PrivateBoard,
  currentRoundMeta: BoardMetaCategory[],
  round: 'single' | 'double',
  categoryIndex: number,
  clueIndex: number,
) {
  const category = (round === 'double' ? board.doubleCategories : board.categories)[categoryIndex]
  const clue = category.clues[clueIndex]

  await updateDoc(gameRef(roomCode), {
    currentClue: {
      round,
      categoryIndex,
      clueIndex,
      value: clue.value,
      text: clue.text,
      imageUrl: clue.imageUrl,
      isDailyDouble: clue.isDailyDouble,
      mode: clue.mode ?? 'standard',
      allowTextInput: clue.mode === 'host_control' ? (clue.allowTextInput ?? false) : false,
      textAnswers: {},
      hideVideoFromPlayers: clue.hideVideoFromPlayers ?? false,
      revealedAnswer: null,
    },
    [`boardMeta.${round}`]: withClueState(currentRoundMeta, categoryIndex, clueIndex, 'revealed'),
    phase: clue.isDailyDouble ? 'daily_double_wager' : 'clue_revealed',
    dailyDouble: clue.isDailyDouble
      ? { controllingPlayerId: null, wager: null, wagerSubmitted: false }
      : null,
    buzz: { token: uuidv4(), opensAtMs: 0, isOpen: false, winnerId: null, winnerAt: null, lockedOutPlayerIds: [], attempts: {} },
    videoSync: null,
    updatedAt: serverTimestamp(),
  })
}

// C3–C5: comfortably reachable (in some octave) for nearly all voices.
const PITCH_GAME_MIN_MIDI = 48
const PITCH_GAME_MAX_MIDI = 72

/** Start the opening pitch minigame with a random target note. */
export async function startPitchGame(roomCode: string) {
  const targetMidi =
    PITCH_GAME_MIN_MIDI + Math.floor(Math.random() * (PITCH_GAME_MAX_MIDI - PITCH_GAME_MIN_MIDI + 1))
  await updateDoc(gameRef(roomCode), { phase: 'pitch_game', pitchGame: { targetMidi } })
}

/** Closest pitch wins opening control of the board. */
export async function finishPitchGame(roomCode: string, winnerId: string) {
  await updateDoc(gameRef(roomCode), { phase: 'board', controlPlayerId: winnerId, pitchGame: null })
}

export async function cancelPitchGame(roomCode: string) {
  await updateDoc(gameRef(roomCode), { phase: 'board', pitchGame: null })
}

/** Host's video player publishes its play/pause/seek state; viewers follow it. The
 * timestamp is always the server's clock, never the host device's — see VideoSyncState. */
export async function setVideoSync(roomCode: string, state: Pick<VideoSyncState, 'status' | 'time'>) {
  await updateDoc(gameRef(roomCode), {
    videoSync: { status: state.status, time: state.time, setAt: serverTimestamp() },
    updatedAt: serverTimestamp(),
  })
}

export async function setDailyDoubleController(roomCode: string, playerId: string) {
  await updateDoc(gameRef(roomCode), { 'dailyDouble.controllingPlayerId': playerId })
}

export async function useControlPlayerAsDailyDoubleDefault(roomCode: string, controlPlayerId: string | null) {
  if (!controlPlayerId) return
  await updateDoc(gameRef(roomCode), { 'dailyDouble.controllingPlayerId': controlPlayerId })
}

export async function revealDailyDoubleClue(roomCode: string) {
  await updateDoc(gameRef(roomCode), { phase: 'clue_revealed' })
}

export async function openBuzzer(roomCode: string, clockOffsetMs: number) {
  await updateDoc(gameRef(roomCode), {
    phase: 'buzzer_open',
    buzz: freshBuzzState(clockOffsetMs),
  })
}

/** After the judging window closes, pick whichever recorded attempt has the earliest
 * (offset-corrected) press time as the winner. Called from the host's client on a
 * timer — safe to call redundantly or late, since it's a no-op once already resolved
 * or once the round has moved on to a different token. */
export async function resolveBuzzWinner(roomCode: string, expectedToken: string) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(gameRef(roomCode))
    if (!snap.exists()) return
    const game = snap.data()
    const buzz = game.buzz
    if (buzz.token !== expectedToken || !buzz.isOpen || buzz.winnerId !== null) return

    const entries = Object.entries(buzz.attempts ?? {}) as [string, number][]
    if (entries.length === 0) return
    entries.sort((a, b) => a[1] - b[1])

    tx.update(gameRef(roomCode), {
      'buzz.winnerId': entries[0][0],
      'buzz.winnerAt': serverTimestamp(),
      'buzz.isOpen': false,
    })
  })
}

/** Judge a normal (non-Daily-Double) buzz-in. Awards/deducts `value`, and on a wrong
 * answer locks the player out and reopens the buzzer for whoever remains. */
export async function judgeBuzzIn(
  roomCode: string,
  playerId: string,
  correct: boolean,
  value: number,
  answer: string,
  clockOffsetMs: number,
) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(gameRef(roomCode))
    if (!snap.exists()) return
    const game = snap.data()
    if (game.buzz.winnerId !== playerId) return // already judged / stale click

    tx.update(playerRef(roomCode, playerId), { score: increment(correct ? value : -value) })

    if (correct) {
      tx.update(gameRef(roomCode), {
        controlPlayerId: playerId,
        phase: 'answer_revealed',
        'currentClue.revealedAnswer': answer,
        [`boardMeta.${game.currentClue.round}`]: withClueState(
          game.boardMeta[game.currentClue.round],
          game.currentClue.categoryIndex,
          game.currentClue.clueIndex,
          'answered',
        ),
        buzz: { ...game.buzz, isOpen: false, winnerId: null },
      })
    } else {
      tx.update(gameRef(roomCode), {
        phase: 'buzzer_open',
        buzz: freshBuzzState(clockOffsetMs, [...game.buzz.lockedOutPlayerIds, playerId]),
      })
    }
  })
}

/** Host-control clue: the host directly awards the money to a player (no buzzing).
 * Awards `value`, gives that player board control, and reveals the answer. */
export async function awardHostControlClue(
  roomCode: string,
  playerId: string,
  value: number,
  answer: string,
) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(gameRef(roomCode))
    if (!snap.exists()) return
    const game = snap.data()
    if (!game.currentClue || game.phase !== 'clue_revealed') return // already resolved / stale click

    tx.update(playerRef(roomCode, playerId), { score: increment(value) })
    tx.update(gameRef(roomCode), {
      controlPlayerId: playerId,
      phase: 'answer_revealed',
      'currentClue.revealedAnswer': answer,
      [`boardMeta.${game.currentClue.round}`]: withClueState(
        game.boardMeta[game.currentClue.round],
        game.currentClue.categoryIndex,
        game.currentClue.clueIndex,
        'answered',
      ),
      buzz: { ...game.buzz, isOpen: false, winnerId: null },
    })
  })
}

/** Judge a Daily Double answer for the controlling player — resolves immediately either way. */
export async function judgeDailyDouble(
  roomCode: string,
  playerId: string,
  correct: boolean,
  wager: number,
  answer: string,
) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(gameRef(roomCode))
    if (!snap.exists()) return
    const game = snap.data()
    if (game.phase === 'answer_revealed' || game.phase === 'board') return // already judged

    tx.update(playerRef(roomCode, playerId), { score: increment(correct ? wager : -wager) })
    tx.update(gameRef(roomCode), {
      phase: 'answer_revealed',
      'currentClue.revealedAnswer': answer,
      [`boardMeta.${game.currentClue.round}`]: withClueState(
        game.boardMeta[game.currentClue.round],
        game.currentClue.categoryIndex,
        game.currentClue.clueIndex,
        'answered',
      ),
    })
  })
}

/** Manual escape hatch: give up on the current clue (no one buzzed / all answered wrong). */
export async function forceRevealAnswer(roomCode: string, answer: string) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(gameRef(roomCode))
    if (!snap.exists()) return
    const game = snap.data()
    if (!game.currentClue) return
    tx.update(gameRef(roomCode), {
      phase: 'answer_revealed',
      'currentClue.revealedAnswer': answer,
      [`boardMeta.${game.currentClue.round}`]: withClueState(
        game.boardMeta[game.currentClue.round],
        game.currentClue.categoryIndex,
        game.currentClue.clueIndex,
        'answered',
      ),
      buzz: { ...game.buzz, isOpen: false },
    })
  })
}

export async function backToBoard(roomCode: string) {
  await updateDoc(gameRef(roomCode), { currentClue: null, dailyDouble: null, phase: 'board', videoSync: null })
}

export async function setRound(roomCode: string, round: 'single' | 'double') {
  await updateDoc(gameRef(roomCode), { round, phase: 'board', currentClue: null, dailyDouble: null })
}

export async function startFinalJeopardy(roomCode: string) {
  await updateDoc(gameRef(roomCode), { round: 'final', phase: 'final_category' })
}

export async function moveToFinalWagering(roomCode: string) {
  await updateDoc(gameRef(roomCode), { phase: 'final_wagering' })
}

export async function moveToFinalAnswering(roomCode: string, board: PrivateBoard, durationMs: number) {
  await updateDoc(gameRef(roomCode), {
    phase: 'final_answering',
    currentClue: {
      round: 'single',
      categoryIndex: 0,
      clueIndex: 0,
      value: 0,
      text: board.finalJeopardy.text,
      imageUrl: board.finalJeopardy.imageUrl,
      isDailyDouble: false,
      hideVideoFromPlayers: board.finalJeopardy.hideVideoFromPlayers ?? false,
      revealedAnswer: null,
    },
    videoSync: null,
    finalAnswerDeadline: Date.now() + durationMs,
  })
}

export async function setFinalRevealOrder(roomCode: string, order: string[]) {
  await updateDoc(gameRef(roomCode), { phase: 'final_reveal', finalRevealOrder: order, finalRevealIndex: 0 })
}

export async function judgeFinalPlayer(roomCode: string, playerId: string, correct: boolean, wager: number) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(gameRef(roomCode))
    if (!snap.exists()) return
    const game = snap.data()
    const nextIndex = (game.finalRevealIndex ?? 0) + 1
    const isLast = !game.finalRevealOrder || nextIndex >= game.finalRevealOrder.length

    tx.update(playerRef(roomCode, playerId), { score: increment(correct ? wager : -wager) })
    tx.update(gameRef(roomCode), {
      finalRevealIndex: nextIndex,
      phase: isLast ? 'game_over' : 'final_reveal',
    })
  })
}
