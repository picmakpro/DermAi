import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CloudStorageService } from '@/services/storage/cloudStorage'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/analyses/[id] - Récupérer une analyse spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const analysisId = params.id

    console.log('🔍 GET /api/analyses/[id] appelé', {
      userId: session.user.id,
      analysisId
    })

    // Récupérer toutes les analyses de l'utilisateur et filtrer par ID
    // (CloudStorageService n'a pas de méthode getAnalysisById pour l'instant)
    const analyses = await CloudStorageService.getUserAnalyses(session.user.id)
    const analysis = analyses.find(a => a.id === analysisId)

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      )
    }

    console.log('✅ Analyse récupérée', {
      analysisId: analysis.id,
      createdAt: analysis.created_at
    })

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('❌ Erreur GET /api/analyses/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'analyse' },
      { status: 500 }
    )
  }
}

// PUT /api/analyses/[id] - Mettre à jour une analyse
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const analysisId = params.id
    const body = await request.json()
    const { analysis_data, photos_metadata, shared_publicly } = body

    console.log('📝 PUT /api/analyses/[id] appelé', {
      userId: session.user.id,
      analysisId,
      hasAnalysisData: !!analysis_data,
      hasPhotosMetadata: !!photos_metadata,
      sharedPublicly: shared_publicly
    })

    const updatedAnalysis = await CloudStorageService.updateAnalysis(
      session.user.id,
      analysisId,
      {
        ...(analysis_data && { analysis_data }),
        ...(photos_metadata && { photos_metadata }),
        ...(typeof shared_publicly === 'boolean' && { shared_publicly })
      }
    )

    console.log('✅ Analyse mise à jour', {
      analysisId: updatedAnalysis.id
    })

    return NextResponse.json({
      success: true,
      data: updatedAnalysis
    })

  } catch (error) {
    console.error('❌ Erreur PUT /api/analyses/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'analyse' },
      { status: 500 }
    )
  }
}

// DELETE /api/analyses/[id] - Supprimer une analyse (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const analysisId = params.id

    console.log('🗑️ DELETE /api/analyses/[id] appelé', {
      userId: session.user.id,
      analysisId
    })

    await CloudStorageService.deleteAnalysis(session.user.id, analysisId)

    console.log('✅ Analyse supprimée', {
      analysisId
    })

    return NextResponse.json({
      success: true,
      message: 'Analyse supprimée avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur DELETE /api/analyses/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'analyse' },
      { status: 500 }
    )
  }
}




