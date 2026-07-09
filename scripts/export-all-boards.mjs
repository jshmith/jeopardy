#!/usr/bin/env node
// One-off backup script: dumps every doc in the `boards` collection to its own
// JSON file, using the Admin SDK so it isn't scoped to a single ownerUid the
// way the in-app export button is.
//
// Usage: node scripts/export-all-boards.mjs <path-to-service-account-key.json> [outDir]

import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const keyPath = process.argv[2]
const outDir = process.argv[3] ?? 'exported-boards'

if (!keyPath) {
  console.error('Usage: node scripts/export-all-boards.mjs <path-to-service-account-key.json> [outDir]')
  console.error('Download a key at: Firebase console -> Project settings -> Service accounts -> Generate new private key')
  process.exit(1)
}

function sanitizeFilename(name) {
  const cleaned = name.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-')
  return cleaned || 'untitled'
}

const serviceAccount = JSON.parse(await readFile(path.resolve(keyPath), 'utf8'))
initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()
const snapshot = await db.collection('boards').get()

await mkdir(outDir, { recursive: true })

let count = 0
for (const doc of snapshot.docs) {
  const { name, categories, doubleCategories, finalJeopardy } = doc.data()
  const exportData = { name, categories, doubleCategories, finalJeopardy }
  const filename = `${sanitizeFilename(name ?? 'untitled')}-${doc.id}.json`
  await writeFile(path.join(outDir, filename), JSON.stringify(exportData, null, 2))
  count++
}

console.log(`Exported ${count} board(s) to ${outDir}/`)
