# 📜 RULES.md - Règles de Code DermAI V2

**Version** : 1.0  
**Date** : 6 Novembre 2025

---

## 🎯 PRINCIPES FONDAMENTAUX

### 1. Code Quality First
- ✅ **Lisibilité > Concision** : Code clair plutôt que "clever"
- ✅ **DRY (Don't Repeat Yourself)** : Factoriser code dupliqué
- ✅ **KISS (Keep It Simple, Stupid)** : Solution la plus simple qui fonctionne
- ✅ **YAGNI (You Aren't Gonna Need It)** : Ne pas anticiper besoins futurs

### 2. Type Safety
- ✅ **TypeScript strict mode** : Activé partout
- ✅ **Pas de `any`** : Utiliser `unknown` ou types précis
- ✅ **Validation runtime** : Zod pour tous inputs externes
- ✅ **Types exportés** : Depuis `/src/types`

### 3. Testing
- ✅ **Tests unitaires** : Services critiques (IA, matching)
- ✅ **Tests d'intégration** : API routes
- ✅ **Tests E2E** : Parcours utilisateur complets
- ✅ **Coverage > 80%** : Pour code métier critique

---

## 📝 CONVENTIONS TYPESCRIPT

### Naming

```typescript
// ✅ BON
const userName: string = 'John'
const isLoading: boolean = false
const MAX_RETRIES: number = 3

interface UserProfile {
  id: string
  name: string
}

type SkinType = 'dry' | 'oily' | 'combination'

enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed'
}

function calculateScore(value: number): number {
  return value * 100
}

class ProductMatcher {
  private readonly logger: Logger
}

// ❌ MAUVAIS
const UserName: string = 'John' // PascalCase pour variable
const is_loading: boolean = false // snake_case
const maxretries: number = 3 // pas de séparation

interface userprofile {} // camelCase pour interface
type skintype = string // camelCase pour type
```

### Types vs Interfaces

```typescript
// ✅ Interfaces pour objets (préféré)
interface UserProfile {
  id: string
  name: string
  email: string
}

// ✅ Types pour unions/intersections
type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal'
type Result<T> = { success: true; data: T } | { success: false; error: string }

// ✅ Extension d'interface
interface ExtendedProfile extends UserProfile {
  age: number
  skinType: SkinType
}

// ❌ MAUVAIS : Type pour objet simple
type UserProfile = {
  id: string
  name: string
}
```

### Null Safety

```typescript
// ✅ BON : Optional chaining
const userName = user?.profile?.name ?? 'Anonymous'

// ✅ BON : Nullish coalescing
const count = data.count ?? 0

// ✅ BON : Type guards
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value
}

// ❌ MAUVAIS : Non-null assertion
const name = user!.name! // Dangereux
```

---

## ⚛️ CONVENTIONS REACT

### Composants

```typescript
// ✅ BON : Props interface + composant fonctionnel
interface ButtonProps {
  variant: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function Button({ 
  variant, 
  children, 
  onClick, 
  disabled = false,
  className 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(buttonVariants[variant], className)}
    >
      {children}
    </button>
  )
}

// ❌ MAUVAIS : Pas de types
export function Button(props) {
  return <button {...props} />
}
```

### Hooks

```typescript
// ✅ BON : Hook custom typé
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// ❌ MAUVAIS : Pas de types génériques
export function useDebounce(value, delay) {
  // ...
}
```

### État

```typescript
// ✅ BON : État typé
const [user, setUser] = useState<User | null>(null)
const [loading, setLoading] = useState<boolean>(false)
const [error, setError] = useState<Error | null>(null)

// ✅ BON : État complexe avec type
interface FormState {
  values: Record<string, string>
  errors: Record<string, string>
  touched: Record<string, boolean>
}

const [form, setForm] = useState<FormState>({
  values: {},
  errors: {},
  touched: {}
})

// ❌ MAUVAIS : any
const [data, setData] = useState<any>(null)
```

---

## 🎨 CONVENTIONS STYLING

### Tailwind CSS

```typescript
// ✅ BON : Classes utilitaires
<div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
  <h2 className="text-2xl font-bold text-foreground">Titre</h2>
</div>

// ✅ BON : Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// ✅ BON : Fonction cn pour classes conditionnelles
<button className={cn(
  'px-4 py-2 rounded-md transition-colors',
  variant === 'primary' && 'bg-primary text-primary-foreground',
  variant === 'secondary' && 'bg-secondary text-secondary-foreground',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
  Click me
</button>

// ❌ MAUVAIS : Styles inline
<div style={{ display: 'flex', padding: '16px' }}>
```

### CSS Modules (si nécessaire)

```typescript
// ✅ BON : CSS Module typé
import styles from './Button.module.css'

export function Button() {
  return <button className={styles.button}>Click</button>
}

// Button.module.css
.button {
  @apply px-4 py-2 rounded-md;
}
```

---

## 🔧 CONVENTIONS API

### Routes

```typescript
// ✅ BON : Validation + Error handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = RequestSchema.parse(body)
    
    const result = await processRequest(validated)
    
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}

// ❌ MAUVAIS : Pas de validation
export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json(body)
}
```

### Services

```typescript
// ✅ BON : Service avec interface
interface AnalysisService {
  analyze(params: AnalyzeParams): Promise<AnalysisResult>
  getById(id: string): Promise<AnalysisResult | null>
}

export class OpenAIAnalysisService implements AnalysisService {
  constructor(private readonly openai: OpenAI) {}
  
  async analyze(params: AnalyzeParams): Promise<AnalysisResult> {
    // Implémentation
  }
  
  async getById(id: string): Promise<AnalysisResult | null> {
    // Implémentation
  }
}

// ❌ MAUVAIS : Fonctions globales sans structure
export async function analyze(params: any) {
  // ...
}
```

---

## 🚨 ERROR HANDLING

### Erreurs Typées

```typescript
// ✅ BON : Erreurs custom
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

try {
  const validated = schema.parse(data)
} catch (error) {
  if (error instanceof z.ZodError) {
    throw new ValidationError('Invalid input', error.errors)
  }
  throw error
}

// ❌ MAUVAIS : throw string
throw 'Invalid input'
```

### Try/Catch

```typescript
// ✅ BON : Gestion d'erreur spécifique
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  if (error instanceof NetworkError) {
    return fallbackValue
  }
  if (error instanceof ValidationError) {
    logger.warn('Validation failed', error.details)
    throw error
  }
  logger.error('Unexpected error', error)
  throw new InternalError('Operation failed')
}

// ❌ MAUVAIS : Catch silencieux
try {
  await riskyOperation()
} catch (error) {
  // Silence...
}
```

---

## 📊 LOGGING

### Logs Structurés

```typescript
// ✅ BON : Logs avec contexte
console.log('[AnalysisService] Starting analysis', {
  userId: user.id,
  photoCount: photos.length,
  timestamp: new Date().toISOString()
})

console.error('[AnalysisService] Analysis failed', {
  userId: user.id,
  error: error.message,
  stack: error.stack
})

// ❌ MAUVAIS : Logs non structurés
console.log('Starting analysis')
console.log(user.id, photos.length)
```

### Niveaux de Log

```typescript
// ✅ BON : Niveaux appropriés
console.log('[INFO] User logged in')
console.warn('[WARN] Rate limit approaching')
console.error('[ERROR] Database connection failed')

// En production : Utiliser logger
import { logger } from '@/lib/logger'

logger.info('User logged in', { userId })
logger.warn('Rate limit approaching', { userId, count })
logger.error('Database connection failed', { error })
```

---

## 🧪 TESTING

### Tests Unitaires

```typescript
// ✅ BON : Test descriptif avec arrange/act/assert
describe('ProductMatcher', () => {
  describe('selectForRoutineStep', () => {
    it('should select product matching skin type and concerns', () => {
      // Arrange
      const matcher = new ProductMatcher()
      const step: RoutineStep = {
        careType: 'hydratation',
        targetProblem: 'Sécheresse'
      }
      const profile: UserProfile = {
        skinType: 'dry',
        concerns: ['hydratation']
      }
      
      // Act
      const result = matcher.selectForRoutineStep(step, profile, budget)
      
      // Assert
      expect(result.product).toBeDefined()
      expect(result.product.careType).toBe('hydratation')
      expect(result.product.targetSkinTypes).toContain('dry')
      expect(result.score).toBeGreaterThan(50)
    })
    
    it('should throw error when no products found', () => {
      const matcher = new ProductMatcher()
      const step: RoutineStep = { careType: 'invalid' }
      
      expect(() => {
        matcher.selectForRoutineStep(step, profile, budget)
      }).toThrow('No products found')
    })
  })
})

// ❌ MAUVAIS : Test vague
test('it works', () => {
  const result = doSomething()
  expect(result).toBeTruthy()
})
```

### Tests E2E

```typescript
// ✅ BON : Test E2E complet
import { test, expect } from '@playwright/test'

test('user can complete full analysis flow', async ({ page }) => {
  // 1. Upload photos
  await page.goto('/upload')
  await page.setInputFiles('input[type="file"]', [
    'tests/fixtures/photo1.jpg',
    'tests/fixtures/photo2.jpg'
  ])
  await page.click('button:has-text("Continuer")')
  
  // 2. Fill questionnaire
  await page.click('input[value="dry"]')
  await page.fill('input[name="age"]', '30')
  await page.click('button:has-text("Suivant")')
  
  // 3. Wait for analysis
  await page.waitForURL('/results')
  
  // 4. Verify results
  await expect(page.locator('h1')).toContainText('Votre diagnostic')
  await expect(page.locator('[data-testid="score-overall"]')).toBeVisible()
  await expect(page.locator('[data-testid="routine-phase"]')).toHaveCount(3)
})
```

---

## 🔒 SÉCURITÉ

### Variables d'Environnement

```typescript
// ✅ BON : Validation env vars
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required')
}

// ✅ BON : Séparation public/privé
// Côté client : NEXT_PUBLIC_*
const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

// Côté serveur : pas de préfixe
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ❌ MAUVAIS : Hardcoded secrets
const apiKey = 'sk-1234567890abcdef'
```

### Sanitization

```typescript
// ✅ BON : Sanitize user input
import DOMPurify from 'isomorphic-dompurify'

const cleanHtml = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
  ALLOWED_ATTR: []
})

// ✅ BON : Validate file uploads
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

if (!ALLOWED_TYPES.includes(file.type)) {
  throw new ValidationError('Invalid file type')
}
if (file.size > MAX_SIZE) {
  throw new ValidationError('File too large')
}
```

---

## 📦 IMPORTS

### Organisation

```typescript
// ✅ BON : Imports groupés et ordonnés
// 1. External libraries
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// 2. Internal modules
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAnalysis } from '@/hooks/useAnalysis'

// 3. Types
import type { UserProfile, AnalysisResult } from '@/types'

// 4. Styles
import styles from './Component.module.css'

// ❌ MAUVAIS : Imports désordonnés
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { UserProfile } from '@/types'
import { z } from 'zod'
```

### Alias

```typescript
// ✅ BON : Utiliser alias @/
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

// ❌ MAUVAIS : Chemins relatifs complexes
import { Button } from '../../../components/ui/button'
```

---

## 🚫 INTERDICTIONS STRICTES

### 1. Pas de `any`
```typescript
// ❌ INTERDIT
function process(data: any) {
  return data.value
}

// ✅ AUTORISÉ
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return data.value
  }
  throw new Error('Invalid data')
}
```

### 2. Pas de console.log en production
```typescript
// ❌ INTERDIT en production
console.log('Debug info', data)

// ✅ AUTORISÉ : Logger conditionnel
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG]', data)
}

// ✅ AUTORISÉ : Logger service
import { logger } from '@/lib/logger'
logger.info('Event occurred', { data })
```

### 3. Pas de secrets hardcodés
```typescript
// ❌ INTERDIT
const apiKey = 'sk-1234567890'

// ✅ AUTORISÉ
const apiKey = process.env.OPENAI_API_KEY!
```

### 4. Pas de code mort
```typescript
// ❌ INTERDIT : Fonction inutilisée
function oldFunction() {
  // Supprimer si non utilisée
}

// ❌ INTERDIT : Code commenté
// const oldCode = 'remove me'
// function oldFunction() {}
```

---

## ✅ CHECKLIST AVANT COMMIT

### Code Quality
- [ ] TypeScript strict mode activé
- [ ] Aucun `any` utilisé
- [ ] Validation Zod pour inputs externes
- [ ] Error handling complet
- [ ] Logs structurés

### Tests
- [ ] Tests unitaires pour nouveaux services
- [ ] Tests E2E pour nouveaux parcours
- [ ] Coverage > 80% pour code critique

### Sécurité
- [ ] Pas de secrets hardcodés
- [ ] Variables d'environnement validées
- [ ] User input sanitizé

### Performance
- [ ] Pas de re-renders inutiles
- [ ] Images optimisées (Next.js Image)
- [ ] Code splitting si nécessaire

### Documentation
- [ ] JSDoc pour fonctions complexes
- [ ] README mis à jour si nécessaire
- [ ] Types exportés documentés

---

**Dernière mise à jour** : 6 Novembre 2025  
**Version** : 1.0  
**Prochain review** : Fin Sprint 2

