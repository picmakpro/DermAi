import type { SkinAnalysis } from '@/types'
import { normalizeAssessmentFRtoEN } from '@/lib/i18n/mappers'

const DB_NAME = 'dermai-db'
const DB_VERSION = 2 // keep in sync with photoStore to ensure upgrade
const STORE = 'analysis'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos')
      }
      if (!db.objectStoreNames.contains('analysis')) {
        db.createObjectStore('analysis')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveAnalysis(id: string, data: unknown): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(data, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAnalysis(id: string): Promise<SkinAnalysis | null> {
  const db = await openDB()
  const result = await new Promise<SkinAnalysis | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })

  if (!result) return null

  // Auto-migration: normalize FR → EN and write back if changed
  const original = JSON.stringify(result.beautyAssessment)
  const normalized = normalizeAssessmentFRtoEN(result.beautyAssessment)
  const afterNormalization = JSON.stringify(normalized)

  if (original !== afterNormalization) {
    console.log('🔄 Auto-migrating analysis from FR to EN:', id)
    const migratedAnalysis = {
      ...result,
      beautyAssessment: normalized
    }
    
    // Write back the migrated version
    await saveAnalysis(id, migratedAnalysis)
    return migratedAnalysis
  }

  return result
}

export async function clearAllAnalysis(): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
