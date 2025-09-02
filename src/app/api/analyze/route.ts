import { NextRequest, NextResponse } from 'next/server'
import { AnalysisService } from '@/services/ai/analysis.service'
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
      const analysis = await AnalysisService.analyzeSkin(body)

      console.log('Analyse terminée avec succès')

      return NextResponse.json({
        success: true,
        data: analysis
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
    console.error('Erreur API /analyze:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? String(error) : 'Service temporairement indisponible'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}
