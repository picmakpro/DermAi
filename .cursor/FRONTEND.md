# 🎨 FRONTEND.md - Patterns React/Next.js DermAI V2

**Version** : 1.0  
**Date** : 6 Novembre 2025

---

## 📋 TABLE DES MATIÈRES

1. [Architecture Composants](#architecture-composants)
2. [Patterns Next.js](#patterns-nextjs)
3. [State Management](#state-management)
4. [Hooks Customs](#hooks-customs)
5. [Forms & Validation](#forms--validation)
6. [Styling](#styling)
7. [Performance](#performance)
8. [Exemples](#exemples)

---

## 🏗️ ARCHITECTURE COMPOSANTS

### Structure Hiérarchique

```
/src/components
├── ui/                    # Primitives shadcn/ui (Button, Card, etc.)
├── shared/               # Composants réutilisables transverses
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx
│   └── ImageUploader.tsx
├── features/             # Composants métier par feature
│   ├── analysis/
│   │   ├── AnalysisCard.tsx
│   │   ├── ScoreDisplay.tsx
│   │   └── DiagnosticPanel.tsx
│   ├── routine/
│   │   ├── RoutinePhaseCard.tsx
│   │   ├── ProductCard.tsx
│   │   └── AlternativesModal.tsx
│   └── questionnaire/
│       ├── QuestionStep.tsx
│       └── ProgressBar.tsx
└── layouts/              # Layouts réutilisables
    ├── DashboardLayout.tsx
    └── AuthLayout.tsx
```

### Règles de Composition

#### ✅ BON : Composant Atomique
```typescript
// components/shared/Badge.tsx
interface BadgeProps {
  variant: 'success' | 'warning' | 'info'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants[variant], className)}>
      {children}
    </span>
  )
}
```

#### ✅ BON : Composant Composé
```typescript
// components/features/routine/ProductCard.tsx
interface ProductCardProps {
  product: EnrichedProduct
  score: number
  onSelect: (id: string) => void
  showAlternatives?: boolean
}

export function ProductCard({ 
  product, 
  score, 
  onSelect,
  showAlternatives = false 
}: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <ProductImage src={product.imageUrl} alt={product.name} />
        <ProductTitle>{product.name}</ProductTitle>
        <ScoreBadge score={score} />
      </CardHeader>
      <CardContent>
        <ProductDetails product={product} />
      </CardContent>
      <CardFooter>
        <Button onClick={() => onSelect(product.catalogId)}>
          Voir sur Amazon
        </Button>
        {showAlternatives && (
          <AlternativesButton productId={product.catalogId} />
        )}
      </CardFooter>
    </Card>
  )
}
```

#### ❌ MAUVAIS : Composant Monolithique
```typescript
// ❌ Trop de responsabilités
function ProductSection() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // 200 lignes de logique...
  // Fetch, transformation, affichage, modals, etc.
  
  return <div>{/* 500 lignes de JSX */}</div>
}
```

---

## 🚀 PATTERNS NEXT.JS

### App Router (Next.js 15)

#### Structure de Page
```typescript
// app/results/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Résultats | DermAI',
  description: 'Votre diagnostic dermatologique personnalisé'
}

export default function ResultsPage() {
  return (
    <main className="container mx-auto py-8">
      <ResultsContent />
    </main>
  )
}
```

#### Server vs Client Components

```typescript
// ✅ Server Component (par défaut)
// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { DashboardStats } from '@/components/features/dashboard/DashboardStats'

export default async function DashboardPage() {
  const session = await getServerSession()
  
  // Fetch côté serveur
  const stats = await fetchUserStats(session.user.id)
  
  return <DashboardStats stats={stats} />
}

// ✅ Client Component (interactivité)
// components/features/dashboard/DashboardStats.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export function DashboardStats({ stats }) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  
  return (
    <motion.div animate={{ opacity: 1 }}>
      <ViewToggle value={view} onChange={setView} />
      <StatsGrid stats={stats} view={view} />
    </motion.div>
  )
}
```

#### API Routes

```typescript
// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { analyzeImages } from '@/services/ai/analysis.service'
import { AnalysisRequestSchema } from '@/types/analysis.types'

export const runtime = 'edge' // ou 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation Zod
    const validated = AnalysisRequestSchema.parse(body)
    
    // Traitement
    const result = await analyzeImages(validated)
    
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Loading & Error States

```typescript
// app/results/loading.tsx
export default function ResultsLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-muted-foreground">
        Analyse en cours...
      </p>
    </div>
  )
}

// app/results/error.tsx
'use client'

export default function ResultsError({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">
        Une erreur est survenue
      </h2>
      <p className="text-muted-foreground mb-6">{error.message}</p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  )
}
```

---

## 🗂️ STATE MANAGEMENT

### React Query (TanStack Query)

#### Configuration
```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1
      }
    }
  }))
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

#### Hooks de Données

```typescript
// hooks/useAnalysis.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { analysisService } from '@/services/ai/analysis.service'

export function useAnalysis(analysisId?: string) {
  return useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: () => analysisService.getById(analysisId!),
    enabled: !!analysisId
  })
}

export function useCreateAnalysis() {
  return useMutation({
    mutationFn: analysisService.create,
    onSuccess: (data) => {
      // Redirection vers résultats
      router.push(`/results?id=${data.id}`)
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'analyse')
    }
  })
}
```

### Context API (État Global Léger)

```typescript
// contexts/AnalysisContext.tsx
'use client'

import { createContext, useContext, useState } from 'react'

interface AnalysisContextType {
  photos: File[]
  addPhoto: (file: File) => void
  removePhoto: (index: number) => void
  clearPhotos: () => void
}

const AnalysisContext = createContext<AnalysisContextType | null>(null)

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<File[]>([])
  
  const addPhoto = (file: File) => {
    if (photos.length < 5) {
      setPhotos([...photos, file])
    }
  }
  
  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }
  
  const clearPhotos = () => setPhotos([])
  
  return (
    <AnalysisContext.Provider value={{ 
      photos, 
      addPhoto, 
      removePhoto, 
      clearPhotos 
    }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysisContext() {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error('useAnalysisContext must be used within AnalysisProvider')
  }
  return context
}
```

---

## 🪝 HOOKS CUSTOMS

### Pattern Standard

```typescript
// hooks/useDebounce.ts
import { useEffect, useState } from 'react'

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
```

### Hook avec Logique Métier

```typescript
// hooks/useProductMatcher.ts
import { useMemo } from 'react'
import { ProductMatcher } from '@/services/products/ProductMatcher'

export function useProductMatcher(
  step: RoutineStep,
  profile: UserProfile,
  budget: BudgetConstraints
) {
  const matcher = useMemo(() => new ProductMatcher(), [])
  
  const match = useMemo(() => {
    return matcher.selectForRoutineStep(step, profile, budget)
  }, [step, profile, budget, matcher])
  
  return {
    product: match.product,
    alternatives: match.alternatives,
    score: match.score,
    reasoning: match.reasoning
  }
}
```

### Hook avec Side Effects

```typescript
// hooks/useAnalytics.ts
import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

export function useAnalytics(eventName: string, data?: Record<string, any>) {
  useEffect(() => {
    analytics.track(eventName, data)
  }, [eventName, data])
}

// Usage
function ResultsPage() {
  useAnalytics('page_view', { page: 'results' })
  
  return <div>...</div>
}
```

---

## 📝 FORMS & VALIDATION

### React Hook Form + Zod

```typescript
// components/features/questionnaire/ProfileForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const ProfileSchema = z.object({
  age: z.number().min(13).max(120),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  skinType: z.enum(['dry', 'oily', 'combination', 'sensitive', 'normal'])
})

type ProfileFormData = z.infer<typeof ProfileSchema>

export function ProfileForm({ onSubmit }: { onSubmit: (data: ProfileFormData) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema)
  })
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="age">Âge</Label>
        <Input
          id="age"
          type="number"
          {...register('age', { valueAsNumber: true })}
        />
        {errors.age && (
          <p className="text-sm text-destructive mt-1">
            {errors.age.message}
          </p>
        )}
      </div>
      
      <div>
        <Label>Type de peau</Label>
        <RadioGroup {...register('skinType')}>
          <RadioGroupItem value="dry" label="Sèche" />
          <RadioGroupItem value="oily" label="Grasse" />
          <RadioGroupItem value="combination" label="Mixte" />
          <RadioGroupItem value="sensitive" label="Sensible" />
          <RadioGroupItem value="normal" label="Normale" />
        </RadioGroup>
        {errors.skinType && (
          <p className="text-sm text-destructive mt-1">
            {errors.skinType.message}
          </p>
        )}
      </div>
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Envoi...' : 'Continuer'}
      </Button>
    </form>
  )
}
```

---

## 🎨 STYLING

### Tailwind CSS

#### Classes Utilitaires
```typescript
// ✅ BON : Classes composées
<div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
  <h2 className="text-2xl font-bold text-foreground">Titre</h2>
  <Badge variant="success">Actif</Badge>
</div>

// ✅ BON : Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

#### Fonction `cn` (Class Names)
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
<Button className={cn(
  'px-4 py-2',
  variant === 'primary' && 'bg-primary text-primary-foreground',
  variant === 'secondary' && 'bg-secondary text-secondary-foreground',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
  Click me
</Button>
```

### Framer Motion

```typescript
// components/shared/AnimatedCard.tsx
'use client'

import { motion } from 'framer-motion'

export function AnimatedCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-card rounded-lg shadow-md"
    >
      {children}
    </motion.div>
  )
}
```

---

## ⚡ PERFORMANCE

### Code Splitting

```typescript
// ✅ BON : Dynamic import
import dynamic from 'next/dynamic'

const AlternativesModal = dynamic(
  () => import('@/components/features/routine/AlternativesModal'),
  { loading: () => <LoadingSpinner /> }
)

export function ProductCard() {
  const [showModal, setShowModal] = useState(false)
  
  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        Voir alternatives
      </Button>
      {showModal && <AlternativesModal onClose={() => setShowModal(false)} />}
    </>
  )
}
```

### Memoization

```typescript
// ✅ BON : useMemo pour calculs coûteux
function RoutinePhaseCard({ steps }: { steps: RoutineStep[] }) {
  const totalPrice = useMemo(() => {
    return steps.reduce((sum, step) => sum + step.product.price, 0)
  }, [steps])
  
  return <div>Total : {totalPrice}€</div>
}

// ✅ BON : useCallback pour fonctions passées en props
function ProductList({ products }: { products: Product[] }) {
  const handleSelect = useCallback((id: string) => {
    analytics.track('product_selected', { id })
  }, [])
  
  return (
    <>
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product}
          onSelect={handleSelect}
        />
      ))}
    </>
  )
}
```

### Image Optimization

```typescript
// ✅ BON : Next.js Image
import Image from 'next/image'

export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={300}
      height={300}
      className="rounded-lg object-cover"
      loading="lazy"
      placeholder="blur"
      blurDataURL="/placeholder.jpg"
    />
  )
}
```

---

## 📚 EXEMPLES COMPLETS

### Composant Feature Complet

```typescript
// components/features/analysis/DiagnosticPanel.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InfoIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiagnosticResult } from '@/types/analysis.types'

interface DiagnosticPanelProps {
  diagnostic: DiagnosticResult
  className?: string
}

export function DiagnosticPanel({ diagnostic, className }: DiagnosticPanelProps) {
  const [expanded, setExpanded] = useState(false)
  
  const severityColor = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  }[diagnostic.severity]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('hover:shadow-lg transition-shadow', className)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>{diagnostic.title}</CardTitle>
            <Badge className={severityColor}>
              {diagnostic.severity}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
          >
            <InfoIcon className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {diagnostic.description}
          </p>
          
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3"
            >
              <div>
                <h4 className="font-semibold mb-2">Recommandations</h4>
                <ul className="list-disc list-inside space-y-1">
                  {diagnostic.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              
              {diagnostic.products.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Produits recommandés</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {diagnostic.products.map(product => (
                      <ProductMiniCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
```

---

## 🚨 ANTI-PATTERNS À ÉVITER

### ❌ Prop Drilling Excessif
```typescript
// ❌ MAUVAIS
<GrandParent user={user}>
  <Parent user={user}>
    <Child user={user}>
      <GrandChild user={user} />
    </Child>
  </Parent>
</GrandParent>

// ✅ BON : Utiliser Context ou React Query
<UserProvider>
  <GrandParent>
    <Parent>
      <Child>
        <GrandChild />
      </Child>
    </Parent>
  </GrandParent>
</UserProvider>
```

### ❌ État Local pour Données Serveur
```typescript
// ❌ MAUVAIS
const [products, setProducts] = useState([])
useEffect(() => {
  fetch('/api/products').then(res => res.json()).then(setProducts)
}, [])

// ✅ BON : Utiliser React Query
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: () => fetch('/api/products').then(res => res.json())
})
```

### ❌ Composants Trop Gros
```typescript
// ❌ MAUVAIS : 500 lignes dans un seul composant

// ✅ BON : Découper en sous-composants
<ProductSection>
  <ProductHeader />
  <ProductFilters />
  <ProductGrid />
  <ProductPagination />
</ProductSection>
```

---

**Dernière mise à jour** : 6 Novembre 2025  
**Version** : 1.0  
**Prochain review** : Fin Sprint 2

