/**
 * Test V2 avec une vraie URL d'image de visage
 */

const mockRequest = {
  photos: [
    {
      // Image de test de visage depuis une source fiable
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format",
      type: "face"
    }
  ],
  userProfile: {
    age: 29,
    gender: "Femme",
    skinType: "Je ne sais pas"
  },
  skinConcerns: {
    primary: ["Imperfections"],
    intensity: "modérée"
  },
  constraints: {
    budget: 100,
    timeAvailable: "10-15 minutes",
    allergies: [],
    currentRoutine: "Basique"
  }
}

async function testV2WithRealFace() {
  console.log('🧪 Test V2 avec vraie image de visage...')
  console.log('📸 URL:', mockRequest.photos[0].url)
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze/test-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockRequest)
    })
    
    const result = await response.json()
    
    console.log('📥 Réponse V2 directe:', {
      success: result.success,
      testMode: result.metadata?.testMode,
      version: result.metadata?.version,
      duration: result.metadata?.duration + 'ms'
    })
    
    if (result.success) {
      console.log('✅ V2 RÉUSSIE!')
      console.log('📊 Données V2:', {
        hasDiagnostic: !!result.data?.diagnostic,
        hasRoutine: !!result.data?.routine,
        hasProducts: !!result.data?.products,
        hasCoherence: !!result.data?.coherenceValidation
      })
      
      if (result.data?.diagnostic) {
        console.log('🔍 Diagnostic V2:', {
          skinType: result.data.diagnostic.skinType,
          overallScore: result.data.diagnostic.scores?.overall,
          issuesCount: result.data.diagnostic.zoneSpecificIssues?.length
        })
      }
      
    } else {
      console.log('❌ V2 ÉCHOUÉE:', result.error)
    }
    
  } catch (error) {
    console.log('💥 Erreur:', error.message)
  }
}

testV2WithRealFace()
