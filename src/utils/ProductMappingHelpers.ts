/**
 * 🔥 SPRINT 2 RÉEL - REFONTE ROUTINES V2 - DÉDUPLICATION INTELLIGENTE
 * ProductMappingHelpers.ts - Implémenter "un produit = un bloc d'affichage"
 * 
 * OBJECTIFS RÉELS:
 * 1. DÉDUPLICATION: Fusionner produits identiques matin/soir en un seul bloc
 * 2. COHÉRENCE: Maintenir logique dermatologique entre phases
 * 3. MÉTADONNÉES: Enrichir avec displayTitle, isTemporary, etc.
 * 4. SIMPLIFICATION: Réduire charge cognitive utilisateur (-60% blocs)
 * 5. CLARTÉ: Un produit continu = un affichage "Matin et soir"
 */

import type { UnifiedRoutineStep, RecommendedProduct, SkinAnalysis } from '@/types'
import { EnrichedCatalogService } from '@/services/catalog/enrichedCatalogService'
import { EnrichedRoutineStep } from '@/schemas/v2/routine'

/**
 * 🔥 FONCTION PRINCIPALE - DÉDUPLICATION INTELLIGENTE
 * Implémente "un produit = un bloc d'affichage"
 * Fusionne les produits identiques utilisés matin ET soir
 */
export const applyIntelligentDeduplication = (routine: UnifiedRoutineStep[]): UnifiedRoutineStep[] => {
  console.log('🔄 Démarrage déduplication intelligente...', { stepsCount: routine.length })
  
  const deduplicatedSteps: UnifiedRoutineStep[] = []
  const processedKeys = new Set<string>()
  
  // Grouper par phase d'abord
  const phases = ['immediate', 'adaptation', 'maintenance'] as const
  
  phases.forEach(phase => {
    const phaseSteps = routine.filter(step => step.phase === phase)
    console.log(`📋 Phase ${phase}: ${phaseSteps.length} étapes`)
    
    phaseSteps.forEach(step => {
      const stepKey = generateDeduplicationKey(step)
      
      if (processedKeys.has(stepKey)) {
        console.log(`⏭️ Étape déjà traitée: ${stepKey}`)
        return // Déjà traité
      }
      
      // Chercher les étapes similaires (même produit, même phase, timing différent)
      const similarSteps = phaseSteps.filter(s => 
        generateDeduplicationKey(s) === stepKey && 
        !processedKeys.has(generateDeduplicationKey(s))
      )
      
      if (similarSteps.length > 1) {
        // Fusionner les étapes similaires
        const mergedStep = mergeSteps(similarSteps)
        deduplicatedSteps.push(mergedStep)
        console.log(`🔗 Fusion: ${similarSteps.length} étapes → 1 étape`, { 
          originalTitles: similarSteps.map(s => s.title),
          mergedTitle: mergedStep.title 
        })
      } else {
        // Étape unique, garder telle quelle
        deduplicatedSteps.push(step)
        console.log(`✅ Étape unique conservée: ${step.title}`)
      }
      
      // Marquer toutes les étapes similaires comme traitées
      similarSteps.forEach(s => {
        processedKeys.add(generateDeduplicationKey(s))
      })
    })
  })
  
  console.log('✅ Déduplication terminée', { 
    avant: routine.length, 
    après: deduplicatedSteps.length,
    réduction: `${Math.round((1 - deduplicatedSteps.length / routine.length) * 100)}%`
  })
  
  return deduplicatedSteps
}

/**
 * Génère une clé unique pour identifier les produits similaires
 * Basé sur: careType + catalogId (le plus fiable) + fonction
 */
