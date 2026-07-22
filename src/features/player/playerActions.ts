import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export async function submitDailyDoubleWager(roomCode: string, wager: number) {
  await updateDoc(doc(db, 'games', roomCode), {
    'dailyDouble.wager': wager,
    'dailyDouble.wagerSubmitted': true,
  })
}

export async function submitHostChoiceAnswer(roomCode: string, uid: string, answer: string) {
  await updateDoc(doc(db, 'games', roomCode), {
    [`currentClue.textAnswers.${uid}`]: answer,
  })
}

export async function submitFinalWager(roomCode: string, uid: string, wager: number) {
  await setDoc(doc(db, 'games', roomCode, 'finalWagers', uid), {
    value: wager,
    submittedAt: serverTimestamp(),
  })
}

export async function submitFinalAnswer(roomCode: string, uid: string, answer: string) {
  await setDoc(doc(db, 'games', roomCode, 'finalAnswers', uid), {
    value: answer,
    submittedAt: serverTimestamp(),
  })
}
