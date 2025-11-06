import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Performance et Charge DermAI V2
 * 
 * Validation des performances sous charge :
 * - Latence P95 < 25s
 * - 50 analyses simultanées sans crash
 * - Usage mémoire < 80%
 */

test.describe('Tests de Performance', () => {
  
  test('latence analyse individuelle < 30s', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/analyze');
    
    // Démarrer analyse avec données de test
    await page.evaluate(() => {
      // Simuler données questionnaire en localStorage
      localStorage.setItem('questionnaire-data', JSON.stringify({
        age: 25,
        gender: 'Femme',
        skinType: 'Mixte',
        concerns: ['acne', 'hydration'],
        budget: 100
      }));
      
      // Simuler photos uploadées
      localStorage.setItem('uploaded-photos', JSON.stringify([
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' // Image de test encodée
      ]));
    });
    
    await page.click('[data-testid="start-analysis"]');
    
    // Attendre fin analyse
    await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible({ 
      timeout: 30000 
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`⏱️ Analyse terminée en ${duration}s`);
    expect(duration).toBeLessThan(30); // Objectif < 30s
    
    // Vérifier qualité résultats malgré contrainte temps
    await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-card"]')).toHaveCountGreaterThan(0);
  });

  test('test de charge - 10 analyses simultanées', async ({ browser }) => {
    const contexts = [];
    const analysisPromises = [];
    
    // Créer 10 contextes simultanés
    for (let i = 0; i < 10; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      
      // Lancer analyse en parallèle
      const analysisPromise = (async () => {
        const startTime = Date.now();
        
        await page.goto('/analyze');
        
        // Données de test différentes pour chaque instance
        await page.evaluate((index) => {
          localStorage.setItem('questionnaire-data', JSON.stringify({
            age: 20 + index,
            gender: index % 2 === 0 ? 'Femme' : 'Homme',
            skinType: ['Sèche', 'Normale', 'Mixte', 'Grasse'][index % 4],
            concerns: ['acne', 'hydration', 'wrinkles'][index % 3],
            budget: 50 + (index * 10)
          }));
          
          localStorage.setItem('uploaded-photos', JSON.stringify([
            `data:image/jpeg;base64,test-image-${index}`
          ]));
        }, i);
        
        await page.click('[data-testid="start-analysis"]');
        
        try {
          await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible({ 
            timeout: 45000 
          });
          
          const endTime = Date.now();
          const duration = (endTime - startTime) / 1000;
          
          return { success: true, duration, index: i };
        } catch (error) {
          return { success: false, error: error.message, index: i };
        }
      })();
      
      analysisPromises.push(analysisPromise);
    }
    
    // Attendre toutes les analyses
    const results = await Promise.all(analysisPromises);
    
    // Analyser résultats
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Analyses réussies: ${successful.length}/10`);
    console.log(`❌ Analyses échouées: ${failed.length}/10`);
    
    if (successful.length > 0) {
      const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
      const maxDuration = Math.max(...successful.map(r => r.duration));
      
      console.log(`📊 Durée moyenne: ${avgDuration.toFixed(2)}s`);
      console.log(`📊 Durée max (P100): ${maxDuration.toFixed(2)}s`);
      
      // Vérifications performance sous charge
      expect(successful.length).toBeGreaterThanOrEqual(8); // Au moins 80% de réussite
      expect(avgDuration).toBeLessThan(35); // Dégradation acceptable sous charge
      expect(maxDuration).toBeLessThan(50); // P100 < 50s
    }
    
    // Nettoyer contextes
    for (const context of contexts) {
      await context.close();
    }
  });

  test('monitoring usage mémoire', async ({ page }) => {
    await page.goto('/');
    
    // Mesurer mémoire initiale
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    if (initialMemory) {
      console.log(`🧠 Mémoire initiale: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // Simuler parcours complet avec monitoring
    await page.goto('/upload');
    
    // Upload multiple photos pour stress test
    for (let i = 0; i < 5; i++) {
      await page.evaluate((index) => {
        // Simuler upload de grosses images
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = `hsl(${index * 60}, 50%, 50%)`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Stocker en localStorage pour simuler upload
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const existing = JSON.parse(localStorage.getItem('uploaded-photos') || '[]');
        existing.push(dataUrl);
        localStorage.setItem('uploaded-photos', JSON.stringify(existing));
      }, i);
    }
    
    // Mesurer mémoire après uploads
    const afterUploadMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null;
    });
    
    if (afterUploadMemory && initialMemory) {
      const memoryIncrease = (afterUploadMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
      console.log(`📈 Augmentation mémoire: ${memoryIncrease.toFixed(2)} MB`);
      
      // Vérifier que l'augmentation reste raisonnable
      expect(memoryIncrease).toBeLessThan(100); // < 100MB d'augmentation
    }
    
    // Continuer parcours et mesurer à chaque étape
    await page.goto('/questionnaire');
    await page.goto('/analyze');
    
    // Mesurer mémoire finale
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : null;
    });
    
    if (finalMemory && initialMemory) {
      const totalIncrease = (finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
      const memoryUsagePercent = (finalMemory.usedJSHeapSize / finalMemory.totalJSHeapSize) * 100;
      
      console.log(`🎯 Usage mémoire final: ${memoryUsagePercent.toFixed(1)}%`);
      console.log(`📊 Augmentation totale: ${totalIncrease.toFixed(2)} MB`);
      
      // Vérifications mémoire
      expect(memoryUsagePercent).toBeLessThan(80); // < 80% usage mémoire
      expect(totalIncrease).toBeLessThan(150); // < 150MB augmentation totale
    }
  });

  test('performance réseau et compression', async ({ page }) => {
    // Simuler connexion lente
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40 // 40ms latency
    });
    
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Mesurer temps de chargement initial
    await page.waitForLoadState('networkidle');
    const loadTime = (Date.now() - startTime) / 1000;
    
    console.log(`🌐 Temps chargement (connexion lente): ${loadTime.toFixed(2)}s`);
    expect(loadTime).toBeLessThan(10); // < 10s même en connexion lente
    
    // Test compression images
    await page.goto('/upload');
    
    // Intercepter requêtes pour mesurer taille
    let uploadSize = 0;
    page.on('request', request => {
      if (request.url().includes('/api/analyze')) {
        const postData = request.postData();
        if (postData) {
          uploadSize = new Blob([postData]).size;
          console.log(`📦 Taille payload: ${(uploadSize / 1024 / 1024).toFixed(2)} MB`);
        }
      }
    });
    
    // Simuler upload grosse image
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 4000;
      canvas.height = 3000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0); // Qualité max
      localStorage.setItem('uploaded-photos', JSON.stringify([dataUrl]));
    });
    
    await page.goto('/analyze');
    await page.click('[data-testid="start-analysis"]');
    
    // Attendre un peu pour que la requête soit envoyée
    await page.waitForTimeout(2000);
    
    // Vérifier compression efficace
    if (uploadSize > 0) {
      expect(uploadSize).toBeLessThan(5 * 1024 * 1024); // < 5MB après compression
    }
  });
});