const generateDeduplicationKey = (step: UnifiedRoutineStep): string => {
  const enrichedStep = step as any // Cast pour accéder aux nouveaux champs
  
  // Utiliser catalogId du premier produit (le plus fiable)
  const catalogId = step.recommendedProducts?.[0]?.catalogId || ''
  
  // Si pas de catalogId, utiliser careType + zones ciblées
  if (!catalogId) {
    const zones = step.zones?.join('-') || 'global'
    return `${step.phase}-${step.category}-${zones}`.toLowerCase()
  }
  
  // Clé basée sur le produit réel (catalogId) + sa fonction
  // Ne pas inclure la phase pour permettre déduplication inter-phases
  return `${step.category}-${catalogId}`.toLowerCase()
}

/**
 * Fusionne plusieurs étapes similaires en une seule
 * Combine les timings et métadonnées
 */
const mergeSteps = (steps: UnifiedRoutineStep[]): UnifiedRoutineStep => {
  if (steps.length === 1) return steps[0]
  
  const baseStep = steps[0]
  const enrichedBase = baseStep as any
  
  // Combiner les timings
  const timings = steps.map(s => s.timeOfDay).filter(Boolean)
  const uniqueTimings = [...new Set(timings)]
  
  let combinedTimeOfDay: string
  if (uniqueTimings.includes('morning') && uniqueTimings.includes('evening')) {
    combinedTimeOfDay = 'both'
  } else if (uniqueTimings.length === 1) {
    combinedTimeOfDay = uniqueTimings[0]
  } else {
    combinedTimeOfDay = 'both' // Par défaut
  }
  
  // Titre unifié - priorité aux displayTitle de l'IA
  const displayTitle = enrichedBase.displayTitle || 
    baseStep.title
      .replace(/\s*-\s*(immediate|adaptation|maintenance)/gi, '') // Supprimer badges de phase
      .replace(/\s+(matin|soir)/gi, '')
      .trim()
  
  // Fusionner les conseils d'application
  const applicationAdvices = steps
    .map(s => s.applicationAdvice)
    .filter(Boolean)
    .filter((advice, index, arr) => arr.indexOf(advice) === index) // Déduplication
  
  const mergedStep: UnifiedRoutineStep = {
    ...baseStep,
    title: displayTitle,
    timeOfDay: combinedTimeOfDay as any,
    applicationAdvice: applicationAdvices.length > 1 
      ? `Matin et soir : ${applicationAdvices[0]}`
      : applicationAdvices[0] || baseStep.applicationAdvice,
    // Conserver les métadonnées du premier step
    frequency: baseStep.frequency,
    // Marquer comme étape fusionnée pour l'affichage
    isMergedStep: true,
    originalSteps: steps.length
  } as any
  
  return mergedStep
}

// Interface pour le mapping de produits
export interface ProductMapping {
  ensureProductMapping(step: UnifiedRoutineStep): UnifiedRoutineStep
  generateFallbackProduct(category: string, title: string): RecommendedProduct
  validateProductExists(catalogId: string): boolean
}

// Interface pour la cohérence inter-phases
export interface PhaseCoherence {
  ensurePhaseCoherence(routine: UnifiedRoutineStep[]): UnifiedRoutineStep[]
  propagateContinuousProducts(routine: UnifiedRoutineStep[]): UnifiedRoutineStep[]
  addIntroductionLabels(step: UnifiedRoutineStep, dayOffset: number): UnifiedRoutineStep
}

/**
 * TÂCHE 2.1: MAPPING PRODUITS GARANTI
 * Garantir qu'aucune étape de routine n'est sans produit recommandé
 */

/**
 * Assure qu'une étape de routine a un produit recommandé
 * Génère un produit fallback si nécessaire
 */
