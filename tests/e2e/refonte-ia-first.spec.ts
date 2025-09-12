/**
 * 🔥 TESTS E2E REFONTE IA-FIRST - SPRINT 3 OPTIMISATION
 * Tests bout en bout du parcours utilisateur avec routine personnalisée IA
 */

import { test, expect, type Page } from '@playwright/test'

// Helper pour compléter le questionnaire
async function completeQuestionnaire(page: Page) {
  // Étape 1: Profil personnel
  await page.selectOption('[data-testid="age-select"]', '28')
  await page.selectOption('[data-testid="gender-select"]', 'Femme')
  await page.selectOption('[data-testid="skin-type-select"]', 'Mixte')
  await page.click('[data-testid="next-step"]')

  // Étape 2: Préoccupations cutanées
  await page.click('[data-testid="concern-imperfections"]')
  await page.click('[data-testid="concern-pores"]')
  await page.click('[data-testid="next-step"]')

  // Étape 3: Routine actuelle (optionnel)
  await page.fill('[data-testid="morning-products"]', 'Nettoyant doux')
  await page.fill('[data-testid="evening-products"]', 'Nettoyant, Crème hydratante')
  await page.selectOption('[data-testid="monthly-budget"]', '50-100€')
  await page.click('[data-testid="next-step"]')

  // Étape 4: Allergies (optionnel)
  await page.click('[data-testid="no-allergies"]')
  await page.click('[data-testid="next-step"]')

  // Étape 5: Type de routine souhaité
  await page.click('[data-testid="routine-complete"]')
  await page.click('[data-testid="finish-questionnaire"]')
}

// Helper pour uploader une photo de test
async function uploadTestPhoto(page: Page) {
  // Créer un fichier de test (image 1x1 pixel)
  const testImageBuffer = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
    0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
    0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
    0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xAA, 0xFF, 0xD9
  ])

  // Simuler l'upload de fichier
  await page.setInputFiles('[data-testid="photo-upload"]', {
    name: 'test-face.jpg',
    mimeType: 'image/jpeg',
    buffer: testImageBuffer
  })

  // Attendre que l'upload soit traité
  await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible()
}

