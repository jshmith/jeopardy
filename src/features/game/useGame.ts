import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { FinalAnswer, FinalWager, Game, Player, PrivateBoard } from '../../types/game'

export function useGameDoc(roomCode: string | undefined): Game | null | undefined {
  const [game, setGame] = useState<Game | null | undefined>(undefined)

  useEffect(() => {
    if (!roomCode) return
    setGame(undefined)
    const unsub = onSnapshot(doc(db, 'games', roomCode), (snap) => {
      setGame(snap.exists() ? (snap.data() as Game) : null)
    })
    return unsub
  }, [roomCode])

  return game
}

export function usePlayers(roomCode: string | undefined): Player[] {
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    if (!roomCode) return
    const q = query(collection(db, 'games', roomCode, 'players'), orderBy('joinedAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setPlayers(snap.docs.map((d) => d.data() as Player))
    })
    return unsub
  }, [roomCode])

  return players
}

/** Host-only: the full board content (clue text/answers), used to drive reveal/judge actions. */
export function usePrivateBoard(roomCode: string | undefined): PrivateBoard | null | undefined {
  const [board, setBoard] = useState<PrivateBoard | null | undefined>(undefined)

  useEffect(() => {
    if (!roomCode) return
    setBoard(undefined)
    const unsub = onSnapshot(doc(db, 'games', roomCode, 'private', 'board'), (snap) => {
      setBoard(snap.exists() ? (snap.data() as PrivateBoard) : null)
    })
    return unsub
  }, [roomCode])

  return board
}

/** Host-only: all players' Final Jeopardy wagers, keyed by uid (readable by host per rules). */
export function useFinalWagers(roomCode: string | undefined): Record<string, FinalWager> {
  const [wagers, setWagers] = useState<Record<string, FinalWager>>({})

  useEffect(() => {
    if (!roomCode) return
    const unsub = onSnapshot(collection(db, 'games', roomCode, 'finalWagers'), (snap) => {
      const next: Record<string, FinalWager> = {}
      snap.docs.forEach((d) => (next[d.id] = d.data() as FinalWager))
      setWagers(next)
    })
    return unsub
  }, [roomCode])

  return wagers
}

/** Host-only: all players' Final Jeopardy answers, keyed by uid (readable by host per rules). */
export function useFinalAnswers(roomCode: string | undefined): Record<string, FinalAnswer> {
  const [answers, setAnswers] = useState<Record<string, FinalAnswer>>({})

  useEffect(() => {
    if (!roomCode) return
    const unsub = onSnapshot(collection(db, 'games', roomCode, 'finalAnswers'), (snap) => {
      const next: Record<string, FinalAnswer> = {}
      snap.docs.forEach((d) => (next[d.id] = d.data() as FinalAnswer))
      setAnswers(next)
    })
    return unsub
  }, [roomCode])

  return answers
}

export function useMyFinalWager(roomCode: string | undefined, uid: string | null): FinalWager | null {
  const [wager, setWager] = useState<FinalWager | null>(null)

  useEffect(() => {
    if (!roomCode || !uid) return
    const unsub = onSnapshot(doc(db, 'games', roomCode, 'finalWagers', uid), (snap) => {
      setWager(snap.exists() ? (snap.data() as FinalWager) : null)
    })
    return unsub
  }, [roomCode, uid])

  return wager
}

export function useMyFinalAnswer(roomCode: string | undefined, uid: string | null): FinalAnswer | null {
  const [answer, setAnswer] = useState<FinalAnswer | null>(null)

  useEffect(() => {
    if (!roomCode || !uid) return
    const unsub = onSnapshot(doc(db, 'games', roomCode, 'finalAnswers', uid), (snap) => {
      setAnswer(snap.exists() ? (snap.data() as FinalAnswer) : null)
    })
    return unsub
  }, [roomCode, uid])

  return answer
}