export const ensureProductMapping = (step: UnifiedRoutineStep): UnifiedRoutineStep => {
  // Si l'étape a déjà des produits recommandés, la retourner telle quelle
  if (step.recommendedProducts && step.recommendedProducts.length > 0) {
    return step
  }

  console.log(`⚠️ Étape sans produit détectée: "${step.title}" (${step.category})`)

  let product: RecommendedProduct

  // Essayer de générer un produit depuis catalogId
  if (step.catalogId) {
    try {
      const catalogProduct = EnrichedCatalogService.getProductById(step.catalogId)
      if (catalogProduct) {
        product = {
          id: catalogProduct.id,
          name: catalogProduct.name,
          brand: catalogProduct.brand,
          category: catalogProduct.category,
          price: catalogProduct.price,
          affiliateLink: catalogProduct.affiliateLink,
          catalogId: catalogProduct.id
        }
        console.log(`✅ Produit trouvé dans catalogue: ${product.brand} ${product.name}`)
      } else {
        throw new Error(`Produit non trouvé pour catalogId: ${step.catalogId}`)
      }
    } catch (error) {
      console.warn(`❌ Erreur récupération catalogId ${step.catalogId}:`, error)
      product = generateFallbackProduct(step.category, step.title)
    }
  } else {
    // Générer un produit fallback par catégorie
    product = generateFallbackProduct(step.category, step.title)
  }

  return {
    ...step,
    recommendedProducts: [product]
  }
}

/**
 * Génère un produit fallback basé sur la catégorie et le titre
 */
export const generateFallbackProduct = (category: string, title: string): RecommendedProduct => {
  const fallbackProducts: Record<string, Omit<RecommendedProduct, 'id'>> = {
    cleansing: {
      name: 'Gel Moussant Nettoyant',
      brand: 'CeraVe',
      category: 'cleanser',
      price: 12.99,
      affiliateLink: 'https://www.amazon.fr/dp/B07CG2Q5V2?tag=dermai-21',
      catalogId: 'cerave_gel_moussant'
    },
    hydration: {
      name: 'Crème Hydratante Visage',
      brand: 'CeraVe',
      category: 'moisturizer',
      price: 15.99,
      affiliateLink: 'https://www.amazon.fr/dp/B07CG2Q5V3?tag=dermai-21',
      catalogId: 'cerave_creme_hydratante'
    },
    protection: {
      name: 'Anthelios Fluid Invisible SPF 50+',
      brand: 'La Roche-Posay',
      category: 'sunscreen',
      price: 18.50,
      affiliateLink: 'https://www.amazon.fr/dp/B07CG2Q5V4?tag=dermai-21',
      catalogId: 'lrp_anthelios_fluid'
    },
    treatment: {
      name: 'Sérum Niacinamide 10%',
      brand: 'The Ordinary',
      category: 'serum',
      price: 7.20,
      affiliateLink: 'https://www.amazon.fr/dp/B01MZ3LN6S?tag=dermai-21',
      catalogId: 'ordinary_niacinamide_10'
    },
    exfoliation: {
      name: 'Sérum BHA 2%',
      brand: "Paula's Choice",
      category: 'exfoliant',
      price: 35.00,
      affiliateLink: 'https://www.amazon.fr/dp/B00949CTQQ?tag=dermai-21',
      catalogId: 'paula_choice_bha_2'
    }
  }

  const baseProduct = fallbackProducts[category] || fallbackProducts.treatment
  
  const product: RecommendedProduct = {
    id: `fallback_${category}_${Date.now()}`,
    ...baseProduct
  }

  console.log(`🔄 Produit fallback généré: ${product.brand} ${product.name} pour catégorie "${category}"`)
  
  return product
}

/**
 * Valide qu'un produit existe dans le catalogue
 */
export const validateProductExists = async (catalogId: string): Promise<boolean> => {
  try {
    const product = await EnrichedCatalogService.getProductById(catalogId)
    return !!product
  } catch (error) {
    console.warn(`❌ Validation échouée pour catalogId ${catalogId}:`, error)
    return false
  }
}

/**
 * TÂCHE 2.2: COHÉRENCE INTER-PHASES
 * Assurer la cohérence des produits continus entre phases
 */

/**
 * Assure la cohérence des produits entre les phases
 * Propage les produits continus (nettoyant, hydratant, protection) dans toutes les phases
 */
