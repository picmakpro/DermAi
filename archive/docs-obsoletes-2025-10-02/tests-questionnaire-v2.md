# 🧪 Plan de Tests - Questionnaire V2

**Référence:** [Rapport Implémentation V2](./rapport-implementation-questionnaire-v2.md)  
**Date:** 29 septembre 2025  
**Statut:** À Exécuter

---

## 🎯 Objectifs Tests

1. **Fonctionnel:** Valider les 5 nouvelles fonctionnalités
2. **Régression:** Garantir compatibilité V1/V2
3. **UX:** Vérifier parcours mobile/desktop
4. **Performance:** Mesurer temps complétion
5. **Backend:** Valider transmission données + IA

---

## 🧩 Tests Unitaires

### `src/utils/uvRiskCalculator.ts`

```typescript
describe('uvRiskFromLatMonth', () => {
  it('devrait retourner Low pour latitude 55° en hiver', () => {
    expect(uvRiskFromLatMonth(55, 12)).toBe('Low')
  })
  
  it('devrait retourner High pour latitude 55° en été', () => {
    expect(uvRiskFromLatMonth(55, 7)).toBe('High')
  })
  
  it('devrait retourner VeryHigh pour latitude tropicale', () => {
    expect(uvRiskFromLatMonth(5, 6)).toBe('VeryHigh')
  })
  
  it('devrait gérer latitude négative (hémisphère sud)', () => {
    expect(uvRiskFromLatMonth(-35, 12)).toBe('High') // Été austral
  })
})

describe('fallbackLatFromCountry', () => {
  it('devrait retourner 46.0 pour France', () => {
    expect(fallbackLatFromCountry('France')).toBe(46.0)
  })
  
  it('devrait retourner 45.0 pour pays inconnu', () => {
    expect(fallbackLatFromCountry('Unknown')).toBe(45.0)
  })
})
```

### `src/schemas/questionnaire.ts`

```typescript
describe('zStep2Questionnaire', () => {
  it('devrait valider questionnaire complet', () => {
    const validData = {
      userProfile: { age: 25, gender: 'Femme', skinType: 'Normale' },
      pregnancy: { isPregnant: false },
      location: { city: 'Paris', country: 'France' },
      constraints: {
        budget: { tier: 'Confort' },
        routineStyle: 'Équilibrée'
      },
      skinConcerns: { primary: ['Acné/Boutons'] }
    }
    
    expect(() => zStep2Questionnaire.parse(validData)).not.toThrow()
  })
  
  it('devrait rejeter si pregnancy absent pour Femme', () => {
    const invalidData = {
      userProfile: { age: 25, gender: 'Femme', skinType: 'Normale' },
      // pregnancy: undefined, ❌
      location: { city: 'Paris', country: 'France' },
      ...
    }
    
    expect(() => zStep2Questionnaire.parse(invalidData)).toThrow()
  })
  
  it('devrait rejeter si plus de 3 concerns', () => {
    const invalidData = {
      ...,
      skinConcerns: { 
        primary: ['Acné', 'Rides', 'Taches', 'Rougeurs'] // ❌ 4 items
      }
    }
    
    expect(() => zStep2Questionnaire.parse(invalidData)).toThrow()
  })
})
```

---

## 🔄 Tests d'Intégration

### Flux Complet Questionnaire V2

```typescript
// tests/integration/questionnaire-v2-flow.test.ts

describe('Questionnaire V2 - Flux Complet', () => {
  beforeEach(() => {
    // Mock sessionStorage avec photos
    sessionStorage.setItem('dermai_photos', JSON.stringify([
      { id: 'photo1', type: 'face', quality: 'hd' }
    ]))
  })
  
  it('devrait compléter le questionnaire V2 et transmettre toutes les données', async () => {
    const { result } = renderHook(() => useSkinQuestionnaire())
    
    // Step 1: Profil
    act(() => {
      result.current.updateData('userProfile', { 
        age: 29, 
        gender: 'Femme',
        pregnancy: { isPregnant: true }
      })
    })
    
    // Step 2: Localisation
    act(() => {
      result.current.updateData('location', { 
        city: 'Paris', 
        country: 'France',
        lat: 48.8566,
        lon: 2.3522
      })
    })
    
    // Step 3: Préoccupations
    act(() => {
      result.current.updateData('skinConcerns', { 
        primary: ['Acné/Boutons', 'Rides/Vieillissement']
      })
    })
    
    // Step 8: Budget + Style
    act(() => {
      result.current.updateData('currentRoutine', { 
        budgetTier: 'Expert',
        routineStyle: 'Complète'
      })
    })
    
    // Soumission
    await act(async () => {
      await result.current.handleSubmit()
    })
    
    // Vérifications
    const savedData = JSON.parse(sessionStorage.getItem('dermai_questionnaire')!)
    
    expect(savedData.pregnancy.isPregnant).toBe(true)
    expect(savedData.location.city).toBe('Paris')
    expect(savedData.currentRoutine.budgetTier).toBe('Expert')
    expect(savedData.currentRoutine.routineStyle).toBe('Complète')
  })
})
```

