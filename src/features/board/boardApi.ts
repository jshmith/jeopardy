import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  CATEGORIES_PER_ROUND,
  CLUES_PER_CATEGORY,
  DOUBLE_VALUES,
  SINGLE_VALUES,
  type Board,
  type BoardCategory,
} from '../../types/game'

function blankCategories(values: number[]): BoardCategory[] {
  return Array.from({ length: CATEGORIES_PER_ROUND }, () => ({
    title: '',
    clues: Array.from({ length: CLUES_PER_CATEGORY }, (_, i) => ({
      value: values[i],
      text: '',
      imageUrl: null,
      answer: '',
      isDailyDouble: false,
      mode: 'standard' as const,
    })),
  }))
}

export function blankBoard(): Omit<Board, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'Untitled Board',
    categories: blankCategories(SINGLE_VALUES),
    doubleCategories: blankCategories(DOUBLE_VALUES),
    finalJeopardy: { category: '', text: '', imageUrl: null, answer: '' },
  }
}

export async function listBoards(ownerUid: string): Promise<Board[]> {
  const q = query(collection(db, 'boards'), where('ownerUid', '==', ownerUid))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Board, 'id'>) }))
}

export async function getBoard(boardId: string): Promise<Board | null> {
  const snap = await getDoc(doc(db, 'boards', boardId))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Board, 'id'>) }
}

export async function createBoard(ownerUid: string): Promise<string> {
  const ref = doc(collection(db, 'boards'))
  await setDoc(ref, {
    ownerUid,
    ...blankBoard(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function createBoardFromData(
  ownerUid: string,
  data: Omit<Board, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const ref = doc(collection(db, 'boards'))
  await setDoc(ref, {
    ownerUid,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function saveBoard(
  boardId: string,
  ownerUid: string,
  data: Omit<Board, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  await setDoc(
    doc(db, 'boards', boardId),
    { ownerUid, ...data, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export async function renameBoard(boardId: string, name: string): Promise<void> {
  await setDoc(doc(db, 'boards', boardId), { name, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteBoard(boardId: string): Promise<void> {
  await deleteDoc(doc(db, 'boards', boardId))
}