export const ensurePhaseCoherence = (routine: UnifiedRoutineStep[]): UnifiedRoutineStep[] => {
  console.log('🔄 Début vérification cohérence inter-phases')
  
  // Identifier les produits de base durables par catégorie et moment de la journée
  const baseDurableProducts = new Map<string, UnifiedRoutineStep>()
  
  // Catégories considérées comme continues
  const continuousCategories = ['cleansing', 'hydration', 'protection']
  
  routine.forEach(step => {
    if (continuousCategories.includes(step.category)) {
      const key = `${step.category}_${step.timeOfDay}`
      if (!baseDurableProducts.has(key)) {
        baseDurableProducts.set(key, step)
        console.log(`📌 Produit continu identifié: ${step.title} (${key})`)
      }
    }
  })

  // Organiser par phases
  const phases = ['immediate', 'adaptation', 'maintenance'] as const
  const routineByPhase = new Map<string, UnifiedRoutineStep[]>()
  
  phases.forEach(phase => {
    routineByPhase.set(phase, routine.filter(s => s.phase === phase))
  })

  const coherentRoutine: UnifiedRoutineStep[] = []

  // Pour chaque phase, s'assurer que les produits continus sont présents
  phases.forEach(phase => {
    const phaseSteps = routineByPhase.get(phase) || []
    const addedSteps = [...phaseSteps]

    // Vérifier chaque produit continu
    baseDurableProducts.forEach((baseStep, key) => {
      const [category, timeOfDay] = key.split('_')
      
      // Vérifier si ce produit continu existe déjà dans cette phase
      const exists = phaseSteps.some(s => 
        s.category === category && s.timeOfDay === timeOfDay
      )

      if (!exists) {
        console.log(`➕ Ajout produit continu manquant en phase ${phase}: ${baseStep.title}`)
        
        // Créer une copie du produit pour cette phase
        const continuityStep: UnifiedRoutineStep = {
          ...baseStep,
          phase: phase,
          stepNumber: phaseSteps.length + addedSteps.length - phaseSteps.length + 1,
          title: `${baseStep.title}`,
          applicationDuration: 'En continu',
          // Ajouter label d'introduction si ce n'est pas la phase immédiate
          ...(phase !== 'immediate' && {
            startAfterDays: phase === 'adaptation' ? 14 : 42,
            frequencyDetails: phase === 'adaptation' 
              ? 'Continuer depuis phase immédiate' 
              : 'Maintenir routine établie'
          })
        }
        
        addedSteps.push(continuityStep)
      }
    })

    coherentRoutine.push(...addedSteps)
  })

  console.log(`✅ Cohérence inter-phases assurée: ${coherentRoutine.length} étapes au total`)
  
  return coherentRoutine.sort((a, b) => {
    // Trier par phase puis par stepNumber
    const phaseOrder = { immediate: 1, adaptation: 2, maintenance: 3 }
    const phaseComparison = phaseOrder[a.phase] - phaseOrder[b.phase]
    if (phaseComparison !== 0) return phaseComparison
    return a.stepNumber - b.stepNumber
  })
}

/**
 * Propage les produits continus entre toutes les phases
 */
export const propagateContinuousProducts = (routine: UnifiedRoutineStep[]): UnifiedRoutineStep[] => {
  return ensurePhaseCoherence(routine)
}

/**
 * Ajoute des labels d'introduction temporels "J+X" pour nouveaux actifs
 */
export const addIntroductionLabels = (step: UnifiedRoutineStep, dayOffset: number): UnifiedRoutineStep => {
  // Catégories qui nécessitent une introduction progressive
  const progressiveCategories = ['treatment', 'exfoliation']
  
  if (!progressiveCategories.includes(step.category)) {
    return step
  }

  const labeledStep: UnifiedRoutineStep = {
    ...step,
    startAfterDays: dayOffset,
    frequencyDetails: `Introduire à partir de J+${dayOffset}`,
    applicationDuration: step.applicationDuration || `Introduction progressive dès J+${dayOffset}`
  }

  console.log(`🏷️ Label temporel ajouté: ${step.title} → J+${dayOffset}`)
  
  return labeledStep
}

