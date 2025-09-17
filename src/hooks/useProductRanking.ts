'use client'

import { useMemo } from 'react'
import { ProductDetail, validateBrandDiversification, validateProductCoherence } from '@/schemas/v3/products'

interface ProductRankingAnalysis {
  ranking: 1 | 2 | 3
  label: string
  description: string
  color: string
  icon: string
  advantages: string[]
  bestFor: string[]
}

interface RankingComparison {
  products: ProductDetail[]
  diversification: {
    isSuccess: boolean
    uniqueBrands: number
    brands: string[]
  }
  coherence: {
    zonesCoherent: boolean
    timingCoherent: boolean
    issues: string[]
  }
  priceRange: {
    min: number
    max: number
    spread: number
    spreadPercentage: number
  }
  recommendations: string[]
}

interface UseProductRankingReturn {
  // Analyse individuelle
  analyzeProduct: (product: ProductDetail) => ProductRankingAnalysis
  
  // Comparaison de groupe
  compareProducts: (products: ProductDetail[]) => RankingComparison
  
  // Utilitaires de ranking
  getRankingLabel: (ranking: 1 | 2 | 3) => string
  getRankingColor: (ranking: 1 | 2 | 3) => string
  getRankingIcon: (ranking: 1 | 2 | 3) => string
  
  // Recommandations intelligentes
  getRecommendationForUser: (
    products: ProductDetail[], 
    userProfile: {
      budget: number
      skinType?: string
      priorities?: string[]
      experience?: 'beginner' | 'intermediate' | 'advanced'
    }
  ) => {
    recommendedProduct: ProductDetail
    reason: string
    alternativeReasons: string[]
  }
}

/**
 * Hook pour analyser et comparer les rankings de produits
 * 
 * Fournit des analyses détaillées sur les produits classés #1, #2, #3
 * et des recommandations personnalisées basées sur le profil utilisateur
 */
