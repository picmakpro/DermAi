/**
 * Script de test rapide pour la V2
 * Usage: node test-v2-quick.js
 */

const mockRequest = {
  photos: [
    {
      url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
      type: "face"
    },
    {
      url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
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

async function testV2() {
  console.log('🧪 Test V2 - Démarrage...')
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-force-v2': 'true'
      },
      body: JSON.stringify(mockRequest)
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Test V2 RÉUSSI !')
      console.log('📊 Version:', result.metadata?.version)
      console.log('⏱️ Durée:', result.metadata?.duration + 'ms')
      console.log('🎯 Cohérence:', result.data?.coherenceValidation?.overallScore + '/100')
      console.log('🌟 Qualité:', result.data?.qualityMetrics?.overallQuality + '/100')
      
      // Vérifier différenciation
      const routineSteps = result.data?.routine?.phases?.immediate?.steps?.length || 0
      console.log('🔧 Étapes routine immédiate:', routineSteps)
      
      const productsCount = result.data?.products?.selectedProducts?.length || 0
      console.log('🛍️ Produits sélectionnés:', productsCount)
      
    } else {
      console.log('❌ Test V2 ÉCHOUÉ')
      console.log('Erreur:', result.error)
    }
    
  } catch (error) {
    console.log('💥 Erreur réseau:', error.message)
  }
}

testV2()
