import { NextRequest, NextResponse } from 'next/server'
import { AnalysisService } from '@/services/ai/AnalysisService'
import type { AnalyzeRequest as ApiAnalyzeRequest } from '@/types/api'
import { logger, Logger } from '@/utils/Logger'
import { ProductSelectionV3Schema } from '@/schemas/v3/products'

// Type pour le service AnalysisService
interface ServiceAnalyzeRequest {
  photos: Array<{
    url: string
    type?: string
  }>
  userProfile: {
    age: number
    gender: string
    skinType?: string
  }
  skinConcerns: {
    primary: string[]
    intensity?: string
  }
  constraints: {
    budget: number
    timeAvailable?: string
    allergies?: string[]
    currentRoutine?: string
  }
}

// Adaptateur pour convertir API request vers Service request
function adaptApiRequestToService(apiRequest: ApiAnalyzeRequest): ServiceAnalyzeRequest {
  
  const budgetMapping = {
    '< 50€': 50,
    '50-100€': 100,
    '100-200€': 200,
    '> 200€': 300,
    'Pas de limite': 500
  }
  
  const budget = budgetMapping[apiRequest.currentRoutine.monthlyBudget] || 100
  
  return {
    photos: apiRequest.photos.map(photo => ({
      url: photo.url || photo.file || '',
      type: photo.type
    })),
    userProfile: {
      age: apiRequest.userProfile.age,
      gender: apiRequest.userProfile.gender,
      skinType: apiRequest.userProfile.skinType
    },
    skinConcerns: {
      primary: apiRequest.skinConcerns.primary,
      intensity: 'modérée' // Valeur par défaut
    },
    constraints: {
      budget,
      timeAvailable: apiRequest.currentRoutine.routinePreference || '10-15 min',
      allergies: apiRequest.allergies?.ingredients || [],
      currentRoutine: `Matin: ${apiRequest.currentRoutine.morningProducts.join(', ')}. Soir: ${apiRequest.currentRoutine.eveningProducts.join(', ')}`
    }
  }
}

/**
 * 🔥 API Route V3 - TOP 3 PRODUITS PAR CATÉGORIE
 * 
 * ARCHITECTURE 4 ÉTAPES ENRICHIE :
 * 1. Diagnostic pur (IA OpenAI) - Photos → Diagnostic structuré
 * 2. Routine personnalisée (IA OpenAI) - Diagnostic + Profil → Routine 3 phases
 * 3. Sélection TOP 3 produits (IA OpenAI) - Routine + Catalogue → 3 produits classés par étape
 * 4. Assemblage & validation (Algorithmique) - Cohérence finale avec alternatives
 */

