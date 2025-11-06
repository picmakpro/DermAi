/**
 * Test V2 avec une vraie image base64 valide
 */

// Image base64 1x1 pixel valide (PNG transparent)
const validBase64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="

const mockRequest = {
  photos: [
    {
      url: validBase64Image,
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

async function testV2WithValidImage() {
  console.log('🧪 Test V2 avec image base64 valide...')
  console.log('📸 Image:', validBase64Image.substring(0, 50) + '...')
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockRequest)
    })
    
    const result = await response.json()
    
    console.log('📥 Réponse:', {
      success: result.success,
      duration: result.metadata?.duration + 'ms',
      isFallback: result.data?.id?.includes('fallback')
    })
    
    if (result.data?.id?.includes('fallback')) {
      console.log('❌ FALLBACK DÉTECTÉ - La V2 a échoué')
      console.log('🔍 Vérifiez les logs du serveur pour voir l\'erreur V2')
    } else {
      console.log('✅ V2 RÉUSSIE - Pas de fallback')
      console.log('📊 Données V2:', {
        hasBeautyAssessment: !!result.data?.beautyAssessment,
        hasDiagnostic: !!result.data?.diagnostic,
        hasRoutine: !!result.data?.routine,
        hasProducts: !!result.data?.products
      })
    }
    
  } catch (error) {
    console.log('💥 Erreur réseau:', error.message)
  }
}

testV2WithValidImage()

