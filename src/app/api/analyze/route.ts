import { NextRequest, NextResponse } from 'next/server'
import { AnalysisService } from '@/services/ai/analysis.service'
import { runV2Pipeline } from '@/services/ai/orchestrator'
import type { AnalyzeRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    console.log('API /analyze appelée')

    // Vérifier la taille de la requête
    const contentLength = request.headers.get('content-length')
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024)
      console.log(`📊 Taille requête: ${sizeInMB.toFixed(2)}MB`)
      
      if (sizeInMB > 4.5) { // Limite Vercel ~5MB
        return NextResponse.json(
          { success: false, error: 'Images trop volumineuses. Réduisez le nombre ou la qualité des photos.' },
          { status: 413 }
        )
      }
    }

    // Parse et validation du body
    const body = await request.json() as AnalyzeRequest

    console.log('Body reçu:', {
      photosCount: body.photos?.length,
      userProfile: body.userProfile,
      skinConcerns: body.skinConcerns,
      currentRoutine: body.currentRoutine
    })

    console.log('Détails userProfile:', {
      age: body.userProfile?.age,
      gender: body.userProfile?.gender,
      skinType: body.userProfile?.skinType
    })

    if (!body.photos || body.photos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Au moins une photo est requise' },
        { status: 400 }
      )
    }

    if (body.photos.length > 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum 5 photos autorisées' },
        { status: 400 }
      )
    }

    // Validation des données utilisateur
    if (!body.userProfile?.age || !body.userProfile?.gender) {
      return NextResponse.json(
        { success: false, error: 'Profil utilisateur incomplet' },
        { status: 400 }
      )
    }

    // Analyse avec IA (les photos sont déjà en base64)
    try {
      // Check pipeline version from environment
      const pipelineVersion = process.env.DERMAI_PIPELINE || 'legacy'
      console.log(`🔧 Using pipeline version: ${pipelineVersion}`)

      let analysis
      let processingTimeMs = 0
      let aiModelUsed = 'gpt-4o'
      let analysisVersion = 'legacy'

      const startTime = Date.now()

      if (pipelineVersion === 'v2') {
        console.log('🚀 Running V2 Pipeline (3-step orchestration)')
        analysis = await runV2Pipeline(body)
        analysisVersion = 'v2-prompts'
        aiModelUsed = 'gpt-4o-vision'
      } else {
        console.log('🔄 Running Legacy Pipeline')
        analysis = await AnalysisService.analyzeSkin(body)
        analysisVersion = 'legacy'
        aiModelUsed = 'gpt-4o'
      }

      processingTimeMs = Date.now() - startTime

      console.log('Analyse terminée avec succès', {
        pipelineVersion,
        processingTimeMs,
        aiModelUsed,
        analysisVersion
      })

      // Add metadata to analysis for database persistence
      const analysisWithMetadata = {
        ...analysis,
        metadata: {
          analysis_version: analysisVersion,
          processing_time_ms: processingTimeMs,
          ai_model_used: aiModelUsed,
          pipeline_version: pipelineVersion,
          timestamp: new Date().toISOString()
        }
      }

      return NextResponse.json({
        success: true,
        data: analysisWithMetadata
      })
    } catch (analysisError) {
      console.error('Erreur spécifique analyse IA:', analysisError)
      
      // Retourner une réponse avec analyse partielle si possible
      const fallbackAnalysis = {
        id: `fallback_${Date.now()}`,
        userId: 'temp-user',
        photos: body.photos,
        scores: {
          overall: 65,
          hydration: { value: 65, justification: "Analyse temporairement indisponible", confidence: 0.3 },
          wrinkles: { value: 70, justification: "Analyse temporairement indisponible", confidence: 0.3 },
          firmness: { value: 68, justification: "Analyse temporairement indisponible", confidence: 0.3 },
          radiance: { value: 66, justification: "Analyse temporairement indisponible", confidence: 0.3 },
          pores: { value: 64, justification: "Analyse temporairement indisponible", confidence: 0.3 },
          spots: { value: 72, justification: "Analyse temporairement indisponible", confidence: 0.3 },
          darkCircles: { value: 69, justification: "Analyse temporairement indisponible", confidence: 0.3 },
          skinAge: { value: 67, justification: "Analyse temporairement indisponible", confidence: 0.3 }
        },
        diagnostic: {
          primaryCondition: "Service temporairement indisponible",
          severity: "À déterminer",
          affectedAreas: ["visage"],
          observations: [
            "Le service d'analyse IA est temporairement indisponible",
            "Veuillez réessayer dans quelques minutes",
            "En cas de problème persistant, contactez le support"
          ],
          overview: ["Service en maintenance"],
          localized: [],
          prognosis: "Réessayez l'analyse dans quelques instants"
        },
        recommendations: {
          immediate: [
            "Maintenez votre routine actuelle",
            "Réessayez l'analyse dans quelques minutes"
          ],
          routine: {
            immediate: [],
            adaptation: [],
            maintenance: []
          },
          localizedRoutine: [],
          overview: "Recommandations temporairement indisponibles",
          localized: "Service en cours de restauration",
          restrictions: "Aucune restriction particulière"
        },
        createdAt: new Date()
      }

      return NextResponse.json({
        success: true,
        data: fallbackAnalysis,
        warning: "Analyse temporairement en mode dégradé"
      })
    }

  } catch (error) {
    console.error('🚨 API /analyze ERROR:', error)
    
    const errorResponse = {
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: (error instanceof Error && error.stack) ? error.stack.slice(0, 2000) : ''
      },
      hint: "Set DERMAI_AI_PROVIDER=mock for local tests or provide OPENAI_API_KEY",
      pipeline: process.env.DERMAI_PIPELINE || 'legacy'
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}
