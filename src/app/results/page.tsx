'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import LZString from 'lz-string'
import { useRouter } from 'next/navigation'
import { getProductInfoByCatalogId, RecommendedProductCard as CatalogRecommendedProductCard, findAlternativeProduct } from '@/services/catalog/catalogService'
import { extractAllCatalogIds as extractCatalogIdsEnhanced, ensureProductSync } from '@/utils/ProductMappingHelpers'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  Clock,
  Heart,
  Shield,
  Droplets,
  Sun,
  Eye,
  RotateCcw,
  Award,
  TrendingUp,
  Sparkles,
  MapPin,
  MessageCircle,
  ChevronRight,
  Calendar,
  Target,
  Share2,
  Download,
  ShoppingBag
} from 'lucide-react'
import type { SkinAnalysis, SkinScores, ScoreDetail } from '@/types'
import { getAnalysis } from '@/utils/storage/analysisStore'

// Convertit la routine V2 (3 phases) vers le format UnifiedRoutineStep[]
function convertV2RoutineToUnified(routineV2: any, productsV2: any): any[] {
  if (!routineV2?.phases) return []
  
  const unifiedSteps: any[] = []
  let stepNumber = 1
  
  // Créer un mapping des produits par routineStepId
  const productsByStep = new Map()
  if (productsV2?.selectedProducts) {
    productsV2.selectedProducts.forEach((product: any) => {
      productsByStep.set(product.routineStepId, product)
    })
  }
  
  // Convertir chaque phase
  Object.entries(routineV2.phases).forEach(([phaseName, phase]: [string, any]) => {
    if (phase?.steps) {
      phase.steps.forEach((step: any) => {
        const product = productsByStep.get(step.stepNumber)
        
        unifiedSteps.push({
          stepNumber: stepNumber++,
          title: `${step.careType} - ${phaseName}`,
          targetArea: (step.targetZones && step.targetZones.length > 0) ? 'specific' : 'global',
          zones: step.targetZones || [],
          recommendedProducts: product ? [{
            id: product.catalogId,
            name: product.productName,
            brand: product.brand,
            price: product.price,
            justification: product.justification || `Adapté pour ${step.careType}`
          }] : [],
          applicationAdvice: product?.applicationAdvice || step.progressiveIntroduction || 'Appliquer selon les instructions',
          restrictions: step.restrictions || [],
          treatmentType: step.careType === 'nettoyage' ? 'cleansing' : 
                        step.careType === 'traitement' ? 'treatment' :
                        step.careType === 'hydratation' ? 'moisturizing' : 'protection',
          priority: phaseName === 'immediate' ? 1 : phaseName === 'adaptation' ? 2 : 3,
          phase: phaseName,
          frequency: step.timing === 'both' ? 'daily' : 'daily', // Simplifier pour l'instant
          timeOfDay: step.timing === 'matin' ? 'morning' : 
                    step.timing === 'soir' ? 'evening' : 'both',
          category: step.careType === 'nettoyage' ? 'cleansing' : 
                   step.careType === 'traitement' ? 'treatment' :
                   step.careType === 'hydratation' ? 'hydration' : 'protection',
          // Champs additionnels pour compatibilité
          duration: phase.duration,
          targetProblem: step.targetProblem
        })
      })
    }
  })
  
  return unifiedSteps
}

// Adaptateur pour la V2
function adaptV2ToV1Format(analysisData: any): any {
  console.log('🔄 Adaptateur V2→V1 appelé avec:', {
    hasBeautyAssessment: !!analysisData?.beautyAssessment,
    hasDiagnostic: !!analysisData?.diagnostic,
    hasRoutine: !!analysisData?.routine,
    hasProducts: !!analysisData?.products,
    dataKeys: Object.keys(analysisData || {}),
    dataType: typeof analysisData
  })
  
  // Si c'est déjà au format V1, retourner tel quel
  if (analysisData?.beautyAssessment) {
    console.log('✅ Format V1 détecté, pas d\'adaptation nécessaire')
    return analysisData
  }
  
  // Si c'est au format V2, adapter
  if (analysisData?.diagnostic && analysisData?.routine && analysisData?.products) {
    console.log('🔄 Format V2 détecté, adaptation en cours...')
    return {
      beautyAssessment: {
        skinType: analysisData.diagnostic.skinType,
        mainConcern: analysisData.diagnostic.generalObservation,
        intensity: 'modérée', // Valeur par défaut
        concernedZones: analysisData.diagnostic.zoneSpecificIssues?.map((issue: any) => issue.zone) || [],
        visualFindings: [analysisData.diagnostic.generalObservation], // Convertir en array
        expectedImprovement: "Amélioration visible avec routine personnalisée",
        zoneSpecific: analysisData.diagnostic.zoneSpecificIssues?.map((issue: any) => ({
          zone: issue.zone,
          problems: [{
            type: issue.problem,
            intensity: issue.intensity,
            description: issue.description
          }]
        })) || []
      },
      scores: {
        overall: analysisData.diagnostic.scores.overall,
        hydration: analysisData.diagnostic.scores.hydration,
        wrinkles: analysisData.diagnostic.scores.wrinkles,
        firmness: analysisData.diagnostic.scores.firmness,
        radiance: analysisData.diagnostic.scores.radiance,
        pores: analysisData.diagnostic.scores.pores,
        spots: analysisData.diagnostic.scores.spots,
        darkCircles: analysisData.diagnostic.scores.darkCircles,
        skinAge: analysisData.diagnostic.scores.skinAge
      },
      routine: {
        phases: analysisData.routine.phases,
        globalAdvice: analysisData.routine.globalAdvice || [],
        dermatologicalRationale: analysisData.routine.dermatologicalRationale || ""
      },
      recommendedProducts: analysisData.products.selectedProducts?.map((product: any) => ({
        catalogId: product.catalogId,
        name: product.productName,
        brand: product.brand,
        price: product.price,
        justification: product.justification,
        applicationAdvice: product.applicationAdvice,
        timing: product.timing,
        targetZones: product.targetZones,
        temporaryLabel: product.temporaryLabel,
        progressiveIntroduction: product.progressiveIntroduction,
        restrictions: product.restrictions
      })) || [],
      recommendations: {
        unifiedRoutine: convertV2RoutineToUnified(analysisData.routine, analysisData.products),
        localizedRoutine: [] // Pour compatibilité
      },
      metadata: {
        version: 'v2-adapted',
        coherenceScore: analysisData.coherenceValidation?.overallScore,
        qualityScore: analysisData.qualityMetrics?.overallQuality,
        ...analysisData.metadata
      }
    }
  }
  
  // Fallback - format inconnu
  console.log('⚠️ Format inconnu, retour des données brutes:', analysisData)
  return analysisData
}

import ChatWidget from './ChatWidget'
import ScoreCircle from './components/ScoreCircle'
import ProductCard from './components/ProductCard'
import AdvancedRoutineDisplay from '@/components/routine/AdvancedRoutineDisplay'
import ShareableCard from '@/components/shared/ShareableCard'
import { UnifiedRoutineSection } from '@/components/results/UnifiedRoutineSection'

// Fonction utilitaire pour extraire les problèmes d'une zone
const extractProblems = (zone: any) => {
  // 1. Nouvelle structure multi-problèmes
  if (Array.isArray(zone.problems) && zone.problems.length > 0) {
    return zone.problems
  }
  // 2. Ancienne structure avec concerns
  if (Array.isArray(zone.concerns) && zone.concerns.length > 0) {
    return zone.concerns.map((concern: string) => ({
      name: concern,
      intensity: zone.intensity || 'modérée'
    }))
  }
  // 3. Structure legacy avec issues
  if (Array.isArray(zone.issues) && zone.issues.length > 0) {
    return zone.issues.map((issue: string) => ({
      name: issue,
      intensity: zone.intensity || 'modérée'
    }))
  }
  // 4. Description valide
  if (zone.description && zone.description !== 'Problème détecté') {
    return [{
      name: zone.description,
      intensity: zone.intensity || 'modérée'
    }]
  }
  return []
}

