import { CloudStorageService } from '@/services/storage/cloudStorage'
import { getAnalysis, clearAllAnalysis } from '@/utils/storage/analysisStore'
import { AuthService } from '@/services/auth/authService'
import type { SkinAnalysis } from '@/types'

export interface MigrationResult {
  success: boolean
  migratedCount: number
  errors: string[]
  duration: number
}

export class MigrationService {
  // Migrer toutes les analyses locales vers le cloud
  static async migrateLocalAnalyses(userId: string): Promise<MigrationResult> {
    const startTime = Date.now()
    let migratedCount = 0
    const errors: string[] = []

    try {
      // Récupérer toutes les analyses locales
      const localAnalyses = await this.getAllLocalAnalyses()
      
      console.log(`Migration: ${localAnalyses.length} analyses trouvées localement`)

      for (const [id, analysis] of localAnalyses) {
        try {
          await CloudStorageService.saveAnalysis(userId, analysis, {
            migrated_from_local: true,
            source: 'migration'
          })
          
          migratedCount++
          console.log(`Migration: Analyse ${id} migrée avec succès`)
          
        } catch (error) {
          const errorMsg = `Erreur migration analyse ${id}: ${error}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      // Mettre à jour le compteur utilisateur
      if (migratedCount > 0) {
        await AuthService.updateProfile(userId, {
          analyses_count: migratedCount
        })
      }

      const duration = Date.now() - startTime
      
      return {
        success: errors.length === 0,
        migratedCount,
        errors,
        duration
      }

    } catch (error) {
      return {
        success: false,
        migratedCount,
        errors: [`Erreur générale migration: ${error}`],
        duration: Date.now() - startTime
      }
    }
  }

  // Nettoyer analyses locales après migration réussie
  static async clearLocalAnalysesAfterMigration(
    confirmationCallback?: () => Promise<boolean>
  ): Promise<boolean> {
    if (confirmationCallback) {
      const confirmed = await confirmationCallback()
      if (!confirmed) return false
    }

    try {
      await clearAllAnalysis()
      console.log('Migration: Analyses locales nettoyées')
      return true
    } catch (error) {
      console.error('Erreur nettoyage analyses locales:', error)
      return false
    }
  }

  // Vérifier si des analyses locales existent
  static async hasLocalAnalyses(): Promise<boolean> {
    try {
      const keys = await this.getLocalAnalysisKeys()
      return keys.length > 0
    } catch (error) {
      console.error('Erreur vérification analyses locales:', error)
      return false
    }
  }

  // Récupérer le nombre d'analyses locales
  static async getLocalAnalysesCount(): Promise<number> {
    try {
      const keys = await this.getLocalAnalysisKeys()
      return keys.length
    } catch (error) {
      console.error('Erreur comptage analyses locales:', error)
      return 0
    }
  }

  // Récupérer toutes les analyses locales
  private static async getAllLocalAnalyses(): Promise<[string, SkinAnalysis][]> {
    const analyses: [string, SkinAnalysis][] = []
    
    try {
      // Parcourir IndexedDB pour récupérer toutes les analyses
      const keys = await this.getLocalAnalysisKeys()
      
      for (const key of keys) {
        const analysis = await getAnalysis(key)
        if (analysis) {
          analyses.push([key, analysis])
        }
      }
    } catch (error) {
      console.error('Erreur récupération analyses locales:', error)
    }

    return analyses
  }

  // Récupérer les clés des analyses locales
  private static async getLocalAnalysisKeys(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('dermai-db', 2)
      
      request.onsuccess = () => {
        const db = request.result
        
        // Vérifier si l'object store existe
        if (!db.objectStoreNames.contains('analysis')) {
          resolve([])
          return
        }

        const transaction = db.transaction(['analysis'], 'readonly')
        const store = transaction.objectStore('analysis')
        const keysRequest = store.getAllKeys()
        
        keysRequest.onsuccess = () => {
          resolve(keysRequest.result as string[])
        }
        
        keysRequest.onerror = () => {
          reject(keysRequest.error)
        }
      }
      
      request.onerror = () => {
        reject(request.error)
      }
      
      request.onupgradeneeded = () => {
        // Base de données n'existe pas encore
        resolve([])
      }
    })
  }

  // Sauvegarder une analyse spécifique depuis le local vers le cloud
  static async migrateSpecificAnalysis(
    userId: string, 
    analysisId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const analysis = await getAnalysis(analysisId)
      if (!analysis) {
        return { success: false, error: 'Analyse locale non trouvée' }
      }

      await CloudStorageService.saveAnalysis(userId, analysis, {
        migrated_from_local: true,
        source: 'manual_migration'
      })

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: `Erreur migration: ${error}` 
      }
    }
  }

  // Créer un rapport de migration
  static async generateMigrationReport(userId: string): Promise<{
    localCount: number
    cloudCount: number
    needsMigration: boolean
    estimatedDuration: number
  }> {
    try {
      const localCount = await this.getLocalAnalysesCount()
      const cloudCount = await CloudStorageService.getUserAnalysesCount(userId)
      
      return {
        localCount,
        cloudCount,
        needsMigration: localCount > 0,
        estimatedDuration: localCount * 2000 // 2s par analyse estimé
      }
    } catch (error) {
      console.error('Erreur génération rapport migration:', error)
      return {
        localCount: 0,
        cloudCount: 0,
        needsMigration: false,
        estimatedDuration: 0
      }
    }
  }
}
