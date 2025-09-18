# 📅 PLANNING EXÉCUTION PHASE 2 - Dashboard Utilisateur

> **Version :** 1.0  
> **Date :** 18 septembre 2025  
> **Durée :** 3-4 semaines (15-20 jours ouvrés)  
> **Statut :** PRÊT À EXÉCUTER

---

## 🎯 **VUE D'ENSEMBLE DU PLANNING**

### **Objectif Global**
Transformer DermAI d'un outil d'analyse ponctuel en **compagnon quotidien de soin de la peau** via un dashboard engageant, un tracking de routine motivant et un coach IA personnalisé.

### **Métriques de Succès**
- **Engagement** : Session moyenne >5 minutes, 2+ widgets utilisés
- **Routine** : >60% des users trackent, >30% streak 7+ jours
- **Rétention** : D7 >50%, D30 >30%
- **Coach IA** : 25% adoption, satisfaction >80%
- **Comparaisons** : 40% des users comparent analyses

### **Sprints Planifiés**
1. **Sprint 2.1** (3-4 jours) : Architecture Dashboard & Layout
2. **Sprint 2.2** (4-5 jours) : Historique Analyses & Comparaison
3. **Sprint 2.3** (5-6 jours) : Routine Tracker & Étagères
4. **Sprint 2.4** (2-3 jours) : Paramètres Utilisateur
5. **Sprint 2.5** (3-4 jours) : Coach IA & Badges

---

## 📊 **SPRINT 2.1 : ARCHITECTURE DASHBOARD**
### *Durée : 3-4 jours*

### **🎯 Objectifs Sprint 2.1**
- Créer l'architecture complète du dashboard
- Implémenter layout responsive avec sidebar
- Développer widgets prioritaires page d'accueil
- Configurer navigation et routing

### **📁 Fichiers à Créer/Modifier**

#### **Structure Dashboard**
```typescript
src/app/dashboard/
├── layout.tsx                // Layout principal avec sidebar
├── page.tsx                 // Page d'accueil avec widgets
├── analyses/
│   ├── page.tsx
│   ├── [id]/page.tsx
│   └── compare/page.tsx
├── routine/
│   ├── page.tsx
│   ├── shelves/page.tsx
│   └── coach/page.tsx
├── progress/
│   └── page.tsx
└── settings/
    └── page.tsx
```

#### **Composants UI**
```typescript
src/components/dashboard/
├── layout/
│   ├── Sidebar.tsx
│   ├── DashboardHeader.tsx
│   └── MobileNav.tsx
├── widgets/
│   ├── OverviewStats.tsx
│   ├── LastAnalysis.tsx
│   ├── RoutineToday.tsx
│   ├── ProgressChart.tsx
│   └── RecentBadges.tsx
└── common/
    ├── DashboardCard.tsx
    ├── LoadingSkeleton.tsx
    └── EmptyState.tsx
```

---

### **JOUR 1 : Layout & Navigation**

#### **Matin : Configuration Layout Dashboard**

**🔧 Prompt Layout Principal :**
```typescript
// Créer src/app/dashboard/layout.tsx
import { Sidebar } from '@/components/dashboard/layout/Sidebar'
import { DashboardHeader } from '@/components/dashboard/layout/DashboardHeader'
import { MobileNav } from '@/components/dashboard/layout/MobileNav'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  
  if (isLoading) {
    return <DashboardLoadingSkeleton />
  }
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar user={user} />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <DashboardHeader user={user} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="lg:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
```

