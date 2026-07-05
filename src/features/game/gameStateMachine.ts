import { doc, increment, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../../lib/firebase'
import type { BoardMetaCategory, ClueState, PrivateBoard } from '../../types/game'

function gameRef(roomCode: string) {
  return doc(db, 'games', roomCode)
}

function playerRef(roomCode: string, playerId: string) {
  return doc(db, 'games', roomCode, 'players', playerId)
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
      revealedAnswer: null,
    },
    [`boardMeta.${round}`]: withClueState(currentRoundMeta, categoryIndex, clueIndex, 'revealed'),
    phase: clue.isDailyDouble ? 'daily_double_wager' : 'clue_revealed',
    dailyDouble: clue.isDailyDouble
      ? { controllingPlayerId: null, wager: null, wagerSubmitted: false }
      : null,
    buzz: { token: uuidv4(), isOpen: false, winnerId: null, winnerAt: null, lockedOutPlayerIds: [] },
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

export async function openBuzzer(roomCode: string) {
  await updateDoc(gameRef(roomCode), {
    phase: 'buzzer_open',
    buzz: { token: uuidv4(), isOpen: true, winnerId: null, winnerAt: null, lockedOutPlayerIds: [] },
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
        buzz: {
          token: uuidv4(),
          isOpen: true,
          winnerId: null,
          winnerAt: null,
          lockedOutPlayerIds: [...game.buzz.lockedOutPlayerIds, playerId],
        },
      })
    }
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
  await updateDoc(gameRef(roomCode), { currentClue: null, dailyDouble: null, phase: 'board' })
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
      revealedAnswer: null,
    },
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
