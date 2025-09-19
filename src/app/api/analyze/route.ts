import { NextRequest, NextResponse } from 'next/server'
import { AnalysisService } from '@/services/ai/AnalysisService'
import type { AnalyzeRequest as ApiAnalyzeRequest } from '@/types/api'
import { logger, Logger } from '@/utils/Logger'
import { FallbackStrategy } from '@/utils/FallbackStrategy'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CloudStorageService } from '@/services/storage/cloudStorage'

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
  // Extraire le budget du currentRoutine
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
 * API Route V2 Pure - Architecture IA-First Complète
 * 
 * ARCHITECTURE 4 ÉTAPES :
 * 1. Diagnostic pur (IA OpenAI) - Photos → Diagnostic structuré
 * 2. Routine personnalisée (IA OpenAI) - Diagnostic + Profil → Routine 3 phases
 * 3. Sélection produits (IA OpenAI) - Routine + Catalogue → Produits adaptés
 * 4. Assemblage & validation (Algorithmique) - Cohérence finale
 */

export async function POST(request: NextRequest) {
  const requestId = Logger.generateRequestId()
  const startTime = Date.now()
  let apiBody: ApiAnalyzeRequest | null = null
  
  logger.setContext({
    requestId,
    operation: 'api_analyze_v2_pure',
    stage: 'request'
  })
  
  logger.info('🚀 API /analyze V2 Pure appelée', { stage: 'start' })
  
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

    logger.info('Validation réussie, démarrage analyse V2 Pure', { stage: 'validated' })

    // 🚀 ANALYSE V2 PURE - Architecture IA-First Complète
    const analysisStartTime = Date.now()
    
    logger.info('🔥 Utilisation AnalysisService V2 Pure (IA-First)', { stage: 'analysis_v2_pure' })
    
    const analysis = await AnalysisService.analyzeSkinComplete(body)
    
    const analysisDuration = Date.now() - analysisStartTime

    logger.info('✅ AnalysisService V2 Pure terminé avec succès', { 
      stage: 'analysis_v2_pure_success'
    })

    logger.performance('Analyse V2 Pure terminée avec succès', analysisDuration, {
      tokensUsed: (analysis as any).tokensUsed || 0,
      apiLatency: analysisDuration
    }, { stage: 'success' })

    // 🔄 ÉTAPE 1: Sauvegarde automatique si utilisateur connecté
    let savedAnalysisId: string | null = null
    try {
      const session = await getServerSession(authOptions)
      const userId = (session?.user as any)?.id
      if (userId) {
        logger.info('💾 Sauvegarde analyse pour utilisateur connecté', { 
          stage: 'save_analysis',
          userId 
        })
        
        const savedAnalysis = await CloudStorageService.saveAnalysis(
          userId,
          analysis as any, // Cast temporaire pour compatibilité type
          { source: 'web_analysis' }
        )
        
        savedAnalysisId = savedAnalysis.id
        logger.info('✅ Analyse sauvegardée avec succès', { 
          stage: 'save_success'
        }, { analysisId: savedAnalysisId })
      } else {
        logger.info('👤 Mode invité - analyse non sauvegardée', { stage: 'guest_mode' })
      }
    } catch (saveError) {
      logger.error('❌ Erreur sauvegarde analyse', saveError as Error, { stage: 'save_error' })
      // Ne pas faire échouer l'analyse si la sauvegarde échoue
    }

    // Calculer métriques de succès
    const totalDuration = Date.now() - startTime
    logger.info('Requête API V2 Pure terminée avec succès', { stage: 'complete' }, {
      totalDuration,
      analysisDuration,
      version: '2.0-pure',
      success: true,
      savedAnalysisId
    })

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        requestId,
        duration: totalDuration,
        version: '2.0-pure',
        source: 'ia-first-pure',
        architecture: '4-steps-ai',
        savedAnalysisId
      }
    })

  } catch (analysisError) {
    logger.error('Erreur analyse V2 Pure', analysisError as Error, { stage: 'analysis_error' })
    
    // Fallback intelligent
    try {
      logger.warn('Tentative de fallback V2 Pure')
      const fallbackResult = FallbackStrategy.generateDiagnosticFallback(
        apiBody!, 
        (analysisError as Error).message
      )
      
      const totalDuration = Date.now() - startTime
      logger.info('Fallback V2 Pure réussi', { stage: 'fallback_success' }, {
        totalDuration,
        confidence: fallbackResult.confidence
      })

      return NextResponse.json({
        success: true,
        data: fallbackResult.data,
        metadata: {
          requestId,
          duration: totalDuration,
          version: '2.0-pure-fallback',
          source: 'fallback',
          degraded: true,
          reason: 'Analyse principale échouée - Mode dégradé activé'
        },
        warning: "Analyse en mode dégradé - Résultats basés sur profil statistique"
      })
      
    } catch (fallbackError) {
      logger.critical('Fallback V2 Pure également échoué', fallbackError as Error, { stage: 'critical_error' })
      
      const totalDuration = Date.now() - startTime
      
      return NextResponse.json({
        success: false,
        error: 'Service temporairement indisponible',
        metadata: {
          requestId,
          duration: totalDuration,
          version: '2.0-pure',
          source: 'error'
        }
      }, { status: 500 })
    }
  } finally {
    // Nettoyer le contexte
    const finalDuration = Date.now() - startTime
    logger.info('Requête API V2 Pure terminée', { stage: 'cleanup' }, { finalDuration })
    
    // Nettoyer les métriques anciennes périodiquement
    if (Math.random() < 0.1) { // 10% de chance
      logger.cleanupMetrics()
    }
    
    logger.clearContext()
  }
}

// Endpoint pour métriques de monitoring V2 Pure
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
          version: '2.0-pure',
          architecture: '4-steps-ai'
        },
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'DermAI V2 Pure - Architecture IA-First Complète',
      version: '2.0-pure',
      architecture: {
        step1: 'Diagnostic pur (IA OpenAI)',
        step2: 'Routine personnalisée (IA OpenAI)', 
        step3: 'Sélection produits (IA OpenAI)',
        step4: 'Assemblage & validation (Algorithmique)'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des informations' },
      { status: 500 }
    )
  }
}