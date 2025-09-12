/**
 * Script pour débugger la structure V2
 */

const mockRequest = {
  photos: [
    {
      url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop&crop=face",
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

async function debugV2Structure() {
  console.log('🔍 Debug structure V2...')
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockRequest)
    })
    
    const result = await response.json()
    
    if (result.success && result.data) {
      console.log('📊 STRUCTURE COMPLÈTE V2:')
      console.log(JSON.stringify(result.data, null, 2))
    } else {
      console.log('❌ Pas de données:', result)
    }
    
  } catch (error) {
    console.log('💥 Erreur:', error.message)
  }
}

debugV2Structure()
