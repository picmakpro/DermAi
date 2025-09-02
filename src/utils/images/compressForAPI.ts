/**
 * Compression agressive des images pour l'envoi à l'API
 * Optimisé pour Vercel et les limites de payload
 */

export interface CompressionOptions {
  maxWidth: number
  maxHeight: number
  quality: number
  format: 'jpeg' | 'webp'
}

// Configuration optimisée pour Vercel
const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1024,    // Réduit de 1920 à 1024
  maxHeight: 1024,   // Réduit de 1080 à 1024
  quality: 0.6,      // Réduit de 0.8 à 0.6
  format: 'jpeg'     // JPEG plus compact que WebP pour l'IA
}

/**
 * Compresse une image de manière agressive pour l'API
 */
export async function compressImageForAPI(
  file: File, 
  options: Partial<CompressionOptions> = {}
): Promise<string> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  try {
    // Créer l'image
    const img = await createImageFromFile(file)
    
    // Calculer les nouvelles dimensions en gardant le ratio
    const { width, height } = calculateOptimalDimensions(
      img.naturalWidth, 
      img.naturalHeight, 
      config.maxWidth, 
      config.maxHeight
    )
    
    // Créer le canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Impossible de créer le contexte canvas')
    }
    
    canvas.width = width
    canvas.height = height
    
    // Optimisations de rendu pour la qualité
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Dessiner l'image redimensionnée
    ctx.drawImage(img, 0, 0, width, height)
    
    // Convertir en base64 avec compression
    const dataUrl = canvas.toDataURL(`image/${config.format}`, config.quality)
    
    // Nettoyer
    canvas.remove()
    URL.revokeObjectURL(img.src)
    
    console.log(`📦 Compression: ${file.size} → ${Math.round(dataUrl.length * 0.75)} bytes (${Math.round(config.quality * 100)}% qualité)`)
    
    return dataUrl
    
  } catch (error) {
    console.error('❌ Erreur compression image:', error)
    // Fallback: convertir sans compression
    return convertFileToBase64Fallback(file)
  }
}

/**
 * Compresse plusieurs images en parallèle avec limite de concurrence
 */
export async function compressImagesForAPI(
  files: File[], 
  options: Partial<CompressionOptions> = {}
): Promise<string[]> {
  const batchSize = 2 // Traiter 2 images en parallèle max
  const results: string[] = []
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(file => compressImageForAPI(file, options))
    )
    results.push(...batchResults)
  }
  
  return results
}

/**
 * Calcule les dimensions optimales en gardant le ratio
 */
function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight }
  
  // Réduire si nécessaire
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }
  
  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * Crée un élément Image à partir d'un File
 */
function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de charger l\'image'))
    }
    
    img.src = url
  })
}

/**
 * Fallback sans compression
 */
function convertFileToBase64Fallback(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Estime la taille du payload JSON avec plusieurs images
 */
export function estimatePayloadSize(imageCount: number, avgImageSize: number): number {
  // Taille approximative du JSON sans images
  const basePayloadSize = 2000 // 2KB pour questionnaire + métadonnées
  
  // Les images base64 font ~33% plus que la taille binaire
  const totalImageSize = imageCount * avgImageSize * 1.33
  
  return basePayloadSize + totalImageSize
}

/**
 * Recommandations de compression selon le nombre d'images
 */
export function getCompressionOptionsForCount(imageCount: number): CompressionOptions {
  if (imageCount === 1) {
    return { maxWidth: 1600, maxHeight: 1600, quality: 0.8, format: 'jpeg' }
  } else if (imageCount <= 3) {
    return { maxWidth: 1024, maxHeight: 1024, quality: 0.6, format: 'jpeg' }
  } else {
    return { maxWidth: 800, maxHeight: 800, quality: 0.5, format: 'jpeg' }
  }
}
