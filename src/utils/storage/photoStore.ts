// Client-side IndexedDB store for large photo payloads

const DB_NAME = 'dermai-db'
const DB_VERSION = 2 // bump version to ensure stores are created
const STORE = 'photos'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      // Créer les stores si manquants
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

export async function savePhotoDataUrl(id: string, dataUrl: string): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(dataUrl, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPhotoDataUrl(id: string): Promise<string | null> {
  const db = await openDB()
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve((req.result as string) || null)
    req.onerror = () => reject(req.error)
  })
}

export async function removePhotos(ids: string[]): Promise<void> {
  const db = await openDB()
  await Promise.all(ids.map(id => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })))
}

export async function clearAllPhotos(): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}


