import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CloudStorageService } from '@/services/storage/cloudStorage'

// GET /api/routine/today - Routine du jour basée sur la dernière analyse
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = (session.user as any).id
    console.log('🌅 [ROUTINE-TODAY] Récupération routine du jour pour userId:', userId)

    // Récupérer la dernière analyse pour extraire la routine
    const latestAnalysis = await CloudStorageService.getLatestAnalysis(userId)
    
    if (!latestAnalysis || !latestAnalysis.analysis_data?.routine) {
      console.log('ℹ️ [ROUTINE-TODAY] Aucune routine trouvée')
      return NextResponse.json({
        success: true,
        data: {
          hasRoutine: false,
          message: 'Aucune routine disponible. Faites une analyse pour obtenir votre routine personnalisée.',
          morning: { steps: [], completed: false },
          evening: { steps: [], completed: false }
        }
      })
    }

    const routine = latestAnalysis.analysis_data.routine
    console.log('📋 [ROUTINE-TODAY] Routine trouvée avec phases:', Object.keys(routine.phases || {}))

    // Extraire les étapes pour aujourd'hui (phase immédiate en priorité)
    const todayRoutine = extractTodayRoutine(routine)
    
    // Simuler le statut de complétion (sera remplacé par vraies données plus tard)
    const completionStatus = {
      morning: {
        ...todayRoutine.morning,
        completed: Math.random() > 0.7 // 30% de chance d'être complétée
      },
      evening: {
        ...todayRoutine.evening,
        completed: Math.random() > 0.6 // 40% de chance d'être complétée
      }
    }

    console.log('✅ [ROUTINE-TODAY] Routine du jour générée:', {
      morningSteps: completionStatus.morning.steps.length,
      eveningSteps: completionStatus.evening.steps.length,
      morningCompleted: completionStatus.morning.completed,
      eveningCompleted: completionStatus.evening.completed
    })

    return NextResponse.json({
      success: true,
      data: {
        hasRoutine: true,
        analysisId: latestAnalysis.id,
        analysisDate: latestAnalysis.created_at,
        ...completionStatus
      }
    })

  } catch (error) {
    console.error('❌ [ROUTINE-TODAY] Erreur:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

// Fonction pour extraire la routine du jour depuis l'analyse
function extractTodayRoutine(routine: any) {
  const morningSteps: any[] = []
  const eveningSteps: any[] = []
  
  // Priorité : phase immédiate, puis adaptation si pas d'immédiate
  const phases = routine.phases || {}
  const currentPhase = phases.immediate || phases.adaptation || phases.maintenance
  
  if (!currentPhase?.steps) {
    return { morning: { steps: [] }, evening: { steps: [] } }
  }

  // Séparer les étapes par timing
  currentPhase.steps.forEach((step: any) => {
    const stepWithProduct = {
      ...step,
      // Ajouter un produit exemple basé sur le careType
      product: generateExampleProduct(step.careType),
      completed: false
    }

    switch (step.timing) {
      case 'matin':
        morningSteps.push(stepWithProduct)
        break
      case 'soir':
        eveningSteps.push(stepWithProduct)
        break
      case 'both':
        // Ajouter aux deux moments
        morningSteps.push({ ...stepWithProduct, timing: 'matin' })
        eveningSteps.push({ ...stepWithProduct, timing: 'soir' })
        break
      case 'hebdomadaire':
        // Ajouter au soir pour les soins hebdomadaires
        eveningSteps.push({ ...stepWithProduct, frequency: 'hebdomadaire' })
        break
    }
  })

  // Trier par stepNumber
  morningSteps.sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0))
  eveningSteps.sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0))

  return {
    morning: { steps: morningSteps },
    evening: { steps: eveningSteps }
  }
}

// Générer un produit exemple basé sur le type de soin
function generateExampleProduct(careType: string) {
  const productExamples: { [key: string]: any } = {
    nettoyage: {
      name: 'Nettoyant Doux',
      brand: 'CeraVe',
      type: 'cleanser',
      description: 'Nettoyant visage pour tous types de peau'
    },
    hydratation: {
      name: 'Crème Hydratante',
      brand: 'Neutrogena',
      type: 'moisturizer',
      description: 'Hydratation quotidienne'
    },
    traitement: {
      name: 'Sérum Actif',
      brand: 'The Ordinary',
      type: 'serum',
      description: 'Traitement ciblé'
    },
    protection: {
      name: 'Crème Solaire SPF50',
      brand: 'La Roche-Posay',
      type: 'sunscreen',
      description: 'Protection UV quotidienne'
    },
    exfoliation: {
      name: 'Exfoliant Doux',
      brand: 'Paula\'s Choice',
      type: 'exfoliant',
      description: 'Exfoliation hebdomadaire'
    }
  }

  return productExamples[careType] || {
    name: 'Produit Recommandé',
    brand: 'À définir',
    type: careType,
    description: 'Produit adapté à votre routine'
  }
}