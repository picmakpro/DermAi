/**
 * Script de test V2 avec logs détaillés visibles
 * Usage: node test-v2-detailed-logs.js
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

async function testV2WithDetailedLogs() {
  console.log('🔍 Test V2 avec logs détaillés - Démarrage...')
  console.log('📊 Configuration de test:')
  console.log('  - Photos:', mockRequest.photos.length)
  console.log('  - Âge:', mockRequest.userProfile.age)
  console.log('  - Budget:', mockRequest.constraints.budget + '€')
  console.log('  - Préoccupations:', mockRequest.skinConcerns.primary.join(', '))
  console.log('')
  
  try {
    console.log('📤 Envoi requête vers V2...')
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-force-v2': 'true'
      },
      body: JSON.stringify(mockRequest)
    })
    
    console.log('📥 Réponse reçue, status:', response.status)
    
    const result = await response.json()
    
    if (result.success) {
      console.log('\n✅ SUCCÈS V2!')
      console.log('📊 Métadonnées:')
      console.log('  - Version:', result.metadata?.version)
      console.log('  - Durée:', result.metadata?.duration + 'ms')
      console.log('  - Feature Flag V2:', result.metadata?.featureFlag?.v2Enabled)
      
      if (result.data) {
        console.log('\n📋 Données reçues:')
        console.log('  - Diagnostic:', result.data.diagnostic ? '✅' : '❌')
        console.log('  - Routine:', result.data.routine ? '✅' : '❌')  
        console.log('  - Produits:', result.data.products ? '✅' : '❌')
        console.log('  - Cohérence:', result.data.coherenceValidation ? '✅' : '❌')
        
        if (result.data.diagnostic) {
          console.log('\n🔍 Diagnostic:')
          console.log('  - Type de peau:', result.data.diagnostic.skinType)
          console.log('  - Score global:', result.data.diagnostic.scores?.overall + '/100')
          console.log('  - Âge cutané:', result.data.diagnostic.skinAgeEstimate + ' ans')
          console.log('  - Problèmes détectés:', result.data.diagnostic.zoneSpecificIssues?.length || 0)
        }
        
        if (result.data.routine) {
          console.log('\n🧬 Routine:')
          console.log('  - Phase immédiate:', result.data.routine.phases?.immediate?.steps?.length || 0, 'étapes')
          console.log('  - Phase adaptation:', result.data.routine.phases?.adaptation?.steps?.length || 0, 'étapes')
          console.log('  - Phase maintenance:', result.data.routine.phases?.maintenance?.steps?.length || 0, 'étapes')
        }
        
        if (result.data.products) {
          console.log('\n🛍️ Produits:')
          console.log('  - Produits sélectionnés:', result.data.products.selectedProducts?.length || 0)
          console.log('  - Coût total:', result.data.products.budgetBreakdown?.totalCost + '€')
          console.log('  - Budget respecté:', result.data.products.budgetBreakdown?.budgetRespected ? '✅' : '❌')
        }
        
        if (result.data.coherenceValidation) {
          console.log('\n📈 Cohérence:')
          console.log('  - Score global:', result.data.coherenceValidation.overallScore + '/100')
          console.log('  - Zones cohérentes:', result.data.coherenceValidation.zonesCoherent ? '✅' : '❌')
          console.log('  - Budget respecté:', result.data.coherenceValidation.budgetRespected ? '✅' : '❌')
        }
      }
      
    } else {
      console.log('\n❌ ÉCHEC V2')
      console.log('Erreur:', result.error)
    }
    
  } catch (error) {
    console.log('💥 Erreur réseau:', error.message)
  }
  
  console.log('\n🔍 Vérifiez les logs du serveur pour voir tous les détails des étapes IA!')
}

testV2WithDetailedLogs()