---

## 🎭 Tests E2E (Playwright)

### Fichier: `tests/e2e/questionnaire-v2.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Questionnaire V2', () => {
  
  test.beforeEach(async ({ page }) => {
    // Upload photos
    await page.goto('/upload')
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/face-test.jpg')
    await page.click('button:has-text("Suivant")')
  })
  
  test('Parcours complet V2 - Femme enceinte', async ({ page }) => {
    // Step 0: Intro
    await expect(page.locator('h1')).toContainText('avant/après')
    await page.click('button:has-text("C\'est parti")')
    
    // Step 1: Profil
    await page.click('input[value="Femme"]')
    await expect(page.locator('text=Grossesse en cours')).toBeVisible()
    await page.click('input[type="checkbox"]:near(text="Grossesse")')
    
    await page.selectOption('select[name="age"]', '25-34')
    await page.click('button:has-text("Suivant")')
    
    // Step 2: Localisation
    await page.fill('input[name="city"]', 'Lyon')
    await page.fill('input[name="country"]', 'France')
    await page.click('button:has-text("Suivant")')
    
    // Step 3: Préoccupations (max 3)
    await page.click('button:has-text("Acné/Boutons")')
    await page.click('button:has-text("Rides/Vieillissement")')
    await page.click('button:has-text("Taches pigmentaires")')
    
    // Vérifier que 4ème option est désactivée
    await expect(page.locator('button:has-text("Rougeurs")')).toBeDisabled()
    
    await page.click('button:has-text("Suivant")')
    
    // Step 4: Similar Concerns (écran plein, auto-continue)
    await page.waitForTimeout(3000)
    await page.click('button:has-text("Continuer")')
    
    // Step 5-6: Routine + Allergies (skip)
    await page.click('button:has-text("Suivant")')
    await page.click('button:has-text("Suivant")')
    
    // Step 7: Savings Progress (auto-continue)
    await page.waitForTimeout(2000)
    await page.click('button:has-text("Continuer")')
    
    // Step 8: Budget + Style
    await page.click('button:has-text("Expert")')
    await page.click('button:has-text("Complète")')
    
    // Soumission
    await page.click('button:has-text("Lancer l\'analyse")')
    
    // Vérifier redirection vers /analyze
    await expect(page).toHaveURL(/\/analyze/)
    
    // Vérifier logs console (données transmises)
    const logs = await page.evaluate(() => {
      return (window as any).__testLogs || []
    })
    
    const v2Log = logs.find((l: any) => l.includes('[questionnaire_v2]'))
    expect(v2Log).toBeTruthy()
    expect(v2Log).toContain('isPregnant: true')
    expect(v2Log).toContain('city: Lyon')
    expect(v2Log).toContain('budgetTier: Expert')
  })
  
  test('Validation grossesse - Femme sans toggle', async ({ page }) => {
    await page.click('input[value="Femme"]')
    // Ne pas cocher toggle grossesse
    await page.click('button:has-text("Suivant")')
    
    // Vérifier message erreur
    await expect(page.locator('text=Statut grossesse requis')).toBeVisible()
  })
  
  test('Genre Homme - Toggle grossesse invisible', async ({ page }) => {
    await page.click('input[value="Homme"]')
    
    // Vérifier toggle grossesse absent
    await expect(page.locator('text=Grossesse en cours')).not.toBeVisible()
    
    await page.click('button:has-text("Suivant")')
    // Devrait passer sans erreur
    await expect(page.locator('h2:has-text("Localisation")')).toBeVisible()
  })
  
  test('Préoccupations - Limitation 3 max', async ({ page }) => {
    // Arriver au step 3
    await page.click('input[value="Homme"]')
    await page.click('button:has-text("Suivant")') // Step 1
    await page.fill('input[name="city"]', 'Paris')
    await page.fill('input[name="country"]', 'France')
    await page.click('button:has-text("Suivant")') // Step 2
    
    // Sélectionner 3 concerns
    await page.click('button:has-text("Acné/Boutons")')
    await page.click('button:has-text("Rides/Vieillissement")')
    await page.click('button:has-text("Taches pigmentaires")')
    
    // Vérifier compteur "3/3"
    await expect(page.locator('text=3/3 sélectionnés')).toBeVisible()
    
    // Vérifier que toutes autres options sont disabled
    const disabledButtons = await page.locator('button:has-text("Rougeurs")[disabled]').count()
    expect(disabledButtons).toBeGreaterThan(0)
    
    // Désélectionner 1 → autres options réactivées
    await page.click('button:has-text("Acné/Boutons")')
    await expect(page.locator('button:has-text("Rougeurs")[disabled]')).toHaveCount(0)
  })
  
  test('Budget + Style - Validation requise', async ({ page }) => {
    // Arriver au step 8 (Budget/Style)
    // ... navigation steps 1-7 ...
    
    // Essayer soumission sans sélection
    const submitBtn = page.locator('button:has-text("Lancer l\'analyse")')
    await expect(submitBtn).toBeDisabled()
    
    // Sélectionner budget uniquement
    await page.click('button:has-text("Confort")')
    await expect(submitBtn).toBeDisabled() // Toujours disabled
    
    // Sélectionner style
    await page.click('button:has-text("Équilibrée")')
    await expect(submitBtn).toBeEnabled() // ✅ Enabled
  })
})
```

---

## 📊 Tests Performance

### Métriques à Mesurer

```typescript
// tests/performance/questionnaire-v2-perf.spec.ts

