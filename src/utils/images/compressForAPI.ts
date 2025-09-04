/**
 * Aggressive image compression for API upload
 * Optimized for Vercel and payload limits
 */

export interface CompressionOptions {
  maxWidth: number
  maxHeight: number
  quality: number
  format: 'jpeg' | 'webp'
}

// Optimized configuration for Vercel
const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1024,   // Reduced from 1920 to 1024
  maxHeight: 1024,  // Reduced from 1080 to 1024
  quality: 0.6,     // Reduced from 0.8 to 0.6
  format: 'jpeg'    // JPEG is typically more compact than WebP for AI
}

/**
 * Aggressively compress a single image for API usage
 */
export async function compressImageForAPI(
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<string> {
  const config = { ...DEFAULT_OPTIONS, ...options }

  try {
    // Create an Image element from the file
    const img = await createImageFromFile(file)

    // Compute new dimensions while preserving aspect ratio
    const { width, height } = calculateOptimalDimensions(
      img.naturalWidth,
      img.naturalHeight,
      config.maxWidth,
      config.maxHeight
    )

    // Create canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to create canvas context')
    }

    canvas.width = width
    canvas.height = height

    // Rendering optimizations for quality
    ;(ctx as CanvasRenderingContext2D).imageSmoothingEnabled = true
    ;(ctx as CanvasRenderingContext2D).imageSmoothingQuality = 'high'

    // Draw the resized image
    ctx.drawImage(img, 0, 0, width, height)

    // Convert to base64 with compression
    const dataUrl = canvas.toDataURL(`image/${config.format}`, config.quality)

    // Cleanup
    canvas.remove()
    URL.revokeObjectURL((img as HTMLImageElement).src)

    console.log(
      `📦 Compression: ${file.size} → ${Math.round(
        dataUrl.length * 0.75
      )} bytes (${Math.round(config.quality * 100)}% quality)`
    )

    return dataUrl
  } catch (error) {
    console.error('❌ Image compression error:', error)
    // Fallback: convert without compression
    return convertFileToBase64Fallback(file)
  }
}

/**
 * Compress multiple images in parallel with a concurrency cap
 */
export async function compressImagesForAPI(
  files: File[],
  options: Partial<CompressionOptions> = {}
): Promise<string[]> {
  const batchSize = 2 // Process at most 2 images in parallel
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
 * Compute optimal dimensions while preserving aspect ratio
 */
function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight }

  // Downscale if needed
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
 * Create an Image element from a File
 */
function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Fallback without compression
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
 * Estimate JSON payload size when embedding multiple images
 */
export function estimatePayloadSize(imageCount: number, avgImageSize: number): number {
  // Approximate JSON size without images
  const basePayloadSize = 2000 // ~2 KB for questionnaire + metadata

  // Base64-encoded images are ~33% larger than binary
  const totalImageSize = imageCount * avgImageSize * 1.33

  return basePayloadSize + totalImageSize
}

/**
 * Compression recommendations based on image count
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
