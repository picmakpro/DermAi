'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProductInfoByCatalogId, RecommendedProductCard } from '@/services/catalog/catalogService'
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
  Target
} from 'lucide-react'
import type { SkinAnalysis, SkinScores, ScoreDetail, RecommendedProductCard } from '@/types'
import { getAnalysis } from '@/utils/storage/analysisStore'
import ChatWidget from './ChatWidget'
import ScoreCircle from './components/ScoreCircle'
import ProductCard from './components/ProductCard'
import AdvancedRoutineDisplay from '@/components/routine/AdvancedRoutineDisplay'

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

// Génération de produits recommandés basée sur l'analyse
const getProductRecommendations = async (analysis: SkinAnalysis) => {
  // Si l'analyse contient des produits détaillés, les utiliser
  if (analysis.recommendations?.productsDetailed && analysis.recommendations.productsDetailed.length > 0) {
    return analysis.recommendations.productsDetailed
  }

  // Extraire les catalogId de l'analyse
  const catalogIds = extractCatalogIds(analysis)
  
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

// Créer des produits basés sur les catalogId trouvés
const getProductsFromCatalogIds = async (catalogIds: string[]): Promise<RecommendedProductCard[]> => {
  const products: RecommendedProductCard[] = []
  
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
const getGenericProducts = (analysis: SkinAnalysis) => {
  const mockProducts = []
  const recommendations = analysis.recommendations?.products || []
  const skinConcerns = analysis.diagnostic?.primaryCondition || ''
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
      originalPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
      discount: null,
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

// Routine localisée – fusionne la réponse IA et le diagnostic, avec fallback
const getLocalizedRoutine = (analysis: any) => {
  console.log('🎯 getLocalizedRoutine - analyse structure:', {
    hasLocalizedRoutine: !!analysis?.recommendations?.localizedRoutine,
    localizedRoutineLength: analysis?.recommendations?.localizedRoutine?.length || 0,
    hasLocalized: !!analysis?.diagnostic?.localized,
    localizedLength: analysis?.diagnostic?.localized?.length || 0,
    localizedData: analysis?.diagnostic?.localized
  })

  const aiZones = Array.isArray(analysis?.recommendations?.localizedRoutine)
    ? analysis.recommendations.localizedRoutine
    : []

  const localized = analysis?.diagnostic?.localized
  if (!Array.isArray(localized) || localized.length === 0) {
    console.log('❌ Aucune zone localisée trouvée')
    return []
  }

  console.log('🔄 Création fallback depuis diagnostic.localized:', localized.length, 'zones')
  console.log('📊 Zones trouvées dans localized:', localized.map((l: any) => `${l.zone} (${l.severity})`))
  
  // Fonction utilitaire pour générer une zone à partir du diagnostic (fallback)
  const buildZoneFromDiagnostic = (loc: any, i: number) => {
    console.log(`  📍 Zone ${i + 1}:`, loc.zone, loc.issues || loc.issue, loc.severity)
    
    const issues = Array.isArray(loc.issues) ? loc.issues : [loc.issue].filter(Boolean)
    const issueText = issues.join(' ').toLowerCase()
    const isIrritated = issueText.includes('irrit') || issueText.includes('rougeur') || issueText.includes('inflam')
    const hasPores = issueText.includes('pore') || issueText.includes('sébum')
    
    const restrictions = isIrritated ? ["Éviter AHA/BHA et rétinoïdes jusqu'à disparition des rougeurs"] : []
    const resumeCondition = isIrritated ? "Réintroduire progressivement après 5-7 jours sans irritation" : undefined

    const steps = []
    
    // Ajouter les soins selon les problèmes détectés
    console.log(`    🧪 Analyse zone ${loc.zone}:`, { issues, issueText, isIrritated, hasPores })
    
    if (isIrritated) {
      console.log(`    ✅ Zone ${loc.zone}: Ajout traitement irritation`)
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
      console.log(`    ✅ Zone ${loc.zone}: Ajout traitement pores`)
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
    
    // CRITIQUE: S'assurer qu'CHAQUE zone a au moins une étape
    if (steps.length === 0) {
      console.log(`    ⚠️ Zone ${loc.zone}: Aucun traitement spécifique détecté, ajout soin générique`)
      // Déterminer le soin approprié selon le type de problème
      const hasRedness = issueText.includes('rougeur') || issueText.includes('rouge')
      const hasRoughness = issueText.includes('rugos') || issueText.includes('sécheresse')
      
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
          timing: 'matin et soir',
          catalogId: 'B01MSSDEPK', // CeraVe Nettoyant Hydratant
          application: 'Masser délicatement',
          duration: 'routine continue',
          resume: 'quotidien'
        })
      }
    }

    return {
      zone: loc.zone || `zone ${i + 1}`,
      priority: isIrritated ? 1 : 3,
      // Forcer une sévérité par défaut pour cohérence couleur
      severity: loc.severity || 'Modérée',
      issues: issues,
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

  // 1) Normaliser les zones issues de l'IA (et appliquer une sévérité par défaut)
  const aiByZone = new Map<string, any>()
  aiZones.forEach((z: any) => {
    if (!z || !z.zone) return
    aiByZone.set(String(z.zone).toLowerCase(), {
      ...z,
      severity: z.severity || 'Modérée',
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
      // Si la zone existe déjà côté IA mais sans sévérité, compléter
      const existing = mergedByZone.get(key)
      mergedByZone.set(key, {
        ...existing,
        severity: existing.severity || dz.severity || 'Modérée',
        issues: existing.issues?.length ? existing.issues : dz.issues,
      })
    }
  })

  const results = Array.from(mergedByZone.values())

  console.log('✅ Zones créées pour ciblage:', results.length, 'zones:', results.map(r => `${r.zone} (${r.steps?.length || 0} étapes)`))
  console.log('🔍 Détail des zones créées:', results.map(r => ({ zone: r.zone, severity: r.severity, issues: r.issues, stepsCount: r.steps?.length || 0 })))
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

const severityBadge = (sev?: string) => {
  const s = (sev || '').toLowerCase()
  if (s.includes('sévère') || s.includes('severe')) return 'bg-red-50 text-red-700 border-red-200'
  if (s.includes('modérée') || s.includes('moderate')) return 'bg-orange-50 text-orange-700 border-orange-200'
  if (s.includes('légère') || s.includes('mild')) return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

export default function ResultsPage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null)
  const [userAge, setUserAge] = useState<number | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [products, setProducts] = useState<RecommendedProductCard[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const analysisId = sessionStorage.getItem('dermai_analysis_id')
      const questionnaireData = sessionStorage.getItem('dermai_questionnaire')
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
        setAnalysis(stored)
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
        setProducts(recommendedProducts)
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
    
    const ageDelta = (75 - score.value) / 10
    const computed = Math.round(userAge + ageDelta)
    return Math.max(15, Math.min(80, computed))
  }, [analysis, userAge])

  const handleNewAnalysis = () => {
    sessionStorage.removeItem('dermai_photos')
    sessionStorage.removeItem('dermai_questionnaire')
    sessionStorage.removeItem('dermai_analysis_id')
    router.push('/upload')
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  const scoreOrder: Array<keyof Omit<SkinScores, 'overall'>> = [
    'hydration', 'wrinkles', 'firmness', 'radiance', 'pores'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
                         <div className="flex items-center space-x-3">
               <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                 <span className="text-white font-bold text-lg">D</span>
               </div>
               <div>
                 <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                   DermAI
                 </h1>
                 <p className="text-sm text-gray-600">Diagnostic personnalisé par IA</p>
               </div>
             </div>

            {/* Progress dots */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
            </div>

            {/* New analysis button */}
            <button
              onClick={handleNewAnalysis}
              className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle analyse</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                 {/* Hero Section - Diagnostic */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden"
         >
           <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10 animate-pulse"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-10 -translate-x-10 animate-pulse delay-1000"></div>
           <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
          
          <div className="relative z-10">
                       <div className="flex items-center space-x-3 mb-6">
             <div className="p-2 bg-white/20 rounded-full">
               <Award className="w-8 h-8" />
             </div>
             <div>
               <h2 className="text-2xl font-bold">Diagnostic Personnalisé</h2>
               <p className="text-purple-100 text-sm">Analyse complétée avec succès</p>
             </div>
           </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Skin type */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Sparkles className="w-6 h-6" />
                  <span className="font-semibold">Type de Peau Identifié</span>
                </div>
                <div className="text-xl font-bold mb-2">
                  {analysis.diagnostic.primaryCondition}
                </div>
                <div className="text-sm opacity-90">
                  Sévérité: {analysis.diagnostic.severity}
                </div>
              </div>

              {/* Skin age */}
              {skinAgeYears && (
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <TrendingUp className="w-6 h-6" />
                    <span className="font-semibold">Âge de peau estimé</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-200">{skinAgeYears} ans</div>
                  <div className="text-xs opacity-80 mt-1">Estimation basée sur votre analyse DermAI</div>
                </div>
              )}

              {/* Overall score */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-sm opacity-90 mb-2">Score Global</div>
                <div className="text-4xl font-bold mb-2">{analysis.scores.overall}</div>
                <div className="text-sm opacity-90">Analyse sur 8 critères</div>
              </div>
            </div>
          </div>
        </motion.div>

                 {/* Scores Section */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
         >
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-pink-100 rounded-full">
                 <Award className="w-6 h-6 text-pink-500" />
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-gray-900">Vos Scores Peau</h2>
                 <p className="text-gray-600">Analyse sur 5 piliers essentiels</p>
               </div>
             </div>
             <div className="text-right">
               <div className="text-sm text-gray-500">Score global</div>
               <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                 {analysis.scores.overall}/100
               </div>
             </div>
           </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
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

                 {/* Key Observations */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white rounded-3xl shadow-xl p-8"
         >
           <div className="flex items-center space-x-3 mb-6">
             <Star className="w-6 h-6 text-blue-500" />
             <h2 className="text-2xl font-bold text-gray-900">Observations Détaillées</h2>
           </div>

          {/* Vue d'ensemble (overview) si disponible, sinon fallback sur observations classiques */}
          {Array.isArray((analysis as any).diagnostic?.overview) && (analysis as any).diagnostic.overview.length > 0 ? (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Vue d’ensemble</h4>
              <div className="grid md:grid-cols-3 gap-3">
                {(analysis as any).diagnostic.overview.slice(0, 3).map((item: string, idx: number) => (
                  <div key={idx} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">{idx + 1}</div>
                      <p className="text-gray-800 text-sm">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
           <div className="grid md:grid-cols-3 gap-4">
             {analysis.diagnostic.observations.slice(0, 3).map((observation, index) => (
               <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
                 <div className="flex items-start space-x-3">
                   <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                     {index + 1}
                   </div>
                   <p className="text-gray-800 text-sm">{observation}</p>
                 </div>
               </div>
             ))}
           </div>
          )}

          {/* Observations localisées par zones */}
          {Array.isArray((analysis as any).diagnostic?.localized) && (analysis as any).diagnostic.localized.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Zones à surveiller</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {(analysis as any).diagnostic.localized.map((loc: any, idx: number) => {
                  const severity = String(loc.severity || '').toLowerCase()
                  const severityColor = severity.includes('sévère') || severity.includes('severe')
                    ? 'bg-red-500'
                    : severity.includes('modérée') || severity.includes('moderate')
                    ? 'bg-orange-400'
                    : 'bg-yellow-300'
                  const fillPercent = severity.includes('sévère') || severity.includes('severe')
                    ? 90
                    : severity.includes('modérée') || severity.includes('moderate')
                    ? 65
                    : 35
                  return (
                    <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {/* Voyant de sévérité */}
                          <div className={`w-4 h-4 rounded-full ring-2 ring-offset-2 ${severityColor} ring-${severity.includes('sévère') ? 'red' : severity.includes('modérée') ? 'orange' : 'yellow'}-200`} />
                          <span className="font-medium text-gray-900 capitalize">{loc.zone}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600">{loc.severity || '—'}</span>
                      </div>

                      <div className="text-sm text-gray-800 mb-3">{loc.issue}</div>

                      {/* Barre de remplissage visuelle */}
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`${severityColor} h-2 rounded-full`}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>

                      {Array.isArray(loc.notes) && loc.notes.length > 0 && (
                        <ul className="mt-3 text-xs text-gray-600 list-disc pl-5 space-y-0.5">
                          {loc.notes.map((n: string, i: number) => (<li key={i}>{n}</li>))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
         </motion.div>

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

         {/* Routine localisée par zones (si disponible) */}
         {getLocalizedRoutine(analysis).length > 0 && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="bg-white rounded-3xl shadow-xl p-8"
           >
             <div className="flex items-center space-x-3 mb-6">
               <Target className="w-6 h-6 text-rose-500" />
               <h2 className="text-2xl font-bold text-gray-900">Traitement des zones à surveiller</h2>
             </div>

                         <div className="space-y-6">
              {getLocalizedRoutine(analysis)
                .sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99))
                .map((loc: any, idx: number) => {
                 // Utiliser la même fonction severityBadge pour la cohérence
                 const severityClass = severityBadge(loc.severity)
                 
                 // Background coloré selon la sévérité
                 const sev = String(loc.severity || '').toLowerCase()
                 const backgroundClass = sev.includes('sévère') || sev.includes('severe')
                   ? 'bg-red-50 border-red-200'
                   : sev.includes('modérée') || sev.includes('moderate')
                   ? 'bg-orange-50 border-orange-200'
                   : 'bg-yellow-50 border-yellow-200'
                 
                 return (
                   <div key={idx} className={`rounded-2xl border p-6 ${backgroundClass}`}>
                     {/* En-tête de zone avec badge de sévérité cohérent */}
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-3">
                         <h4 className="text-lg font-bold text-gray-900 capitalize">{loc.zone}</h4>
                         <span className={`text-xs px-3 py-1 rounded-full border ${severityClass}`}>
                           {loc.severity || 'Modérée'}
                         </span>
                       </div>
                       {Array.isArray(loc.issues) && (
                         <div className="text-sm text-gray-600">{loc.issues.join(' • ')}</div>
                       )}
                     </div>

                      {Array.isArray(loc.restrictions) && loc.restrictions.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-700 mb-1">Restrictions temporaires</div>
                          <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">
                            {loc.restrictions.map((r: string, i: number) => (<li key={i}>{r}</li>))}
                          </ul>
                        </div>
                      )}

                      {loc.resumeCondition && (
                        <div className="text-xs text-gray-600 mb-3">
                          <span className="font-medium">Reprise progressive:</span> {loc.resumeCondition}
                        </div>
                      )}

                      {Array.isArray(loc.steps) && loc.steps.length > 0 && (
                        <div className="space-y-3">
                          {loc.steps.map((s: any, si: number) => (
                            <div key={si} className="bg-white rounded-xl p-4 border border-gray-200">
                              {/* En-tête avec numérotation claire */}
                              <div className="flex items-start space-x-3 mb-3">
                                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {si + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-gray-900 mb-1">{s.name || s.title}</div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                      {s.category === 'treatment' ? '🩹 Traitement' : '💧 Soin'} • 
                                      {s.frequency === 'quotidien' ? ' Quotidien' : ` ${s.frequency}`}
                                      {s.timing && ` • ${s.timing === 'soir' ? 'Soir' : s.timing === 'matin' ? 'Matin' : s.timing}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {/* Affichage amélioré des produits avec catalogId */}
                              {s.catalogId && (
                                <div className="bg-blue-50 rounded-lg p-2 mb-2 border border-blue-200">
                                  <div className="flex items-center space-x-1 text-xs text-blue-700 mb-1">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    <span className="font-medium">Produit recommandé</span>
                                  </div>
                                  <p className="text-xs text-gray-800 font-medium">{getProductNameFromCatalogId(s.catalogId)}</p>
                                  {s.application && (
                                    <p className="text-xs text-gray-600 mt-1">{s.application}</p>
                                  )}
                                  {s.duration && (
                                    <p className="text-xs text-gray-500 mt-1">Durée: {s.duration}</p>
                                  )}
                                  {s.resume && (
                                    <p className="text-xs text-gray-500 mt-1">Reprise: {s.resume}</p>
                                  )}
                                </div>
                              )}
                              {/* Fallback pour ancienne structure */}
                              {!s.catalogId && getCatalogProductName(analysis, s) && (
                                <div className="text-xs text-gray-800"><span className="font-medium">Produit:</span> {getCatalogProductName(analysis, s)}</div>
                              )}
                              {Array.isArray(s.applicationTips) && s.applicationTips.length > 0 && (
                                <div className="mt-1">
                                  <div className="text-[11px] text-gray-600 font-medium mb-0.5">Conseils d’application</div>
                                  <ul className="text-xs text-gray-600 list-disc pl-4 space-y-0.5">
                                    {s.applicationTips.map((t: string, ti: number) => (<li key={ti}>{t}</li>))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
             </div>
           </motion.div>
         )}

         {/* Products Section */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-xl p-8 border border-purple-100"
         >
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center space-x-3">
               <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                 <span className="text-white text-xl">🛍️</span>
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-gray-900">Produits Recommandés</h2>
                 <p className="text-gray-600">
                   Sélectionnés par l'IA • <span className="text-green-600 font-semibold">Livraison gratuite dès 49€</span>
                 </p>
               </div>
             </div>
             <div className="text-right hidden md:block">
               <div className="text-sm text-gray-500">Offre spéciale</div>
               <div className="text-lg font-bold text-green-600">-19% vs pharmacie</div>
             </div>
           </div>

           <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-2xl p-4 mb-6">
             <div className="flex items-center justify-between text-green-800">
               <div className="flex items-center space-x-2">
               <span className="text-lg">💡</span>
               <span className="font-semibold">Ces produits correspondent parfaitement à votre type de peau</span>
               </div>
               <div className="text-xs bg-green-200 text-green-800 px-3 py-1 rounded-full">
                 Sélection DermAI
               </div>
             </div>
           </div>

                     <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
            {productsLoading ? (
              <div className="flex items-center justify-center w-full py-8">
                <div className="text-gray-500">Chargement des produits...</div>
              </div>
            ) : (
              products.map((product, index) => (
                <ProductCard key={index} {...product} />
              ))
            )}
          </div>
         </motion.div>

        {/* Chat CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl p-8 text-white text-center"
        >
          <div className="max-w-2xl mx-auto">
            <MessageCircle className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Discussion avec votre assistant DermAI</h2>
            <p className="text-lg opacity-90 mb-6">
              Posez vos questions sur votre diagnostic !
            </p>
            <p className="text-sm opacity-75 mb-4">
              Ex: "Comment appliquer ces produits ?" ou "Puis-je utiliser du rétinol ?"
            </p>
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors"
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
         className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50 flex items-center justify-center group"
       >
         <MessageCircle className="w-7 h-7" />
         <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-pulse flex items-center justify-center">
           <span className="text-white text-xs font-bold">!</span>
         </span>
         
         {/* Tooltip */}
         <div className="absolute bottom-full right-0 mb-3 hidden group-hover:block">
           <div className="bg-gray-900 text-white text-sm rounded-lg px-4 py-3 whitespace-nowrap shadow-xl">
             <div className="font-semibold">💬 Besoin d'aide ?</div>
             <div className="text-xs text-gray-300 mt-1">Posez vos questions à votre assistant DermAI</div>
             <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
           </div>
         </div>
       </motion.button>
       )}

       {/* Chat Widget */}
       {isChatOpen && (
         <ChatWidget analysis={analysis} onClose={() => setIsChatOpen(false)} />
       )}
     </div>
   )
 }
