import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CloudStorageService } from '@/services/storage/cloudStorage'
import { MigrationService } from '@/services/migration/migrationService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Test 1: Récupérer les analyses utilisateur
    const analyses = await CloudStorageService.getUserAnalyses(userId)
    
    // Test 2: Compter les analyses
    const analysesCount = await CloudStorageService.getUserAnalysesCount(userId)
    
    // Test 3: Récupérer la dernière analyse
    const latestAnalysis = await CloudStorageService.getLatestAnalysis(userId)
    
    // Test 4: Générer rapport de migration
    const migrationReport = await MigrationService.generateMigrationReport(userId)

    return NextResponse.json({
      success: true,
      userId,
      tests: {
        analyses: {
          count: analyses.length,
          data: analyses.map(a => ({
            id: a.id,
            created_at: a.created_at,
            source: a.source,
            migrated_from_local: a.migrated_from_local
          }))
        },
        analysesCount,
        latestAnalysis: latestAnalysis ? {
          id: latestAnalysis.id,
          created_at: latestAnalysis.created_at,
          source: latestAnalysis.source
        } : null,
        migrationReport
      }
    })

  } catch (error) {
    console.error('Erreur test cloud storage:', error)
    return NextResponse.json(
      { 
        error: 'Erreur test cloud storage',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()

    // Test de sauvegarde d'une analyse mock
    const mockAnalysis = {
      id: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      photos: [],
      questionnaire: {
        age: 25,
        gender: 'female',
        skinType: 'mixed',
        concerns: ['acne'],
        currentRoutine: [],
        allergies: [],
        budget: 'medium'
      },
      scores: {
        hydration: 75,
        acne: 60,
        wrinkles: 85,
        dark_spots: 70,
        redness: 80,
        pores: 65,
        firmness: 75,
        radiance: 70
      },
      recommendations: {
        routine: {
          phases: [
            {
              name: 'Phase Immédiate',
              duration: '1-3 semaines',
              products: []
            }
          ]
        }
      }
    }

    // Sauvegarder l'analyse test
    const savedAnalysis = await CloudStorageService.saveAnalysis(
      userId, 
      mockAnalysis,
      { source: 'test' }
    )

    // Générer un token de partage
    const shareToken = await CloudStorageService.generateShareToken(
      userId,
      savedAnalysis.id
    )

    return NextResponse.json({
      success: true,
      savedAnalysis: {
        id: savedAnalysis.id,
        created_at: savedAnalysis.created_at,
        source: savedAnalysis.source
      },
      shareToken,
      message: 'Analyse test sauvegardée avec succès'
    })

  } catch (error) {
    console.error('Erreur sauvegarde test:', error)
    return NextResponse.json(
      { 
        error: 'Erreur sauvegarde test',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