**🎨 Prompt Sidebar Component :**
```typescript
// Créer src/components/dashboard/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  LineChart,
  Calendar,
  Package,
  Settings,
  MessageCircle,
  Trophy
} from 'lucide-react'

const navigation = [
  { name: 'Vue d\'ensemble', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Mes Analyses', href: '/dashboard/analyses', icon: LineChart },
  { name: 'Ma Routine', href: '/dashboard/routine', icon: Calendar },
  { name: 'Étagères Produits', href: '/dashboard/routine/shelves', icon: Package },
  { name: 'Progression', href: '/dashboard/progress', icon: Trophy },
  { name: 'Coach IA', href: '/dashboard/routine/coach', icon: MessageCircle },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar({ user }) {
  const pathname = usePathname()
  
  return (
    <div className="flex h-full w-70 flex-col bg-white shadow-sm">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500" />
          <span className="text-xl font-semibold">DermAI</span>
        </Link>
      </div>
      
      {/* User Info */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.full_name}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user.full_name || 'Utilisateur'}
            </p>
            <p className="text-xs text-gray-500">
              {user.subscription_status === 'premium' ? 'Premium' : 'Gratuit'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive 
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      {/* CTA Nouvelle Analyse */}
      <div className="p-4 border-t">
        <Link
          href="/upload"
          className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-blue-500 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Analyse
        </Link>
      </div>
    </div>
  )
}
```

#### **Après-midi : Page d'Accueil Dashboard**

**🏠 Prompt Page Dashboard :**
```typescript
// Créer src/app/dashboard/page.tsx
import { Suspense } from 'react'
import { OverviewStats } from '@/components/dashboard/widgets/OverviewStats'
import { LastAnalysis } from '@/components/dashboard/widgets/LastAnalysis'
import { RoutineToday } from '@/components/dashboard/widgets/RoutineToday'
import { ProgressChart } from '@/components/dashboard/widgets/ProgressChart'
import { RecentBadges } from '@/components/dashboard/widgets/RecentBadges'
import { DashboardSkeleton } from '@/components/dashboard/common/LoadingSkeleton'

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Tableau de Bord
        </h1>
        <p className="text-gray-600">
          Bienvenue ! Voici votre suivi personnalisé.
        </p>
      </div>
      
      {/* Widgets Grid */}
      <Suspense fallback={<DashboardSkeleton />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <LastAnalysis />
            <RoutineToday />
          </div>
          
          {/* Colonne latérale (1/3) */}
          <div className="space-y-6">
            <OverviewStats />
            <ProgressChart />
            <RecentBadges />
          </div>
        </div>
      </Suspense>
    </div>
  )
}
```