/**
 * TÂCHE 2.3: SYNCHRONISATION SECTION PRODUITS
 * Synchroniser routine ↔ section "Produits Recommandés"
 */

/**
 * Extrait tous les catalogId depuis une routine complète
 * Version améliorée qui parcourt toutes les structures possibles
 */
export const extractAllCatalogIds = (analysis: SkinAnalysis): string[] => {
  const catalogIds = new Set<string>()
  
  console.log('🔍 Extraction catalogIds - Analyse structure complète')

  // 1. Routine unifiée (priorité)
  if (analysis.recommendations?.unifiedRoutine) {
    analysis.recommendations.unifiedRoutine.forEach(step => {
      if (step.catalogId) {
        catalogIds.add(step.catalogId)
        console.log(`📋 Unified routine: ${step.catalogId} (${step.title})`)
      }
      
      // Produits recommandés dans l'étape
      step.recommendedProducts?.forEach(product => {
        if (product.catalogId) {
          catalogIds.add(product.catalogId)
          console.log(`📦 Product in step: ${product.catalogId} (${product.name})`)
        }
      })
    })
  }

  // 2. Routine par phases (structure avancée)
  if (analysis.recommendations?.routine && typeof analysis.recommendations.routine === 'object') {
    const routine = analysis.recommendations.routine as any
    
    if ('immediate' in routine || 'adaptation' in routine || 'maintenance' in routine) {
      ['immediate', 'adaptation', 'maintenance'].forEach(phase => {
        const steps = routine[phase] || []
        console.log(`📋 Phase ${phase}: ${steps.length} étapes`)
        
        steps.forEach((step: any) => {
          if (step.catalogId) {
            catalogIds.add(step.catalogId)
            console.log(`📋 Phase routine: ${step.catalogId} (${step.name || step.title})`)
          }
        })
      })
    }
  }

  // 3. Routine localisée
  if (analysis.recommendations?.localizedRoutine) {
    analysis.recommendations.localizedRoutine.forEach((zone: any) => {
      const steps = zone.steps || []
      console.log(`🎯 Zone ${zone.zone}: ${steps.length} étapes`)
      
      steps.forEach((step: any) => {
        if (step.catalogId) {
          catalogIds.add(step.catalogId)
          console.log(`🎯 Localized routine: ${step.catalogId} (${step.name})`)
        }
      })
    })
  }

  // 4. Produits détaillés (fallback)
  if (analysis.recommendations?.productsDetailed) {
    analysis.recommendations.productsDetailed.forEach((product: any) => {
      if (product.catalogId || product.id) {
        const id = product.catalogId || product.id
        catalogIds.add(id)
        console.log(`💎 Detailed product: ${id} (${product.name})`)
      }
    })
  }

  const result = Array.from(catalogIds)
  console.log(`✅ Total catalogIds extraits: ${result.length}`)
  console.log(`📋 Liste complète: ${result.join(', ')}`)
  
  return result
}

/**
 * Assure la synchronisation entre routine et section produits
 * Garantit que tous les produits de la routine apparaissent dans la section
 */