test('Performance - Temps complétion questionnaire', async ({ page }) => {
  const startTime = Date.now()
  
  // Parcours complet automatisé
  await completeQuestionnaireV2(page)
  
  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000
  
  // Objectif: < 3 minutes pour utilisateur moyen
  expect(duration).toBeLessThan(180)
  
  console.log(`Temps complétion: ${duration}s`)
})

test('Performance - Temps soumission + redirection', async ({ page }) => {
  await fillQuestionnaireV2(page)
  
  const startTime = Date.now()
  await page.click('button:has-text("Lancer l\'analyse")')
  await page.waitForURL(/\/analyze/)
  const endTime = Date.now()
  
  const duration = endTime - startTime
  
  // Objectif: < 500ms
  expect(duration).toBeLessThan(500)
  
  console.log(`Temps soumission: ${duration}ms`)
})
```

---

## 🔒 Tests Rétrocompatibilité

### Ancien Format Questionnaire V1

```typescript
test('Rétrocompat - Questionnaire V1 sans nouvelles données', async ({ page }) => {
  // Simuler ancien format V1 dans sessionStorage
  const oldFormatData = {
    photos: [...],
    userProfile: { age: 25, gender: 'Homme', skinType: 'Normale' },
    skinConcerns: { primary: ['Acné/Boutons'] },
    currentRoutine: { 
      monthlyBudget: '50-100€', // ✅ Ancien format
      routinePreference: 'Simple' // ✅ Ancien format
    },
    allergies: { ingredients: [], pastReactions: '' }
    // ❌ Pas de: pregnancy, location, budgetTier, routineStyle
  }
  
  sessionStorage.setItem('dermai_questionnaire', JSON.stringify(oldFormatData))
  
  // Rediriger vers /analyze
  await page.goto('/analyze')
  
  // Vérifier que l'analyse démarre sans erreur
  await expect(page.locator('text=Analyse en cours')).toBeVisible()
  
  // Vérifier logs backend (fallbacks activés)
  const response = await page.waitForResponse(r => r.url().includes('/api/analyze'))
  const body = await response.json()
  
  expect(body.error).toBeUndefined()
})
```

---

## 🌍 Tests Multi-Localisations

### Calcul UV Risk

```typescript
test.describe('UV Risk - Différentes localisations', () => {
  const testCases = [
    { city: 'Oslo', country: 'Norway', lat: 59.9, month: 7, expectedUV: 'High' },
    { city: 'Madrid', country: 'Spain', lat: 40.4, month: 7, expectedUV: 'VeryHigh' },
    { city: 'Singapore', country: 'Singapore', lat: 1.3, month: 7, expectedUV: 'VeryHigh' },
    { city: 'Melbourne', country: 'Australia', lat: -37.8, month: 12, expectedUV: 'VeryHigh' },
  ]
  
  testCases.forEach(({ city, country, lat, month, expectedUV }) => {
    test(`UV Risk ${city} (lat=${lat}, mois=${month}) = ${expectedUV}`, async ({ page }) => {
      // Remplir questionnaire avec cette localisation
      await page.fill('input[name="city"]', city)
      await page.fill('input[name="country"]', country)
      await page.fill('input[name="lat"]', lat.toString())
      
      // Soumettre
      await completeAndSubmitQuestionnaire(page)
      
      // Vérifier logs backend
      const logs = await getBackendLogs()
      expect(logs).toContain(`UV Risk calculé: ${expectedUV}`)
    })
  })
})
```

---

## 🧪 Tests Backend API

### Endpoint `/api/analyze`

```typescript
// tests/api/analyze-v2.test.ts