**📊 Prompt Widget Stats :**
```typescript
// Créer src/components/dashboard/widgets/OverviewStats.tsx
'use client'

import { useEffect, useState } from 'react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Award 
} from 'lucide-react'

export function OverviewStats() {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    currentStreak: 0,
    improvementRate: 0,
    totalBadges: 0
  })
  
  useEffect(() => {
    fetchUserStats()
  }, [])
  
  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }
  
  const statItems = [
    {
      label: 'Analyses',
      value: stats.totalAnalyses,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Streak',
      value: `${stats.currentStreak}j`,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Amélioration',
      value: `+${stats.improvementRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Badges',
      value: stats.totalBadges,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]
  
  return (
    <DashboardCard title="Vos Statistiques">
      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <div className={`inline-flex p-3 rounded-lg ${item.bgColor}`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {item.value}
            </p>
            <p className="text-sm text-gray-600">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}
```

**✅ Prompt Vérification Jour 1 :**
```bash
# Tester layout dashboard
npm run dev
# Naviguer vers http://localhost:3000/dashboard
# Vérifier : sidebar, responsive, navigation
```

---

### **JOUR 2 : Widgets Prioritaires**

#### **Matin : Widget Dernière Analyse**

**📊 Prompt Widget LastAnalysis :**
```typescript
// Créer src/components/dashboard/widgets/LastAnalysis.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'

export function LastAnalysis() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchLastAnalysis()
  }, [])
  
  const fetchLastAnalysis = async () => {
    try {
      const response = await fetch('/api/analyses?limit=1')
      const data = await response.json()
      setAnalysis(data.analyses[0])
    } catch (error) {
      console.error('Erreur chargement analyse:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return <LastAnalysisSkeleton />
  }
  
  if (!analysis) {
    return (
      <DashboardCard>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Aucune analyse encore réalisée
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Commencer votre première analyse
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </DashboardCard>
    )
  }
  
  const topScores = Object.entries(analysis.analysis_data.scores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
  
  const bottomScores = Object.entries(analysis.analysis_data.scores)
    .sort(([,a], [,b]) => a - b)
    .slice(0, 3)
  
  return (
    <DashboardCard
      title="Dernière Analyse"
      action={
        <Link 
          href={`/dashboard/analyses/${analysis.id}`}
          className="text-sm text-violet-600 hover:text-violet-700"
        >
          Voir détails →
        </Link>
      }
    >
      <div className="flex gap-6">
        {/* Photo principale */}
        <div className="flex-shrink-0">
          {analysis.photos_metadata?.[0] ? (
            <img
              src={analysis.photos_metadata[0].url}
              alt="Dernière analyse"
              className="w-32 h-32 rounded-lg object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-lg bg-gray-200" />
          )}
        </div>
        
        {/* Infos analyse */}
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              {formatDistanceToNow(new Date(analysis.created_at), {
                addSuffix: true,
                locale: fr
              })}
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              Score global : {analysis.analysis_data.globalScore}/100
            </p>
          </div>
          
          {/* Top scores */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Points forts
            </p>
            <div className="space-y-1">
              {topScores.map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">
                    {key}: {value}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/dashboard/analyses/compare"
              className="text-sm text-violet-600 hover:text-violet-700"
            >
              Comparer
            </Link>
            <Link
              href="/upload"
              className="text-sm text-violet-600 hover:text-violet-700"
            >
              Nouvelle analyse
            </Link>
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}
```

#### **Après-midi : Widget Routine du Jour**

**📅 Prompt Widget RoutineToday :**
```typescript
// Créer src/components/dashboard/widgets/RoutineToday.tsx
'use client'

import { useEffect, useState } from 'react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import { Check, Clock, Sun, Moon } from 'lucide-react'
import Link from 'next/link'

export function RoutineToday() {
  const [routine, setRoutine] = useState({
    morning: { products: [], completed: false },
    evening: { products: [], completed: false },
    currentStreak: 0
  })
  
  useEffect(() => {
    fetchTodayRoutine()
  }, [])
  
  const fetchTodayRoutine = async () => {
    try {
      const response = await fetch('/api/routine/today')
      const data = await response.json()
      setRoutine(data)
    } catch (error) {
      console.error('Erreur chargement routine:', error)
    }
  }
  
  const handleTogglePhase = async (phase: 'morning' | 'evening') => {
    try {
      await fetch('/api/routine/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completion_date: new Date().toISOString().split('T')[0],
          phase,
          completed: !routine[phase].completed
        })
      })
      
      // Mise à jour locale
      setRoutine(prev => ({
        ...prev,
        [phase]: {
          ...prev[phase],
          completed: !prev[phase].completed
        }
      }))
    } catch (error) {
      console.error('Erreur mise à jour routine:', error)
    }
  }
  
  return (
    <DashboardCard
      title="Routine du Jour"
      action={
        <Link 
          href="/dashboard/routine"
          className="text-sm text-violet-600 hover:text-violet-700"
        >
          Voir calendrier →
        </Link>
      }
    >
      {/* Streak actuel */}
      {routine.currentStreak > 0 && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            🔥 Série actuelle : {routine.currentStreak} jours
          </p>
        </div>
      )}
      
      {/* Phases matin/soir */}
      <div className="space-y-4">
        {/* Phase Matin */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Routine Matin</span>
            </div>
            <button
              onClick={() => handleTogglePhase('morning')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                routine.morning.completed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {routine.morning.completed ? (
                <>
                  <Check className="h-4 w-4" />
                  Complétée
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  À faire
                </>
              )}
            </button>
          </div>
          
          <div className="space-y-1 ml-7">
            {routine.morning.products.map((product, index) => (
              <div key={index} className="text-sm text-gray-600">
                {index + 1}. {product.name}
              </div>
            ))}
          </div>
        </div>
        
        {/* Phase Soir */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-indigo-500" />
              <span className="font-medium">Routine Soir</span>
            </div>
            <button
              onClick={() => handleTogglePhase('evening')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                routine.evening.completed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {routine.evening.completed ? (
                <>
                  <Check className="h-4 w-4" />
                  Complétée
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  À faire
                </>
              )}
            </button>
          </div>
          
          <div className="space-y-1 ml-7">
            {routine.evening.products.map((product, index) => (
              <div key={index} className="text-sm text-gray-600">
                {index + 1}. {product.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}
```

**✅ Prompt Vérification Jour 2 :**
```typescript
// Test des widgets
// 1. Vérifier LastAnalysis avec/sans données
// 2. Tester toggle routine matin/soir
// 3. Vérifier responsive mobile
```

---

### **JOUR 3 : Graphiques & Tour Guidé**

#### **Matin : Widget Progress Chart**

**📈 Prompt Widget ProgressChart :**
```typescript
// Créer src/components/dashboard/widgets/ProgressChart.tsx
'use client'

import { useEffect, useState } from 'react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const CRITERIA_OPTIONS = [
  { value: 'hydration', label: 'Hydratation', color: '#3B82F6' },
  { value: 'wrinkles', label: 'Rides', color: '#8B5CF6' },
  { value: 'texture', label: 'Texture', color: '#10B981' },
  { value: 'radiance', label: 'Éclat', color: '#F59E0B' },
  { value: 'elasticity', label: 'Élasticité', color: '#EF4444' },
  { value: 'sebum', label: 'Sébum', color: '#6366F1' },
  { value: 'sensitivity', label: 'Sensibilité', color: '#EC4899' },
  { value: 'darkSpots', label: 'Taches', color: '#14B8A6' }
]

export function ProgressChart() {
  const [selectedCriteria, setSelectedCriteria] = useState('hydration')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchProgressData()
  }, [selectedCriteria])
  
  const fetchProgressData = async () => {
    try {
      const response = await fetch(
        `/api/analyses/progress?criteria=${selectedCriteria}&period=6months`
      )
      const progressData = await response.json()
      
      // Formater pour Recharts
      const formattedData = progressData.map(item => ({
        date: format(new Date(item.date), 'dd MMM', { locale: fr }),
        value: item.scores[selectedCriteria],
        fullDate: item.date
      }))
      
      setData(formattedData)
    } catch (error) {
      console.error('Erreur chargement progression:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const selectedConfig = CRITERIA_OPTIONS.find(c => c.value === selectedCriteria)
  
  return (
    <DashboardCard title="Évolution">
      {/* Sélecteur de critère */}
      <div className="mb-4">
        <select
          value={selectedCriteria}
          onChange={(e) => setSelectedCriteria(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          {CRITERIA_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Graphique */}
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              domain={[0, 100]}
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              formatter={(value) => [`${value}/100`, selectedConfig.label]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={selectedConfig.color}
              strokeWidth={2}
              dot={{ fill: selectedConfig.color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          Pas assez de données pour afficher l'évolution
        </div>
      )}
    </DashboardCard>
  )
}
```

#### **Après-midi : Tour Guidé Onboarding**

**🎯 Prompt Tour Guidé :**
```typescript
// Installer react-joyride
npm install react-joyride

// Créer src/components/dashboard/DashboardTour.tsx
'use client'

import { useEffect, useState } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import { useRouter } from 'next/navigation'

const tourSteps: Step[] = [
  {
    target: '.dashboard-overview',
    content: 'Bienvenue dans votre tableau de bord ! Ici vous retrouvez vos statistiques principales.',
    placement: 'center',
    disableBeacon: true
  },
  {
    target: '.last-analysis-widget',
    content: 'Votre dernière analyse est toujours accessible ici. Vous pouvez la comparer avec les précédentes.',
    placement: 'bottom'
  },
  {
    target: '.routine-today-widget',
    content: 'Suivez votre routine quotidienne et marquez chaque phase comme complétée.',
    placement: 'top'
  },
  {
    target: '.sidebar-nav',
    content: 'Naviguez facilement entre les différentes sections de votre dashboard.',
    placement: 'right'
  }
]

export function DashboardTour() {
  const [runTour, setRunTour] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Vérifier si première visite
    const hasSeenTour = localStorage.getItem('dashboard_tour_completed')
    if (!hasSeenTour) {
      setTimeout(() => setRunTour(true), 1000)
    }
  }, [])
  
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem('dashboard_tour_completed', 'true')
      setRunTour(false)
    }
  }
  
  return (
    <Joyride
      steps={tourSteps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          primaryColor: '#8B5CF6',
          zIndex: 10000,
        },
        spotlight: {
          borderRadius: 8,
        },
        tooltip: {
          borderRadius: 8,
        },
        buttonNext: {
          borderRadius: 6,
        },
        buttonBack: {
          borderRadius: 6,
        },
      }}
      locale={{
        back: 'Retour',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        skip: 'Passer'
      }}
      callback={handleJoyrideCallback}
    />
  )
}

// Ajouter dans dashboard/page.tsx
import { DashboardTour } from '@/components/dashboard/DashboardTour'

export default function DashboardPage() {
  return (
    <>
      <DashboardTour />
      {/* ... reste du dashboard */}
    </>
  )
}
```

**✅ Prompt Vérification Sprint 2.1 :**
```bash
# Tests finaux Sprint 2.1
# 1. Navigation complète dashboard
# 2. Responsive mobile/tablet/desktop
# 3. Tour guidé première visite
# 4. Widgets avec données réelles
# 5. Performance chargement <2s
```

---

## 📊 **SPRINT 2.2 : HISTORIQUE ANALYSES & COMPARAISON**
### *Durée : 4-5 jours*

### **🎯 Objectifs Sprint 2.2**
- Implémenter liste paginée des analyses avec filtres
- Développer page détail analyse enrichie
- Créer interface de comparaison interactive
- Optimiser performance avec cache SWR

---

### **JOUR 4 : Liste Analyses & Filtres**

#### **Matin : Page Liste Analyses**

**📋 Prompt Page Analyses :**
```typescript
// Créer src/app/dashboard/analyses/page.tsx
import { Suspense } from 'react'
import { AnalysisList } from '@/components/dashboard/analyses/AnalysisList'
import { AnalysisFilters } from '@/components/dashboard/analyses/AnalysisFilters'
import { AnalysisListSkeleton } from '@/components/dashboard/common/LoadingSkeleton'

export default function AnalysesPage({
  searchParams
}: {
  searchParams: { page?: string; filter?: string; search?: string }
}) {
  const currentPage = Number(searchParams.page) || 1
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Mes Analyses
          </h1>
          <p className="text-gray-600">
            Historique complet de vos diagnostics
          </p>
        </div>
        
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Analyse
        </Link>
      </div>
      
      {/* Filtres */}
      <AnalysisFilters 
        defaultFilters={{
          dateRange: searchParams.filter || 'all',
          search: searchParams.search || ''
        }}
      />
      
      {/* Liste analyses */}
      <Suspense fallback={<AnalysisListSkeleton />}>
        <AnalysisList 
          page={currentPage}
          filters={searchParams}
        />
      </Suspense>
    </div>
  )
}
```

**🔍 Prompt Composant Filtres :**
```typescript
// Créer src/components/dashboard/analyses/AnalysisFilters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar, Filter } from 'lucide-react'
import { useState } from 'react'

export function AnalysisFilters({ defaultFilters }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(defaultFilters.search)
  
  const handleFilterChange = (filterType: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set(filterType, value)
    params.set('page', '1') // Reset page on filter change
    router.push(`/dashboard/analyses?${params.toString()}`)
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilterChange('search', searchQuery)
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans vos analyses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
        </form>
        
        {/* Filtre période */}
        <select
          value={defaultFilters.dateRange}
          onChange={(e) => handleFilterChange('filter', e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">Toutes les analyses</option>
          <option value="last_month">Dernier mois</option>
          <option value="last_3_months">3 derniers mois</option>
          <option value="last_year">Dernière année</option>
        </select>
        
        {/* Filtre amélioration */}
        <select
          onChange={(e) => handleFilterChange('improvement', e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">Toutes</option>
          <option value="improved">Améliorées</option>
          <option value="declined">Dégradées</option>
          <option value="stable">Stables</option>
        </select>
      </div>
    </div>
  )
}
```

#### **Après-midi : Liste avec Pagination**

**📋 Prompt AnalysisList Component :**
```typescript
// Créer src/components/dashboard/analyses/AnalysisList.tsx
import { AnalysisCard } from './AnalysisCard'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/dashboard/common/EmptyState'

const ITEMS_PER_PAGE = 10

export async function AnalysisList({ page, filters }) {
  const offset = (page - 1) * ITEMS_PER_PAGE
  
  // Construire query params
  const queryParams = new URLSearchParams({
    limit: ITEMS_PER_PAGE.toString(),
    offset: offset.toString(),
    ...filters
  })
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/analyses?${queryParams}`,
    { cache: 'no-store' }
  )
  
  const { analyses, total } = await response.json()
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  
  if (analyses.length === 0) {
    return (
      <EmptyState
        title="Aucune analyse trouvée"
        description={filters.search 
          ? "Aucun résultat ne correspond à votre recherche."
          : "Commencez par réaliser votre première analyse de peau."
        }
        action={
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Nouvelle Analyse
          </Link>
        }
      />
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Liste des analyses */}
      <div className="grid gap-4">
        {analyses.map((analysis) => (
          <AnalysisCard key={analysis.id} analysis={analysis} />
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/dashboard/analyses"
          queryParams={filters}
        />
      )}
    </div>
  )
}
```

**✅ Prompt Vérification Jour 4 :**
```bash
# Tests liste analyses
# 1. Filtres fonctionnels
# 2. Pagination navigation
# 3. Recherche textuelle
# 4. Performance avec 50+ analyses
```

---

### **JOUR 5-6 : Comparaison Interactive**

#### **Jour 5 : Interface Comparaison**

**🔄 Prompt Page Compare :**
```typescript
// Créer src/app/dashboard/analyses/compare/page.tsx
import { ComparisonInterface } from '@/components/dashboard/analyses/ComparisonInterface'

export default function ComparePage({
  searchParams
}: {
  searchParams: { ids?: string }
}) {
  const analysisIds = searchParams.ids?.split(',') || []
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Comparer vos Analyses
        </h1>
        <p className="text-gray-600">
          Visualisez votre évolution dans le temps
        </p>
      </div>
      
      <ComparisonInterface 
        preselectedIds={analysisIds}
      />
    </div>
  )
}
```

**🎭 Prompt ComparisonSlider :**
```typescript
// Créer src/components/dashboard/analyses/ComparisonSlider.tsx
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ComparisonSlider({ beforePhotos, afterPhotos }) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }
  
  return (
    <div className="space-y-4">
      {/* Slider principal */}
      <div 
        className="relative overflow-hidden rounded-lg cursor-col-resize"
        onMouseMove={handleMouseMove}
      >
        <div className="relative w-full" style={{ paddingBottom: '100%' }}>
          {/* Photo après (base) */}
          <img
            src={afterPhotos[selectedPhotoIndex].url}
            alt="Après"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Photo avant (overlay avec clip) */}
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={beforePhotos[selectedPhotoIndex].url}
              alt="Avant"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          
          {/* Ligne de séparation */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </div>
          </div>
          
          {/* Labels */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
            Avant
          </div>
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
            Après
          </div>
        </div>
      </div>
      
      {/* Sélection photo si multiple */}
      {beforePhotos.length > 1 && (
        <div className="flex gap-2 justify-center">
          {beforePhotos.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedPhotoIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === selectedPhotoIndex
                  ? 'bg-violet-600'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**✅ Prompt Vérification Sprint 2.2 :**
```bash
# Tests complets Sprint 2.2
# 1. Liste analyses avec 50+ items
# 2. Filtres et recherche performants
# 3. Détail analyse complet
# 4. Comparaison 2-4 analyses
# 5. Slider photos fluide
# 6. Export PDF fonctionnel
```

---

## 📋 **NOTES IMPORTANTES**

Le planning complet est divisé en deux fichiers pour des raisons de taille :
- **Partie 1** : Sprint 2.1 et 2.2 (Architecture Dashboard + Historique Analyses)
- **Partie 2** : Sprint 2.3, 2.4 et 2.5 (voir `docs/planning-execution-phase2-dashboard-part2.md`)

Consultez `docs/planning-execution-phase2-dashboard-part2.md` pour :
- Sprint 2.3 : Routine Tracker & Étagères
- Sprint 2.4 : Paramètres Utilisateur  
- Sprint 2.5 : Coach IA & Badges

---