export const ensureProductSync = async (analysis: SkinAnalysis): Promise<{
  catalogIds: string[]
  missingProducts: string[]
  syncedProducts: any[]
}> => {
  console.log('🔄 Début synchronisation routine ↔ section produits')
  
  // Extraire tous les catalogIds de la routine
  const routineCatalogIds = extractAllCatalogIds(analysis)
  
  // Vérifier quels produits sont disponibles dans le catalogue
  const availableProducts: any[] = []
  const missingProducts: string[] = []
  
  for (const catalogId of routineCatalogIds) {
    try {
      const product = await EnrichedCatalogService.getProductById(catalogId)
      if (product) {
        availableProducts.push(product)
        console.log(`✅ Produit synchronisé: ${product.brand} ${product.name}`)
      } else {
        missingProducts.push(catalogId)
        console.log(`❌ Produit manquant: ${catalogId}`)
      }
    } catch (error) {
      missingProducts.push(catalogId)
      console.warn(`❌ Erreur synchronisation ${catalogId}:`, error)
    }
  }

  // Générer des produits fallback pour les manquants
  for (const missingId of missingProducts) {
    const fallbackProduct = generateFallbackProduct('treatment', `Produit ${missingId}`)
    availableProducts.push({
      id: fallbackProduct.catalogId,
      name: fallbackProduct.name,
      brand: fallbackProduct.brand,
      category: fallbackProduct.category,
      price: fallbackProduct.price,
      affiliateLink: fallbackProduct.affiliateLink
    })
    console.log(`🔄 Produit fallback ajouté pour: ${missingId}`)
  }

  console.log(`✅ Synchronisation terminée: ${availableProducts.length} produits disponibles`)
  
  return {
    catalogIds: routineCatalogIds,
    missingProducts,
    syncedProducts: availableProducts
  }
}

/**
 * FONCTIONS UTILITAIRES
 */

/**
 * Vérifie si une routine a des étapes sans produits
 */
export const hasStepsWithoutProducts = (routine: UnifiedRoutineStep[]): boolean => {
  return routine.some(step => !step.recommendedProducts || step.recommendedProducts.length === 0)
}

/**
 * Compte le nombre d'étapes sans produits dans une routine
 */
export const countStepsWithoutProducts = (routine: UnifiedRoutineStep[]): number => {
  return routine.filter(step => !step.recommendedProducts || step.recommendedProducts.length === 0).length
}

/**
 * Applique le mapping de produits à une routine complète
 */
export const applyProductMappingToRoutine = (routine: UnifiedRoutineStep[]): UnifiedRoutineStep[] => {
  console.log('🔄 Application mapping produits à routine complète')
  
  const mappedRoutine: UnifiedRoutineStep[] = []
  
  for (const step of routine) {
    const mappedStep = ensureProductMapping(step)
    mappedRoutine.push(mappedStep)
  }
  
  console.log(`✅ Mapping appliqué: ${mappedRoutine.length} étapes traitées`)
  
  return mappedRoutine
}

/**
 * Applique la cohérence inter-phases et le mapping produits
 */
export const applyFullCoherence = (routine: UnifiedRoutineStep[]): UnifiedRoutineStep[] => {
  console.log('🔄 Application cohérence complète (mapping + inter-phases)')
  
  // 1. Appliquer le mapping de produits
  const mappedRoutine = applyProductMappingToRoutine(routine)
  
  // 2. Assurer la cohérence inter-phases
  const coherentRoutine = ensurePhaseCoherence(mappedRoutine)
  
  // 3. Ajouter les labels temporels pour les nouveaux actifs
  const labeledRoutine = coherentRoutine.map((step, index) => {
    if (step.phase === 'adaptation' && ['treatment', 'exfoliation'].includes(step.category)) {
      return addIntroductionLabels(step, 14) // J+14 pour phase adaptation
    }
    if (step.phase === 'maintenance' && ['treatment', 'exfoliation'].includes(step.category)) {
      return addIntroductionLabels(step, 42) // J+42 pour phase maintenance
    }
    return step
  })
  
  console.log(`✅ Cohérence complète appliquée: ${labeledRoutine.length} étapes finales`)
  
  return labeledRoutine
}

// ===== NOUVELLES FONCTIONS V2 - REFONTE ROUTINES =====

/**
 * NOUVELLE FONCTION V2: Cohérence inter-phases avec support isTemporary
 * Utilise les nouveaux champs V2 pour une logique plus intelligente
 */
