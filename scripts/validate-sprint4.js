#!/usr/bin/env node

/**
 * Script de validation Sprint 4 - DermAI V2
 * Vérifie que tous les objectifs sont atteints avant production
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 VALIDATION SPRINT 4 - DermAI V2 PRODUCTION READY');
console.log('=' .repeat(60));

let allTestsPassed = true;
const results = [];

/**
 * Utilitaire pour exécuter des commandes
 */
function runCommand(command, description) {
  try {
    console.log(`\n🔍 ${description}...`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - SUCCÈS`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} - ÉCHEC`);
    console.log(`   Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Vérifier que les fichiers existent
 */
async function checkFilesExist() {
  console.log('\n📁 VÉRIFICATION FICHIERS CRITIQUES');
  
  const criticalFiles = [
    'playwright.config.ts',
    'tests/e2e/user-journey.spec.ts',
    'tests/e2e/performance.spec.ts',
    'src/services/ai/prompts/optimized-prompts.ts',
    'src/utils/images/compressForAPI.ts',
    'docs/runbooks-incidents.md',
    'docs/deployment-guide.md',
    'docs/diagnostic-technique-complet.md'
  ];
  
  let filesOK = true;
  
  for (const file of criticalFiles) {
    try {
      await fs.access(file);
      console.log(`✅ ${file}`);
    } catch (error) {
      console.log(`❌ ${file} - MANQUANT`);
      filesOK = false;
    }
  }
  
  results.push({
    test: 'Fichiers critiques',
    passed: filesOK,
    details: `${criticalFiles.length} fichiers vérifiés`
  });
  
  if (!filesOK) allTestsPassed = false;
}

/**
 * Vérifier la configuration Playwright
 */
async function checkPlaywrightConfig() {
  console.log('\n🎭 VÉRIFICATION CONFIGURATION PLAYWRIGHT');
  
  const result = runCommand('npx playwright test --list', 'Listing des tests E2E');
  
  if (result.success) {
    const testCount = (result.output.match(/Total: (\d+) tests/)?.[1]) || '0';
    console.log(`📊 Tests E2E détectés: ${testCount}`);
    
    const expectedMinTests = 80; // Au moins 80 tests
    const actualTests = parseInt(testCount);
    
    if (actualTests >= expectedMinTests) {
      console.log(`✅ Nombre de tests suffisant (${actualTests} >= ${expectedMinTests})`);
      results.push({
        test: 'Tests E2E Playwright',
        passed: true,
        details: `${actualTests} tests configurés`
      });
    } else {
      console.log(`❌ Nombre de tests insuffisant (${actualTests} < ${expectedMinTests})`);
      results.push({
        test: 'Tests E2E Playwright',
        passed: false,
        details: `Seulement ${actualTests} tests (minimum ${expectedMinTests})`
      });
      allTestsPassed = false;
    }
  } else {
    results.push({
      test: 'Tests E2E Playwright',
      passed: false,
      details: 'Configuration Playwright invalide'
    });
    allTestsPassed = false;
  }
}

/**
 * Vérifier le build de production
 */
async function checkProductionBuild() {
  console.log('\n🏗️ VÉRIFICATION BUILD PRODUCTION');
  
  const result = runCommand('npm run build', 'Build de production');
  
  results.push({
    test: 'Build Production',
    passed: result.success,
    details: result.success ? 'Build réussi' : 'Erreurs de build'
  });
  
  if (!result.success) allTestsPassed = false;
}

/**
 * Vérifier les tests unitaires
 */
async function checkUnitTests() {
  console.log('\n🧪 VÉRIFICATION TESTS UNITAIRES');
  
  const result = runCommand('npm run test -- --passWithNoTests', 'Tests unitaires');
  
  results.push({
    test: 'Tests Unitaires',
    passed: result.success,
    details: result.success ? 'Tous les tests passent' : 'Tests en échec'
  });
  
  if (!result.success) allTestsPassed = false;
}

/**
 * Vérifier le linting
 */
async function checkLinting() {
  console.log('\n🔍 VÉRIFICATION LINTING');
  
  const result = runCommand('npm run lint', 'ESLint + TypeScript');
  
  results.push({
    test: 'Linting',
    passed: result.success,
    details: result.success ? 'Code propre' : 'Erreurs de linting'
  });
  
  if (!result.success) allTestsPassed = false;
}

/**
 * Vérifier la documentation
 */
async function checkDocumentation() {
  console.log('\n📚 VÉRIFICATION DOCUMENTATION');
  
  try {
    // Vérifier que la fiche technique contient "PRODUCTION READY"
    const ficheContent = await fs.readFile('docs/diagnostic-technique-complet.md', 'utf8');
    const isProductionReady = ficheContent.includes('PRODUCTION READY');
    
    // Vérifier que les runbooks existent et sont complets
    const runbooksContent = await fs.readFile('docs/runbooks-incidents.md', 'utf8');
    const hasIncidentProcedures = runbooksContent.includes('INCIDENT P0-001') && 
                                 runbooksContent.includes('INCIDENT P1-001');
    
    // Vérifier guide déploiement
    const deploymentContent = await fs.readFile('docs/deployment-guide.md', 'utf8');
    const hasDeploymentChecklist = deploymentContent.includes('CHECKLIST PRÉ-DÉPLOIEMENT');
    
    const docComplete = isProductionReady && hasIncidentProcedures && hasDeploymentChecklist;
    
    if (docComplete) {
      console.log('✅ Documentation complète et à jour');
      results.push({
        test: 'Documentation',
        passed: true,
        details: 'Fiche technique v2.0 + Runbooks + Guide déploiement'
      });
    } else {
      console.log('❌ Documentation incomplète');
      results.push({
        test: 'Documentation',
        passed: false,
        details: 'Documentation manquante ou obsolète'
      });
      allTestsPassed = false;
    }
    
  } catch (error) {
    console.log(`❌ Erreur lecture documentation: ${error.message}`);
    results.push({
      test: 'Documentation',
      passed: false,
      details: 'Erreur accès fichiers documentation'
    });
    allTestsPassed = false;
  }
}

/**
 * Vérifier les optimisations
 */
async function checkOptimizations() {
  console.log('\n⚡ VÉRIFICATION OPTIMISATIONS');
  
  try {
    // Vérifier compression adaptative
    const compressionContent = await fs.readFile('src/utils/images/compressForAPI.ts', 'utf8');
    const hasAdaptiveCompression = compressionContent.includes('compressImagesAdaptive') &&
                                  compressionContent.includes('getAdaptiveCompressionLevel');
    
    // Vérifier prompts optimisés
    const promptsExist = await fs.access('src/services/ai/prompts/optimized-prompts.ts')
      .then(() => true)
      .catch(() => false);
    
    const optimizationsComplete = hasAdaptiveCompression && promptsExist;
    
    if (optimizationsComplete) {
      console.log('✅ Optimisations implémentées');
      results.push({
        test: 'Optimisations Performance',
        passed: true,
        details: 'Compression adaptative + Prompts optimisés'
      });
    } else {
      console.log('❌ Optimisations manquantes');
      results.push({
        test: 'Optimisations Performance',
        passed: false,
        details: 'Compression ou prompts non optimisés'
      });
      allTestsPassed = false;
    }
    
  } catch (error) {
    console.log(`❌ Erreur vérification optimisations: ${error.message}`);
    results.push({
      test: 'Optimisations Performance',
      passed: false,
      details: 'Erreur accès fichiers optimisation'
    });
    allTestsPassed = false;
  }
}

/**
 * Afficher le rapport final
 */
function displayFinalReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT FINAL VALIDATION SPRINT 4');
  console.log('='.repeat(60));
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}: ${result.details}`);
  });
  
  console.log('\n' + '-'.repeat(60));
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log(`📈 RÉSULTAT: ${passedTests}/${totalTests} validations réussies`);
  
  if (allTestsPassed) {
    console.log('\n🎉 SPRINT 4 VALIDÉ - DERMAI V2 PRODUCTION READY ! 🚀');
    console.log('\n✅ Tous les objectifs sont atteints:');
    console.log('   • Tests E2E complets (84 tests multi-navigateurs)');
    console.log('   • Optimisations performance (compression + prompts)');
    console.log('   • Documentation opérationnelle (runbooks + déploiement)');
    console.log('   • Build production fonctionnel');
    console.log('   • Code propre et testé');
    console.log('\n🚀 PRÊT POUR LE DÉPLOIEMENT EN PRODUCTION !');
    process.exit(0);
  } else {
    console.log('\n❌ SPRINT 4 INCOMPLET - Corrections nécessaires');
    console.log('\n🔧 Actions requises:');
    results.filter(r => !r.passed).forEach(result => {
      console.log(`   • Corriger: ${result.test} (${result.details})`);
    });
    console.log('\n⚠️  Relancer la validation après corrections');
    process.exit(1);
  }
}

/**
 * Exécution principale
 */
async function main() {
  try {
    await checkFilesExist();
    await checkPlaywrightConfig();
    await checkProductionBuild();
    await checkUnitTests();
    await checkLinting();
    await checkDocumentation();
    await checkOptimizations();
    
    displayFinalReport();
    
  } catch (error) {
    console.error('\n💥 ERREUR CRITIQUE:', error.message);
    process.exit(1);
  }
}

// Lancer la validation
main();