export async function POST(request: NextRequest) {
  const requestId = Logger.generateRequestId()
  const startTime = Date.now()
  let apiBody: ApiAnalyzeRequest | null = null
  
  logger.setContext({
    requestId,
    operation: 'api_analyze_v3_top3',
    stage: 'request'
  })
  
  logger.info('🔥 API /analyze-v3 TOP 3 appelée', { stage: 'start' })
  
  try {
    // Validation taille requête
    const contentLength = request.headers.get('content-length')
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024)
      logger.info(`📊 Taille requête: ${sizeInMB.toFixed(2)}MB`, { stage: 'validation' }, { sizeInMB })
      
      if (sizeInMB > 4.5) { // Limite Vercel ~5MB
        logger.warn('Requête trop volumineuse rejetée', { stage: 'validation' }, { sizeInMB, limit: 4.5 })
        return NextResponse.json(
          { success: false, error: 'Images trop volumineuses. Réduisez le nombre ou la qualité des photos.' },
          { status: 413 }
        )
      }
    }

    // Parse du body
    apiBody = await request.json() as ApiAnalyzeRequest
    const body = adaptApiRequestToService(apiBody)

    logger.info('Body reçu et parsé', { stage: 'parsing' }, {
      photosCount: body.photos?.length,
      userAge: body.userProfile?.age,
      skinType: body.userProfile?.skinType,
      concernsCount: body.skinConcerns?.primary?.length,
      budget: body.constraints.budget
    })

    // Validation des données requises
    if (!body.photos || body.photos.length === 0) {
      logger.warn('Validation échouée: aucune photo', { stage: 'validation' })
      return NextResponse.json(
        { success: false, error: 'Au moins une photo est requise' },
        { status: 400 }
      )
    }

    if (body.photos.length > 5) {
      logger.warn('Validation échouée: trop de photos', { stage: 'validation' }, { count: body.photos.length })
      return NextResponse.json(
        { success: false, error: 'Maximum 5 photos autorisées' },
        { status: 400 }
      )
    }

    if (!body.userProfile?.age || !body.userProfile?.gender) {
      logger.warn('Validation échouée: profil incomplet', { stage: 'validation' }, {
        hasAge: !!body.userProfile?.age,
        hasGender: !!body.userProfile?.gender
      })
      return NextResponse.json(
        { success: false, error: 'Profil utilisateur incomplet' },
        { status: 400 }
      )
    }

    logger.info('Validation réussie, démarrage analyse V3 TOP 3', { stage: 'validated' })

    // 🔥 ANALYSE V3 TOP 3 - Architecture IA-First Enrichie
    const analysisStartTime = Date.now()
    
    logger.info('🔥 Utilisation AnalysisService V3 TOP 3 (IA-First Enrichi)', { stage: 'analysis_v3_top3' })
    
    // ÉTAPE 1 & 2: Diagnostic + Routine (inchangées)
    const diagnostic = await AnalysisService.generatePureDiagnostic(body, requestId)
    const routine = await AnalysisService.generatePersonalizedRoutine(diagnostic, body, requestId)
    
    // ÉTAPE 3 V3: Sélection TOP 3 produits par catégorie
    const productsV3 = await AnalysisService.selectOptimalProductsV3(routine, body, requestId)
    
    // ÉTAPE 4: Assemblage final avec validation V3
    const analysis = {
      diagnostic,
      routine,
      products: productsV3, // ProductSelectionV3 avec alternatives
      metadata: {
        requestId,
        version: '3.0-top3',
        architecture: '4-steps-ai-enriched',
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - analysisStartTime
      }
    }
    
    const analysisDuration = Date.now() - analysisStartTime

    logger.info('✅ AnalysisService V3 TOP 3 terminé avec succès', { 
      stage: 'analysis_v3_top3_success',
      stepsCount: productsV3.selectedProducts.length,
      totalProducts: productsV3.selectedProducts.length * 3,
      diversificationSuccess: productsV3.coherenceValidation.diversificationSuccess
    })

    logger.performance('Analyse V3 TOP 3 terminée avec succès', analysisDuration, {
      tokensUsed: (analysis as any).tokensUsed || 0,
      apiLatency: analysisDuration,
      productsGenerated: productsV3.selectedProducts.length * 3
    }, { stage: 'success' })

    // Calculer métriques de succès V3
    const totalDuration = Date.now() - startTime
    logger.info('Requête API V3 TOP 3 terminée avec succès', { 
      stage: 'complete',
      totalDuration,
      stepsProcessed: productsV3.selectedProducts.length,
      alternativesGenerated: productsV3.selectedProducts.length * 2,
      budgetRespected: productsV3.budgetBreakdown.budgetRespected
    })

    // Réponse avec structure V3 enrichie
    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        version: '3.0-top3',
        architecture: '4-steps-ai-enriched',
        processingTime: totalDuration,
        features: {
          top3Products: true,
          intelligentAlternatives: true,
          brandDiversification: productsV3.coherenceValidation.diversificationSuccess,
          budgetOptimization: productsV3.budgetBreakdown.budgetRespected
        }
      }
    })

  } catch (error) {
    const errorDuration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    logger.error('❌ Erreur API V3 TOP 3', { 
      stage: 'error',
      error: errorMessage,
      duration: errorDuration,
      stack: error instanceof Error ? error.stack : undefined
    })

    // Gestion d'erreurs spécifiques V3
    if (errorMessage.includes('ProductSelectionV3Schema')) {
      return NextResponse.json({
        success: false,
        error: 'Erreur de validation des produits TOP 3. Veuillez réessayer.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }, { status: 422 })
    }

    if (errorMessage.includes('diversification')) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de générer des alternatives diversifiées. Veuillez réessayer.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }, { status: 422 })
    }

    // Erreur générique
    return NextResponse.json({
      success: false,
      error: 'Une erreur est survenue lors de l\'analyse. Veuillez réessayer.',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
    
  } finally {
    logger.clearContext()
  }
}

// Endpoint pour métriques de monitoring V3 TOP 3
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    if (url.searchParams.get('metrics') === 'true') {
      const timeWindow = parseInt(url.searchParams.get('window') || '3600000') // 1h par défaut
      const metrics = logger.getAggregatedMetrics(timeWindow)
      
      return NextResponse.json({
        success: true,
        data: {
          ...metrics,
          version: '3.0-top3',
          architecture: '4-steps-ai-enriched',
          features: {
            top3Products: true,
            intelligentAlternatives: true,
            brandDiversification: true,
            budgetOptimization: true
          }
        },
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'DermAI V3 TOP 3 - Architecture IA-First Enrichie',
      version: '3.0-top3',
      architecture: {
        step1: 'Diagnostic pur (IA OpenAI)',
        step2: 'Routine personnalisée (IA OpenAI)', 
        step3: 'Sélection TOP 3 produits (IA OpenAI)',
        step4: 'Assemblage & validation alternatives (Algorithmique)'
      },
      features: {
        top3Products: 'Génération de 3 produits classés par pertinence',
        intelligentAlternatives: 'Alternatives avec justifications différenciées',
        brandDiversification: 'Diversification automatique des marques',
        budgetOptimization: 'Respect strict du budget utilisateur'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des informations V3' },
      { status: 500 }
    )
  }
}