const scoreIcons = {
  hydration: <Droplets className="w-6 h-6" />,
  wrinkles: <Clock className="w-6 h-6" />,
  firmness: <Shield className="w-6 h-6" />,
  radiance: <Sun className="w-6 h-6" />,
  pores: <Eye className="w-6 h-6" />,
  spots: <AlertTriangle className="w-6 h-6" />,
  darkCircles: <Heart className="w-6 h-6" />,
  skinAge: <Star className="w-6 h-6" />,
}

const scoreLabels: Record<keyof Omit<SkinScores, 'overall'>, string> = {
  hydration: 'Hydratation',
  wrinkles: 'Rides',
  firmness: 'Fermeté',
  radiance: 'Éclat',
  pores: 'Pores',
  spots: 'Taches',
  darkCircles: 'Cernes',
  skinAge: 'Âge de la peau',
}

// Extraction des catalogId depuis l'analyse pour afficher les vrais produits du catalogue
const extractCatalogIds = (analysis: SkinAnalysis): string[] => {
  const catalogIds = new Set<string>()
  
  console.log('🔍 Extraction catalogId - Structure reçue:', {
    hasRoutine: !!analysis.recommendations?.routine,
    hasLocalizedRoutine: !!analysis.recommendations?.localizedRoutine,
    routineType: typeof analysis.recommendations?.routine
  })
  
  // Extraire catalogId de la routine principale
  const routine = analysis.recommendations?.routine
  if (routine && typeof routine === 'object' && 'immediate' in routine) {
    const newRoutine = routine as any // Type temporaire
    
    // Phases immediate, adaptation, maintenance
    ;['immediate', 'adaptation', 'maintenance'].forEach(phase => {
      const steps = newRoutine[phase] || []
      console.log(`📋 Phase ${phase}:`, steps.length, 'étapes')
      steps.forEach((step: any, index: number) => {
        console.log(`  - Étape ${index + 1}:`, step.name || step.title, 'catalogId:', step.catalogId)
        if (step.catalogId) {
          catalogIds.add(step.catalogId)
        }
      })
    })
  }
  
  // Extraire catalogId de localizedRoutine
  const localizedRoutine = analysis.recommendations?.localizedRoutine || []
  console.log('🎯 Routine localisée:', localizedRoutine.length, 'zones')
  localizedRoutine.forEach((zoneRoutine: any, zoneIndex: number) => {
    const steps = zoneRoutine.steps || []
    console.log(`  Zone ${zoneIndex + 1} (${zoneRoutine.zone}):`, steps.length, 'étapes')
    steps.forEach((step: any, stepIndex: number) => {
      console.log(`    - Étape ${stepIndex + 1}:`, step.name, 'catalogId:', step.catalogId)
      if (step.catalogId) {
        catalogIds.add(step.catalogId)
      }
    })
  })

  const result = Array.from(catalogIds)
  console.log('✅ CatalogIds extraits au total:', result.length, result)
  return result
}

// Génération de produits recommandés basée sur l'analyse - SPRINT 2 AMÉLIORÉ
const getProductRecommendations = async (analysis: SkinAnalysis): Promise<CatalogRecommendedProductCard[]> => {
  console.log('🔄 SPRINT 2: Génération produits avec synchronisation améliorée')
  
  // Si l'analyse contient des produits détaillés (type léger), les convertir vers le format catalogue
  if (analysis.recommendations?.productsDetailed && analysis.recommendations.productsDetailed.length > 0) {
    const mapped = analysis.recommendations.productsDetailed.map((p: any): CatalogRecommendedProductCard => {
      const safePrice = typeof p.price === 'number' ? p.price : 0
      const originalPrice = Math.round(safePrice * 1.2 * 100) / 100
      const discount = originalPrice > 0 ? Math.max(0, Math.min(99, Math.round(((originalPrice - safePrice) / originalPrice) * 100))) : 0
      return {
        name: p.name,
        brand: p.brand,
        price: safePrice,
        originalPrice,
        imageUrl: p.imageUrl,
        discount,
        frequency: p.frequency || 'Selon routine',
        benefits: Array.isArray(p.benefits) ? p.benefits : [],
        instructions: "Suivre les instructions de la routine personnalisée",
        whyThisProduct: "Sélectionné par l'IA pour votre diagnostic",
        affiliateLink: p.affiliateLink || '#'
      }
    })
    return mapped
  }

  // 🔥 SPRINT 2: Utiliser la nouvelle fonction d'extraction améliorée
  try {
    const syncResult = await ensureProductSync(analysis)
    console.log(`✅ SPRINT 2: Synchronisation complète - ${syncResult.syncedProducts.length} produits`)
    
    // Convertir les produits synchronisés au format attendu
    const products = syncResult.syncedProducts.map((product: any): CatalogRecommendedProductCard => {
      const safePrice = typeof product.price === 'number' ? product.price : 0
      const originalPrice = Math.round(safePrice * 1.2 * 100) / 100
      const discount = originalPrice > 0 ? Math.max(0, Math.min(99, Math.round(((originalPrice - safePrice) / originalPrice) * 100))) : 0
      
      return {
        name: product.name,
        brand: product.brand,
        price: safePrice,
        originalPrice,
        imageUrl: product.imageUrl || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
        discount,
        frequency: 'Selon routine',
        benefits: Array.isArray(product.benefits) ? product.benefits : ['Sélectionné pour votre peau'],
        instructions: "Suivre les instructions de la routine personnalisée",
        whyThisProduct: "Produit sélectionné spécifiquement pour vos besoins par l'IA DermAI",
        affiliateLink: product.affiliateLink || '#'
      }
    })
    
    return products
  } catch (error) {
    console.warn('❌ SPRINT 2: Erreur synchronisation, fallback vers ancienne méthode:', error)
    
    // Fallback vers ancienne méthode
    const catalogIds = extractCatalogIds(analysis)
 
    // Ajouter les catalogId issus du fallback de routine localisée (générée côté UI)
    try {
      const localizedComputed = getLocalizedRoutine(analysis) as any[]
      const extraIds: string[] = []
      localizedComputed.forEach((zone: any) => {
        ;(zone.steps || []).forEach((s: any) => {
          if (s?.catalogId) extraIds.push(s.catalogId)
        })
      })
      if (extraIds.length) {
        const merged = Array.from(new Set([...catalogIds, ...extraIds]))
        console.log('➕ Ajout IDs depuis fallback localizedRoutine:', extraIds, '→ total:', merged.length)
        return await getProductsFromCatalogIds(merged)
      }
    } catch (e) {
      console.warn('Fallback localizedRoutine non disponible pour extraction:', e)
    }

    // Si on a des catalogId, créer des produits avec référence au catalogue
    if (catalogIds.length > 0) {
      console.log('🎯 CatalogIds trouvés:', catalogIds)
      const products = await getProductsFromCatalogIds(catalogIds)
      console.log('📦 Produits générés:', products.length, products.map(p => `${p.brand} ${p.name}`))
      return products
    }

    // Fallback vers produits génériques
    console.log('Aucun catalogId trouvé, utilisation des produits génériques')
    return getGenericProducts(analysis)
  }
}

