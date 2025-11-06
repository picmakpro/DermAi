import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Tests E2E - Parcours Utilisateur Complet DermAI V2
 * 
 * Validation du parcours complet :
 * Upload photos → Questionnaire → Analyse → Résultats
 */

test.describe('Parcours Utilisateur Complet', () => {
  
  test('parcours complet upload → questionnaire → analyse → résultats', async ({ page }) => {
    const startTime = Date.now();
    
    // 1. PAGE D'ACCUEIL
    await page.goto('/');
    await expect(page).toHaveTitle(/DermAI/);
    
    // Vérifier présence éléments clés
    await expect(page.locator('h1')).toContainText(/diagnostic/i);
    
    // 2. UPLOAD DE PHOTOS
    await page.goto('/upload');
    await expect(page.locator('[data-testid="photo-upload-zone"]')).toBeVisible();
    
    // Simuler upload d'une photo de test
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '../fixtures/test-face.jpg');
    
    // Créer une image de test si elle n'existe pas
    if (!await page.locator('[data-testid="uploaded-photo"]').isVisible()) {
      // Simuler upload via drag & drop ou input file
      await fileInput.setInputFiles(testImagePath);
    }
    
    // Attendre que l'upload soit traité
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });
    
    // Continuer vers le questionnaire
    await page.click('[data-testid="continue-to-questionnaire"]');
    
    // 3. QUESTIONNAIRE INTERACTIF
    await expect(page.url()).toContain('/questionnaire');
    
    // Étape 1 : Profil personnel
    await page.selectOption('[data-testid="age-select"]', '25');
    await page.click('[data-testid="gender-femme"]');
    await page.click('[data-testid="skin-type-mixte"]');
    await page.click('[data-testid="next-step"]');
    
    // Étape 2 : Préoccupations cutanées
    await page.click('[data-testid="concern-acne"]');
    await page.click('[data-testid="concern-hydration"]');
    await page.click('[data-testid="next-step"]');
    
    // Étape 3 : Budget et routine
    await page.fill('[data-testid="budget-input"]', '100');
    await page.click('[data-testid="routine-complete"]');
    await page.click('[data-testid="start-analysis"]');
    
    // 4. PAGE D'ANALYSE
    await expect(page.url()).toContain('/analyze');
    await expect(page.locator('[data-testid="analysis-progress"]')).toBeVisible();
    
    // Attendre la fin de l'analyse (max 45s selon specs)
    await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible({ 
      timeout: 45000 
    });
    
    // 5. PAGE DE RÉSULTATS
    await expect(page.url()).toContain('/results');
    
    // Vérifier présence des scores
    await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();
    const overallScore = await page.locator('[data-testid="overall-score"]').textContent();
    expect(parseInt(overallScore || '0')).toBeGreaterThan(0);
    expect(parseInt(overallScore || '0')).toBeLessThanOrEqual(100);
    
    // Vérifier routine 3 phases
    await expect(page.locator('[data-testid="phase-immediate"]')).toBeVisible();
    await expect(page.locator('[data-testid="phase-adaptation"]')).toBeVisible();
    await expect(page.locator('[data-testid="phase-maintenance"]')).toBeVisible();
    
    // Vérifier produits recommandés
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards).toHaveCountGreaterThan(0);
    
    // Vérifier cohérence budget
    const totalPrice = await page.locator('[data-testid="total-price"]').textContent();
    if (totalPrice) {
      const price = parseFloat(totalPrice.replace(/[^\d.]/g, ''));
      expect(price).toBeLessThanOrEqual(100); // Respecter budget utilisateur
    }
    
    // 6. MÉTRIQUES DE PERFORMANCE
    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;
    
    console.log(`✅ Parcours complet terminé en ${totalDuration}s`);
    expect(totalDuration).toBeLessThan(60); // Max 1 minute pour parcours complet
    
    // 7. FONCTIONNALITÉS AVANCÉES
    
    // Test partage de résultats
    if (await page.locator('[data-testid="share-results"]').isVisible()) {
      await page.click('[data-testid="share-results"]');
      await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();
    }
    
    // Test chat IA
    if (await page.locator('[data-testid="chat-widget"]').isVisible()) {
      await page.click('[data-testid="chat-widget"]');
      await page.fill('[data-testid="chat-input"]', 'Pourquoi ces produits ?');
      await page.click('[data-testid="chat-send"]');
      await expect(page.locator('[data-testid="chat-response"]')).toBeVisible({ timeout: 15000 });
    }
  });

  test('validation des scores détaillés', async ({ page }) => {
    // Aller directement aux résultats (avec données de test)
    await page.goto('/results?test=true');
    
    // Vérifier tous les scores individuels
    const scoreCategories = [
      'hydration',
      'wrinkles', 
      'firmness',
      'radiance',
      'pores',
      'spots',
      'dark-circles',
      'skin-age'
    ];
    
    for (const category of scoreCategories) {
      const scoreElement = page.locator(`[data-testid="score-${category}"]`);
      await expect(scoreElement).toBeVisible();
      
      const scoreText = await scoreElement.textContent();
      const score = parseInt(scoreText || '0');
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
    
    // Vérifier cohérence des scores
    const overallScore = parseInt(await page.locator('[data-testid="overall-score"]').textContent() || '0');
    expect(overallScore).toBeGreaterThan(0);
  });

  test('validation routine 3 phases dermatologique', async ({ page }) => {
    await page.goto('/results?test=true');
    
    // Phase Immédiate (1-3 semaines)
    const phaseImmediate = page.locator('[data-testid="phase-immediate"]');
    await expect(phaseImmediate).toBeVisible();
    await expect(phaseImmediate.locator('[data-testid="phase-duration"]')).toContainText(/1-3.*semaine/i);
    
    // Vérifier produits phase immédiate
    const immediateProducts = phaseImmediate.locator('[data-testid="product-card"]');
    await expect(immediateProducts).toHaveCountGreaterThan(0);
    
    // Phase Adaptation (3-8 semaines)
    const phaseAdaptation = page.locator('[data-testid="phase-adaptation"]');
    await expect(phaseAdaptation).toBeVisible();
    await expect(phaseAdaptation.locator('[data-testid="phase-duration"]')).toContainText(/3-8.*semaine/i);
    
    // Phase Maintenance (continu)
    const phaseMaintenance = page.locator('[data-testid="phase-maintenance"]');
    await expect(phaseMaintenance).toBeVisible();
    await expect(phaseMaintenance.locator('[data-testid="phase-duration"]')).toContainText(/continu/i);
    
    // Vérifier badges temporels éducatifs
    await expect(page.locator('[data-testid="educational-tooltip"]')).toHaveCountGreaterThan(0);
  });

  test('responsive design mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      // Simuler mobile sur desktop
      await page.setViewportSize({ width: 375, height: 667 });
    }
    
    await page.goto('/');
    
    // Vérifier navigation mobile
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test upload sur mobile
    await page.goto('/upload');
    await expect(page.locator('[data-testid="photo-upload-zone"]')).toBeVisible();
    
    // Vérifier que les éléments sont bien adaptés
    const uploadZone = page.locator('[data-testid="photo-upload-zone"]');
    const boundingBox = await uploadZone.boundingBox();
    
    if (boundingBox) {
      expect(boundingBox.width).toBeLessThan(400); // Adapté à la largeur mobile
    }
    
    // Test questionnaire mobile
    await page.goto('/questionnaire');
    await expect(page.locator('[data-testid="questionnaire-mobile"]')).toBeVisible();
    
    // Test résultats mobile
    await page.goto('/results?test=true');
    await expect(page.locator('[data-testid="results-mobile"]')).toBeVisible();
    
    // Vérifier scroll horizontal absent
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowInnerWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowInnerWidth + 1); // +1 pour tolérance
  });
});

