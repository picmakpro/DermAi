import { createHash } from 'crypto'
import { logger } from './Logger'

/**
 * 🔥 CACHE MANAGER INTELLIGENT - SPRINT 3 OPTIMISATION
 * Cache intelligent pour réduire les appels OpenAI répétitifs
 * Système de similarité pour éviter les analyses identiques
 */

export interface CacheEntry<T> {
  key: string
  data: T
  timestamp: number
  ttl: number
  metadata: {
    userProfile: any
    requestHash: string
    similarity?: number
  }
}

export interface CacheConfig {
  ttl: number // Time to live en millisecondes
  maxSize: number // Nombre max d'entrées
  similarityThreshold: number // Seuil de similarité (0-1)
}

export class CacheManager {
  private static instance: CacheManager
  private cache = new Map<string, CacheEntry<any>>()
  
  // Configuration par type de cache
  private static readonly CONFIGS = {
    diagnostic: {
      ttl: 24 * 60 * 60 * 1000, // 24h
      maxSize: 1000,
      similarityThreshold: 0.95 // Très strict pour diagnostic
    },
    routine: {
      ttl: 12 * 60 * 60 * 1000, // 12h
      maxSize: 500,
      similarityThreshold: 0.85 // Moins strict pour routine
    },
    products: {
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 jours
      maxSize: 200,
      similarityThreshold: 0.90 // Strict pour produits
    }
  }

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Génère une clé de cache basée sur le contenu
   */
  private generateCacheKey(type: string, data: any): string {
    const content = JSON.stringify(data, Object.keys(data).sort())
    const hash = createHash('sha256').update(content).digest('hex').substring(0, 16)
    return `${type}:${hash}`
  }

  /**
   * Calcule la similarité entre deux profils utilisateur
   */
  private calculateSimilarity(profile1: any, profile2: any): number {
    if (!profile1 || !profile2) return 0

    let score = 0
    let totalFields = 0

    // Comparaison âge (tolérance ±2 ans)
    if (profile1.age && profile2.age) {
      const ageDiff = Math.abs(profile1.age - profile2.age)
      score += ageDiff <= 2 ? 1 : Math.max(0, 1 - ageDiff / 10)
      totalFields++
    }

    // Comparaison type de peau (exact match)
    if (profile1.skinType && profile2.skinType) {
      score += profile1.skinType === profile2.skinType ? 1 : 0
      totalFields++
    }

    // Comparaison préoccupations (intersection)
    if (profile1.concerns && profile2.concerns) {
      const concerns1 = new Set(profile1.concerns)
      const concerns2 = new Set(profile2.concerns)
      const intersection = new Set([...concerns1].filter(x => concerns2.has(x)))
      const union = new Set([...concerns1, ...concerns2])
      score += union.size > 0 ? intersection.size / union.size : 0
      totalFields++
    }

    return totalFields > 0 ? score / totalFields : 0
  }

  /**
   * Recherche une entrée similaire dans le cache
   */
  private findSimilarEntry<T>(
    type: keyof typeof CacheManager.CONFIGS,
    userProfile: any
  ): CacheEntry<T> | null {
    const config = CacheManager.CONFIGS[type]
    const now = Date.now()

    let bestMatch: CacheEntry<T> | null = null
    let bestSimilarity = 0

    for (const entry of this.cache.values()) {
      // Vérifier expiration
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(entry.key)
        continue
      }

      // Vérifier type
      if (!entry.key.startsWith(type)) continue

      // Calculer similarité
      const similarity = this.calculateSimilarity(userProfile, entry.metadata.userProfile)
      
      if (similarity > config.similarityThreshold && similarity > bestSimilarity) {
        bestMatch = entry
        bestSimilarity = similarity
      }
    }

    if (bestMatch) {
      logger.info(`Cache hit similaire trouvé`, {
        type,
        similarity: bestSimilarity,
        cacheKey: bestMatch.key
      })
    }