describe('POST /api/analyze - V2 Payload', () => {
  it('devrait accepter et logger payload V2 complet', async () => {
    const v2Payload = {
      photos: [...],
      userProfile: { 
        age: 29, 
        gender: 'Femme',
        skinType: 'Normale',
        pregnancy: { isPregnant: true }
      },
      location: { 
        city: 'Lyon', 
        country: 'France', 
        lat: 45.75, 
        lon: 4.85 
      },
      currentRoutine: {
        morningProducts: [],
        eveningProducts: [],
        budgetTier: 'Expert',
        routineStyle: 'Complète'
      },
      skinConcerns: { primary: ['Acné/Boutons'] },
      allergies: { ingredients: [], pastReactions: '' },
      pregnancy: { isPregnant: true },
    }
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(v2Payload),
      headers: { 'Content-Type': 'application/json' }
    })
    
    expect(response.status).toBe(200)
    
    // Vérifier logs
    const logs = await getServerLogs()
    expect(logs).toContain('[questionnaire_v2] payload')
    expect(logs).toContain('isPregnant: true')
    expect(logs).toContain('city: Lyon')
    expect(logs).toContain('budgetTier: Expert')
    expect(logs).toContain('UV Risk calculé: Moderate')
  })
  
  it('devrait calculer UV Risk correct avec lat/lon', async () => {
    const payload = {
      ...,
      location: { city: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 }
    }
    
    await fetch('/api/analyze', { method: 'POST', body: JSON.stringify(payload) })
    
    const logs = await getServerLogs()
    
    // Septembre (mois 9) à Paris (lat 48.8) → Moderate
    expect(logs).toContain('UV Risk calculé: Moderate')
  })
  
  it('devrait utiliser fallback lat si lat/lon absents', async () => {
    const payload = {
      ...,
      location: { city: 'Paris', country: 'France' } // Pas de lat/lon
    }
    
    await fetch('/api/analyze', { method: 'POST', body: JSON.stringify(payload) })
    
    const logs = await getServerLogs()
    
    // Fallback France = 46.0
    expect(logs).toContain('lat=46')
    expect(logs).toContain('UV Risk calculé')
  })
})
```

---

## 📋 Checklist Pré-Production

### Validation Finale

- [ ] **Tests Unitaires:** 100% pass (uvRiskCalculator, schemas)
- [ ] **Tests Intégration:** Flux complet V2 validé
- [ ] **Tests E2E:** 10 scénarios critiques pass
- [ ] **Tests Performance:** Temps complétion < 3min
- [ ] **Tests Mobile:** iOS + Android validés
- [ ] **Tests Rétrocompat:** V1 fonctionne toujours
- [ ] **Tests Backend:** Logs V2 conformes
- [ ] **Tests IA:** Prompt enrichi vérifié
- [ ] **Tests Multi-Loc:** 5 pays testés (UV Risk OK)
- [ ] **Tests Accessibilité:** Navigation clavier OK

### Monitoring Post-Deploy

- [ ] **Dashboard Analytics:** Taux complétion par step
- [ ] **Logs Backend:** `[questionnaire_v2]` centralisés
- [ ] **Alerts:** Erreurs validation > 5%
- [ ] **A/B Test:** V1 vs V2 (2 semaines)
- [ ] **Feedback Users:** Survey satisfaction routine

---

**Plan de Tests V2**  
**Statut:** 📝 Défini, ⏳ À Exécuter  
**Prochaine Étape:** Implémenter tests E2E Playwright