test.describe('Gestion d\'Erreurs et Edge Cases', () => {
  
  test('gestion timeout analyse', async ({ page }) => {
    await page.goto('/analyze');
    
    // Simuler timeout en interceptant l'API
    await page.route('/api/analyze', async route => {
      // Délai supérieur au timeout client (30s)
      await new Promise(resolve => setTimeout(resolve, 35000));
      await route.fulfill({ status: 408, body: 'Timeout' });
    });
    
    // Démarrer analyse
    await page.click('[data-testid="start-analysis"]');
    
    // Vérifier message timeout après 30s
    await expect(page.locator('[data-testid="timeout-message"]')).toBeVisible({ 
      timeout: 35000 
    });
    
    // Vérifier bouton retry
    await expect(page.locator('[data-testid="retry-analysis"]')).toBeVisible();
  });

  test('gestion erreur upload photo', async ({ page }) => {
    await page.goto('/upload');
    
    // Simuler erreur upload
    await page.route('/api/upload', async route => {
      await route.fulfill({ 
        status: 413, 
        body: JSON.stringify({ error: 'File too large' })
      });
    });
    
    // Tenter upload fichier trop volumineux
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/large-image.jpg'));
    
    // Vérifier message d'erreur
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-error"]')).toContainText(/trop volumineux/i);
  });

  test('fallback mode dégradé', async ({ page }) => {
    await page.goto('/analyze');
    
    // Simuler erreur OpenAI API
    await page.route('/api/analyze', async route => {
      await route.fulfill({ 
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            source: 'fallback',
            degraded: true,
            confidence: 0.3
          }
        })
      });
    });
    
    await page.click('[data-testid="start-analysis"]');
    
    // Vérifier mode dégradé affiché
    await expect(page.locator('[data-testid="degraded-mode-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="degraded-mode-notice"]')).toContainText(/mode dégradé/i);
    
    // Vérifier possibilité retry
    await expect(page.locator('[data-testid="retry-full-analysis"]')).toBeVisible();
  });
});
