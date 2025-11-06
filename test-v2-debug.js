/**
 * Script de debug détaillé pour la V2
 */

const mockRequest = {
  photos: [
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

async function testV2Debug() {
  console.log('🔍 Test V2 Debug - Démarrage...')
  
  try {
    console.log('📤 Envoi requête...')
    const response = await fetch('http://localhost:3000/api/analyze/test-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockRequest)
    })
    
    console.log('📥 Réponse reçue, status:', response.status)
    
    const result = await response.json()
    
    console.log('📊 Résultat complet:')
    console.log(JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('\n✅ SUCCÈS V2!')
      console.log('🎯 Diagnostic:', result.data?.diagnostic ? 'Présent' : 'Absent')
      console.log('🧬 Routine:', result.data?.routine ? 'Présent' : 'Absent')  
      console.log('🛍️ Produits:', result.data?.products ? 'Présent' : 'Absent')
      console.log('📈 Cohérence:', result.data?.coherenceValidation ? 'Présent' : 'Absent')
    } else {
      console.log('\n❌ ÉCHEC V2')
      console.log('Erreur:', result.error)
      console.log('Stack:', result.stack)
    }
    
  } catch (error) {
    console.log('💥 Erreur réseau:', error.message)
  }
}

testV2Debug()
