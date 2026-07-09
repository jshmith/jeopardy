import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../../lib/firebase'
import { getBoard } from '../board/boardApi'
import type { Board, BoardMetaCategory, Game } from '../../types/game'

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROOM_CODE_LENGTH = 6
const MAX_PLAYERS = 4

function randomRoomCode(): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  }
  return code
}

function toBoardMeta(categories: Board['categories']): BoardMetaCategory[] {
  return categories.map((cat) => ({
    title: cat.title,
    clues: cat.clues.map((clue) => ({ value: clue.value, state: 'hidden' as const })),
  }))
}

export async function createGame(hostUid: string, boardId: string): Promise<string> {
  const board = await getBoard(boardId)
  if (!board) throw new Error('Board not found')

  let roomCode = randomRoomCode()
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await getDoc(doc(db, 'games', roomCode))
    if (!existing.exists()) break
    roomCode = randomRoomCode()
  }

  const gameData: Omit<Game, 'createdAt' | 'updatedAt'> = {
    hostUid,
    boardId,
    round: 'single',
    phase: 'board',
    boardMeta: {
      single: toBoardMeta(board.categories),
      double: toBoardMeta(board.doubleCategories),
    },
    currentClue: null,
    videoSync: null,
    buzz: {
      token: uuidv4(),
      isOpen: false,
      winnerId: null,
      winnerAt: null,
      lockedOutPlayerIds: [],
    },
    controlPlayerId: null,
    dailyDouble: null,
    finalJeopardyMeta: { category: board.finalJeopardy.category, revealed: false },
    finalAnswerDeadline: null,
    finalRevealOrder: null,
    finalRevealIndex: 0,
    playerCount: 0,
  }

  // Written sequentially, not batched: the private/board rule checks isHost(), which
  // reads the public game doc's hostUid via get() — a batch's writes aren't visible to
  // each other's rule evaluation, so the game doc must actually commit first.
  await setDoc(doc(db, 'games', roomCode), {
    ...gameData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await setDoc(doc(db, 'games', roomCode, 'private', 'board'), {
    categories: board.categories,
    doubleCategories: board.doubleCategories,
    finalJeopardy: board.finalJeopardy,
  })

  return roomCode
}

export type JoinResult = { ok: true } | { ok: false; reason: 'not_found' | 'full' }

export async function joinGame(roomCode: string, uid: string, displayName: string): Promise<JoinResult> {
  const gameRef = doc(db, 'games', roomCode)
  const playerRef = doc(db, 'games', roomCode, 'players', uid)

  try {
    await runTransaction(db, async (tx) => {
      const gameSnap = await tx.get(gameRef)
      if (!gameSnap.exists()) throw new Error('not_found')

      const playerSnap = await tx.get(playerRef)
      if (playerSnap.exists()) {
        tx.update(playerRef, { connected: true, lastSeenAt: serverTimestamp() })
        return
      }

      const playerCount = gameSnap.data().playerCount ?? 0
      if (playerCount >= MAX_PLAYERS) throw new Error('full')

      tx.set(playerRef, {
        uid,
        displayName,
        score: 0,
        joinedAt: serverTimestamp(),
        connected: true,
        lastSeenAt: serverTimestamp(),
      })
      tx.update(gameRef, { playerCount: playerCount + 1, updatedAt: serverTimestamp() })
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'full') return { ok: false, reason: 'full' }
    return { ok: false, reason: 'not_found' }
  }
}
