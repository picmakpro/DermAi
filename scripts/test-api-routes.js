#!/usr/bin/env node

/**
 * Script pour tester les API routes du Sprint 2.3
 * À exécuter après avoir créé les tables Supabase
 */

const BASE_URL = 'http://localhost:3000'

console.log('🧪 TEST API ROUTES SPRINT 2.3')
console.log('=' .repeat(50))

// Test des endpoints (nécessite d'être connecté)
const endpoints = [
  { method: 'GET', url: '/api/routine/stats', description: 'Statistiques routine' },
  { method: 'GET', url: '/api/routine/today', description: 'Routine du jour' },
  { method: 'GET', url: '/api/routine/completions', description: 'Historique completions' },
  { method: 'GET', url: '/api/routine/shelves', description: 'Liste étagères' },
  { method: 'GET', url: '/api/products/search?q=serum', description: 'Recherche produits' }
]

console.log('\n📡 Endpoints à tester manuellement (nécessite authentification):')
endpoints.forEach(endpoint => {
  console.log(`${endpoint.method.padEnd(4)} ${BASE_URL}${endpoint.url}`)
  console.log(`     → ${endpoint.description}`)
})

console.log('\n📋 INSTRUCTIONS DE TEST:')
console.log('1. Assurez-vous que le serveur dev tourne (npm run dev)')
console.log('2. Connectez-vous sur http://localhost:3000')
console.log('3. Allez sur /dashboard/routine pour tester le calendrier')
console.log('4. Allez sur /dashboard/routine/shelves pour tester les étagères')
console.log('5. Utilisez les DevTools pour vérifier les appels API')

console.log('\n🔍 POINTS DE VÉRIFICATION:')
console.log('✓ Le calendrier affiche les jours avec indicateurs')
console.log('✓ Cliquer sur un jour ouvre le modal de détail')
console.log('✓ Les toggles matin/soir fonctionnent')
console.log('✓ Les stats (streak, taux) se mettent à jour')
console.log('✓ La page étagères charge sans erreur')
console.log('✓ Le bouton "Créer étagère" ouvre le modal')
console.log('✓ La recherche de produits fonctionne')
console.log('✓ Le drag & drop réorganise les éléments')

console.log('\n⚠️  PRÉREQUIS:')
console.log('- Tables Supabase créées (SPRINT-2-3-SUPABASE-TABLES.sql)')
console.log('- Utilisateur connecté avec session valide')
console.log('- Données de test optionnelles (SPRINT-2-3-TEST-DATA.sql)')


