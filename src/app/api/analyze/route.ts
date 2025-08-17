import { NextRequest, NextResponse } from 'next/server'
import { AnalysisService } from '@/services/ai/analysis.service'
import type { AnalyzeRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    console.log('API /analyze appelée')

    // Parse et validation du body
    const body = await request.json() as AnalyzeRequest

    console.log('Body reçu:', {
      photosCount: body.photos?.length,
      userProfile: body.userProfile,
      skinConcerns: body.skinConcerns
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
    const analysis = await AnalysisService.analyzeSkin(body)

    console.log('Analyse terminée avec succès')

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('Erreur API /analyze:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? String(error) : undefined
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