export function useProductRanking(): UseProductRankingReturn {
  
  // Configuration des rankings
  const rankingConfig = useMemo(() => ({
    1: {
      label: 'Recommandé',
      description: 'Le plus adapté à votre diagnostic',
      color: 'green',
      icon: 'crown',
      advantages: [
        'Optimal pour votre type de peau',
        'Meilleur rapport efficacité/tolérance',
        'Recommandé par notre IA',
        'Résultats prouvés'
      ],
      bestFor: [
        'Première utilisation',
        'Peau sensible',
        'Résultats garantis',
        'Usage quotidien'
      ]
    },
    2: {
      label: 'Alternative',
      description: 'Qualité équivalente, approche différente',
      color: 'blue',
      icon: 'star',
      advantages: [
        'Approche complémentaire',
        'Marque différente',
        'Actifs spécialisés',
        'Qualité premium'
      ],
      bestFor: [
        'Utilisateurs expérimentés',
        'Préférence de marque',
        'Besoins spécifiques',
        'Variation de routine'
      ]
    },
    3: {
      label: 'Économique',
      description: 'Option accessible ou spécialisée',
      color: 'orange',
      icon: 'dollar-sign',
      advantages: [
        'Prix accessible',
        'Bon rapport qualité/prix',
        'Idéal pour débuter',
        'Sans compromis sur l\'efficacité'
      ],
      bestFor: [
        'Budget serré',
        'Première routine',
        'Test de tolérance',
        'Usage occasionnel'
      ]
    }
  }), [])
  
  // Analyser un produit individuel
  const analyzeProduct = useMemo(() => (product: ProductDetail): ProductRankingAnalysis => {
    const config = rankingConfig[product.ranking]
    
    return {
      ranking: product.ranking,
      label: config.label,
      description: config.description,
      color: config.color,
      icon: config.icon,
      advantages: config.advantages,
      bestFor: config.bestFor
    }
  }, [rankingConfig])
  
  // Comparer un groupe de produits
  const compareProducts = useMemo(() => (products: ProductDetail[]): RankingComparison => {
    if (products.length !== 3) {
      throw new Error('compareProducts requiert exactement 3 produits')
    }
    
    // Validation diversification et cohérence
    const diversification = validateBrandDiversification(products)
    const coherence = validateProductCoherence(products)
    
    // Analyse des prix
    const prices = products.map(p => p.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const spread = maxPrice - minPrice
    const spreadPercentage = minPrice > 0 ? (spread / minPrice) * 100 : 0
    
    // Générer des recommandations
    const recommendations: string[] = []
    
    if (diversification.isSuccess) {
      recommendations.push(`Excellente diversification avec ${diversification.uniqueBrands} marques différentes`)
    } else {
      recommendations.push('Diversification limitée - considérez d\'autres marques')
    }
    
    if (spreadPercentage > 50) {
      recommendations.push('Large gamme de prix - options pour tous les budgets')
    } else if (spreadPercentage < 20) {
      recommendations.push('Prix similaires - choix basé sur les préférences')
    }
    
    if (coherence.zonesCoherent && coherence.timingCoherent) {
      recommendations.push('Parfaite cohérence - tous les produits sont interchangeables')
    }
    
    return {
      products,
      diversification,
      coherence,
      priceRange: {
        min: minPrice,
        max: maxPrice,
        spread,
        spreadPercentage: Math.round(spreadPercentage)
      },
      recommendations
    }
  }, [])
  
  // Utilitaires de ranking
  const getRankingLabel = useMemo(() => (ranking: 1 | 2 | 3): string => {
    return rankingConfig[ranking].label
  }, [rankingConfig])
  
  const getRankingColor = useMemo(() => (ranking: 1 | 2 | 3): string => {
    return rankingConfig[ranking].color
  }, [rankingConfig])
  
  const getRankingIcon = useMemo(() => (ranking: 1 | 2 | 3): string => {
    return rankingConfig[ranking].icon
  }, [rankingConfig])
  
  // Recommandation personnalisée
  const getRecommendationForUser = useMemo(() => (
    products: ProductDetail[],
    userProfile: {
      budget: number
      skinType?: string
      priorities?: string[]
      experience?: 'beginner' | 'intermediate' | 'advanced'
    }
  ) => {
    if (products.length !== 3) {
      throw new Error('getRecommendationForUser requiert exactement 3 produits')
    }
    
    const [primary, alternative, economic] = products.sort((a, b) => a.ranking - b.ranking)
    
    // Logique de recommandation basée sur le profil
    let recommendedProduct = primary
    let reason = 'Produit optimal selon notre analyse IA'
    const alternativeReasons: string[] = []
    
    // Contrainte budgétaire stricte
    if (userProfile.budget < primary.price) {
      if (userProfile.budget >= economic.price) {
        recommendedProduct = economic
        reason = `Respecte votre budget de ${userProfile.budget}€ tout en offrant une excellente efficacité`
      } else if (userProfile.budget >= alternative.price) {
        recommendedProduct = alternative
        reason = `Meilleur compromis dans votre budget de ${userProfile.budget}€`
      }
    }
    
    // Expérience utilisateur
    if (userProfile.experience === 'beginner') {
      if (economic.strengthComparison?.includes('doux') || economic.strengthComparison?.includes('débutant')) {
        recommendedProduct = economic
        reason = 'Formule douce idéale pour débuter une routine skincare'
      }
    } else if (userProfile.experience === 'advanced') {
      if (alternative.strengthComparison?.includes('concentré') || alternative.strengthComparison?.includes('puissant')) {
        recommendedProduct = alternative
        reason = 'Formule avancée adaptée à votre expérience'
      }
    }
    
    // Priorités spécifiques
    if (userProfile.priorities?.includes('prix')) {
      recommendedProduct = economic
      reason = 'Meilleur rapport qualité/prix selon vos priorités'
    } else if (userProfile.priorities?.includes('premium')) {
      recommendedProduct = alternative.price > primary.price ? alternative : primary
      reason = 'Formule premium pour des résultats optimaux'
    }
    
    // Générer les raisons pour les alternatives
    products.forEach(product => {
      if (product.catalogId !== recommendedProduct.catalogId) {
        const analysis = analyzeProduct(product)
        alternativeReasons.push(
          `${analysis.label}: ${product.justification.substring(0, 100)}...`
        )
      }
    })
    
    return {
      recommendedProduct,
      reason,
      alternativeReasons
    }
  }, [analyzeProduct])
  
  return {
    analyzeProduct,
    compareProducts,
    getRankingLabel,
    getRankingColor,
    getRankingIcon,
    getRecommendationForUser
  }
}