export const ensurePhaseCoherenceV2 = (routine: UnifiedRoutineStep[]): UnifiedRoutineStep[] => {
  console.log('🔄 V2 - Début vérification cohérence inter-phases avec champs enrichis')
  
  // Identifier les produits continus vs temporaires
  const continuousProducts = new Map<string, UnifiedRoutineStep>()
  const temporaryProducts = new Map<string, UnifiedRoutineStep[]>()
  
  routine.forEach(step => {
    // Utiliser isTemporary si disponible, sinon inférer
    const isTemporary = (step as any).isTemporary ?? 
                       ['treatment', 'exfoliation'].includes(step.category)
    
    if (!isTemporary) {
      // Produit continu - doit être propagé dans toutes les phases
      const key = `${step.category}_${step.timeOfDay}`
      if (!continuousProducts.has(key)) {
        continuousProducts.set(key, step)
        console.log(`📌 V2 - Produit continu identifié: ${step.title} (${key})`)
      }
    } else {
      // Produit temporaire - reste dans sa phase
      const phaseKey = step.phase
      if (!temporaryProducts.has(phaseKey)) {
        temporaryProducts.set(phaseKey, [])
      }
      temporaryProducts.get(phaseKey)!.push(step)
      console.log(`⏱️ V2 - Produit temporaire identifié: ${step.title} (${phaseKey})`)
    }
  })
  
  // Reconstruire la routine avec cohérence
  const phases = ['immediate', 'adaptation', 'maintenance'] as const
  const coherentRoutine: UnifiedRoutineStep[] = []
  
  phases.forEach(phase => {
    // Ajouter tous les produits continus pour cette phase
    continuousProducts.forEach((baseStep, key) => {
      const continuityStep: UnifiedRoutineStep = {
        ...baseStep,
        phase: phase,
        stepNumber: coherentRoutine.length + 1,
        // Adapter les métadonnées selon la phase
        applicationDuration: phase === 'immediate' ? 
          (baseStep.applicationDuration || 'En continu') : 
          'Continuer routine établie',
        frequencyDetails: phase === 'immediate' ? 
          baseStep.frequencyDetails : 
          `Maintenir depuis phase ${phase === 'adaptation' ? 'immédiate' : 'précédente'}`
      }
      coherentRoutine.push(continuityStep)
    })
    
    // Ajouter les produits temporaires spécifiques à cette phase
    const phaseTemporaryProducts = temporaryProducts.get(phase) || []
    phaseTemporaryProducts.forEach(step => {
      coherentRoutine.push({
        ...step,
        stepNumber: coherentRoutine.length + 1
      })
    })
  })
  
  console.log(`✅ V2 - Cohérence inter-phases assurée: ${coherentRoutine.length} étapes`)
  return coherentRoutine
}

/**
 * NOUVELLE FONCTION V2: Génération de métadonnées d'affichage enrichies
 */
export const generateDisplayMetadata = (step: UnifiedRoutineStep): {
  showTemporaryBadge: boolean
  showDurationBadge: boolean
  showPhaseBadge: boolean
  temporaryLabel?: string
  durationLabel?: string
  phaseLabel?: string
  benefitLabel?: string
} => {
  const isTemporary = (step as any).isTemporary ?? 
                     ['treatment', 'exfoliation'].includes(step.category)
  
  const applicationDuration = step.applicationDuration || 'En continu'
  const hasSpecificDuration = applicationDuration !== 'En continu' && 
                             applicationDuration !== 'continu'
  
  return {
    showTemporaryBadge: isTemporary,
    showDurationBadge: hasSpecificDuration,
    showPhaseBadge: step.phase !== 'maintenance',
    
    temporaryLabel: isTemporary ? 'Traitement temporaire' : undefined,
    durationLabel: hasSpecificDuration ? applicationDuration : undefined,
    phaseLabel: step.phase === 'immediate' ? 'Phase Immédiate' :
               step.phase === 'adaptation' ? 'Phase Adaptation' :
               'Phase Maintenance',
    benefitLabel: (step as any).targetBenefit || 
                 `Améliorer ${step.category === 'treatment' ? 'problèmes ciblés' : step.category}`
  }
}

