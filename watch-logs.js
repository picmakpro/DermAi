/**
 * Script pour surveiller les logs en temps réel
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

async function testWithLogs() {
  console.log('🚀 Lancement test V2 - surveillez les logs du serveur...')
  console.log('⏱️ Attente 3 secondes avant envoi...')
  
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  console.log('📤 ENVOI REQUÊTE MAINTENANT!')
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockRequest)
    })
    
    const result = await response.json()
    
    console.log('📥 Réponse reçue:', {
      success: result.success,
      hasData: !!result.data,
      version: result.metadata?.version,
      duration: result.metadata?.duration + 'ms'
    })
    
    if (result.data) {
      console.log('📊 Structure des données:')
      console.log('  - Keys:', Object.keys(result.data))
      
      // Vérifier si c'est V1 ou V2
      if (result.data.beautyAssessment) {
        console.log('  - Format: V1 (beautyAssessment présent)')
      } else if (result.data.diagnostic) {
        console.log('  - Format: V2 (diagnostic présent)')
      } else {
        console.log('  - Format: Inconnu')
      }
    }
    
  } catch (error) {
    console.log('❌ Erreur:', error.message)
  }
}

testWithLogs()

