import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CloudStorageService } from '@/services/storage/cloudStorage'

// GET /api/analyses/latest - Récupérer la dernière analyse de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    console.log('🔍 GET /api/analyses/latest appelé', {
      userId: session.user.id
    })

    const latestAnalysis = await CloudStorageService.getLatestAnalysis(session.user.id)

    if (!latestAnalysis) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Aucune analyse trouvée'
      })
    }

    console.log('✅ Dernière analyse récupérée', {
      analysisId: latestAnalysis.id,
      createdAt: latestAnalysis.created_at
    })

    return NextResponse.json({
      success: true,
      data: latestAnalysis
    })

  } catch (error) {
    console.error('❌ Erreur GET /api/analyses/latest:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la dernière analyse' },
      { status: 500 }
    )
  }
}