// Créer des produits basés sur les catalogId trouvés
const getProductsFromCatalogIds = async (catalogIds: string[]): Promise<CatalogRecommendedProductCard[]> => {
  const products: CatalogRecommendedProductCard[] = []
  
  // Pour chaque catalogId, créer un produit représentatif (TOUS les produits, pas de limite)
  for (const catalogId of catalogIds) {
    try {
      // Déterminer le type de produit selon l'ID depuis le vrai catalogue
      const productInfo = await getProductInfoByCatalogId(catalogId)
      
      products.push({
        ...productInfo,
        whyThisProduct: `Produit sélectionné spécifiquement pour vos besoins par l'IA DermAI`
      })
    } catch (error) {
      console.error(`❌ Erreur pour catalogId ${catalogId}:`, error)
    }
  }
  
  console.log('🎁 Produits créés depuis catalogIds:', products.length, 'produits')
  return products
}



// Fallback pour produits génériques si pas de catalogId
const getGenericProducts = (analysis: SkinAnalysis): CatalogRecommendedProductCard[] => {
  const mockProducts: CatalogRecommendedProductCard[] = []
  const recommendations = analysis.recommendations?.products || []
  const skinConcerns = analysis.beautyAssessment?.mainConcern || ''
  const scores = analysis.scores

  // Produit 1: Nettoyant (toujours recommandé)
  mockProducts.push({
    name: "Gel Nettoyant Doux",
    brand: "CeraVe",
    price: 12.99,
    originalPrice: 15.99,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    discount: 19,
    frequency: "Matin et soir",
    benefits: ["Nettoyage en douceur", "Préserve la barrière cutanée", "Sans savon"],
    instructions: "Masser délicatement sur peau humide, rincer à l'eau tiède",
    whyThisProduct: "Recommandé pour votre type de peau selon l'analyse DermAI",
    affiliateLink: "https://example.com/cerave-gel"
  })

  // Produit 2: Sérum selon les scores
  if (scores?.hydration?.value < 60) {
    mockProducts.push({
      name: "Sérum Acide Hyaluronique",
      brand: "The Ordinary",
      price: 7.90,
      originalPrice: 9.50,
      imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
      discount: 17,
      frequency: "Matin et soir",
      benefits: ["Hydratation intense", "Repulpe la peau", "Anti-âge"],
      instructions: "Appliquer 2-3 gouttes sur peau propre",
      whyThisProduct: `Votre score d'hydratation (${scores.hydration.value}/100) nécessite un boost d'hydratation`,
      affiliateLink: "https://example.com/ordinary-hyaluronic"
    })
  } else if (scores?.spots?.value < 60 || skinConcerns.toLowerCase().includes('acné')) {
    mockProducts.push({
    name: "Sérum Niacinamide 10%",
    brand: "The Ordinary",
    price: 7.20,
    originalPrice: 8.90,
    imageUrl: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&h=400&fit=crop",
    discount: 19,
    frequency: "Soir uniquement", 
      benefits: ["Régule le sébum", "Minimise les pores", "Anti-imperfections"],
      instructions: "Appliquer 2-3 gouttes le soir sur peau propre",
      whyThisProduct: "Idéal pour réguler le sébum et réduire les imperfections détectées",
    affiliateLink: "https://example.com/ordinary-niacinamide"
    })
  }

  // Produit 3: Protection solaire (toujours recommandée)
  mockProducts.push({
    name: "Crème Solaire Invisible SPF 50+",
    brand: "La Roche-Posay",
    price: 18.50,
    originalPrice: 22.00,
    imageUrl: "https://images.unsplash.com/photo-1556228578-dd97c4d84df2?w=400&h=400&fit=crop",
    discount: 16,
    frequency: "Chaque matin",
    benefits: ["Protection SPF 50+", "Fini invisible", "Résistant à l'eau"],
    instructions: "Appliquer généreusement 20 min avant exposition, renouveler toutes les 2h",
    whyThisProduct: "Protection essentielle contre le vieillissement cutané",
    affiliateLink: "https://example.com/lrp-anthelios"
  })

  return mockProducts.slice(0, 3) // Limiter à 3 produits
}

// Fonction de validation pour la nouvelle structure multi-problèmes
const validateZoneStructure = (zone: any) => {
  if (Array.isArray(zone.problems)) {
    return zone.problems.every((problem: any) => 
      problem.name && 
      problem.intensity && 
      ['légère', 'modérée', 'intense'].includes(problem.intensity)
    )
  }
  return false
}

