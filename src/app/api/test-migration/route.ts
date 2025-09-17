import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MigrationService } from '@/services/migration/migrationService'
import { saveAnalysis } from '@/utils/storage/analysisStore'

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

    // Test 1: Vérifier s'il y a des analyses locales
    const hasLocal = await MigrationService.hasLocalAnalyses()
    
    // Test 2: Compter les analyses locales
    const localCount = await MigrationService.getLocalAnalysesCount()
    
    // Test 3: Générer rapport de migration
    const report = await MigrationService.generateMigrationReport(userId)

    return NextResponse.json({
      success: true,
      userId,
      migration: {
        hasLocalAnalyses: hasLocal,
        localAnalysesCount: localCount,
        report
      }
    })

  } catch (error) {
    console.error('Erreur test migration:', error)
    return NextResponse.json(
      { 
        error: 'Erreur test migration',
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
    const action = body.action

    if (action === 'create_local') {
      // Créer une analyse locale pour tester la migration
      const mockAnalysis = {
        id: `local-test-${Date.now()}`,
        timestamp: new Date().toISOString(),
        photos: [],
        questionnaire: {
          age: 30,
          gender: 'male',
          skinType: 'dry',
          concerns: ['wrinkles'],
          currentRoutine: [],
          allergies: [],
          budget: 'high'
        },
        scores: {
          hydration: 60,
          acne: 90,
          wrinkles: 50,
          dark_spots: 80,
          redness: 85,
          pores: 75,
          firmness: 60,
          radiance: 65
        },
        recommendations: {
          routine: {
            phases: [
              {
                name: 'Phase Test',
                duration: '2-4 semaines',
                products: []
              }
            ]
          }
        }
      }

      await saveAnalysis('test-local-analysis', mockAnalysis)

      return NextResponse.json({
        success: true,
        message: 'Analyse locale créée pour test',
        analysisId: 'test-local-analysis'
      })

    } else if (action === 'migrate') {
      // Effectuer la migration
      const result = await MigrationService.migrateLocalAnalyses(userId)

      return NextResponse.json({
        success: result.success,
        migration: result,
        message: result.success 
          ? `Migration réussie: ${result.migratedCount} analyses migrées`
          : `Migration échouée: ${result.errors.join(', ')}`
      })

    } else if (action === 'clear_local') {
      // Nettoyer les analyses locales
      const cleared = await MigrationService.clearLocalAnalysesAfterMigration()

      return NextResponse.json({
        success: cleared,
        message: cleared 
          ? 'Analyses locales nettoyées'
          : 'Erreur nettoyage analyses locales'
      })

    } else {
      return NextResponse.json(
        { error: 'Action non reconnue' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erreur action migration:', error)
    return NextResponse.json(
      { 
        error: 'Erreur action migration',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
