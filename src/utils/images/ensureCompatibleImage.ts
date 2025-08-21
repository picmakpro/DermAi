export type CompatibleImageResult = {
  file: File
  converted: boolean
  originalType: string
}

const NEEDS_CONVERSION = new Set([
  'image/heic',
  'image/heif',
  'image/avif'
])

/**
 * Convertit HEIC/HEIF/AVIF en JPEG via canvas (heic2any pour HEIC/HEIF),
 * sinon renvoie le fichier tel quel.
 */
export async function ensureCompatibleImage(inputFile: File): Promise<CompatibleImageResult> {
  const originalType = inputFile.type || ''

  // Si le type est déjà supporté largement par les navigateurs et notre pipeline
  if (!NEEDS_CONVERSION.has(originalType)) {
    // Rien à convertir : renvoyer le fichier
    return { file: inputFile, converted: false, originalType }
  }

  // Import dynamique côté client
  if (typeof window === 'undefined') {
    return { file: inputFile, converted: false, originalType }
  }

  try {
    if (originalType === 'image/heic' || originalType === 'image/heif') {
      const heic2any = (await import('heic2any')).default as any
      const blob = await heic2any({ blob: inputFile, toType: 'image/jpeg', quality: 0.92 })
      let file = new File([blob as BlobPart], changeExtension(inputFile.name, 'jpg'), { type: 'image/jpeg' })
      file = await compressJpegIfNeeded(file)
      return { file, converted: true, originalType }
    }

    if (originalType === 'image/avif') {
      // Canvas decode; certains navigateurs décodent AVIF en <img> puis canvas -> jpeg
      const jpegBlob = await drawToJpegBlob(inputFile, 0.92)
      if (jpegBlob) {
        let file = new File([jpegBlob], changeExtension(inputFile.name, 'jpg'), { type: 'image/jpeg' })
        file = await compressJpegIfNeeded(file)
        return { file, converted: true, originalType }
      }
    }

    return { file: inputFile, converted: false, originalType }
  } catch (e) {
    // En cas d'échec, renvoyer le fichier original pour ne pas bloquer
    return { file: inputFile, converted: false, originalType }
  }
}

function changeExtension(name: string, ext: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > -1 ? name.slice(0, dot) : name
  return `${base}.${ext}`
}

async function drawToJpegBlob(file: File, quality: number): Promise<Blob | null> {
  const dataUrl = await fileToDataUrl(file)
  const img = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0)
  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function compressJpegIfNeeded(file: File): Promise<File> {
  try {
    const { MAX_FILE_SIZE } = await import('@/constants')
    if (file.size <= MAX_FILE_SIZE) return file

    // Compression progressive: 0.85 -> 0.75 -> 0.65
    const qualities = [0.85, 0.75, 0.65]
    for (const q of qualities) {
      const blob = await drawToJpegBlob(file, q)
      if (!blob) break
      const compressed = new File([blob], changeExtension(file.name, 'jpg'), { type: 'image/jpeg' })
      if (compressed.size <= MAX_FILE_SIZE) return compressed
      file = compressed
    }
    return file
  } catch {
    return file
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}