    return bestMatch
  }

  /**
   * Récupère une entrée du cache (exact ou similaire)
   */
  async get<T>(
    type: keyof typeof CacheManager.CONFIGS,
    data: any,
    userProfile?: any
  ): Promise<T | null> {
    const key = this.generateCacheKey(type, data)
    const now = Date.now()

    // Recherche exacte
    const exactEntry = this.cache.get(key)
    if (exactEntry && now - exactEntry.timestamp < exactEntry.ttl) {
      logger.info(`Cache hit exact`, { type, key })
      return exactEntry.data
    }

    // Recherche similaire si profil fourni
    if (userProfile) {
      const similarEntry = this.findSimilarEntry<T>(type, userProfile)
      if (similarEntry) {
        logger.info(`Cache hit similaire`, { 
          type, 
          originalKey: key,
          similarKey: similarEntry.key,
          similarity: similarEntry.metadata.similarity
        })
        return similarEntry.data
      }
    }

    // Nettoyer entrée expirée si elle existe
    if (exactEntry) {
      this.cache.delete(key)
    }

    logger.info(`Cache miss`, { type, key })
    return null
  }

  /**
   * Stocke une entrée dans le cache
   */
  async set<T>(
    type: keyof typeof CacheManager.CONFIGS,
    data: any,
    result: T,
    userProfile?: any
  ): Promise<void> {
    const config = CacheManager.CONFIGS[type]
    const key = this.generateCacheKey(type, data)
    
    // Vérifier taille du cache et nettoyer si nécessaire
    if (this.cache.size >= config.maxSize) {
      this.cleanup(type)
    }

    const entry: CacheEntry<T> = {
      key,
      data: result,
      timestamp: Date.now(),
      ttl: config.ttl,
      metadata: {
        userProfile,
        requestHash: createHash('md5').update(JSON.stringify(data)).digest('hex')
      }
    }

    this.cache.set(key, entry)
    
    logger.info(`Cache set`, { 
      type, 
      key, 
      cacheSize: this.cache.size,
      ttl: config.ttl 
    })
  }

  /**
   * Nettoie les entrées expirées d'un type donné
   */
  private cleanup(type: string): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(type) && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    logger.info(`Cache cleanup`, { type, entriesRemoved: cleaned })
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    logger.info(`Cache cleared`, { entriesRemoved: size })
  }

  /**
   * Statistiques du cache
   */
  getStats(): {
    totalEntries: number
    entriesByType: Record<string, number>
    memoryUsage: number
  } {
    const entriesByType: Record<string, number> = {}
    let memoryUsage = 0

    for (const [key, entry] of this.cache.entries()) {
      const type = key.split(':')[0]
      entriesByType[type] = (entriesByType[type] || 0) + 1
      
      // Estimation approximative de l'usage mémoire
      memoryUsage += JSON.stringify(entry).length * 2 // UTF-16
    }

    return {
      totalEntries: this.cache.size,
      entriesByType,
      memoryUsage
    }
  }

  /**
   * Préchauffe le cache avec des données communes
   */
  async warmup(): Promise<void> {
    logger.info('Cache warmup démarré')
    
    // Ici on pourrait précharger des résultats pour des profils types
    // Par exemple : peau grasse 25 ans, peau sèche 45 ans, etc.
    
    logger.info('Cache warmup terminé')
  }
}

// Export singleton
export const cacheManager = CacheManager.getInstance()

/**
 * Décorateur pour mettre en cache automatiquement les résultats de méthodes
 */
export function Cacheable(
  type: keyof typeof CacheManager.CONFIGS,
  keyExtractor?: (args: any[]) => any
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cache = CacheManager.getInstance()
      const cacheKey = keyExtractor ? keyExtractor(args) : args[0]
      
      // Essayer de récupérer du cache
      const cached = await cache.get(type, cacheKey)
      if (cached) {
        return cached
      }

      // Exécuter la méthode originale
      const result = await method.apply(this, args)
      
      // Stocker en cache
      await cache.set(type, cacheKey, result)
      
      return result
    }
  }
}
