# ✅ CHECKLISTS.md - Validation et Qualité DermAI V2

**Version** : 1.0  
**Date** : 6 Novembre 2025  
**Objectif** : Checklists de validation pour chaque type de tâche

---

## 📋 TABLE DES MATIÈRES

1. [Checklist Générale](#checklist-générale)
2. [Checklist Backend](#checklist-backend)
3. [Checklist Frontend](#checklist-frontend)
4. [Checklist Tests](#checklist-tests)
5. [Checklist Database](#checklist-database)
6. [Checklist Performance](#checklist-performance)
7. [Checklist Security](#checklist-security)
8. [Checklist Sprint](#checklist-sprint)
9. [Checklist Release](#checklist-release)

---

## ✅ CHECKLIST GÉNÉRALE

### **Avant de Commencer**
- [ ] Lire `.cursor/MEMORY.md` pour contexte
- [ ] Lire `.cursor/AGENT_ROLES.md` pour rôle
- [ ] Lire `docs/SPRINT_X_EXECUTION.md` pour tâches
- [ ] Vérifier branche Git (`git status`)
- [ ] Pull dernières modifications (`git pull`)

### **Pendant Développement**
- [ ] Respecter patterns `.cursor/FRONTEND.md` ou `.cursor/BACKEND.md`
- [ ] Respecter règles `.cursor/RULES.md`
- [ ] Commit réguliers (toutes les 1-2h)
- [ ] Messages commit clairs (`feat:`, `fix:`, `refactor:`)
- [ ] Logs structurés avec `[ServiceName]`

### **Après Développement**
- [ ] Type-check passé (`npm run type-check`)
- [ ] Lint passé (`npm run lint`)
- [ ] Tests passés (`npm run test`)
- [ ] Build OK (`npm run build`)
- [ ] Documentation mise à jour

---

## 🔧 CHECKLIST BACKEND

### **Services IA**

#### **Avant Création**
- [ ] Lire prompt existant dans `src/services/ai/prompts/`
- [ ] Vérifier schéma Zod output dans types
- [ ] Identifier dépendances (OpenAI, Supabase)

#### **Pendant Création**
- [ ] Créer interface params avec types stricts
- [ ] Créer schéma Zod validation output
- [ ] Implémenter retry logic (3 tentatives max)
- [ ] Ajouter logs structurés (`[ServiceName]`)
- [ ] Gérer erreurs OpenAI (APIError, timeout)
- [ ] Température 0.0 pour déterminisme
- [ ] Max tokens défini selon besoin

#### **Validation**
- [ ] Type-check passé
- [ ] Tests unitaires créés (10+ tests)
- [ ] Cas limites testés (empty, null, invalid)
- [ ] Erreurs testées (API error, timeout, invalid JSON)
- [ ] Performance < 10s par appel
- [ ] Coût tokens documenté

**Exemple Validation** :
```typescript
// ✅ BON
export async function analyzeImages({
  photos,
  profile
}: AnalyzeImagesParams): Promise<DiagnosticOutput> {
  console.log('[AnalysisService] Starting analysis', { photoCount: photos.length })
  
  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.0,
        max_tokens: 2000
      })
    })
    
    const validated = DiagnosticOutputSchema.parse(JSON.parse(content))
    return validated
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new OpenAIServiceError(error.message, error.status)
    }
    throw error
  }
}
```

---

### **Services Produits**

#### **Avant Création**
- [ ] Lire `docs/architecture/product-matching-analysis.md`
- [ ] Comprendre scoring 5 critères (35% ingrédients)
- [ ] Vérifier schéma EnrichedProduct

#### **Pendant Création**
- [ ] Filtrage candidats avec logs détaillés
- [ ] Scoring multi-critères (5 critères)
- [ ] Sélection top 1 + alternatives (3+)
- [ ] Justification reasoning
- [ ] Cache 1h par careType
- [ ] Gestion fallback si 0 candidats

#### **Validation**
- [ ] Tests 20 cas variés (skinType, concerns, budget)
- [ ] 100% complétude (0 "produit non spécifié")
- [ ] Alternatives présentes (3+ par produit)
- [ ] Score matching 50-95%
- [ ] Performance < 5s pour routine 20 steps
- [ ] Logs complets et lisibles

**Exemple Logs** :
```
[ProductMatcher] 🔍 Matching step 11 (traitement) - Traitement Lèvres
[ProductMatcher]    🗂️ Candidats initiaux (traitement): 42
[ProductMatcher]    💰 19 produits exclus (budget: 10.59€ max)
[ProductMatcher]    🧴 20 produits exclus (skinType: combination)
[ProductMatcher]    🚫 2 produits exclus (zones incompatibles: lèvres)
[ProductMatcher]    ✅ 3 candidats finaux
[ProductMatcher]    ✓ Top 1 score: 85/100 (Aquaphor Lip Repair)
```

---

### **API Routes**

#### **Avant Création**
- [ ] Identifier inputs/outputs
- [ ] Créer schémas Zod validation
- [ ] Vérifier authentification nécessaire

#### **Pendant Création**
- [ ] Configuration runtime (`nodejs` ou `edge`)
- [ ] Configuration maxDuration (30s max)
- [ ] Validation Zod des inputs
- [ ] Error handling global
- [ ] Rate limiting si nécessaire
- [ ] Logs structurés
- [ ] Headers sécurité

#### **Validation**
- [ ] Tests API avec curl/Postman
- [ ] Validation inputs (400 si invalid)
- [ ] Gestion erreurs (500, 503, etc.)
- [ ] Performance < maxDuration
- [ ] Logs complets

**Template API Route** :
```typescript
// ✅ BON
export const runtime = 'nodejs'
export const maxDuration = 30

const RequestSchema = z.object({
  // ... validation
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = RequestSchema.parse(body)
    
    const result = await service.process(validated)
    
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 🎨 CHECKLIST FRONTEND

### **Composants React**

#### **Avant Création**
- [ ] Identifier props nécessaires
- [ ] Créer interface Props
- [ ] Vérifier composants ui/ existants (shadcn/ui)

#### **Pendant Création**
- [ ] Composant fonctionnel uniquement
- [ ] Props typées (interface)
- [ ] Hooks en haut du composant
- [ ] Styling Tailwind CSS
- [ ] Responsive (mobile-first)
- [ ] Accessibilité (aria-labels)
- [ ] Loading states
- [ ] Error boundaries

#### **Validation**
- [ ] Type-check passé
- [ ] Lint passé
- [ ] Tests composant créés (React Testing Library)
- [ ] Visuel vérifié (npm run dev)
- [ ] Responsive vérifié (mobile + desktop)
- [ ] Accessibilité vérifiée (Lighthouse)

**Template Composant** :
```typescript
// ✅ BON
interface ProductCardProps {
  product: EnrichedProduct
  score: number
  onSelectAlternative?: (product: EnrichedProduct) => void
}

export function ProductCard({ 
  product, 
  score, 
  onSelectAlternative 
}: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">{product.name}</h3>
      <ScoreBadge score={score} />
      
      <Button 
        onClick={() => setIsModalOpen(true)}
        aria-label="Voir alternatives"
      >
        Voir alternatives
      </Button>
      
      {isModalOpen && (
        <AlternativesModal
          product={product}
          onClose={() => setIsModalOpen(false)}
          onSelect={onSelectAlternative}
        />
      )}
    </Card>
  )
}
```

---

### **Pages Next.js**

#### **Avant Création**
- [ ] Identifier route (`/app/(routes)/page.tsx`)
- [ ] Vérifier Server Component vs Client Component
- [ ] Créer metadata SEO

#### **Pendant Création**
- [ ] Metadata SEO (title, description)
- [ ] Loading state (loading.tsx)
- [ ] Error boundary (error.tsx)
- [ ] Responsive layout
- [ ] Data fetching (React Query ou Server Component)

#### **Validation**
- [ ] Type-check passé
- [ ] Lint passé
- [ ] SEO vérifié (Lighthouse)
- [ ] Performance vérifiée (Core Web Vitals)
- [ ] Navigation testée

---

### **Hooks Customs**

#### **Avant Création**
- [ ] Identifier logique réutilisable
- [ ] Vérifier hooks existants

#### **Pendant Création**
- [ ] Nom commence par `use`
- [ ] Types stricts (params + return)
- [ ] Dependencies array optimisé
- [ ] Cleanup si nécessaire (useEffect)

#### **Validation**
- [ ] Type-check passé
- [ ] Tests hook créés (renderHook)
- [ ] Pas de memory leaks
- [ ] Performance OK (pas de re-renders inutiles)

**Template Hook** :
```typescript
// ✅ BON
export function useAnalysis(photos: string[]) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [result, setResult] = useState<DiagnosticOutput | null>(null)
  
  const analyze = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ photos })
      })
      
      if (!response.ok) throw new Error('Analysis failed')
      
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [photos])
  
  return { analyze, isLoading, error, result }
}
```

---

## ✅ CHECKLIST TESTS

### **Tests Unitaires**

#### **Avant Création**
- [ ] Identifier module à tester
- [ ] Lire code source
- [ ] Identifier cas limites

#### **Pendant Création**
- [ ] 10+ tests par module
- [ ] Tests isolés (mocks pour dépendances)
- [ ] Cas normaux testés
- [ ] Cas limites testés (empty, null, undefined)
- [ ] Erreurs testées
- [ ] Descriptions claires (`describe`, `it`)

#### **Validation**
- [ ] Tous tests passent
- [ ] Coverage > 80%
- [ ] Tests rapides (< 5s total)
- [ ] Pas de console.log

**Template Test** :
```typescript
// ✅ BON
describe('HybridProductSelector', () => {
  let selector: HybridProductSelector
  
  beforeEach(() => {
    selector = new HybridProductSelector()
  })
  
  describe('selectForStep', () => {
    it('should return product with alternatives', async () => {
      const step = mockRoutineStep({ careType: 'hydratation' })
      const profile = mockUserProfile({ skinType: 'dry' })
      
      const result = await selector.selectForStep(step, profile, 100)
      
      expect(result.product).toBeDefined()
      expect(result.alternatives).toHaveLength(3)
      expect(result.score).toBeGreaterThanOrEqual(50)
    })
    
    it('should handle empty catalog', async () => {
      // Mock database vide
      jest.spyOn(ProductDatabaseLoader, 'loadByCareType').mockResolvedValue([])
      
      await expect(
        selector.selectForStep(mockStep, mockProfile, 100)
      ).rejects.toThrow('No products found')
    })
  })
})
```

---

### **Tests E2E**

#### **Avant Création**
- [ ] Identifier parcours utilisateur complet
- [ ] Lire scénarios dans `docs/SPRINT_X_EXECUTION.md`

#### **Pendant Création**
- [ ] Tests Playwright
- [ ] Scénarios réalistes
- [ ] Screenshots si échec
- [ ] Assertions claires
- [ ] Cleanup après tests

#### **Validation**
- [ ] Tous tests passent
- [ ] Tests stables (pas de flakiness)
- [ ] Performance acceptable (< 2min total)
- [ ] Screenshots générés si échec

**Template E2E** :
```typescript
// ✅ BON
test.describe('Step 3 Hybrid', () => {
  test('should display products with alternatives', async ({ page }) => {
    // 1. Navigation
    await page.goto('/analyze')
    
    // 2. Upload photos
    await page.locator('[data-testid="upload-input"]').setInputFiles([
      'tests/fixtures/photo1.jpg'
    ])
    
    // 3. Remplir questionnaire
    await page.locator('[data-testid="skin-type-dry"]').click()
    await page.locator('[data-testid="submit"]').click()
    
    // 4. Attendre résultats
    await page.waitForSelector('[data-testid="results"]')
    
    // 5. Vérifier produits
    const products = page.locator('[data-testid="product-card"]')
    await expect(products).toHaveCount(15)
    
    // 6. Vérifier alternatives
    await page.locator('[data-testid="alternatives-button"]').first().click()
    const alternatives = page.locator('[data-testid="alternative-item"]')
    await expect(alternatives).toHaveCount(3)
  })
})
```

---

## 💾 CHECKLIST DATABASE

### **Migrations**

#### **Avant Création**
- [ ] Identifier changements schema
- [ ] Vérifier impact sur données existantes
- [ ] Planifier rollback

#### **Pendant Création**
- [ ] Nom migration clair (`YYYYMMDD_description.sql`)
- [ ] SQL valide (tester localement)
- [ ] Index optimisés
- [ ] RLS configuré
- [ ] Triggers si nécessaire
- [ ] Commentaires SQL

#### **Validation**
- [ ] Migration appliquée (`npx supabase db push`)
- [ ] Schema vérifié (`npx supabase db pull`)
- [ ] Types générés (`npx supabase gen types`)
- [ ] Tests migration (insert, select, update)
- [ ] Rollback testé

**Template Migration** :
```sql
-- ✅ BON
-- Migration: Add products table
-- Date: 2025-11-06
-- Author: DermAI Team

CREATE TABLE products (
  catalog_id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  care_type VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index optimisés
CREATE INDEX idx_products_care_type ON products(care_type);
CREATE INDEX idx_products_price ON products(price);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (status = 'active');

-- Commentaires
COMMENT ON TABLE products IS 'Catalogue produits cosmétiques enrichis';
COMMENT ON COLUMN products.care_type IS '10 types spécialisés (nettoyage, hydratation, etc.)';
```

---

## ⚡ CHECKLIST PERFORMANCE

### **Optimisations Frontend**

#### **Avant Optimisation**
- [ ] Identifier bottlenecks (Lighthouse)
- [ ] Mesurer baseline (LCP, FID, CLS)

#### **Pendant Optimisation**
- [ ] Code splitting (dynamic imports)
- [ ] Lazy loading images
- [ ] Memoization (useMemo, useCallback)
- [ ] Bundle size optimization
- [ ] Compression images

#### **Validation**
- [ ] Lighthouse > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Bundle size < 500KB

---

### **Optimisations Backend**

#### **Avant Optimisation**
- [ ] Identifier queries lentes (> 100ms)
- [ ] Mesurer baseline (latence API)

#### **Pendant Optimisation**
- [ ] Cache Redis (1h TTL)
- [ ] Query optimization (index)
- [ ] Compression responses (gzip)
- [ ] CDN configuration

#### **Validation**
- [ ] Queries < 100ms
- [ ] API latency < 500ms
- [ ] Cache hit rate > 80%
- [ ] Compression ratio > 70%

---

## 🔒 CHECKLIST SECURITY

### **Validation Inputs**

#### **Checklist**
- [ ] Validation Zod stricte
- [ ] Sanitization HTML (DOMPurify)
- [ ] Sanitization SQL (parameterized queries)
- [ ] Validation fichiers (type, size)
- [ ] Rate limiting API

---

### **Authentification**

#### **Checklist**
- [ ] NextAuth.js configuré
- [ ] JWT sécurisés (secret fort)
- [ ] OAuth flows validés
- [ ] Session management
- [ ] Password hashing (bcrypt)

---

### **Headers Sécurité**

#### **Checklist**
- [ ] Content-Security-Policy
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security
- [ ] Referrer-Policy

---

## 🚀 CHECKLIST SPRINT

### **Début Sprint**

#### **Checklist**
- [ ] Lire `docs/SPRINT_X_EXECUTION.md`
- [ ] Comprendre objectifs
- [ ] Identifier agents nécessaires
- [ ] Vérifier dépendances
- [ ] Planifier ordre exécution
- [ ] Activer mode Worktree si parallèle

---

### **Pendant Sprint**

#### **Checklist Quotidienne**
- [ ] Commit réguliers (matin, midi, soir)
- [ ] Type-check passé
- [ ] Lint passé
- [ ] Tests passés
- [ ] Communication agents (si parallèle)

---

### **Fin Sprint**

#### **Definition of Done**
- [ ] Tous objectifs atteints
- [ ] Tests 100% passés
- [ ] Coverage > 80%
- [ ] Build production OK
- [ ] Documentation mise à jour
- [ ] Demo fonctionnelle
- [ ] Merge branches
- [ ] Tag Git (`v1.0.0-sprint-1`)

---

## 🎯 CHECKLIST RELEASE

### **Pré-Release**

#### **Checklist**
- [ ] Tous sprints terminés
- [ ] Tests E2E 100% passés
- [ ] Performance validée (Lighthouse > 90)
- [ ] Security audit passé
- [ ] Documentation complète
- [ ] Changelog généré

---

### **Release**

#### **Checklist**
- [ ] Build production OK
- [ ] Environment variables configurées
- [ ] Database migrations appliquées
- [ ] Déploiement staging OK
- [ ] Tests staging OK
- [ ] Déploiement production
- [ ] Monitoring actif (Sentry, Vercel)
- [ ] Alerting configuré

---

### **Post-Release**

#### **Checklist**
- [ ] Monitoring 24h
- [ ] Erreurs < 1%
- [ ] Performance stable
- [ ] Feedback utilisateurs collecté
- [ ] Hotfixes si nécessaire
- [ ] Retrospective sprint

---

## 📊 MÉTRIQUES QUALITÉ

### **Cibles Globales**

| Métrique | Cible | Actuel | Statut |
|----------|-------|--------|--------|
| **TypeScript Strict** | 100% | 100% | ✅ |
| **ESLint Errors** | 0 | 0 | ✅ |
| **Test Coverage** | > 80% | 40% | 🟡 |
| **Lighthouse Score** | > 90 | 85 | 🟡 |
| **Build Time** | < 2min | 1.5min | ✅ |
| **Bundle Size** | < 500KB | 450KB | ✅ |
| **API Latency** | < 500ms | 300ms | ✅ |
| **Uptime** | > 99.9% | N/A | 📋 |

---

## 🎓 BEST PRACTICES

### **Commits**

#### **Format**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### **Types**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction bug
- `refactor`: Refactoring code
- `test`: Ajout tests
- `docs`: Documentation
- `style`: Formatting
- `perf`: Performance
- `chore`: Maintenance

#### **Exemples**
```bash
feat(backend): add HybridProductSelector
fix(frontend): resolve modal z-index issue
test(products): add 10 tests for ProductMatcherV2
docs(sprint): update SPRINT_1_EXECUTION.md
refactor(services): optimize cache logic
```

---

### **Code Review**

#### **Checklist Reviewer**
- [ ] Code suit patterns `.cursor/`
- [ ] Tests présents et passent
- [ ] Documentation mise à jour
- [ ] Pas de console.log
- [ ] Pas de TODO non résolus
- [ ] Performance acceptable
- [ ] Sécurité validée

---

**Dernière mise à jour** : 6 Novembre 2025  
**Version** : 1.0  
**Prochain review** : Fin Sprint 2