/**
 * NOUVELLE FONCTION V2: Génération de clé produit pour déduplication intelligente
 * Utilise les nouveaux champs pour une logique plus précise
 */
export const generateProductKey = (step: UnifiedRoutineStep): string => {
  const product = step.recommendedProducts[0]
  if (!product) return `no-product-${step.category}-${step.timeOfDay}`
  
  // Pour les produits continus, utiliser catalogId + fonction
  const isTemporary = (step as any).isTemporary ?? 
                     ['treatment', 'exfoliation'].includes(step.category)
  
  if (!isTemporary) {
    // Produits continus : clé basée sur fonction + timing
    return `continuous-${step.category}-${step.timeOfDay}`
  } else {
    // Traitements temporaires : clé unique pour éviter fusion
    return `temporary-${product.catalogId || product.id}-${step.phase}-${step.stepNumber}`
  }
}

/**
 * NOUVELLE FONCTION V2: Validation de cohérence avec nouveaux champs
 */
export const validateRoutineCoherenceV2 = (routine: UnifiedRoutineStep[]): {
  isCoherent: boolean
  issues: string[]
  suggestions: string[]
} => {
  const issues: string[] = []
  const suggestions: string[] = []
  
  // Vérifier que chaque phase a les produits de base
  const phases = ['immediate', 'adaptation', 'maintenance'] as const
  const requiredCategories = ['cleansing', 'hydration', 'protection']
  
  phases.forEach(phase => {
    const phaseSteps = routine.filter(s => s.phase === phase)
    
    requiredCategories.forEach(category => {
      const hasCategory = phaseSteps.some(s => s.category === category)
      if (!hasCategory) {
        issues.push(`Phase ${phase} manque catégorie ${category}`)
        suggestions.push(`Ajouter un produit ${category} en phase ${phase}`)
      }
    })
  })
  
  // Vérifier la progression logique des traitements temporaires
  const temporaryTreatments = routine.filter(s => 
    (s as any).isTemporary && s.category === 'treatment'
  )
  
  temporaryTreatments.forEach(treatment => {
    const introduceFromWeek = (treatment as any).introduceFromWeek || 0
    const expectedPhase = introduceFromWeek === 0 ? 'immediate' :
                         introduceFromWeek <= 4 ? 'adaptation' : 'maintenance'
    
    if (treatment.phase !== expectedPhase) {
      issues.push(`Traitement ${treatment.title} en mauvaise phase (${treatment.phase} vs ${expectedPhase})`)
      suggestions.push(`Déplacer ${treatment.title} en phase ${expectedPhase}`)
    }
  })
  
  return {
    isCoherent: issues.length === 0,
    issues,
    suggestions
  }
}

/**
 * NOUVELLE FONCTION V2: Application complète avec support V2
 */
export const applyFullCoherenceV2 = (routine: UnifiedRoutineStep[]): UnifiedRoutineStep[] => {
  console.log('🔄 V2 - Application cohérence complète avec nouveaux champs')
  
  // 1. Appliquer le mapping de produits
  const mappedRoutine = applyProductMappingToRoutine(routine)
  
  // 2. Assurer la cohérence inter-phases V2
  const coherentRoutine = ensurePhaseCoherenceV2(mappedRoutine)
  
  // 3. Générer les métadonnées d'affichage
  const enrichedRoutine = coherentRoutine.map(step => ({
    ...step,
    displayMetadata: generateDisplayMetadata(step)
  }))
  
  // 4. Valider la cohérence finale
  const validation = validateRoutineCoherenceV2(enrichedRoutine)
  if (!validation.isCoherent) {
    console.warn('⚠️ V2 - Problèmes de cohérence détectés:', validation.issues)
    console.log('💡 V2 - Suggestions:', validation.suggestions)
  }
  
  console.log(`✅ V2 - Cohérence complète appliquée: ${enrichedRoutine.length} étapes finales`)
  
  return enrichedRoutine
}