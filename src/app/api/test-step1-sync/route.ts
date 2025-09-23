import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CloudStorageService } from '@/services/storage/cloudStorage'

// GET /api/test-step1-sync - Tester la synchronisation analyses ↔ authentification
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Non authentifié',
        message: 'Connectez-vous pour tester la synchronisation',
        testResults: {
          authentication: false,
          userId: null,
          analysesCount: 0,
          latestAnalysis: null
        }
      })
    }

    const userId = (session.user as any)?.id
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'ID utilisateur manquant',
        testResults: {
          authentication: true,
          userId: null,
          analysesCount: 0,
          latestAnalysis: null
        }
      })
    }

    console.log('🧪 Test Step 1 - Synchronisation analyses ↔ auth', { userId })

    // Test 1: Récupérer les analyses de l'utilisateur
    const analyses = await CloudStorageService.getUserAnalyses(userId)
    const analysesCount = await CloudStorageService.getUserAnalysesCount(userId)
    
    // Test 2: Récupérer la dernière analyse
    const latestAnalysis = await CloudStorageService.getLatestAnalysis(userId)

    // Test 3: Vérifier la structure des données
    const analysisStructure = latestAnalysis ? {
      hasId: !!latestAnalysis.id,
      hasUserId: !!latestAnalysis.user_id,
      hasAnalysisData: !!latestAnalysis.analysis_data,
      hasCreatedAt: !!latestAnalysis.created_at,
      source: latestAnalysis.source,
      version: latestAnalysis.version
    } : null

    const testResults = {
      authentication: true,
      userId,
      userEmail: session.user.email,
      analysesCount,
      latestAnalysis: latestAnalysis ? {
        id: latestAnalysis.id,
        created_at: latestAnalysis.created_at,
        source: latestAnalysis.source,
        version: latestAnalysis.version,
        migrated_from_local: latestAnalysis.migrated_from_local
      } : null,
      analysisStructure,
      allAnalyses: analyses.map(a => ({
        id: a.id,
        created_at: a.created_at,
        source: a.source,
        version: a.version
      }))
    }

    console.log('✅ Test Step 1 terminé', testResults)

    return NextResponse.json({
      success: true,
      message: 'Test de synchronisation réussi',
      testResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur test Step 1:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du test de synchronisation',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      testResults: {
        authentication: false,
        userId: null,
        analysesCount: 0,
        latestAnalysis: null
      }
    }, { status: 500 })
  }
}

// POST /api/test-step1-sync - Créer une analyse de test
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Créer une analyse de test
    const testAnalysis = {
      id: `test-${Date.now()}`,
      scores: {
        hydration: 75,
        texture: 80,
        radiance: 70,
        wrinkles: 85,
        elasticity: 78,
        sebum: 72,
        sensitivity: 88,
        darkSpots: 65
      },
      globalScore: 77,
      beautyAssessment: {
        skinType: 'combination',
        mainConcerns: ['hydration', 'texture'],
        recommendations: ['Utiliser un sérum hydratant', 'Exfolier 2x par semaine']
      },
      photos: [],
      userId: userId,
      timestamp: new Date().toISOString()
    }

    console.log('🧪 Création analyse de test', { userId })

    const savedAnalysis = await CloudStorageService.saveAnalysis(
      userId,
      testAnalysis as any,
      { source: 'test_step1' }
    )

    console.log('✅ Analyse de test créée', { analysisId: savedAnalysis.id })

    return NextResponse.json({
      success: true,
      message: 'Analyse de test créée avec succès',
      data: {
        analysisId: savedAnalysis.id,
        userId: savedAnalysis.user_id,
        createdAt: savedAnalysis.created_at,
        source: savedAnalysis.source
      }
    })

  } catch (error) {
    console.error('❌ Erreur création analyse test:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la création de l\'analyse de test',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

