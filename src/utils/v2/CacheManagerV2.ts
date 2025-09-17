import { createHash } from 'crypto'
import { PureDiagnostic, PersonalizedRoutine } from '@/schemas/v2'
import { Logger } from '@/utils/Logger'

/**
 * Cache Manager V2 - Multi-niveaux pour architecture IA-First
 * 
 * STRATÉGIE CACHE :
 * - Diagnostic : Cache par hash d'images (24h)
 * - Routine : Cache par diagnostic + profil (12h)  
 * - Produits : Cache par routine + budget (6h)
 * - Final : Cache assemblage final (3h)
 */
export class CacheManagerV2 {
  private logger = Logger.getInstance('CacheManagerV2')
  private cache = new Map<string, { data: any; expiry: number }>()

  /**
   * Générer clé cache pour diagnostic (basée sur hash des images)
   */
  generateDiagnosticKey(photos: Array<{ url: string; type?: string }>): string {
    const photoHashes = photos.map(photo => this.hashString(photo.url)).join('|')
    return `diagnostic_v2_${this.hashString(photoHashes)}`
  }

  /**
   * Générer clé cache pour routine (basée sur diagnostic + profil)
   */
  generateRoutineKey(
    diagnostic: PureDiagnostic, 
    userProfile: { age: number; gender: string; skinType?: string }
  ): string {
    const diagnosticHash = this.hashString(JSON.stringify({
      skinType: diagnostic.skinType,
      scores: diagnostic.scores.overall,
      issues: diagnostic.zoneSpecificIssues.map(i => `${i.zone}:${i.problem}:${i.intensity}`)
    }))
    
    const profileHash = this.hashString(JSON.stringify({
      age: userProfile.age,
      gender: userProfile.gender,
      skinType: userProfile.skinType
    }))
    
    return `routine_v2_${diagnosticHash}_${profileHash}`
  }

  /**
   * Générer clé cache pour produits (basée sur routine + budget)
   */
  generateProductsKey(routine: PersonalizedRoutine, budget: number): string {
    const routineHash = this.hashString(JSON.stringify({
      immediateSteps: routine.phases.immediate.steps.length,
      adaptationSteps: routine.phases.adaptation.steps.length,
      maintenanceSteps: routine.phases.maintenance.steps.length,
      careTypes: this.extractCareTypes(routine)
    }))
    
    return `products_v2_${routineHash}_${budget}`
  }

  /**
   * 🔥 NOUVEAU: Générer clé cache pour Top 3 produits V3
   */
  generateProductsV3Key(routine: PersonalizedRoutine, budget: number): string {
    const routineHash = this.hashObject({
      phases: Object.keys(routine.phases).map(phase => ({
        phase,
        steps: routine.phases[phase].steps.map(step => ({
          careType: step.careType,
          targetProblem: step.targetProblem,
          targetZones: step.targetZones,
          timing: step.timing
        }))
      })),
      budget,
      version: 'v3' // Nouvelle version pour Top 3
    })
    
    return `products_v3_${routineHash}`
  }

  /**
   * Générer clé cache pour assemblage final
   */
  generateFinalKey(diagnosticKey: string, routineKey: string, productsKey: string): string {
    const combinedHash = this.hashString(`${diagnosticKey}|${routineKey}|${productsKey}`)
    return `final_v2_${combinedHash}`
  }

  /**
   * Récupérer données du cache
   */
  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key)
    
    if (!cached) {
      this.logger.debug('Cache miss', { key })
      return null
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(key)
      this.logger.debug('Cache expired', { key })
      return null
    }

    this.logger.debug('Cache hit', { key })
    return cached.data as T
  }

  /**
   * Stocker données dans le cache
   */
  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    const expiry = Date.now() + ttlMs
    this.cache.set(key, { data, expiry })
    
    this.logger.debug('Cache set', { 
      key, 
      ttlMs, 
      expiresAt: new Date(expiry).toISOString() 
    })
  }

  /**
   * Invalider cache par pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    )
    
    keysToDelete.forEach(key => this.cache.delete(key))
    
    this.logger.info('Cache invalidated', { 
      pattern, 
      deletedKeys: keysToDelete.length 
    })
  }

  /**
   * Nettoyer cache expiré
   */
  async cleanup(): Promise<void> {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
    
    this.logger.info('Cache cleanup completed', { 
      deletedKeys: keysToDelete.length,
      remainingKeys: this.cache.size
    })
  }

  /**
   * Statistiques du cache
   */
  getStats(): {
    totalKeys: number
    expiredKeys: number
    memoryUsage: number
  } {
    const now = Date.now()
    let expiredKeys = 0
    
    for (const [, value] of this.cache.entries()) {
      if (now > value.expiry) {
        expiredKeys++
      }
    }
    
    // Estimation approximative de l'usage mémoire
    const memoryUsage = JSON.stringify(Array.from(this.cache.values())).length
    
    return {
      totalKeys: this.cache.size,
      expiredKeys,
      memoryUsage
    }
  }

  /**
   * 🔥 NOUVEAU: Statistiques cache spécifiques Top 3
   */
  async getCacheStatsV3(): Promise<{
    hitRate: number
    totalRequests: number
    averageProductsPerRequest: number
    diversificationSuccessRate: number
  }> {
    const keys = await this.getAllKeys('products_v3_*')
    let totalRequests = 0
    let hits = 0
    let totalProducts = 0
    let diversificationSuccesses = 0
    
    for (const key of keys) {
      const data = await this.get(key)
      if (data) {
        totalRequests++
        hits++
        totalProducts += (data as any).selectedProducts?.length * 3 || 0
        if ((data as any).coherenceValidation?.diversificationSuccess) {
          diversificationSuccesses++
        }
      }
    }
    
    return {
      hitRate: totalRequests > 0 ? hits / totalRequests : 0,
      totalRequests,
      averageProductsPerRequest: totalRequests > 0 ? totalProducts / totalRequests : 0,
      diversificationSuccessRate: totalRequests > 0 ? diversificationSuccesses / totalRequests : 0
    }
  }

  /**
   * Récupérer toutes les clés correspondant à un pattern
   */
  private async getAllKeys(pattern: string): Promise<string[]> {
    return Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern.replace('*', ''))
    )
  }

  /**
   * Hasher une chaîne de caractères
   */
  private hashString(input: string): string {
    return createHash('sha256').update(input).digest('hex').substring(0, 16)
  }

  /**
   * 🔥 NOUVEAU: Hasher un objet (pour clés V3)
   */
  private hashObject(obj: any): string {
    return this.hashString(JSON.stringify(obj))
  }

  /**
   * Extraire les types de soins d'une routine
   */
  private extractCareTypes(routine: PersonalizedRoutine): string[] {
    const careTypes = new Set<string>()
    
    Object.values(routine.phases).forEach(phase => {
      phase.steps.forEach(step => {
        careTypes.add(step.careType)
      })
    })
    
    return Array.from(careTypes).sort()
  }
}

// Instance singleton pour réutilisation
export const cacheManagerV2 = new CacheManagerV2()

// Nettoyage automatique toutes les heures
if (typeof window === 'undefined') { // Côté serveur seulement
  setInterval(() => {
    cacheManagerV2.cleanup()
  }, 60 * 60 * 1000) // 1 heure
}
