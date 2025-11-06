/**
 * Compression adaptative des images pour l'envoi à l'API
 * Optimisé pour Vercel avec monitoring mémoire temps réel
 */

export interface CompressionOptions {
  maxWidth: number
  maxHeight: number
  quality: number
  format: 'jpeg' | 'webp'
}

export interface MemoryMetrics {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  usagePercent: number
}

export interface AdaptiveCompressionResult {
  compressedImages: string[]
  compressionLevel: 'low' | 'medium' | 'high' | 'extreme'
  memoryBefore: MemoryMetrics | null
  memoryAfter: MemoryMetrics | null
  payloadSize: number
  compressionRatio: number
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
 * Mesure l'usage mémoire actuel du navigateur
 */
export function getMemoryMetrics(): MemoryMetrics | null {
  if (typeof window === 'undefined' || !(performance as any).memory) {
    return null
  }
  
  const memory = (performance as any).memory
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercent: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
  }
}

/**
 * Détermine le niveau de compression selon l'usage mémoire et le nombre d'images
 */
export function getAdaptiveCompressionLevel(
  imageCount: number, 
  memoryMetrics: MemoryMetrics | null
): 'low' | 'medium' | 'high' | 'extreme' {
  // Facteurs de décision
  const memoryPressure = memoryMetrics?.usagePercent || 0
  const imageLoad = imageCount
  
  // Compression extrême si mémoire critique (>80%) ou beaucoup d'images (>4)
  if (memoryPressure > 80 || imageLoad > 4) {
    return 'extreme'
  }
  
  // Compression élevée si mémoire élevée (>60%) ou plusieurs images (>2)
  if (memoryPressure > 60 || imageLoad > 2) {
    return 'high'
  }
  
  // Compression moyenne si mémoire modérée (>40%) ou 2 images
  if (memoryPressure > 40 || imageLoad === 2) {
    return 'medium'
  }
  
  // Compression faible pour usage mémoire optimal et 1 image
  return 'low'
}

/**
 * Options de compression par niveau adaptatif
 */
export function getCompressionOptionsForLevel(level: 'low' | 'medium' | 'high' | 'extreme'): CompressionOptions {
  switch (level) {
    case 'low':
      return { maxWidth: 1600, maxHeight: 1600, quality: 0.85, format: 'jpeg' }
    case 'medium':
      return { maxWidth: 1200, maxHeight: 1200, quality: 0.7, format: 'jpeg' }
    case 'high':
      return { maxWidth: 800, maxHeight: 800, quality: 0.55, format: 'jpeg' }
    case 'extreme':
      return { maxWidth: 600, maxHeight: 600, quality: 0.4, format: 'jpeg' }
  }
}

/**
 * Compression adaptative intelligente basée sur mémoire et performance
 */
export async function compressImagesAdaptive(files: File[]): Promise<AdaptiveCompressionResult> {
  const memoryBefore = getMemoryMetrics()
  const startTime = Date.now()
  
  // Déterminer niveau de compression optimal
  const compressionLevel = getAdaptiveCompressionLevel(files.length, memoryBefore)
  const options = getCompressionOptionsForLevel(compressionLevel)
  
  console.log(`🧠 Compression adaptative: ${compressionLevel} (mémoire: ${memoryBefore?.usagePercent.toFixed(1)}%)`)
  
  // Compresser les images
  const compressedImages = await compressImagesForAPI(files, options)
  
  const memoryAfter = getMemoryMetrics()
  const endTime = Date.now()
  
  // Calculer métriques
  const originalSize = files.reduce((sum, file) => sum + file.size, 0)
  const compressedSize = compressedImages.reduce((sum, img) => sum + (img.length * 0.75), 0) // Base64 overhead
  const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1
  
  const result: AdaptiveCompressionResult = {
    compressedImages,
    compressionLevel,
    memoryBefore,
    memoryAfter,
    payloadSize: compressedSize,
    compressionRatio
  }
  
  // Logging détaillé
  console.log(`📊 Compression terminée en ${endTime - startTime}ms:`)
  console.log(`   - Niveau: ${compressionLevel}`)
  console.log(`   - Taille: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB`)
  console.log(`   - Ratio: ${(compressionRatio * 100).toFixed(1)}%`)
  
  if (memoryBefore && memoryAfter) {
    const memoryDelta = memoryAfter.usedJSHeapSize - memoryBefore.usedJSHeapSize
    console.log(`   - Mémoire: ${memoryBefore.usagePercent.toFixed(1)}% → ${memoryAfter.usagePercent.toFixed(1)}% (Δ${(memoryDelta / 1024 / 1024).toFixed(2)}MB)`)
  }
  
  // Alertes si problèmes détectés
  if (memoryAfter && memoryAfter.usagePercent > 85) {
    console.warn(`⚠️ Usage mémoire critique: ${memoryAfter.usagePercent.toFixed(1)}%`)
  }
  
  if (compressedSize > 4 * 1024 * 1024) { // 4MB limit Vercel
    console.warn(`⚠️ Payload trop volumineux: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`)
  }
  
  return result
}

/**
 * Recommandations de compression selon le nombre d'images (legacy)
 */
export function getCompressionOptionsForCount(imageCount: number): CompressionOptions {
  const level = getAdaptiveCompressionLevel(imageCount, getMemoryMetrics())
  return getCompressionOptionsForLevel(level)
}

/**
 * Monitoring continu de la mémoire pendant le traitement
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor
  private intervalId: NodeJS.Timeout | null = null
  private callbacks: ((metrics: MemoryMetrics) => void)[] = []
  
  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor()
    }
    return MemoryMonitor.instance
  }
  
  startMonitoring(intervalMs: number = 1000): void {
    if (this.intervalId) return
    
    this.intervalId = setInterval(() => {
      const metrics = getMemoryMetrics()
      if (metrics) {
        this.callbacks.forEach(callback => callback(metrics))
        
        // Alerte automatique si usage critique
        if (metrics.usagePercent > 90) {
          console.error(`🚨 Mémoire critique: ${metrics.usagePercent.toFixed(1)}%`)
        }
      }
    }, intervalMs)
  }
  
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
  
  onMemoryChange(callback: (metrics: MemoryMetrics) => void): void {
    this.callbacks.push(callback)
  }
  
  removeCallback(callback: (metrics: MemoryMetrics) => void): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback)
  }
}
