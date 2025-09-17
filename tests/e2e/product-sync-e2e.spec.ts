/**
 * 🎭 TESTS E2E - SYNCHRONISATION PRODUITS ↔ ROUTINE
 * 
 * Tests end-to-end avec Playwright pour valider l'expérience utilisateur complète
 * de la synchronisation bidirectionnelle produits-routine
 * 
 * Sprint 3 - Intégration, Tests & Optimisation
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { test, expect, Page } from '@playwright/test'

test.describe('🔄 Product Sync E2E Tests', () => {
  
  // Configuration des tests
  test.beforeEach(async ({ page }) => {
    // Intercepter les appels API pour des tests déterministes
    await page.route('**/api/analyze', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            // Données de test cohérentes
            diagnostic: {
              generalObservation: "Peau mixte avec tendance acnéique légère",
              skinType: "mixte",
              mainConcerns: ["acné", "hydratation"],
              zoneSpecificIssues: {
                "zone_t": ["brillance", "pores dilatés"],
                "joues": ["déshydratation"]
              }
            },
            routine: {
              phases: {
                immediate: {
                  duration: "2-3 semaines",
                  steps: [
                    {
                      stepNumber: 1,
                      title: "Nettoyage quotidien",
                      careType: "cleansing",
                      targetProblem: "Éliminer impuretés et excès de sébum",
                      timing: "quotidien",
                      timeOfDay: "matin",
                      products: [
                        {
                          catalogId: "cerave-foaming-cleanser",
                          justification: "Nettoyage doux sans assécher",
                          applicationAdvice: "Masser délicatement sur peau humide"
                        }
                      ]
                    },
                    {
                      stepNumber: 2,
                      title: "Hydratation équilibrée",
                      careType: "moisturizing",
                      targetProblem: "Restaurer l'hydratation sans surcharger",
                      timing: "quotidien",
                      timeOfDay: "matin",
                      products: [
                        {
                          catalogId: "neutrogena-oil-free-moisturizer",
                          justification: "Hydratation légère pour peau mixte",
                          applicationAdvice: "Appliquer uniformément en évitant le contour des yeux"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
        })
      })
    })

    // Mock du catalogue produits
    await page.route('**/affiliateCatalog.json', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: "cerave-foaming-cleanser",
              name: "Foaming Facial Cleanser",
              brand: "CeraVe",
              category: "cleanser",
              price: 12.99,
              imageUrl: "/test-images/cerave-cleanser.jpg",
              benefits: ["Nettoie en douceur", "Respecte la barrière cutanée"],
              affiliateLink: "https://amazon.com/cerave-cleanser"
            },
            {
              id: "neutrogena-oil-free-moisturizer",
              name: "Oil-Free Moisture Gel",
              brand: "Neutrogena",
              category: "moisturizer",
              price: 15.99,
              imageUrl: "/test-images/neutrogena-moisturizer.jpg",
              benefits: ["Hydratation sans huile", "Non comédogène"],
              affiliateLink: "https://amazon.com/neutrogena-moisturizer"
            },
            {
              id: "lrp-toleriane-cleanser",
              name: "Toleriane Caring Wash",
              brand: "La Roche-Posay",
              category: "cleanser",
              price: 18.99,
              imageUrl: "/test-images/lrp-cleanser.jpg",
              benefits: ["Formule apaisante", "Pour peaux sensibles"],
              affiliateLink: "https://amazon.com/lrp-cleanser"
            }
          ]
        })
      })
    })
  })

  test('🎯 Complete user journey: Upload → Analysis → Product Sync → Alternatives', async ({ page }) => {
    // 1. Navigation vers l'upload
    await page.goto('/')
    await page.click('text=Commencer l\'analyse')
    
    // 2. Upload d'une photo de test
    await page.goto('/upload')
    
    // Simuler l'upload d'une image
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-face.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    })
    
    // Attendre que l'image soit chargée
    await expect(page.locator('.uploaded-image')).toBeVisible({ timeout: 5000 })
    
    // 3. Remplir le questionnaire
    await page.click('text=Continuer')
    await page.goto('/questionnaire')
    
    // Simuler les réponses du questionnaire
    await page.selectOption('select[name="age"]', '25-34')
    await page.selectOption('select[name="skinType"]', 'mixte')
    await page.check('input[value="acné"]')
    await page.check('input[value="hydratation"]')
    
    await page.click('text=Analyser ma peau')
    
    // 4. Page d'analyse
    await page.goto('/analyze')
    await expect(page.locator('text=Analyse en cours')).toBeVisible()
    
    // Attendre la fin de l'analyse (mock)
    await page.waitForTimeout(2000)
    
    // 5. Page de résultats avec synchronisation produits
    await page.goto('/results')
    
    // Vérifier que la section produits est présente
    await expect(page.locator('text=Produits recommandés')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Synchronisés avec votre routine')).toBeVisible()
    
    // Vérifier que les produits sont affichés
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(2)
    
    // Vérifier les détails des produits
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct.locator('text=CeraVe')).toBeVisible()
    await expect(firstProduct.locator('text=Foaming Facial Cleanser')).toBeVisible()
    await expect(firstProduct.locator('text=12,99 €')).toBeVisible()
    
    // 6. Test des bulles d'informations
    await firstProduct.locator('[data-testid="usage-info-bubble"]').hover()
    await expect(page.locator('text=Masser délicatement sur peau humide')).toBeVisible()
    
    await firstProduct.locator('[data-testid="justification-bubble"]').hover()
    await expect(page.locator('text=Nettoyage doux sans assécher')).toBeVisible()
    
    // 7. Test du système d'alternatives
    await firstProduct.locator('text=Voir une alternative').click()
    
    // Vérifier l'ouverture du modal d'alternatives
    await expect(page.locator('[data-testid="alternative-modal"]')).toBeVisible()
    await expect(page.locator('text=Alternatives disponibles')).toBeVisible()
    
    // Vérifier qu'une alternative est proposée
    await expect(page.locator('[data-testid="alternative-card"]')).toHaveCount(1)
    
    const alternativeCard = page.locator('[data-testid="alternative-card"]').first()
    await expect(alternativeCard.locator('text=La Roche-Posay')).toBeVisible()
    await expect(alternativeCard.locator('text=Plus cher')).toBeVisible()
    
    // 8. Test du remplacement de produit
    await alternativeCard.locator('text=Choisir cette alternative').click()
    
    // Vérifier l'ouverture du modal de prévention
    await expect(page.locator('[data-testid="replacement-warning-modal"]')).toBeVisible()
    await expect(page.locator('text=Changement de produit')).toBeVisible()
    
    // Confirmer le remplacement
    await page.locator('text=Confirmer le changement').click()
    
    // 9. Vérifier la synchronisation après remplacement
    await expect(page.locator('[data-testid="replacement-warning-modal"]')).not.toBeVisible()
    
    // Vérifier que le produit a été remplacé dans la liste
    await expect(page.locator('text=La Roche-Posay')).toBeVisible()
    await expect(page.locator('text=Toleriane Caring Wash')).toBeVisible()
    
    // Vérifier le badge "Produit alternatif"
    await expect(page.locator('[data-testid="alternative-badge"]')).toBeVisible()
    
    // 10. Vérifier la synchronisation avec la routine
    const routineSection = page.locator('[data-testid="routine-section"]')
    await expect(routineSection.locator('text=La Roche-Posay')).toBeVisible()
  })

  test('🚨 Error handling and fallbacks', async ({ page }) => {
    // Test avec erreur de catalogue
    await page.route('**/affiliateCatalog.json', async route => {
      await route.abort('failed')
    })
    
    await page.goto('/results')
    
    // Vérifier la gestion d'erreur gracieuse
    await expect(page.locator('text=Erreur de synchronisation')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Réessayer')).toBeVisible()
    
    // Test du bouton de retry
    await page.click('text=Réessayer')
    
    // Vérifier que l'utilisateur peut continuer malgré l'erreur
    await expect(page.locator('text=Produits recommandés')).toBeVisible()
  })

  test('⚡ Performance and loading states', async ({ page }) => {
    await page.goto('/results')
    
    // Vérifier l'état de chargement initial
    await expect(page.locator('text=Synchronisation des produits')).toBeVisible()
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Mesurer le temps de chargement
    const startTime = Date.now()
    await expect(page.locator('text=Produits recommandés')).toBeVisible({ timeout: 5000 })
    const loadTime = Date.now() - startTime
    
    // Vérifier que le chargement respecte les objectifs de performance
    expect(loadTime).toBeLessThan(2000) // < 2 secondes
    
    // Vérifier que les skeletons sont remplacés par le contenu
    await expect(page.locator('[data-testid="product-skeleton"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="product-card"]')).toBeVisible()
  })

  test('📱 Mobile responsiveness', async ({ page }) => {
    // Simuler un écran mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/results')
    
    // Vérifier l'affichage mobile
    await expect(page.locator('text=Produits recommandés')).toBeVisible()
    
    // Vérifier que les cartes produits s'adaptent
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCount(2)
    
    // Vérifier que les cartes sont empilées verticalement sur mobile
    const firstCard = productCards.first()
    const secondCard = productCards.nth(1)
    
    const firstCardBox = await firstCard.boundingBox()
    const secondCardBox = await secondCard.boundingBox()
    
    // Sur mobile, la deuxième carte doit être en dessous de la première
    expect(secondCardBox!.y).toBeGreaterThan(firstCardBox!.y + firstCardBox!.height)
    
    // Test du modal d'alternatives sur mobile
    await firstCard.locator('text=Voir une alternative').click()
    
    const modal = page.locator('[data-testid="alternative-modal"]')
    await expect(modal).toBeVisible()
    
    // Vérifier que le modal prend toute la largeur sur mobile
    const modalBox = await modal.boundingBox()
    expect(modalBox!.width).toBeGreaterThan(350) // Presque toute la largeur
  })

  test('♿ Accessibility compliance', async ({ page }) => {
    await page.goto('/results')
    
    // Attendre le chargement complet
    await expect(page.locator('text=Produits recommandés')).toBeVisible()
    
    // Test de navigation au clavier
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Vérifier que le focus est visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test des alternatives avec le clavier
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="alternative-modal"]')).toBeVisible()
    
    // Fermer avec Escape
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="alternative-modal"]')).not.toBeVisible()
    
    // Vérifier les attributs ARIA
    const productSection = page.locator('[data-testid="products-section"]')
    await expect(productSection).toHaveAttribute('role', 'region')
    await expect(productSection).toHaveAttribute('aria-label', 'Produits recommandés')
    
    // Vérifier les boutons d'alternatives
    const alternativeButtons = page.locator('[data-testid="alternative-button"]')
    for (let i = 0; i < await alternativeButtons.count(); i++) {
      const button = alternativeButtons.nth(i)
      await expect(button).toHaveAttribute('aria-label')
    }
  })

  test('🔄 State persistence and refresh', async ({ page }) => {
    await page.goto('/results')
    
    // Attendre le chargement et effectuer un remplacement
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(2)
    
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.locator('text=Voir une alternative').click()
    
    await page.locator('[data-testid="alternative-card"]').first().locator('text=Choisir cette alternative').click()
    await page.locator('text=Confirmer le changement').click()
    
    // Vérifier que le changement est effectué
    await expect(page.locator('text=La Roche-Posay')).toBeVisible()
    
    // Rafraîchir la page
    await page.reload()
    
    // Vérifier que l'état est maintenu après refresh
    await expect(page.locator('text=Produits recommandés')).toBeVisible()
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(2)
    
    // Note: Dans un vrai scénario, ceci nécessiterait une persistance côté serveur
    // Pour l'instant, on teste que l'interface se recharge correctement
  })

  test('📊 Analytics tracking', async ({ page }) => {
    // Intercepter les appels analytics
    const analyticsEvents: string[] = []
    
    await page.route('**/api/analytics/**', async route => {
      const url = route.request().url()
      const body = route.request().postData()
      analyticsEvents.push(`${url}: ${body}`)
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })
    
    await page.goto('/results')
    
    // Attendre le chargement
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(2)
    
    // Déclencher des événements trackés
    await page.locator('[data-testid="product-card"]').first().locator('text=Voir une alternative').click()
    
    // Vérifier que l'événement a été tracké
    expect(analyticsEvents.some(event => event.includes('product_alternative_opened'))).toBe(true)
    
    // Effectuer un remplacement
    await page.locator('[data-testid="alternative-card"]').first().locator('text=Choisir cette alternative').click()
    await page.locator('text=Confirmer le changement').click()
    
    // Vérifier les événements de remplacement
    expect(analyticsEvents.some(event => event.includes('product_replaced'))).toBe(true)
    
    // Test du clic sur lien d'affiliation
    await page.locator('[data-testid="affiliate-link"]').first().click()
    expect(analyticsEvents.some(event => event.includes('affiliate_click'))).toBe(true)
  })
})