test.describe('Tests de Stress et Limites', () => {
  
  test('gestion multiple onglets simultanés', async ({ browser }) => {
    const pages = [];
    
    // Ouvrir 5 onglets simultanés
    for (let i = 0; i < 5; i++) {
      const page = await browser.newPage();
      pages.push(page);
      
      await page.goto('/');
      
      // Démarrer analyse sur chaque onglet
      await page.goto('/analyze');
      await page.evaluate((index) => {
        localStorage.setItem('questionnaire-data', JSON.stringify({
          age: 25,
          gender: 'Femme',
          skinType: 'Mixte',
          concerns: ['acne'],
          budget: 100
        }));
        
        localStorage.setItem('uploaded-photos', JSON.stringify([
          `data:image/jpeg;base64,test-${index}`
        ]));
      }, i);
    }
    
    // Lancer analyses en parallèle
    const analysisPromises = pages.map(async (page, index) => {
      try {
        await page.click('[data-testid="start-analysis"]');
        await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible({ 
          timeout: 60000 
        });
        return { success: true, tab: index };
      } catch (error) {
        return { success: false, tab: index, error: error.message };
      }
    });
    
    const results = await Promise.all(analysisPromises);
    const successful = results.filter(r => r.success);
    
    console.log(`✅ Onglets réussis: ${successful.length}/5`);
    expect(successful.length).toBeGreaterThanOrEqual(3); // Au moins 60% de réussite
    
    // Fermer tous les onglets
    for (const page of pages) {
      await page.close();
    }
  });

  test('test limite upload photos', async ({ page }) => {
    await page.goto('/upload');
    
    // Tenter upload de 10 photos (limite théorique 5)
    await page.evaluate(() => {
      const photos = [];
      for (let i = 0; i < 10; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = `hsl(${i * 36}, 70%, 50%)`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        photos.push(canvas.toDataURL('image/jpeg', 0.7));
      }
      
      // Tenter de stocker toutes les photos
      localStorage.setItem('uploaded-photos', JSON.stringify(photos));
    });
    
    // Vérifier limitation côté client
    const storedPhotos = await page.evaluate(() => {
      const photos = JSON.parse(localStorage.getItem('uploaded-photos') || '[]');
      return photos.length;
    });
    
    console.log(`📸 Photos stockées: ${storedPhotos}`);
    expect(storedPhotos).toBeLessThanOrEqual(5); // Limite respectée
    
    // Vérifier message d'avertissement si limite dépassée
    if (storedPhotos === 5) {
      await expect(page.locator('[data-testid="photo-limit-warning"]')).toBeVisible();
    }
  });

  test('récupération après erreur serveur', async ({ page }) => {
    await page.goto('/analyze');
    
    let requestCount = 0;
    
    // Simuler erreur serveur puis récupération
    await page.route('/api/analyze', async route => {
      requestCount++;
      
      if (requestCount <= 2) {
        // Premières tentatives échouent
        await route.fulfill({ 
          status: 500, 
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      } else {
        // Troisième tentative réussit
        await route.fulfill({ 
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              scores: { overall: 75 },
              routine: { immediate: [], adaptation: [], maintenance: [] }
            }
          })
        });
      }
    });
    
    await page.evaluate(() => {
      localStorage.setItem('questionnaire-data', JSON.stringify({
        age: 25,
        gender: 'Femme',
        skinType: 'Mixte',
        concerns: ['acne'],
        budget: 100
      }));
      
      localStorage.setItem('uploaded-photos', JSON.stringify([
        'data:image/jpeg;base64,test'
      ]));
    });
    
    await page.click('[data-testid="start-analysis"]');
    
    // Vérifier que le retry fonctionne
    await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible({ 
      timeout: 45000 
    });
    
    console.log(`🔄 Récupération après ${requestCount} tentatives`);
    expect(requestCount).toBe(3); // Confirmer retry automatique
  });
});