// Routine localisée – fusionne la réponse IA et le diagnostic, avec fallback
const getLocalizedRoutine = (analysis: any) => {
  console.log('🎯 getLocalizedRoutine - analyse structure:', {
    hasLocalizedRoutine: !!analysis?.recommendations?.localizedRoutine,
    localizedRoutineLength: analysis?.recommendations?.localizedRoutine?.length || 0,
    hasZoneSpecific: !!analysis?.beautyAssessment?.zoneSpecific,
    zoneSpecificLength: analysis?.beautyAssessment?.zoneSpecific?.length || 0,
    zoneSpecificData: analysis?.beautyAssessment?.zoneSpecific
  })

  const aiZones = Array.isArray(analysis?.recommendations?.localizedRoutine)
    ? analysis.recommendations.localizedRoutine
    : []

  const localized = analysis?.beautyAssessment?.zoneSpecific
  if (!Array.isArray(localized) || localized.length === 0) {
    console.log('❌ Aucune zone localisée trouvée')
    return []
  }

  console.log('🔄 Création fallback depuis beautyAssessment.zoneSpecific:', localized.length, 'zones')
  console.log('📊 Zones trouvées dans zoneSpecific:', localized.map((l: any) => {
    if (validateZoneStructure(l)) {
      return `${l.zone} (${l.problems.length} problèmes)`
    } else {
      return `${l.zone} (${l.intensity})`
    }
  }))
  
  // Fonction utilitaire pour générer une zone à partir du diagnostic (fallback)
  const buildZoneFromDiagnostic = (loc: any, i: number) => {
    console.log(`  📍 Zone ${i + 1}:`, loc.zone, loc.concerns || loc.issue, loc.intensity)
    
    // Extraire les problèmes de la zone avec une logique améliorée
    let problems = []
    
    if (Array.isArray(loc.problems)) {
      // Nouvelle structure multi-problèmes
      problems = loc.problems.map((problem: any) => ({
        name: problem.name || 'Problème non spécifié',
        intensity: problem.intensity || 'modérée',
        description: problem.description
      }))
    } else if (Array.isArray(loc.concerns)) {
      // Ancienne structure - convertir en problèmes individuels
      problems = loc.concerns.map((concern: string) => ({
        name: concern,
        intensity: loc.intensity || 'modérée',
        description: loc.description
      }))
    } else if (Array.isArray(loc.issues)) {
      // Structure legacy avec issues
      problems = loc.issues.map((issue: string) => ({
        name: issue,
        intensity: loc.intensity || 'modérée',
        description: loc.description
      }))
    } else if (loc.issue && typeof loc.issue === 'string') {
      // Problème unique avec issue
      problems = [{
        name: loc.issue,
        intensity: loc.intensity || 'modérée',
        description: loc.description
      }]
    } else if (loc.description && typeof loc.description === 'string' && loc.description !== 'Problème détecté') {
      // Description comme problème unique
      problems = [{
        name: loc.description,
        intensity: loc.intensity || 'modérée',
        description: loc.description
      }]
    } else {
      // Fallback intelligent basé sur le nom de la zone
      const zoneName = String(loc.zone || '').toLowerCase()
      if (zoneName.includes('menton') || zoneName.includes('chin')) {
        problems = [
          {
            name: 'Poils incarnés',
            intensity: loc.intensity || 'modérée',
            description: 'Irritation post-rasage détectée'
          },
          {
            name: 'Rougeurs post-rasage',
            intensity: 'sévère',
            description: 'Inflammation de la zone de rasage'
          }
        ]
      } else if (zoneName.includes('joues') || zoneName.includes('cheeks')) {
        problems = [
          {
            name: 'Pores dilatés',
            intensity: 'légère',
            description: 'Texture irrégulière détectée'
          },
          {
            name: 'Imperfections',
            intensity: loc.intensity || 'modérée',
            description: 'Petites imperfections visibles'
          }
        ]
      } else if (zoneName.includes('front') || zoneName.includes('forehead')) {
        problems = [
          {
            name: 'Rides d\'expression',
            intensity: loc.intensity || 'modérée',
            description: 'Lignes horizontales détectées'
          }
        ]
      } else if (zoneName.includes('nez') || zoneName.includes('nose')) {
        problems = [
          {
            name: 'Pores dilatés',
            intensity: loc.intensity || 'modérée',
            description: 'Zone T avec pores visibles'
          },
          {
            name: 'Points noirs',
            intensity: 'légère',
            description: 'Comédons détectés'
          }
        ]
      } else {
        // Dernier fallback avec nom de zone spécifique
        problems = [{
          name: `Problème détecté sur ${loc.zone}`,
          intensity: loc.intensity || 'modérée',
          description: `Zone ${loc.zone} nécessite attention`
        }]
      }
    }

    console.log(`    🧪 Problèmes détectés pour ${loc.zone}:`, problems)
    
    // Analyser les problèmes pour déterminer les soins
    const steps: any[] = []
    const restrictions: string[] = []
    let resumeCondition: string | undefined = undefined

    problems.forEach((problem: any) => {
      const issueText = problem.name.toLowerCase()
      const isIrritated = issueText.includes('irrit') || issueText.includes('rougeur') || issueText.includes('inflam') || issueText.includes('rasage')
      const hasPores = issueText.includes('pore') || issueText.includes('sébum') || issueText.includes('dilaté')
      const hasAcne = issueText.includes('acné') || issueText.includes('bouton') || issueText.includes('imperfection') || issueText.includes('comédon')
      const hasWrinkles = issueText.includes('ride') || issueText.includes('ligne') || issueText.includes('expression')
      
      if (isIrritated) {
        restrictions.push("Éviter AHA/BHA et rétinoïdes jusqu'à disparition des rougeurs")
        resumeCondition = "Réintroduire progressivement après 5-7 jours sans irritation"
        
        steps.push({
          name: 'Crème apaisante réparatrice',
          category: 'treatment',
          frequency: 'quotidien',
          timing: 'soir',
          catalogId: 'B00BNUY3HE', // La Roche-Posay Cicaplast Baume B5
          application: 'Couche fine sur les zones irritées',
          duration: 'jusqu\'à cicatrisation',
          resume: 'quand irritation disparue'
        })
      }
      
      if (hasPores) {
        steps.push({
          name: 'Sérum régulateur',
          category: 'treatment', 
          frequency: 'quotidien',
          timing: 'soir',
          catalogId: 'B01MDTVZTZ', // The Ordinary Niacinamide 10% + Zinc 1%
          application: 'Quelques gouttes sur la zone',
          duration: 'routine continue',
          resume: 'selon besoin'
        })
      }

      if (hasAcne) {
        steps.push({
          name: 'Traitement anti-imperfections',
          category: 'treatment',
          frequency: 'quotidien',
          timing: 'soir',
          catalogId: 'B00949CTQQ', // Paula's Choice BHA
          application: 'Appliquer localement sur les imperfections',
          duration: 'jusqu\'à amélioration',
          resume: 'selon besoin'
        })
      }

      if (hasWrinkles) {
        steps.push({
          name: 'Sérum anti-rides',
          category: 'treatment',
          frequency: 'quotidien',
          timing: 'soir',
          catalogId: 'B01MSSDEPK', // CeraVe avec peptides
          application: 'Appliquer sur les zones concernées',
          duration: 'routine continue',
          resume: 'quotidien'
        })
      }
    })
    
    // CRITIQUE: S'assurer qu'CHAQUE zone a au moins une étape
    if (steps.length === 0) {
      console.log(`    ⚠️ Zone ${loc.zone}: Aucun traitement spécifique détecté, ajout soin générique`)
      
      const allIssuesText = problems.map((p: any) => p.name).join(' ').toLowerCase()
      const hasRedness = allIssuesText.includes('rougeur') || allIssuesText.includes('rouge')
      const hasRoughness = allIssuesText.includes('rugos') || allIssuesText.includes('sécheresse')
      
      if (hasRedness) {
        steps.push({
          name: 'Soin apaisant',
          category: 'treatment',
          frequency: 'quotidien',
          timing: 'soir',
          catalogId: 'B000O7PH34', // Avène Thermal Spring Water
          application: 'Vaporiser et tapoter délicatement',
          duration: 'jusqu\'à amélioration',
          resume: 'continuer si nécessaire'
        })
      } else {
        steps.push({
          name: 'Hydratant réparateur',
          category: 'treatment',
          frequency: 'quotidien',
          timing: 'matin_et_soir',
          catalogId: 'B01MSSDEPK', // CeraVe Nettoyant Hydratant
          application: 'Masser délicatement',
          duration: 'routine continue',
          resume: 'quotidien'
        })
      }
    }

    return {
      zone: loc.zone || `zone ${i + 1}`,
      priority: problems.some((p: any) => p.intensity === 'intense' || p.intensity === 'sévère') ? 1 : 3,
      problems: problems, // Nouvelle structure multi-problèmes
      concerns: problems.map((p: any) => p.name), // Compatibilité avec l'ancienne structure
      issues: problems.map((p: any) => p.name), // Compatibilité avec l'ancienne structure
      intensity: problems.length > 0 ? problems[0].intensity : 'modérée', // Intensité du premier problème pour compatibilité
      restrictions,
      resumeCondition,
      steps: steps.length > 0 ? steps : [
        {
          name: 'Hydratant barrière',
          category: 'hydration',
          frequency: 'quotidien',
          timing: 'matin_et_soir',
          catalogId: 'CERAVE_HYDRATING_CLEANSER_004',
          application: 'Appliquer sur peau propre',
          duration: 'routine quotidienne',
          resume: 'continu'
        }
      ]
    }
  }

  // 1) Normaliser les zones issues de l'IA (et appliquer une intensité par défaut)
  const aiByZone = new Map<string, any>()
  aiZones.forEach((z: any) => {
    if (!z || !z.zone) return
    aiByZone.set(String(z.zone).toLowerCase(), {
      ...z,
      intensity: z.intensity || 'Modérée',
      steps: Array.isArray(z.steps) ? z.steps : []
    })
  })

  // 2) Générer les zones depuis le diagnostic
  const diagZones = localized.map((loc: any, i: number) => buildZoneFromDiagnostic(loc, i))

  // 3) Fusionner: conserver les zones IA et compléter avec les zones manquantes du diagnostic
  const mergedByZone = new Map<string, any>(aiByZone)
  diagZones.forEach((dz) => {
    const key = String(dz.zone).toLowerCase()
    if (!mergedByZone.has(key)) {
      mergedByZone.set(key, dz)
    } else {
      // Si la zone existe déjà côté IA mais sans intensité, compléter
      const existing = mergedByZone.get(key)
      mergedByZone.set(key, {
        ...existing,
        intensity: existing.intensity || dz.intensity || 'Modérée',
        issues: existing.issues?.length ? existing.issues : dz.issues,
      })
    }
  })

  const results = Array.from(mergedByZone.values())

  console.log('✅ Zones créées pour ciblage:', results.length, 'zones:', results.map(r => `${r.zone} (${r.steps?.length || 0} étapes)`))
  console.log('🔍 Détail des zones créées:', results.map(r => ({ zone: r.zone, intensity: r.intensity, issues: r.issues, stepsCount: r.steps?.length || 0 })))
  return results
}

