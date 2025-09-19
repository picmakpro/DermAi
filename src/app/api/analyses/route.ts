import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CloudStorageService } from '@/services/storage/cloudStorage'

// GET /api/analyses - Récupérer les analyses de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true'

    console.log('🔍 GET /api/analyses appelé', {
      userId: session.user.id,
      limit,
      offset,
      includeDeleted
    })

    const analyses = await CloudStorageService.getUserAnalyses(session.user.id, {
      limit,
      offset,
      includeDeleted
    })

    // Enrichir les analyses avec des métadonnées utiles pour le dashboard
    const enrichedAnalyses = analyses.map(analysis => ({
      ...analysis,
      metadata: {
        hasRoutine: !!(analysis.analysis_data as any)?.routine,
        hasScores: !!(analysis.analysis_data as any)?.scores,
        routinePhases: (analysis.analysis_data as any)?.routine?.phases ? 
          Object.keys((analysis.analysis_data as any).routine.phases) : [],
        totalSteps: countTotalSteps(analysis.analysis_data),
        analysisType: (analysis.analysis_data as any)?.routine ? 'V2' : 'V1'
      }
    }))

    const totalCount = await CloudStorageService.getUserAnalysesCount(session.user.id)

    console.log('✅ Analyses récupérées', {
      count: analyses.length,
      totalCount,
      enriched: enrichedAnalyses.length
    })

    return NextResponse.json({
      success: true,
      data: {
        analyses: enrichedAnalyses,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + limit < totalCount
        }
      }
    })

  } catch (error) {
    console.error('❌ Erreur GET /api/analyses:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des analyses' },
      { status: 500 }
    )
  }
}

// POST /api/analyses - Créer une nouvelle analyse (utilisé pour migration manuelle)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { analysis_data, source = 'manual', migrated_from_local = false } = body

    if (!analysis_data) {
      return NextResponse.json(
        { error: 'Données d\'analyse requises' },
        { status: 400 }
      )
    }

    console.log('📝 POST /api/analyses appelé', {
      userId: session.user.id,
      source,
      migrated_from_local
    })

    const savedAnalysis = await CloudStorageService.saveAnalysis(
      session.user.id,
      analysis_data,
      { source, migrated_from_local }
    )

    console.log('✅ Analyse créée', {
      analysisId: savedAnalysis.id
    })

    return NextResponse.json({
      success: true,
      data: savedAnalysis
    })

  } catch (error) {
    console.error('❌ Erreur POST /api/analyses:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'analyse' },
      { status: 500 }
    )
  }
}

// Fonction utilitaire pour compter les étapes totales d'une routine
function countTotalSteps(analysisData: any): number {
  if (!analysisData?.routine?.phases) return 0
  
  const phases = analysisData.routine.phases
  let totalSteps = 0
  
  if (phases.immediate?.steps) totalSteps += phases.immediate.steps.length
  if (phases.adaptation?.steps) totalSteps += phases.adaptation.steps.length
  if (phases.maintenance?.steps) totalSteps += phases.maintenance.steps.length
  
  return totalSteps
}
