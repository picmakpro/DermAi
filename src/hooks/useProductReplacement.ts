/**
 * 🔄 HOOK REACT - REMPLACEMENT DE PRODUITS
 * 
 * Hook personnalisé pour la gestion complète du processus de remplacement
 * de produits avec alternatives, validation et prévention utilisateur
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { useState, useCallback, useRef } from 'react'
import { EnrichedProduct } from '@/types/productSync'
import { AlternativeProduct, AlternativeCriteria } from '@/types/alternatives'
import { useProductSync } from './useProductSync'
import { useAlternatives } from './useAlternatives'

interface ReplacementStep {
  step: 'idle' | 'selecting' | 'confirming' | 'replacing' | 'completed' | 'error'
  progress: number
  message: string
}

interface ReplacementImpact {
  routineChanges: string[]
  priceImpact: number
  compatibilityWarnings: string[]
  transitionPeriod: string
  recommendedActions: string[]
}

interface UseProductReplacementReturn {
  // État du processus
  currentStep: ReplacementStep
  isProcessing: boolean
  
  // Données de remplacement
  originalProduct: EnrichedProduct | null
  selectedAlternative: AlternativeProduct | null
  replacementImpact: ReplacementImpact | null
  
  // Actions principales
  startReplacement: (product: EnrichedProduct, criteria?: AlternativeCriteria) => Promise<void>
  selectAlternative: (alternative: AlternativeProduct) => void
  confirmReplacement: () => Promise<void>
  cancelReplacement: () => void
  
  // Hooks intégrés
  productSync: ReturnType<typeof useProductSync>
  alternatives: ReturnType<typeof useAlternatives>
  
  // Historique
  replacementHistory: ReplacementRecord[]
}

interface ReplacementRecord {
  id: string
  timestamp: Date
  originalProduct: {
    id: string
    name: string
    brand: string
  }
  selectedAlternative: {
    id: string
    name: string
    brand: string
  }
  reason: string
  success: boolean
  userFeedback?: {
    satisfaction: number
    wouldRecommend: boolean
    comments?: string
  }
}

interface UseProductReplacementOptions {
  autoLoadAlternatives?: boolean
  requireConfirmation?: boolean
  trackHistory?: boolean
  maxHistoryEntries?: number
}

export const useProductReplacement = (
  options: UseProductReplacementOptions = {}
): UseProductReplacementReturn => {
  
  const {
    autoLoadAlternatives = true,
    requireConfirmation = true,
    trackHistory = true,
    maxHistoryEntries = 100
  } = options
  
  // Hooks intégrés
  const productSync = useProductSync()
  const alternatives = useAlternatives()
  
  // État local du processus
  const [currentStep, setCurrentStep] = useState<ReplacementStep>({
    step: 'idle',
    progress: 0,
    message: 'Prêt pour le remplacement'
  })
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Données de remplacement
  const [originalProduct, setOriginalProduct] = useState<EnrichedProduct | null>(null)
  const [selectedAlternative, setSelectedAlternative] = useState<AlternativeProduct | null>(null)
  const [replacementImpact, setReplacementImpact] = useState<ReplacementImpact | null>(null)
  
  // Historique des remplacements
  const [replacementHistory, setReplacementHistory] = useState<ReplacementRecord[]>([])
  
  // Refs pour gestion des timeouts et IDs
  const replacementIdRef = useRef<string | null>(null)
  
  /**
   * 🚀 DÉMARRAGE DU PROCESSUS DE REMPLACEMENT
   */
  const startReplacement = useCallback(async (
    product: EnrichedProduct,
    criteria: AlternativeCriteria = {}
  ) => {
    console.log(`🚀 Démarrage remplacement pour: ${product.name}`)
    
    try {
      setIsProcessing(true)
      setOriginalProduct(product)
      setSelectedAlternative(null)
      setReplacementImpact(null)
      replacementIdRef.current = `replacement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Étape 1: Initialisation
      setCurrentStep({
        step: 'selecting',
        progress: 10,
        message: 'Recherche d\'alternatives en cours...'
      })
      
      if (autoLoadAlternatives) {
        // Étape 2: Chargement des alternatives
        setCurrentStep({
          step: 'selecting',
          progress: 30,
          message: 'Analyse des produits compatibles...'
        })
        
        await alternatives.loadAlternatives(product, criteria)
        
        if (alternatives.alternativesError) {
          throw new Error(alternatives.alternativesError)
        }
        
        // Étape 3: Alternatives chargées
        setCurrentStep({
          step: 'selecting',
          progress: 70,
          message: `${alternatives.alternatives.length} alternatives trouvées`
        })
      }
      
      // Étape 4: Prêt pour sélection
      setCurrentStep({
        step: 'selecting',
        progress: 100,
        message: 'Sélectionnez une alternative'
      })
      
      console.log(`✅ ${alternatives.alternatives.length} alternatives disponibles`)
      
    } catch (error) {
      console.error('❌ Erreur lors du démarrage du remplacement:', error)
      setCurrentStep({
        step: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setIsProcessing(false)
    }
  }, [alternatives, autoLoadAlternatives])
  
  /**
   * ✅ SÉLECTION D'UNE ALTERNATIVE
   */
  const selectAlternative = useCallback((alternative: AlternativeProduct) => {
    console.log(`✅ Sélection alternative: ${alternative.name}`)
    
    setSelectedAlternative(alternative)
    alternatives.selectAlternative(alternative)
    
    // Calculer l'impact du remplacement
    const impact = calculateReplacementImpact(originalProduct!, alternative)
    setReplacementImpact(impact)
    
    if (requireConfirmation) {
      setCurrentStep({
        step: 'confirming',
        progress: 0,
        message: 'Confirmez le remplacement'
      })
    } else {
      // Remplacement automatique sans confirmation
      confirmReplacement()
    }
  }, [originalProduct, alternatives, requireConfirmation])
  
  /**
   * ✅ CONFIRMATION DU REMPLACEMENT
   */
  const confirmReplacement = useCallback(async () => {
    if (!originalProduct || !selectedAlternative) {
      console.error('❌ Produit original ou alternative manquant')
      return
    }
    
    console.log(`✅ Confirmation remplacement: ${originalProduct.name} → ${selectedAlternative.name}`)
    
    try {
      setIsProcessing(true)
      
      // Étape 1: Préparation du remplacement
      setCurrentStep({
        step: 'replacing',
        progress: 20,
        message: 'Préparation du remplacement...'
      })
      
      // Étape 2: Synchronisation
      setCurrentStep({
        step: 'replacing',
        progress: 50,
        message: 'Mise à jour de la routine...'
      })
      
      const syncResult = await productSync.replaceProduct(originalProduct, selectedAlternative)
      
      if (!syncResult.success) {
        throw new Error(syncResult.errors?.join(', ') || 'Erreur de synchronisation')
      }
      
      // Étape 3: Finalisation
      setCurrentStep({
        step: 'replacing',
        progress: 80,
        message: 'Finalisation...'
      })
      
      // Enregistrer dans l'historique
      if (trackHistory) {
        const record: ReplacementRecord = {
          id: replacementIdRef.current!,
          timestamp: new Date(),
          originalProduct: {
            id: originalProduct.id,
            name: originalProduct.name,
            brand: originalProduct.brand
          },
          selectedAlternative: {
            id: selectedAlternative.id,
            name: selectedAlternative.name,
            brand: selectedAlternative.brand
          },
          reason: selectedAlternative.alternativeReason,
          success: true
        }
        
        addToHistory(record)
      }
      
      // Étape 4: Succès
      setCurrentStep({
        step: 'completed',
        progress: 100,
        message: 'Remplacement effectué avec succès'
      })
      
      console.log('✅ Remplacement terminé avec succès')
      
      // Auto-reset après 3 secondes
      setTimeout(() => {
        resetReplacement()
      }, 3000)
      
    } catch (error) {
      console.error('❌ Erreur lors du remplacement:', error)
      
      // Enregistrer l'échec dans l'historique
      if (trackHistory && replacementIdRef.current) {
        const record: ReplacementRecord = {
          id: replacementIdRef.current,
          timestamp: new Date(),
          originalProduct: {
            id: originalProduct.id,
            name: originalProduct.name,
            brand: originalProduct.brand
          },
          selectedAlternative: {
            id: selectedAlternative.id,
            name: selectedAlternative.name,
            brand: selectedAlternative.brand
          },
          reason: selectedAlternative.alternativeReason,
          success: false
        }
        
        addToHistory(record)
      }
      
      setCurrentStep({
        step: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Erreur de remplacement'
      })
    } finally {
      setIsProcessing(false)
    }
  }, [originalProduct, selectedAlternative, productSync, trackHistory])
  
  /**
   * ❌ ANNULATION DU REMPLACEMENT
   */
  const cancelReplacement = useCallback(() => {
    console.log('❌ Annulation du remplacement')
    resetReplacement()
  }, [])
  
  /**
   * 🔄 RESET DU PROCESSUS
   */
  const resetReplacement = useCallback(() => {
    setOriginalProduct(null)
    setSelectedAlternative(null)
    setReplacementImpact(null)
    setIsProcessing(false)
    replacementIdRef.current = null
    
    setCurrentStep({
      step: 'idle',
      progress: 0,
      message: 'Prêt pour le remplacement'
    })
    
    alternatives.clearAlternatives()
  }, [alternatives])
  
  /**
   * 📊 CALCUL DE L'IMPACT DU REMPLACEMENT
   */
  const calculateReplacementImpact = useCallback((
    original: EnrichedProduct,
    alternative: AlternativeProduct
  ): ReplacementImpact => {
    const priceImpact = alternative.price && original.price 
      ? ((alternative.price - original.price) / original.price) * 100
      : 0
    
    return {
      routineChanges: alternative.switchingImpact?.routineChanges || [],
      priceImpact,
      compatibilityWarnings: alternative.switchingImpact?.compatibilityWarnings || [],
      transitionPeriod: alternative.switchingImpact?.transitionPeriod || 'Immédiat',
      recommendedActions: [
        ...(alternative.switchingImpact?.precautions || []),
        ...(priceImpact > 20 ? ['Vérifiez votre budget'] : []),
        ...(alternative.switchingImpact?.routineChanges?.length > 0 ? ['Adaptez votre routine'] : [])
      ]
    }
  }, [])
  
  /**
   * 📝 AJOUT À L'HISTORIQUE
   */
  const addToHistory = useCallback((record: ReplacementRecord) => {
    setReplacementHistory(prev => {
      const updated = [record, ...prev]
      
      // Limiter la taille de l'historique
      if (updated.length > maxHistoryEntries) {
        updated.splice(maxHistoryEntries)
      }
      
      // Sauvegarder en localStorage
      try {
        localStorage.setItem('replacementHistory', JSON.stringify(updated))
      } catch (error) {
        console.warn('⚠️ Impossible de sauvegarder l\'historique:', error)
      }
      
      return updated
    })
  }, [maxHistoryEntries])
  
  // Chargement de l'historique au montage
  useState(() => {
    if (trackHistory) {
      try {
        const saved = localStorage.getItem('replacementHistory')
        if (saved) {
          const history = JSON.parse(saved).map((record: any) => ({
            ...record,
            timestamp: new Date(record.timestamp)
          }))
          setReplacementHistory(history)
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors du chargement de l\'historique:', error)
      }
    }
  })
  
  return {
    // État du processus
    currentStep,
    isProcessing,
    
    // Données de remplacement
    originalProduct,
    selectedAlternative,
    replacementImpact,
    
    // Actions principales
    startReplacement,
    selectAlternative,
    confirmReplacement,
    cancelReplacement,
    
    // Hooks intégrés
    productSync,
    alternatives,
    
    // Historique
    replacementHistory
  }
}