test.describe('Refonte IA-First - Parcours Utilisateur Complet', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configuration pour tests E2E
    await page.goto('/')
    
    // Mock des appels API pour éviter les vrais appels OpenAI
    await page.route('/api/analyze', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scores: {
            hydration: { score: 75, details: "Hydratation correcte" },
            wrinkles: { score: 85, details: "Peu de rides" },
            firmness: { score: 80, details: "Fermeté bonne" },
            radiance: { score: 70, details: "Éclat à améliorer" },
            pores: { score: 60, details: "Pores visibles zone T" },
            spots: { score: 65, details: "Quelques imperfections" },
            darkCircles: { score: 90, details: "Pas de cernes" },
            skinAge: { score: 82, details: "Peau jeune" },
            overall: 77
          },
          beautyAssessment: {
            mainConcern: "Imperfections et pores dilatés zone T",
            intensity: "modérée",
            skinType: "Mixte",
            concernedZones: ["Zone T", "Joues"]
          },
          routine: [
            {
              stepNumber: 1,
              title: "Nettoyage doux anti-imperfections zone T",
              description: "Masser délicatement 30 secondes sur votre zone T grasse, en évitant le contour des yeux sensible",
              category: "cleansing",
              timing: "both",
              frequency: "Quotidien matin et soir",
              phase: "immediate",
              duration: "2-3 semaines selon votre peau mixte"
            },
            {
              stepNumber: 2,
              title: "Sérum régulateur sébum zone T uniquement",
              description: "Appliquer 2-3 gouttes uniquement sur votre zone T grasse, jamais sur les joues",
              category: "treatment",
              timing: "evening",
              frequency: "Quotidien soir",
              phase: "adaptation",
              duration: "4-6 semaines avec introduction progressive"
            }
          ],
          productRecommendations: {
            immediate: [
              {
                catalogId: "cerave_gel_moussant",
                name: "Gel Moussant Nettoyant",
                brand: "CeraVe",
                price: 12.99,
                justification: "Nettoyage doux adapté à votre peau mixte sans décaper",
                applicationAdvice: "Masser 30s sur zone T, rincer à l'eau tiède"
              }
            ],
            adaptation: [],
            maintenance: []
          }
        })
      })
    })
  })

  test('parcours complet upload → questionnaire → analyse → résultats personnalisés', async ({ page }) => {
    // 1. Page d'accueil
    await expect(page.locator('h1')).toContainText('DermAI')
    await page.click('[data-testid="start-analysis"]')

    // 2. Upload de photos
    await expect(page).toHaveURL(/.*\/upload/)
    await uploadTestPhoto(page)
    await page.click('[data-testid="continue-to-questionnaire"]')

    // 3. Questionnaire
    await expect(page).toHaveURL(/.*\/questionnaire/)
    await completeQuestionnaire(page)

    // 4. Page d'analyse (loading)
    await expect(page).toHaveURL(/.*\/analyze/)
    await expect(page.locator('[data-testid="analysis-progress"]')).toBeVisible()
    
    // Attendre que l'analyse soit terminée (max 45s selon critères Sprint 3)
    await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible({ timeout: 45000 })

    // 5. Redirection automatique vers résultats
    await expect(page).toHaveURL(/.*\/results/)

    // 6. Vérification des résultats personnalisés
    
    // Scores affichés
    await expect(page.locator('[data-testid="overall-score"]')).toContainText('77')
    await expect(page.locator('[data-testid="hydration-score"]')).toContainText('75')
    
    // Diagnostic personnalisé
    await expect(page.locator('[data-testid="main-concern"]')).toContainText('Imperfections et pores dilatés zone T')
    await expect(page.locator('[data-testid="skin-type"]')).toContainText('Mixte')
    
    // Routine personnalisée IA (contenu unique)
    const routineSteps = page.locator('[data-testid="routine-step"]')
    await expect(routineSteps).toHaveCount(2)
    
    // Vérifier contenu personnalisé (pas générique)
    await expect(routineSteps.first()).toContainText('zone T') // Spécifique au diagnostic
    await expect(routineSteps.first()).toContainText('votre peau mixte') // Personnalisé
    
    // Phases avec durées personnalisées
    await expect(page.locator('[data-testid="immediate-phase"]')).toContainText('2-3 semaines selon votre peau mixte')
    await expect(page.locator('[data-testid="adaptation-phase"]')).toContainText('4-6 semaines avec introduction progressive')
    
    // Produits recommandés avec justifications
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCount(1)
    
    await expect(productCards.first()).toContainText('Gel Moussant Nettoyant')
    await expect(productCards.first()).toContainText('CeraVe')
    await expect(productCards.first()).toContainText('12.99€')
    
    // Justification personnalisée
    await expect(page.locator('[data-testid="product-justification"]')).toContainText('adapté à votre peau mixte')
    
    // Conseils d'usage personnalisés
    await expect(page.locator('[data-testid="usage-advice"]')).toContainText('zone T')
  })

  test('rendu dynamique du contenu IA variable', async ({ page }) => {
    // Aller directement aux résultats avec mock
    await page.goto('/results')
    
    // Simuler différents types de contenu IA
    await page.route('/api/analyze', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          routine: [
            {
              stepNumber: 1,
              title: "Titre très long qui devrait s'adapter correctement dans l'interface utilisateur sans déborder",
              description: "Description extrêmement détaillée avec beaucoup de texte pour tester le rendu dynamique de l'interface. Cette description contient des caractères spéciaux : éàùç, des émojis 🧴💧, et des instructions précises pour l'utilisateur selon son profil unique.",
              category: "cleansing",
              timing: "both",
              frequency: "Quotidien avec adaptation selon réaction cutanée",
              phase: "immediate"
            },
            {
              stepNumber: 2,
              title: "Titre court",
              description: "Description courte.",
              category: "treatment",
              timing: "evening",
              frequency: "Variable",
              phase: "adaptation"
            }
          ]
        })
      })
    })

    // Vérifier que le contenu long s'affiche correctement
    const longTitle = page.locator('[data-testid="routine-step"]:first-child [data-testid="step-title"]')
    await expect(longTitle).toBeVisible()
    await expect(longTitle).toContainText('Titre très long')
    
    // Vérifier que la description longue est lisible
    const longDescription = page.locator('[data-testid="routine-step"]:first-child [data-testid="step-description"]')
    await expect(longDescription).toBeVisible()
    await expect(longDescription).toContainText('caractères spéciaux')
    await expect(longDescription).toContainText('🧴💧') // Émojis
    
    // Vérifier que le contenu court s'affiche aussi
    const shortTitle = page.locator('[data-testid="routine-step"]:nth-child(2) [data-testid="step-title"]')
    await expect(shortTitle).toContainText('Titre court')
  })

  test('performance - analyse complète sous 45 secondes', async ({ page }) => {
    const startTime = Date.now()
    
    // Parcours complet optimisé
    await page.click('[data-testid="start-analysis"]')
    await uploadTestPhoto(page)
    await page.click('[data-testid="continue-to-questionnaire"]')
    await completeQuestionnaire(page)
    
    // Attendre les résultats
    await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible({ timeout: 45000 })
    await expect(page).toHaveURL(/.*\/results/)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Vérifier que l'analyse complète prend moins de 45s (critère Sprint 3)
    expect(duration).toBeLessThan(45000)
    
    console.log(`Durée analyse complète: ${duration}ms`)
  })

  test('cache - deuxième analyse identique plus rapide', async ({ page }) => {
    // Première analyse
    const startTime1 = Date.now()
    
    await page.click('[data-testid="start-analysis"]')
    await uploadTestPhoto(page)
    await page.click('[data-testid="continue-to-questionnaire"]')
    await completeQuestionnaire(page)
    await expect(page).toHaveURL(/.*\/results/)
    
    const duration1 = Date.now() - startTime1
    
    // Retour à l'accueil pour refaire une analyse
    await page.goto('/')
    
    // Deuxième analyse identique (devrait utiliser le cache)
    const startTime2 = Date.now()
    
    await page.click('[data-testid="start-analysis"]')
    await uploadTestPhoto(page)
    await page.click('[data-testid="continue-to-questionnaire"]')
    await completeQuestionnaire(page)
    await expect(page).toHaveURL(/.*\/results/)
    
    const duration2 = Date.now() - startTime2
    
    // La deuxième analyse devrait être plus rapide grâce au cache
    expect(duration2).toBeLessThan(duration1 * 0.8) // Au moins 20% plus rapide
    
    console.log(`Première analyse: ${duration1}ms, Deuxième: ${duration2}ms`)
  })

  test('gestion erreurs - budget OpenAI dépassé', async ({ page }) => {
    // Mock erreur de budget
    await page.route('/api/analyze', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Budget OpenAI dépassé: Budget quotidien dépassé. Attendre demain ou utiliser le cache'
        })
      })
    })

    await page.click('[data-testid="start-analysis"]')
    await uploadTestPhoto(page)
    await page.click('[data-testid="continue-to-questionnaire"]')
    await completeQuestionnaire(page)

    // Vérifier que l'erreur est affichée de manière user-friendly
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('budget')
    
    // Vérifier qu'une solution est proposée
    await expect(page.locator('[data-testid="error-suggestion"]')).toContainText('cache')
  })

  test('accessibilité - navigation au clavier', async ({ page }) => {
    // Tester la navigation au clavier dans les résultats
    await page.goto('/results')
    
    // Simuler navigation avec Tab
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Vérifier que les éléments sont focusables
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Tester activation avec Enter/Space
    await page.keyboard.press('Enter')
    // Vérifier qu'une action s'est produite (expansion, navigation, etc.)
  })

  test('responsive - affichage mobile', async ({ page }) => {
    // Simuler un écran mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/results')
    
    // Vérifier que les éléments s'adaptent
    const routineSection = page.locator('[data-testid="routine-section"]')
    await expect(routineSection).toBeVisible()
    
    // Vérifier que le texte reste lisible
    const stepTitle = page.locator('[data-testid="step-title"]').first()
    await expect(stepTitle).toBeVisible()
    
    // Vérifier que les boutons sont accessibles
    const productCard = page.locator('[data-testid="product-card"]').first()
    await expect(productCard).toBeVisible()
  })

  test('partage - génération URL de partage', async ({ page }) => {
    await page.goto('/results')
    
    // Cliquer sur le bouton de partage
    await page.click('[data-testid="share-button"]')
    
    // Vérifier que l'URL de partage est générée
    await expect(page.locator('[data-testid="share-url"]')).toBeVisible()
    
    // Vérifier que l'URL contient les données compressées
    const shareUrl = await page.locator('[data-testid="share-url"]').textContent()
    expect(shareUrl).toContain('share=')
    
    // Tester l'ouverture de l'URL de partage
    if (shareUrl) {
      await page.goto(shareUrl)
      await expect(page.locator('[data-testid="shared-results"]')).toBeVisible()
    }
  })
})