// Helpers d'affichage pour la routine localisée
const formatFrequency = (f?: string) => {
  switch ((f || '').toLowerCase()) {
    case 'daily': return 'Quotidien'
    case 'weekly': return 'Hebdomadaire'
    case 'monthly': return 'Mensuel'
    case 'as-needed': return 'Au besoin'
    case 'progressive': return 'Progressif'
    default: return f || '—'
  }
}

const timeOfDayLabel = (t?: string) => {
  if (!t) return '—'
  if (t === 'both') return 'Matin & soir'
  if (t === 'morning') return 'Matin'
  if (t === 'evening') return 'Soir'
  return t
}

// Helper pour obtenir le nom du produit depuis le catalogId (état global pour cache)
let productNameCache: { [key: string]: string } = {}

const getProductNameFromCatalogId = (catalogId: string): string => {
  console.log('🏷️ Demande nom produit pour catalogId:', catalogId)
  
  // Vérifier le cache d'abord
  if (productNameCache[catalogId]) {
    console.log('📋 Cache trouvé:', productNameCache[catalogId])
    return productNameCache[catalogId]
  }
  
  // Utiliser le même pattern matching que le service catalogue + IDs Amazon directs
  if (catalogId === 'B000O7PH34') {
    productNameCache[catalogId] = "Avène Thermal Spring Water"
    console.log('✅ ID Amazon Avène trouvé:', productNameCache[catalogId])
    return productNameCache[catalogId]
  }
  if (catalogId === 'B00BNUY3HE') {
    productNameCache[catalogId] = "La Roche-Posay Cicaplast Baume B5"
    console.log('✅ ID Amazon Cicaplast trouvé:', productNameCache[catalogId])
    return productNameCache[catalogId]
  }
  if (catalogId === 'B01MSSDEPK') {
    productNameCache[catalogId] = "CeraVe Nettoyant Hydratant"
    console.log('✅ ID Amazon CeraVe trouvé:', productNameCache[catalogId])
    return productNameCache[catalogId]
  }
  if (catalogId === 'B01MDTVZTZ') {
    productNameCache[catalogId] = "The Ordinary Niacinamide 10% + Zinc 1%"
    console.log('✅ ID Amazon The Ordinary trouvé:', productNameCache[catalogId])
    return productNameCache[catalogId]
  }
  if (catalogId === 'B00949CTQQ') {
    productNameCache[catalogId] = "Paula's Choice SKIN PERFECTING 2% BHA"
    console.log('✅ ID Amazon Paula\'s Choice trouvé:', productNameCache[catalogId])
    return productNameCache[catalogId]
  }
  
  // Patterns pour les anciens IDs fictifs (fallback)
  if (catalogId.includes('CERAVE') && catalogId.includes('CLEANSER')) {
    productNameCache[catalogId] = "CeraVe Nettoyant Hydratant"
    console.log('✅ Pattern CeraVe trouvé:', productNameCache[catalogId])
    return productNameCache[catalogId]
  }
  if (catalogId.includes('AVENE') && catalogId.includes('CICALFATE')) {
    productNameCache[catalogId] = "Avène Thermal Spring Water"
    return productNameCache[catalogId]
  }
  if (catalogId.includes('ORDINARY') && catalogId.includes('NIACINAMIDE')) {
    productNameCache[catalogId] = "The Ordinary Niacinamide 10% + Zinc 1%"
    return productNameCache[catalogId]
  }
  if (catalogId.includes('LRP') || catalogId.includes('ROCHE') || catalogId.includes('SPF')) {
    productNameCache[catalogId] = "La Roche-Posay Anthelios Fluid SPF 50"
    return productNameCache[catalogId]
  }
  if (catalogId.includes('PAULA') && (catalogId.includes('CHOICE') || catalogId.includes('BHA'))) {
    productNameCache[catalogId] = "Paula's Choice SKIN PERFECTING 2% BHA"
    return productNameCache[catalogId]
  }
  
  // Fallback générique
  productNameCache[catalogId] = "Produit Soin Ciblé"
  return productNameCache[catalogId]
}

const getCatalogProductName = (analysis: any, step: any): string | null => {
  if (step?.productName) return step.productName
  if (step?.catalogId && Array.isArray(analysis?.recommendations?.productsDetailed)) {
    const found = analysis.recommendations.productsDetailed.find((p: any) => p.id === step.catalogId || p.catalogId === step.catalogId)
    if (found) return `${found.name}${found.brand ? ' – ' + found.brand : ''}`
  }
  if (typeof step?.productSuggestion === 'string') return step.productSuggestion
  return null
}

const categoryAccent = (category?: string) => {
  const c = (category || '').toLowerCase()
  if (c === 'treatment') return 'border-l-4 border-rose-500'
  if (c === 'hydration') return 'border-l-4 border-sky-500'
  if (c === 'protection') return 'border-l-4 border-amber-500'
  if (c === 'cleansing') return 'border-l-4 border-emerald-500'
  if (c === 'exfoliation') return 'border-l-4 border-purple-500'
  return 'border-l-4 border-gray-300'
}

