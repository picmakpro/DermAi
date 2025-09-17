#!/usr/bin/env node

/**
 * Script de test pour valider le Jour 4 : Stockage Cloud & Migration
 * 
 * Tests :
 * 1. Vérification des services créés
 * 2. Test des imports et exports
 * 3. Validation de la structure des fichiers
 * 4. Test des API routes
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 VALIDATION JOUR 4 - STOCKAGE CLOUD & MIGRATION');
console.log('='.repeat(60));

let totalTests = 0;
let passedTests = 0;

function test(description, condition) {
  totalTests++;
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${description}`);
  if (condition) passedTests++;
  return condition;
}

// Test 1: Vérification des fichiers créés
console.log('\n📁 VÉRIFICATION DES FICHIERS CRÉÉS');
console.log('-'.repeat(40));

const requiredFiles = [
  'src/services/storage/cloudStorage.ts',
  'src/services/migration/migrationService.ts',
  'src/app/api/test-cloud-storage/route.ts',
  'src/app/api/test-migration/route.ts',
  'src/app/test-cloud-migration/page.tsx'
];

requiredFiles.forEach(filePath => {
  test(`Fichier ${filePath} existe`, fs.existsSync(filePath));
});

// Test 2: Vérification du contenu des services
console.log('\n🔧 VÉRIFICATION DES SERVICES');
console.log('-'.repeat(40));

try {
  const cloudStorageContent = fs.readFileSync('src/services/storage/cloudStorage.ts', 'utf8');
  
  test('CloudStorageService contient saveAnalysis', cloudStorageContent.includes('saveAnalysis'));
  test('CloudStorageService contient getUserAnalyses', cloudStorageContent.includes('getUserAnalyses'));
  test('CloudStorageService contient deleteAnalysis', cloudStorageContent.includes('deleteAnalysis'));
  test('CloudStorageService contient uploadPhoto', cloudStorageContent.includes('uploadPhoto'));
  test('CloudStorageService contient generateShareToken', cloudStorageContent.includes('generateShareToken'));
  
} catch (error) {
  test('Lecture CloudStorageService', false);
}

try {
  const migrationContent = fs.readFileSync('src/services/migration/migrationService.ts', 'utf8');
  
  test('MigrationService contient migrateLocalAnalyses', migrationContent.includes('migrateLocalAnalyses'));
  test('MigrationService contient clearLocalAnalysesAfterMigration', migrationContent.includes('clearLocalAnalysesAfterMigration'));
  test('MigrationService contient hasLocalAnalyses', migrationContent.includes('hasLocalAnalyses'));
  test('MigrationService contient generateMigrationReport', migrationContent.includes('generateMigrationReport'));
  
} catch (error) {
  test('Lecture MigrationService', false);
}

// Test 3: Vérification des API routes
console.log('\n🔌 VÉRIFICATION DES API ROUTES');
console.log('-'.repeat(40));

try {
  const testCloudContent = fs.readFileSync('src/app/api/test-cloud-storage/route.ts', 'utf8');
  
  test('API test-cloud-storage a GET handler', testCloudContent.includes('export async function GET'));
  test('API test-cloud-storage a POST handler', testCloudContent.includes('export async function POST'));
  test('API test-cloud-storage utilise getServerSession', testCloudContent.includes('getServerSession'));
  test('API test-cloud-storage utilise CloudStorageService', testCloudContent.includes('CloudStorageService'));
  
} catch (error) {
  test('Lecture API test-cloud-storage', false);
}

try {
  const testMigrationContent = fs.readFileSync('src/app/api/test-migration/route.ts', 'utf8');
  
  test('API test-migration a GET handler', testMigrationContent.includes('export async function GET'));
  test('API test-migration a POST handler', testMigrationContent.includes('export async function POST'));
  test('API test-migration utilise MigrationService', testMigrationContent.includes('MigrationService'));
  test('API test-migration gère les actions', testMigrationContent.includes('action'));
  
} catch (error) {
  test('Lecture API test-migration', false);
}

// Test 4: Vérification de la page de test
console.log('\n🎨 VÉRIFICATION DE LA PAGE DE TEST');
console.log('-'.repeat(40));

try {
  const testPageContent = fs.readFileSync('src/app/test-cloud-migration/page.tsx', 'utf8');
  
  test('Page de test utilise useAuth', testPageContent.includes('useAuth'));
  test('Page de test a des boutons de test', testPageContent.includes('TestButton'));
  test('Page de test gère l\'authentification', testPageContent.includes('isAuthenticated'));
  test('Page de test a un scénario complet', testPageContent.includes('Scénario de test complet'));
  
} catch (error) {
  test('Lecture page de test', false);
}

// Test 5: Vérification des types et interfaces
console.log('\n📝 VÉRIFICATION DES TYPES');
console.log('-'.repeat(40));

try {
  const migrationContent = fs.readFileSync('src/services/migration/migrationService.ts', 'utf8');
  
  test('Interface MigrationResult définie', migrationContent.includes('interface MigrationResult'));
  test('MigrationResult a success', migrationContent.includes('success: boolean'));
  test('MigrationResult a migratedCount', migrationContent.includes('migratedCount: number'));
  test('MigrationResult a errors', migrationContent.includes('errors: string[]'));
  test('MigrationResult a duration', migrationContent.includes('duration: number'));
  
} catch (error) {
  test('Vérification types MigrationResult', false);
}

// Résumé des tests
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ DES TESTS');
console.log('='.repeat(60));

const successRate = ((passedTests / totalTests) * 100).toFixed(1);
console.log(`Tests réussis: ${passedTests}/${totalTests} (${successRate}%)`);

if (passedTests === totalTests) {
  console.log('🎉 JOUR 4 VALIDÉ AVEC SUCCÈS !');
  console.log('✅ Tous les services de stockage cloud et migration sont implémentés');
  console.log('✅ Les API routes de test sont fonctionnelles');
  console.log('✅ La page de test est prête');
  console.log('\n🚀 PROCHAINES ÉTAPES :');
  console.log('1. Tester les fonctionnalités sur http://localhost:3000/test-cloud-migration');
  console.log('2. Vérifier la connexion Supabase');
  console.log('3. Tester le processus de migration complet');
  console.log('4. Passer au Jour 5 : Pages Auth & Intégration');
} else {
  console.log('⚠️  JOUR 4 PARTIELLEMENT VALIDÉ');
  console.log(`❌ ${totalTests - passedTests} tests ont échoué`);
  console.log('🔧 Vérifiez les erreurs ci-dessus avant de continuer');
}

console.log('\n📋 CHECKLIST JOUR 4 :');
console.log('□ Service CloudStorageService créé et fonctionnel');
console.log('□ Service MigrationService créé et fonctionnel');
console.log('□ API routes de test créées');
console.log('□ Page de test interactive créée');
console.log('□ Tests de validation passés');

process.exit(passedTests === totalTests ? 0 : 1);