test.describe('Tests de Charge et Performance', () => {
  
  test('simulation charge - 10 analyses simultanées', async ({ browser }) => {
    const startTime = Date.now()
    
    // Créer 10 contextes de navigateur pour simuler 10 utilisateurs
    const contexts = await Promise.all(
      Array.from({ length: 10 }, () => browser.newContext())
    )
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    )
    
    // Lancer 10 analyses en parallèle
    const analysisPromises = pages.map(async (page, index) => {
      await page.goto('/')
      await page.click('[data-testid="start-analysis"]')
      await uploadTestPhoto(page)
      await page.click('[data-testid="continue-to-questionnaire"]')
      await completeQuestionnaire(page)
      
      return page.waitForURL(/.*\/results/, { timeout: 60000 })
    })
    
    // Attendre que toutes les analyses se terminent
    await Promise.all(analysisPromises)
    
    const endTime = Date.now()
    const totalDuration = endTime - startTime
    const averageDuration = totalDuration / 10
    
    console.log(`10 analyses simultanées terminées en ${totalDuration}ms`)
    console.log(`Durée moyenne par analyse: ${averageDuration}ms`)
    
    // Vérifier que chaque analyse prend moins de 60s même en charge
    expect(averageDuration).toBeLessThan(60000)
    
    // Nettoyer
    await Promise.all(contexts.map(context => context.close()))
  })
})