const intensityBadge = (intensity?: string) => {
  const s = (intensity || '').toLowerCase()
  if (s.includes('intense') || s.includes('sévère') || s.includes('severe')) return 'bg-red-50 text-red-700 border-red-200'
  if (s.includes('modérée') || s.includes('moderate')) return 'bg-orange-50 text-orange-700 border-orange-200'
  if (s.includes('légère') || s.includes('mild')) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

export default function ResultsPage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null)
  const [userAge, setUserAge] = useState<number | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [products, setProducts] = useState<CatalogRecommendedProductCard[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [catalogMap, setCatalogMap] = useState<Record<string, { name: string; affiliateLink: string }>>({})
  const [isExportingImage, setIsExportingImage] = useState(false)
  const shareableCardRef = useRef<HTMLDivElement>(null)
  const handleAlternative = async (index: number) => {
    try {
      const current = products[index]
      const alternative = await findAlternativeProduct({ name: current.name, brand: current.brand, price: current.price })
      if (!alternative) return
      const next = [...products]
      next[index] = alternative
      setProducts(next)
    } catch (e) {
      console.warn('Impossible de charger une alternative:', e)
    }
  }

  useEffect(() => {
    const load = async () => {
      const questionnaireData = sessionStorage.getItem('dermai_questionnaire')
      // Priorité: lien partagé ?d=...
      try {
        const url = new URL(window.location.href)
        const dParam = url.searchParams.get('d')
        if (dParam) {
          const json = LZString.decompressFromEncodedURIComponent(dParam)
          if (json) {
            const shared = JSON.parse(json)
            setAnalysis(adaptV2ToV1Format(shared))
            if (questionnaireData) {
              const q = JSON.parse(questionnaireData)
              if (q?.userProfile?.age) setUserAge(q.userProfile.age)
            }
            return
          }
        }
      } catch (e) {
        console.warn('Lien partagé invalide:', e)
      }

      // Sinon, fallback sessionStorage
      const analysisId = sessionStorage.getItem('dermai_analysis_id')
      if (!analysisId) {
        router.push('/upload')
        return
      }
      try {
        const stored = await getAnalysis(analysisId)
        if (!stored) {
          router.push('/upload')
          return
        }
        setAnalysis(adaptV2ToV1Format(stored))
        if (questionnaireData) {
          const q = JSON.parse(questionnaireData)
          if (q?.userProfile?.age) setUserAge(q.userProfile.age)
        }
      } catch (e) {
        console.error('Erreur chargement results:', e)
        router.push('/upload')
      }
    }
    load()
  }, [router])

  // Charger les produits de manière asynchrone
  useEffect(() => {
    if (!analysis) return
    
    const loadProducts = async () => {
      setProductsLoading(true)
      try {
        const recommendedProducts = await getProductRecommendations(analysis)
        setProducts(recommendedProducts as CatalogRecommendedProductCard[])

        // Construire une map catalogId -> {name, affiliateLink} pour toute la page
        const ids = extractCatalogIds(analysis)
        const uniqueIds = Array.from(new Set(ids))
        const infos = await Promise.all(uniqueIds.map(async (id) => {
          const info = await getProductInfoByCatalogId(id)
          return [id, { name: info.name, affiliateLink: info.affiliateLink }] as const
        }))
        setCatalogMap(Object.fromEntries(infos))
      } catch (error) {
        console.error('❌ Erreur chargement produits:', error)
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }

    loadProducts()
  }, [analysis])

  const skinAgeYears = useMemo(() => {
    if (!analysis || userAge == null) return null
    const score = (analysis.scores as any)?.skinAge as ScoreDetail | undefined
    if (!score || typeof score.value !== 'number') return null
    
    // Calculer l'âge de peau basé sur l'analyse photo
    const ageDelta = (75 - score.value) / 10
    const computedAge = Math.round(userAge + ageDelta)
    
    // Règle de cohérence : ne jamais afficher un âge inférieur à la borne minimale déclarée
    // Extraire la borne minimale de la tranche d'âge (ex: "25-34" -> 25)
    const questionnaireData = sessionStorage.getItem('dermai_questionnaire')
    let minDeclaredAge = userAge
    if (questionnaireData) {
      try {
        const questionnaire = JSON.parse(questionnaireData)
        const ageRange = questionnaire?.userProfile?.ageRange
        if (typeof ageRange === 'string' && ageRange.includes('-')) {
          const minAge = parseInt(ageRange.split('-')[0])
          if (!isNaN(minAge)) {
            minDeclaredAge = minAge
          }
        }
      } catch (e) {
        console.warn('Impossible de parser la tranche d\'âge:', e)
      }
    }
    
    // Appliquer la règle de cohérence et bornes générales
    const finalAge = Math.max(minDeclaredAge, Math.min(80, computedAge))
    return Math.max(15, finalAge)
  }, [analysis, userAge])

  const handleNewAnalysis = () => {
    sessionStorage.removeItem('dermai_photos')
    sessionStorage.removeItem('dermai_questionnaire')
    sessionStorage.removeItem('dermai_analysis_id')
    router.push('/upload')
  }

  // Fonction pour exporter la carte de diagnostic en image
  const handleExportImage = async () => {
    if (!shareableCardRef.current || !analysis) return
    
    setIsExportingImage(true)
    
    // Rendre temporairement visible le composant
    const container = shareableCardRef.current.parentElement
    if (container) {
      container.style.opacity = '1'
      container.style.position = 'fixed'
      container.style.top = '0px'
      container.style.left = '0px'
      container.style.zIndex = '9999'
    }
    
    try {
      // Attendre que le rendu soit complet
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Utiliser html2canvas pour capturer l'élément
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(shareableCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 512,
        height: 512,
        logging: false
      })
      
      // Remettre invisible
      if (container) {
        container.style.opacity = '0'
        container.style.zIndex = '-1'
      }
      
      // Convertir en blob et télécharger
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `diagnostic-dermai-${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    } catch (error) {
      console.error('Erreur lors de l\'export d\'image:', error)
      alert('Erreur lors de la génération de l\'image. Veuillez réessayer.')
      
      // Remettre invisible en cas d'erreur
      if (container) {
        container.style.opacity = '0'
        container.style.zIndex = '-1'
      }
    } finally {
      setIsExportingImage(false)
    }
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-dermai-pure flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-dermai-ai-500"></div>
      </div>
    )
  }

  const scoreOrder: Array<keyof Omit<SkinScores, 'overall'>> = [
    'hydration', 'wrinkles', 'firmness', 'radiance', 'pores', 'spots', 'darkCircles', 'skinAge'
  ]

  return (
    <div className="min-h-screen bg-dermai-pure">
      {/* Header */}
      <div className="bg-dermai-pure/80 backdrop-blur-sm border-b border-dermai-nude-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="cursor-pointer transition-opacity hover:opacity-80">
                <img 
                  src="/DERMAI-logo.svg" 
                  alt="DermAI" 
                  className="h-8 md:h-10 w-auto"
                />
              </a>
            </div>

            {/* Progress dots */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-dermai-ai-500 rounded-full shadow-glow"></div>
              <div className="w-3 h-3 bg-dermai-ai-500 rounded-full shadow-glow"></div>
              <div className="w-3 h-3 bg-dermai-ai-500 rounded-full shadow-glow"></div>
              <div className="w-3 h-3 bg-dermai-ai-500 rounded-full shadow-glow"></div>
            </div>

            {/* Actions header */}
            <div className="flex items-center space-x-2">
            <button
              onClick={handleNewAnalysis}
              className="flex items-center space-x-2 bg-dermai-pure text-dermai-neutral-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow border border-dermai-nude-200 hover-lift"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle analyse</span>
            </button>
            <button
              onClick={() => {
                try {
                  if (!analysis) return
                  const json = JSON.stringify(analysis)
                  const encoded = LZString.compressToEncodedURIComponent(json)
                  const shareUrl = `${window.location.origin}/results?d=${encoded}`
                  navigator.clipboard.writeText(shareUrl)
                } catch (e) { console.warn('Copie du lien impossible', e) }
              }}
              className="btn-primary flex items-center space-x-2 px-4 py-2 rounded-full shadow-sm transition-colors"
              title="Copier le lien du diagnostic"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Partager</span>
            </button>
            <button
              onClick={handleExportImage}
              disabled={isExportingImage}
              className="flex items-center space-x-2 bg-dermai-ai-500 text-white px-4 py-2 rounded-full shadow-sm hover:bg-dermai-ai-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Télécharger carte de diagnostic"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isExportingImage ? 'Export...' : 'Image'}
              </span>
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                 {/* Nouvelle Section - Diagnostic Personnalisé */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-dermai-ai-500 via-dermai-ai-400 to-dermai-ai-600 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden"
        >
          {/* Éléments décoratifs animés */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
          
          <div className="relative z-10">
            {/* En-tête */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Award className="w-7 h-7" />
            </div>
            <div>
                <h2 className="text-2xl md:text-3xl font-bold font-display">Diagnostic Personnalisé</h2>
                <p className="text-dermai-ai-100 text-sm md:text-base">Analyse IA complétée avec succès</p>
            </div>
          </div>
            
            {/* Grille mobile-first - Nouvel ordre */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              
              {/* 1. Type de peau global */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold text-sm">Type de Peau</span>
                </div>
                <div className="text-lg md:text-xl font-bold font-display mb-1">
                  {analysis?.beautyAssessment?.skinType || analysis?.beautyAssessment?.mainConcern || 'Type de peau en cours d\'analyse...'}
                </div>
              </div>

              {/* 2. Spécificités détectées */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5">
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="w-5 h-5" />
                  <span className="font-semibold text-sm">Spécificités</span>
                </div>
                {analysis.beautyAssessment.specificities && analysis.beautyAssessment.specificities.length > 0 ? (
                  <div className="space-y-2">
                    {analysis.beautyAssessment.specificities.slice(0, 2).map((spec, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="font-medium">{spec.name}</div>
                        <div className="text-xs opacity-80 capitalize">{spec.intensity}</div>
                      </div>
                    ))}
                    {analysis.beautyAssessment.specificities.length > 2 && (
                      <button
                        onClick={() => {
                          const observationsSection = document.getElementById('observations-specificities')
                          if (observationsSection) {
                            observationsSection.scrollIntoView({ behavior: 'smooth' })
                          }
                        }}
                        className="text-xs opacity-75 hover:opacity-100 underline cursor-pointer transition-opacity"
                      >
                        +{analysis.beautyAssessment.specificities.length - 2} autres
                      </button>
                    )}
                  </div>
                ) : (
                <div className="text-sm opacity-90">
                    {analysis.beautyAssessment.mainConcern}
                    <div className="text-xs opacity-75 mt-1 capitalize">
                      {analysis.beautyAssessment.intensity}
                </div>
                  </div>
                )}
              </div>

              {/* 3. Score global - maintenant en 3ème position */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 text-center">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold text-sm">Score Global</span>
                </div>
                <div className="text-2xl md:text-3xl font-bold font-display">{analysis.scores.overall}/100</div>
                <div className="text-xs opacity-75 mt-1">8 critères évalués</div>
              </div>
            </div>

            {/* Ligne séparée pour Âge de peau et Amélioration */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* 4. Âge de peau estimé */}
              {skinAgeYears && (
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-semibold text-sm">Âge de peau estimé</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold font-display text-dermai-ai-200">{skinAgeYears} ans</div>
                  <div className="text-xs opacity-75 mt-1">Basé sur analyse photo</div>
                </div>
              )}

              {/* 5. Estimation d'amélioration - en dernier */}
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 text-center">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold text-sm">Estimation d'amélioration</span>
              </div>
                <div className="text-lg font-bold font-display mb-1">
                  {analysis.beautyAssessment.improvementTimeEstimate || "3-4 mois"} pour atteindre 90/100
                </div>
                <div className="text-xs opacity-60">Basé sur l'état de votre peau actuel</div>
              </div>
            </div>
          </div>
        </motion.div>

                 {/* Scores Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-dermai-pure to-dermai-nude-50 rounded-3xl shadow-premium p-8 hover:shadow-premium-lg transition-shadow border border-dermai-nude-100"
        >
           <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8">
             <div className="flex items-center space-x-3 md:space-x-4">
               <div className="p-2 md:p-3 bg-gradient-to-br from-dermai-ai-100 to-dermai-ai-200 rounded-xl md:rounded-2xl">
                 <Award className="w-5 h-5 md:w-7 md:h-7 text-dermai-ai-600" />
               </div>
               <div>
                 <h2 className="text-xl md:text-2xl font-bold font-display text-dermai-neutral-900">Vos Scores Peau</h2>
                 <p className="text-sm md:text-base text-dermai-neutral-600">Analyse complète sur 8 critères essentiels</p>
               </div>
             </div>
           </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 justify-items-center">
            {scoreOrder.map((key) => {
              const score = (analysis.scores as any)[key] as ScoreDetail
              if (!score || typeof score.value !== 'number') return null
              
              return (
                <ScoreCircle
                  key={key}
                  score={Math.round(score.value)}
                  label={scoreLabels[key]}
                  icon={scoreIcons[key]}
                />
              )
            })}
          </div>
        </motion.div>

                 {/* Observations liées aux spécificités */}
         <motion.div
           id="observations-specificities"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white rounded-3xl shadow-xl p-8"
         >
           <div className="flex items-center space-x-3 mb-6">
             <div className="p-2 bg-gradient-to-br from-dermai-ai-100 to-dermai-ai-200 rounded-xl">
               <Eye className="w-5 h-5 text-dermai-ai-600" />
             </div>
             <h2 className="text-2xl font-bold text-gray-900">Observations liées aux spécificités</h2>
           </div>

          {/* Vue d'ensemble (overview) si disponible, sinon fallback sur observations classiques */}
          {Array.isArray((analysis as any).beautyAssessment?.overview) && (analysis as any).beautyAssessment.overview.length > 0 ? (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Vue d'ensemble</h4>
              <div className="grid md:grid-cols-3 gap-3">
                {(analysis as any).beautyAssessment.overview.slice(0, 3).map((item: string, idx: number) => (
                  <div key={idx} className="bg-gradient-to-br from-dermai-ai-50 to-dermai-nude-50 rounded-2xl p-4 border border-dermai-ai-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-dermai-ai-500 to-dermai-ai-600 text-white rounded-full flex items-center justify-center text-sm font-bold">{idx + 1}</div>
                      <p className="text-gray-800 text-sm">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
           <div className="grid md:grid-cols-3 gap-4">
             {analysis.beautyAssessment.visualFindings.slice(0, 3).map((observation: string, index: number) => (
               <div key={index} className="bg-gradient-to-br from-dermai-ai-50 to-dermai-nude-50 rounded-2xl p-4 border border-dermai-ai-200">
                 <div className="flex items-start space-x-3">
                   <div className="w-6 h-6 bg-gradient-to-br from-dermai-ai-500 to-dermai-ai-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                     {index + 1}
                   </div>
                   <p className="text-gray-800 text-sm">{observation}</p>
                 </div>
               </div>
             ))}
           </div>
          )}

          {/* Observations localisées par zones */}
          {getLocalizedRoutine(analysis).length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Zones à surveiller</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getLocalizedRoutine(analysis)
                  .filter((loc: any) => {
                    // Filtrer les zones qui ont des problèmes valides
                    const hasProblems = Array.isArray(loc.problems) && loc.problems.length > 0
                    const hasConcerns = Array.isArray(loc.concerns) && loc.concerns.length > 0
                    const hasIssues = Array.isArray(loc.issues) && loc.issues.length > 0
                    const hasValidDescription = loc.description && loc.description !== 'Problème détecté'
                    
                    return hasProblems || hasConcerns || hasIssues || hasValidDescription
                  })
                  .map((loc: any, idx: number) => {
                    // Fonction pour obtenir les couleurs selon l'intensité
                    const getIntensityColors = (intensity: string) => {
                      const intensityLower = String(intensity || '').toLowerCase()
                      if (intensityLower.includes('intense') || intensityLower.includes('sévère')) {
                        return {
                          bar: 'bg-red-500/80',
                          badge: 'bg-red-50/80 text-red-700 border-red-200/80',
                          ring: 'ring-red-200/80'
                        }
                      } else if (intensityLower.includes('modérée') || intensityLower.includes('moderate')) {
                        return {
                          bar: 'bg-orange-400/80',
                          badge: 'bg-orange-50/80 text-orange-700 border-orange-200/80',
                          ring: 'ring-orange-200/80'
                        }
                      } else {
                        return {
                          bar: 'bg-yellow-300/80',
                          badge: 'bg-yellow-50/80 text-yellow-700 border-yellow-200/80',
                          ring: 'ring-yellow-200/80'
                        }
                      }
                    }

                    // Fonction pour calculer le pourcentage de remplissage
                    const getFillPercent = (intensity: string) => {
                      const intensityLower = String(intensity || '').toLowerCase()
                      if (intensityLower.includes('intense') || intensityLower.includes('sévère')) return 90
                      if (intensityLower.includes('modérée') || intensityLower.includes('moderate')) return 65
                      return 35
                    }

                    // Extraire les problèmes de la zone

                    const problems = extractProblems(loc)

                    return (
                      <div key={idx} className="bg-white rounded-2xl p-5 border-2 border-dermai-ai-200/60 shadow-sm hover:shadow-md transition-shadow">
                        {/* En-tête de la zone */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-full ring-2 ring-offset-2 bg-dermai-ai-400 ring-dermai-ai-200/80" />
                            <h5 className="font-semibold text-gray-900 capitalize text-lg">
                              {loc.zone}
                            </h5>
                          </div>
                        </div>

                        {/* Liste des problèmes avec barres individuelles */}
                        <div className="space-y-3">
                          {problems.map((problem: any, problemIdx: number) => {
                            const colors = getIntensityColors(problem.intensity)
                            const fillPercent = getFillPercent(problem.intensity)
                            
                            return (
                              <div key={problemIdx} className="space-y-2">
                                {/* Nom du problème */}
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-800">
                                    {problem.name}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full border ${colors.badge}`}>
                                    {problem.intensity}
                                  </span>
                                </div>
                                
                                {/* Barre de progression */}
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`${colors.bar} h-2 rounded-full transition-all duration-500 ease-out`}
                                    style={{ width: `${fillPercent}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Description générale de la zone (si disponible) */}
                        {loc.description && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-600">{loc.description}</p>
                          </div>
                        )}

                        {/* Notes supplémentaires (si disponibles) */}
                        {Array.isArray(loc.notes) && loc.notes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">
                              {loc.notes.map((n: string, i: number) => (<li key={i}>{n}</li>))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
         </motion.div>

         {/* NOUVELLE SECTION ROUTINE UNIFIÉE */}
         {analysis.recommendations.unifiedRoutine && analysis.recommendations.unifiedRoutine.length > 0 ? (
           <UnifiedRoutineSection 
             routine={analysis.recommendations.unifiedRoutine} 
             beautyAssessment={analysis.beautyAssessment || undefined}
           />
         ) : (
           // Fallback vers ancienne structure si routine unifiée non disponible
           <>
         {/* Routine Section */}
        {analysis.recommendations.routine && typeof analysis.recommendations.routine === 'object' && analysis.recommendations.routine.immediate ? (
          <AdvancedRoutineDisplay routine={analysis.recommendations.routine} />
        ) : (
          // Fallback pour l'ancien format
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="bg-white rounded-3xl shadow-xl p-8"
         >
           <div className="flex items-center space-x-3 mb-6">
             <Calendar className="w-6 h-6 text-purple-500" />
             <h2 className="text-2xl font-bold text-gray-900">Routine Personnalisée</h2>
           </div>
           
           <div className="grid md:grid-cols-2 gap-6">
             {/* Morning routine */}
             <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
               <div className="flex items-center space-x-3 mb-4">
                 <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                   <span className="text-white text-sm">☀️</span>
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">ROUTINE MATIN</h3>
               </div>
               
               <div className="space-y-3">
                  {Array.isArray(analysis.recommendations.routine) && analysis.recommendations.routine.slice(0, 3).map((step, index) => (
                   <div key={index} className="flex items-start space-x-3">
                     <div className="w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-sm font-bold">
                       {index + 1}
                     </div>
                     <p className="text-gray-800 text-sm">{step}</p>
                   </div>
                 ))}
               </div>
             </div>

             {/* Evening routine */}
             <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
               <div className="flex items-center space-x-3 mb-4">
                 <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                   <span className="text-white text-sm">🌙</span>
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">ROUTINE SOIR</h3>
               </div>
               
               <div className="space-y-3">
                  {Array.isArray(analysis.recommendations.routine) && analysis.recommendations.routine.slice(3, 6).map((step, index) => (
                   <div key={index} className="flex items-start space-x-3">
                     <div className="w-6 h-6 bg-indigo-200 text-indigo-800 rounded-full flex items-center justify-center text-sm font-bold">
                       {index + 1}
                     </div>
                     <p className="text-gray-800 text-sm">{step}</p>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </motion.div>
        )}
           </>
         )}

         {/* SUPPRIMÉ: Routine localisée par zones - remplacée par routine unifiée */}

         {/* Products Section */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="bg-white rounded-3xl shadow-xl p-8 border border-dermai-ai-100"
         >
           <div className="flex items-center space-x-3 mb-6">
             <div className="p-2 bg-gradient-to-br from-dermai-ai-100 to-dermai-ai-200 rounded-xl">
               <ShoppingBag className="w-5 h-5 text-dermai-ai-600" />
             </div>
             <div>
               <h2 className="text-xl md:text-2xl font-bold text-gray-900">Produits recommandés</h2>
               <p className="text-sm text-dermai-neutral-600">Sélectionnés pour votre peau</p>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsLoading ? (
              <div className="flex items-center justify-center w-full py-8">
                <div className="text-dermai-neutral-500">Chargement des produits...</div>
              </div>
            ) : (
              products.map((product, index) => (
                <ProductCard key={index} {...product} onAlternativeClick={() => handleAlternative(index)} />
              ))
            )}
           </div>
         </motion.div>

         {/* Actions secondaires après Produits recommandés */}
         <div className="flex items-center justify-end gap-3">
           <button
             onClick={() => {
               try {
                 if (!analysis) return
                 const json = JSON.stringify(analysis)
                 const encoded = LZString.compressToEncodedURIComponent(json)
                 const shareUrl = `${window.location.origin}/results?d=${encoded}`
                 navigator.clipboard.writeText(shareUrl)
               } catch (e) { console.warn('Copie du lien impossible', e) }
             }}
             className="flex items-center space-x-2 bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 text-white px-6 py-3 rounded-xl shadow-sm hover:from-dermai-ai-600 hover:to-dermai-ai-700 transition-all font-semibold"
             title="Copier le lien du diagnostic"
           >
             <Share2 className="w-4 h-4" />
             <span>Partager</span>
           </button>
           <button
             disabled
             className="flex items-center space-x-2 bg-white text-dermai-neutral-400 px-6 py-3 rounded-xl shadow-sm border-2 border-dermai-neutral-200 cursor-not-allowed font-semibold"
             title="Export PDF bientôt disponible"
           >
             <Download className="w-4 h-4" />
             <span>Enregistrer (PDF bientôt)</span>
           </button>
         </div>

        {/* Chat CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 rounded-3xl p-8 text-white text-center shadow-xl"
        >
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Discussion avec votre assistant DermAI</h2>
            <p className="text-lg opacity-90 mb-6 leading-relaxed">
              Posez vos questions sur votre diagnostic et obtenez des conseils personnalisés !
            </p>
            <p className="text-sm opacity-75 mb-6">
              Ex: "Comment appliquer ces produits ?" ou "Puis-je utiliser du rétinol ?"
            </p>
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-white text-dermai-ai-600 px-8 py-4 rounded-xl font-bold hover:bg-dermai-ai-50 transition-all shadow-lg hover:shadow-xl"
            >
              Commencer la discussion
            </button>
          </div>
        </motion.div>

        {/* Legal notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Avertissement médical</h4>
              <p className="text-yellow-800 text-sm">
                Cette analyse est réalisée par intelligence artificielle et ne remplace pas un diagnostic médical professionnel. 
                En cas de problème dermatologique persistant ou sévère, consultez un dermatologue qualifié.
              </p>
            </div>
          </div>
        </div>
      </div>

             {/* Floating Chat Bubble - masqué quand le chat est ouvert */}
       {!isChatOpen && (
       <motion.button
         initial={{ scale: 0 }}
         animate={{ scale: 1 }}
         transition={{ delay: 1.5, type: "spring" }}
         onClick={() => setIsChatOpen(true)}
         className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 z-50 flex items-center justify-center group"
       >
         <MessageCircle className="w-7 h-7" />
         <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
       </motion.button>
       )}

       {/* Carte partageable pour export d'image */}
       <div className="fixed top-0 left-0 opacity-0 pointer-events-none z-[-1]">
         <ShareableCard 
           ref={shareableCardRef}
           analysis={analysis}
           skinAgeYears={skinAgeYears}
         />
       </div>

       {/* Chat Widget */}
       {isChatOpen && (
         <ChatWidget analysis={analysis} onClose={() => setIsChatOpen(false)} />
       )}
     </div>
   )
 }
