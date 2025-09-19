## 📅 **SPRINT 2.3 : ROUTINE TRACKER & ÉTAGÈRES**
### *Durée : 5-6 jours*

### **🎯 Objectifs Sprint 2.3**
- Implémenter calendrier de suivi routine avec vue mensuelle
- Développer système d'étagères produits drag & drop
- Créer statistiques de complétion et streaks
- Intégrer avec produits recommandés des analyses

---

### **JOUR 7-8 : Calendrier Routine**

#### **Jour 7 : Calendrier Mensuel**

**📅 Prompt Page Routine :**
```typescript
// Créer src/app/dashboard/routine/page.tsx
import { RoutineCalendar } from '@/components/dashboard/routine/RoutineCalendar'
import { RoutineStats } from '@/components/dashboard/routine/RoutineStats'
import { QuickActions } from '@/components/dashboard/routine/QuickActions'

export default function RoutinePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ma Routine
          </h1>
          <p className="text-gray-600">
            Suivez votre routine quotidienne et vos progrès
          </p>
        </div>
        
        <Link
          href="/dashboard/routine/shelves"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Package className="h-4 w-4" />
          Mes Étagères
        </Link>
      </div>
      
      {/* Statistiques */}
      <RoutineStats />
      
      {/* Actions rapides du jour */}
      <QuickActions />
      
      {/* Calendrier */}
      <DashboardCard title="Calendrier de Suivi">
        <RoutineCalendar />
      </DashboardCard>
    </div>
  )
}
```

**📅 Prompt RoutineCalendar Component :**
```typescript
// Créer src/components/dashboard/routine/RoutineCalendar.tsx
'use client'

import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function RoutineCalendar() {
  const [date, setDate] = useState(new Date())
  const [completions, setCompletions] = useState({})
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchMonthCompletions()
  }, [date])
  
  const fetchMonthCompletions = async () => {
    const month = format(date, 'yyyy-MM')
    try {
      const response = await fetch(`/api/routine/completions?month=${month}`)
      const data = await response.json()
      
      // Transformer en map date -> completion
      const completionMap = data.reduce((acc, item) => {
        acc[item.completion_date] = item
        return acc
      }, {})
      
      setCompletions(completionMap)
    } catch (error) {
      console.error('Erreur chargement completions:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null
    
    const dateStr = format(date, 'yyyy-MM-dd')
    const completion = completions[dateStr]
    
    if (!completion) return null
    
    const morningComplete = completion.morning?.completed
    const eveningComplete = completion.evening?.completed
    
    if (morningComplete && eveningComplete) {
      return (
        <div className="flex justify-center mt-1">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </div>
      )
    } else if (morningComplete || eveningComplete) {
      return (
        <div className="flex justify-center mt-1">
          <div className="w-2 h-2 bg-orange-500 rounded-full" />
        </div>
      )
    }
    
    return null
  }
  
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null
    
    const dateStr = format(date, 'yyyy-MM-dd')
    const completion = completions[dateStr]
    
    if (!completion) return null
    
    const morningComplete = completion.morning?.completed
    const eveningComplete = completion.evening?.completed
    
    if (morningComplete && eveningComplete) {
      return 'routine-complete'
    } else if (morningComplete || eveningComplete) {
      return 'routine-partial'
    }
    
    return null
  }
  
  const handleDateClick = (value) => {
    const dateStr = format(value, 'yyyy-MM-dd')
    // Ouvrir modal détail jour
    openDayDetailModal(dateStr)
  }
  
  return (
    <>
      <Calendar
        onChange={setDate}
        value={date}
        onClickDay={handleDateClick}
        locale="fr-FR"
        tileContent={tileContent}
        tileClassName={tileClassName}
        className="routine-calendar"
      />
      
      {/* Légende */}
      <div className="flex items-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>Routine complète</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full" />
          <span>Routine partielle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 rounded-full" />
          <span>Pas de routine</span>
        </div>
      </div>
      
      <style jsx global>{`
        .routine-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        
        .routine-calendar .react-calendar__tile {
          padding: 0.75em 0.5em;
          height: 60px;
        }
        
        .routine-calendar .react-calendar__tile--active {
          background: #8B5CF6;
          color: white;
        }
        
        .routine-calendar .routine-complete {
          background-color: #f0fdf4;
        }
        
        .routine-calendar .routine-partial {
          background-color: #fef3c7;
        }
      `}</style>
    </>
  )
}
```

#### **Jour 8 : Statistiques & Streaks**

**📊 Prompt RoutineStats Component :**
```typescript
// Créer src/components/dashboard/routine/RoutineStats.tsx
'use client'

import { useEffect, useState } from 'react'
import { Flame, TrendingUp, Calendar, Award } from 'lucide-react'

export function RoutineStats() {
  const [stats, setStats] = useState({
    currentStreak: 0,
    bestStreak: 0,
    completionRate: 0,
    totalDays: 0
  })
  
  useEffect(() => {
    fetchRoutineStats()
  }, [])
  
  const fetchRoutineStats = async () => {
    try {
      const response = await fetch('/api/routine/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erreur chargement stats routine:', error)
    }
  }
  
  const statCards = [
    {
      label: 'Série Actuelle',
      value: `${stats.currentStreak} jours`,
      icon: Flame,
      color: stats.currentStreak > 0 ? 'text-orange-600' : 'text-gray-400',
      bgColor: stats.currentStreak > 0 ? 'bg-orange-50' : 'bg-gray-50'
    },
    {
      label: 'Meilleure Série',
      value: `${stats.bestStreak} jours`,
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Taux de Complétion',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Jours Total',
      value: stats.totalDays,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ]
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div key={stat.label} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            {stat.label === 'Série Actuelle' && stats.currentStreak >= 7 && (
              <span className="text-2xl">🔥</span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
```

**🚀 Prompt QuickActions Component :**
```typescript
// Créer src/components/dashboard/routine/QuickActions.tsx
'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Check, Clock } from 'lucide-react'
import { format } from 'date-fns'

export function QuickActions() {
  const [todayRoutine, setTodayRoutine] = useState({
    morning: { completed: false, products: [] },
    evening: { completed: false, products: [] }
  })
  
  const today = format(new Date(), 'yyyy-MM-dd')
  
  useEffect(() => {
    fetchTodayRoutine()
  }, [])
  
  const fetchTodayRoutine = async () => {
    try {
      const response = await fetch(`/api/routine/completions?date=${today}`)
      const data = await response.json()
      if (data) {
        setTodayRoutine(data)
      }
    } catch (error) {
      console.error('Erreur chargement routine du jour:', error)
    }
  }
  
  const togglePhase = async (phase: 'morning' | 'evening') => {
    try {
      await fetch('/api/routine/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completion_date: today,
          phase,
          completed: !todayRoutine[phase].completed
        })
      })
      
      // Mise à jour locale
      setTodayRoutine(prev => ({
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
    <DashboardCard title="Actions du Jour">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Routine Matin */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Routine Matin</span>
            </div>
            <button
              onClick={() => togglePhase('morning')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                todayRoutine.morning.completed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {todayRoutine.morning.completed ? (
                <>
                  <Check className="inline h-4 w-4 mr-1" />
                  Complétée
                </>
              ) : (
                <>
                  <Clock className="inline h-4 w-4 mr-1" />
                  À faire
                </>
              )}
            </button>
          </div>
          
          {todayRoutine.morning.products.length > 0 && (
            <div className="space-y-2">
              {todayRoutine.morning.products.map((product, i) => (
                <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-gray-400">{i + 1}.</span>
                  {product.name}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Routine Soir */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-indigo-500" />
              <span className="font-medium">Routine Soir</span>
            </div>
            <button
              onClick={() => togglePhase('evening')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                todayRoutine.evening.completed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {todayRoutine.evening.completed ? (
                <>
                  <Check className="inline h-4 w-4 mr-1" />
                  Complétée
                </>
              ) : (
                <>
                  <Clock className="inline h-4 w-4 mr-1" />
                  À faire
                </>
              )}
            </button>
          </div>
          
          {todayRoutine.evening.products.length > 0 && (
            <div className="space-y-2">
              {todayRoutine.evening.products.map((product, i) => (
                <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-gray-400">{i + 1}.</span>
                  {product.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardCard>
  )
}
```

---

### **JOUR 9-10 : Étagères Produits**

#### **Jour 9 : Interface Étagères**

**📦 Prompt Page Shelves :**
```typescript
// Créer src/app/dashboard/routine/shelves/page.tsx
import { ProductShelves } from '@/components/dashboard/routine/ProductShelves'
import { CreateShelfButton } from '@/components/dashboard/routine/CreateShelfButton'

export default function ShelvesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Mes Étagères Produits
          </h1>
          <p className="text-gray-600">
            Organisez vos produits par routine ou catégorie
          </p>
        </div>
        
        <CreateShelfButton />
      </div>
      
      {/* Info étagères liées */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Les étagères avec l'icône 🔗 sont liées à une analyse et contiennent 
          les produits recommandés par l'IA.
        </AlertDescription>
      </Alert>
      
      {/* Liste étagères */}
      <ProductShelves />
    </div>
  )
}
```

**🗂️ Prompt ProductShelves Component :**
```typescript
// Créer src/components/dashboard/routine/ProductShelves.tsx
'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable } from 'react-beautiful-dnd'
import { ShelfCard } from './ShelfCard'
import { EmptyState } from '@/components/dashboard/common/EmptyState'

export function ProductShelves() {
  const [shelves, setShelves] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchShelves()
  }, [])
  
  const fetchShelves = async () => {
    try {
      const response = await fetch('/api/routine/shelves')
      const data = await response.json()
      setShelves(data)
    } catch (error) {
      console.error('Erreur chargement étagères:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDragEnd = async (result) => {
    if (!result.destination) return
    
    const items = Array.from(shelves)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    setShelves(items)
    
    // Sauvegarder nouvel ordre
    try {
      await fetch('/api/routine/shelves/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shelfIds: items.map(s => s.id)
        })
      })
    } catch (error) {
      console.error('Erreur réorganisation étagères:', error)
    }
  }
  
  if (loading) {
    return <ShelvesLoadingSkeleton />
  }
  
  if (shelves.length === 0) {
    return (
      <EmptyState
        title="Aucune étagère créée"
        description="Créez votre première étagère pour organiser vos produits"
        icon={Package}
        action={
          <CreateShelfButton />
        }
      />
    )
  }
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="shelves">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-4"
          >
            {shelves.map((shelf, index) => (
              <ShelfCard
                key={shelf.id}
                shelf={shelf}
                index={index}
                onUpdate={fetchShelves}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
```

#### **Jour 10 : Éditeur d'Étagère**

**✏️ Prompt ShelfEditor Component :**
```typescript
// Créer src/components/dashboard/routine/ShelfEditor.tsx
'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Search, Plus, X, GripVertical } from 'lucide-react'

export function ShelfEditor({ shelf, isOpen, onClose, onSave }) {
  const [shelfData, setShelfData] = useState({
    name: shelf?.name || '',
    products: shelf?.products || []
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isAddingCustom, setIsAddingCustom] = useState(false)
  
  // Recherche produits catalogue
  useEffect(() => {
    if (searchQuery.length > 2) {
      searchProducts()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])
  
  const searchProducts = async () => {
    try {
      const response = await fetch(`/api/products/search?q=${searchQuery}`)
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Erreur recherche produits:', error)
    }
  }
  
  const handleAddProduct = (product) => {
    setShelfData(prev => ({
      ...prev,
      products: [...prev.products, product]
    }))
    setSearchQuery('')
    setSearchResults([])
  }
  
  const handleAddCustomProduct = (customProduct) => {
    const newProduct = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      ...customProduct
    }
    handleAddProduct(newProduct)
    setIsAddingCustom(false)
  }
  
  const handleRemoveProduct = (productId) => {
    setShelfData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId)
    }))
  }
  
  const handleDragEnd = (result) => {
    if (!result.destination) return
    
    const items = Array.from(shelfData.products)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    setShelfData(prev => ({ ...prev, products: items }))
  }
  
  const handleSave = async () => {
    await onSave(shelfData)
    onClose()
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">
          {shelf ? 'Modifier l\'étagère' : 'Créer une étagère'}
        </h2>
        
        {/* Nom étagère */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom de l'étagère
          </label>
          <input
            type="text"
            value={shelfData.name}
            onChange={(e) => setShelfData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
            placeholder="Ex: Routine du matin, Soins anti-âge..."
          />
        </div>
        
        {/* Recherche produits */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ajouter des produits
          </label>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
              placeholder="Rechercher dans le catalogue..."
            />
          </div>
          
          {/* Résultats recherche */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg max-h-48 overflow-y-auto mb-4">
              {searchResults.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0"
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600">{product.brand}</div>
                </button>
              ))}
            </div>
          )}
          
          {/* Bouton produit personnalisé */}
          <button
            onClick={() => setIsAddingCustom(true)}
            className="text-violet-600 hover:text-violet-700 text-sm font-medium"
          >
            + Ajouter un produit personnalisé
          </button>
        </div>
        
        {/* Liste produits étagère */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Produits dans l'étagère ({shelfData.products.length})
          </label>
          
          {shelfData.products.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
              Aucun produit ajouté. Recherchez ou créez des produits ci-dessus.
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="products">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {shelfData.products.map((product, index) => (
                      <Draggable
                        key={product.id}
                        draggableId={product.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-600">
                                {product.brand} • {product.category}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleRemoveProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!shelfData.name || shelfData.products.length === 0}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {shelf ? 'Enregistrer' : 'Créer l\'étagère'}
          </button>
        </div>
      </div>
      
      {/* Modal ajout produit personnalisé */}
      {isAddingCustom && (
        <CustomProductModal
          isOpen={isAddingCustom}
          onClose={() => setIsAddingCustom(false)}
          onAdd={handleAddCustomProduct}
        />
      )}
    </Modal>
  )
}
```

**✅ Prompt Vérification Sprint 2.3 :**
```bash
# Tests complets Sprint 2.3
# 1. Calendrier navigation mois
# 2. Indicateurs complétion visuels
# 3. Calcul streaks correct
# 4. Drag & drop étagères fluide
# 5. Recherche produits rapide
# 6. Sauvegarde modifications
```

---

## ⚙️ **SPRINT 2.4 : PARAMÈTRES UTILISATEUR**
### *Durée : 2-3 jours*

### **🎯 Objectifs Sprint 2.4**
- Implémenter page paramètres complète
- Gérer préférences dashboard et notifications
- Permettre export/import données
- Assurer conformité RGPD

---

### **JOUR 11 : Page Paramètres**

**⚙️ Prompt Page Settings :**
```typescript
// Créer src/app/dashboard/settings/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { ProfileSettings } from '@/components/dashboard/settings/ProfileSettings'
import { NotificationSettings } from '@/components/dashboard/settings/NotificationSettings'
import { PrivacySettings } from '@/components/dashboard/settings/PrivacySettings'
import { DashboardSettings } from '@/components/dashboard/settings/DashboardSettings'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Paramètres
        </h1>
        <p className="text-gray-600">
          Gérez votre compte et vos préférences
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="privacy">Confidentialité</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="dashboard">
          <DashboardSettings />
        </TabsContent>
        
        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**👤 Prompt ProfileSettings Component :**
```typescript
// Créer src/components/dashboard/settings/ProfileSettings.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Camera, Save } from 'lucide-react'
import { toast } from 'sonner'

export function ProfileSettings() {
  const { user, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    skin_type: user?.skin_type || '',
    birth_year: user?.birth_year || '',
    concerns: user?.concerns || []
  })
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await updateProfile(formData)
      toast.success('Profil mis à jour avec succès')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }
  
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('avatar', file)
    
    try {
      const response = await fetch('/api/settings/avatar', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const { avatar_url } = await response.json()
        await updateProfile({ avatar_url })
        toast.success('Photo de profil mise à jour')
      }
    } catch (error) {
      toast.error('Erreur upload photo')
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DashboardCard title="Informations Personnelles">
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 p-1 bg-violet-600 rounded-full cursor-pointer hover:bg-violet-700">
              <Camera className="h-4 w-4 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
          
          <div>
            <h3 className="font-medium">Photo de profil</h3>
            <p className="text-sm text-gray-600">
              JPG, PNG ou GIF. Max 5MB.
            </p>
          </div>
        </div>
        
        {/* Champs formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border rounded-lg bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de peau
            </label>
            <select
              value={formData.skin_type}
              onChange={(e) => setFormData(prev => ({ ...prev, skin_type: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Sélectionner</option>
              <option value="dry">Sèche</option>
              <option value="oily">Grasse</option>
              <option value="combination">Mixte</option>
              <option value="sensitive">Sensible</option>
              <option value="normal">Normale</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de naissance
            </label>
            <input
              type="number"
              value={formData.birth_year}
              onChange={(e) => setFormData(prev => ({ ...prev, birth_year: e.target.value }))}
              min="1920"
              max={new Date().getFullYear()}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
        
        {/* Préoccupations */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Préoccupations principales
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Acné', 'Rides', 'Déshydratation', 
              'Taches', 'Sensibilité', 'Pores dilatés'
            ].map(concern => (
              <label key={concern} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.concerns.includes(concern)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ 
                        ...prev, 
                        concerns: [...prev.concerns, concern] 
                      }))
                    } else {
                      setFormData(prev => ({ 
                        ...prev, 
                        concerns: prev.concerns.filter(c => c !== concern) 
                      }))
                    }
                  }}
                  className="rounded text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm">{concern}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Bouton sauvegarder */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </DashboardCard>
    </form>
  )
}
```

---

### **JOUR 12 : Notifications & RGPD**

**🔔 Prompt NotificationSettings :**
```typescript
// Créer src/components/dashboard/settings/NotificationSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Clock } from 'lucide-react'
import { toast } from 'sonner'

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    routine_reminders: true,
    analysis_reminders: true,
    badge_notifications: true,
    coach_suggestions: true,
    email_frequency: 'weekly',
    reminder_time: '09:00'
  })
  
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    fetchSettings()
  }, [])
  
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/notifications')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Erreur chargement paramètres:', error)
    }
  }
  
  const handleSave = async () => {
    setLoading(true)
    
    try {
      await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      toast.success('Préférences de notifications mises à jour')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <DashboardCard title="Notifications In-App">
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Rappels de routine</p>
                <p className="text-sm text-gray-600">
                  Notification pour votre routine quotidienne
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.routine_reminders}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                routine_reminders: e.target.checked 
              }))}
              className="toggle"
            />
          </label>
          
          {settings.routine_reminders && (
            <div className="ml-8 mt-2">
              <label className="text-sm text-gray-600">
                Heure du rappel
                <input
                  type="time"
                  value={settings.reminder_time}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    reminder_time: e.target.value 
                  }))}
                  className="ml-2 px-3 py-1 border rounded"
                />
              </label>
            </div>
          )}
          
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Nouvelles analyses</p>
                <p className="text-sm text-gray-600">
                  Rappel pour refaire une analyse
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.analysis_reminders}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                analysis_reminders: e.target.checked 
              }))}
              className="toggle"
            />
          </label>
        </div>
      </DashboardCard>
      
      <DashboardCard title="Notifications Email">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fréquence des emails récapitulatifs
            </label>
            <select
              value={settings.email_frequency}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                email_frequency: e.target.value 
              }))}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="never">Jamais</option>
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
            </select>
          </div>
        </div>
      </DashboardCard>
      
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les préférences'}
        </button>
      </div>
    </div>
  )
}
```

**🔐 Prompt PrivacySettings :**
```typescript
// Créer src/components/dashboard/settings/PrivacySettings.tsx
'use client'

import { useState } from 'react'
import { Shield, Download, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export function PrivacySettings() {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  
  const handleExportData = async () => {
    try {
      const response = await fetch('/api/settings/export-data', {
        method: 'POST'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dermai-data-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        
        toast.success('Données exportées avec succès')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    }
  }
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      toast.error('Veuillez taper SUPPRIMER pour confirmer')
      return
    }
    
    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Compte supprimé. Vous allez être déconnecté.')
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }
  
  return (
    <div className="space-y-6">
      <DashboardCard title="Confidentialité des Données">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium">Vos données sont sécurisées</h3>
              <p className="text-sm text-gray-600 mt-1">
                Toutes vos données sont chiffrées et stockées de manière sécurisée.
                Nous ne partageons jamais vos informations personnelles.
              </p>
            </div>
          </div>
        </div>
      </DashboardCard>
      
      <DashboardCard title="Gestion des Données">
        <div className="space-y-4">
          {/* Export données */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Exporter mes données</p>
                <p className="text-sm text-gray-600">
                  Téléchargez toutes vos données au format JSON
                </p>
              </div>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Exporter
            </button>
          </div>
          
          {/* Supprimer compte */}
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Supprimer mon compte</p>
                <p className="text-sm text-red-700">
                  Cette action est irréversible
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </DashboardCard>
      
      {/* Modal suppression */}
      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold">Supprimer votre compte</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Cette action supprimera définitivement :
            </p>
            
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6">
              <li>Toutes vos analyses</li>
              <li>Vos routines et étagères produits</li>
              <li>Votre historique et vos badges</li>
              <li>Toutes vos données personnelles</li>
            </ul>
            
            <p className="text-sm text-gray-600 mb-4">
              Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :
            </p>
            
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-6"
              placeholder="SUPPRIMER"
            />
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'SUPPRIMER'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
```

**✅ Prompt Vérification Sprint 2.4 :**
```bash
# Tests complets Sprint 2.4
# 1. Mise à jour profil fonctionnelle
# 2. Upload avatar avec compression
# 3. Préférences notifications sauvegardées
# 4. Export données format JSON
# 5. Suppression compte avec confirmation
# 6. Responsive tous écrans
```

---

## 🤖 **SPRINT 2.5 : COACH IA & BADGES**
### *Durée : 3-4 jours*

### **🎯 Objectifs Sprint 2.5**
- Implémenter coach IA avec contexte personnalisé
- Créer système de badges symboliques motivants
- Intégrer suggestions produits dans coach
- Optimiser coûts API avec cache intelligent

---

### **JOUR 13-14 : Coach IA**

#### **Jour 13 : Interface Chat**

**💬 Prompt AICoachModal :**
```typescript
// Créer src/components/dashboard/coach/AICoachModal.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function AICoachModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const { user } = useAuth()
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Message de bienvenue
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Bonjour ${user?.full_name || ''} ! Je suis votre coach IA personnel. Comment puis-je vous aider avec votre routine de soins aujourd'hui ?`,
        timestamp: new Date()
      }])
    }
  }, [isOpen])
  
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            hasRecentAnalysis: true,
            currentProducts: [],
            routineStreak: 7
          }
        })
      })
      
      const data = await response.json()
      
      const assistantMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        suggestions: data.suggestions,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erreur coach IA:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Désolé, je suis temporairement indisponible. Réessayez dans quelques instants.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      
      {/* Modal Chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-violet-500 to-blue-500 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Coach IA DermAI</h3>
                <p className="text-xs text-gray-600">Toujours là pour vous</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                } rounded-lg p-3`}>
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Suggestions produits */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs opacity-80">Produits suggérés :</p>
                      {message.suggestions.map((product, i) => (
                        <a
                          key={i}
                          href={product.affiliate_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 bg-white/10 rounded text-xs hover:bg-white/20"
                        >
                          {product.name} - {product.brand}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="p-4 border-t"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
```

#### **Jour 14 : Service Coach IA**

**🤖 Prompt AICoachService :**
```typescript
// Créer src/services/coach/aiCoachService.ts
import { openai } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

export class AICoachService {
  // Construire contexte utilisateur intelligent
  static async buildUserContext(userId: string) {
    // Récupérer données pertinentes
    const [profile, lastAnalysis, routineStats, recentProducts] = await Promise.all([
      this.getUserProfile(userId),
      this.getLastAnalysis(userId),
      this.getRoutineStats(userId),
      this.getRecentProducts(userId)
    ])
    
    // Construire contexte résumé
    return {
      skinProfile: {
        type: profile.skin_type,
        age: new Date().getFullYear() - profile.birth_year,
        concerns: profile.concerns
      },
      currentState: {
        lastAnalysisDate: lastAnalysis?.created_at,
        globalScore: lastAnalysis?.analysis_data.globalScore,
        mainIssues: lastAnalysis?.analysis_data.mainConcerns || []
      },
      routineAdherence: {
        currentStreak: routineStats.currentStreak,
        completionRate: routineStats.completionRate,
        missedDays: routineStats.recentMissedDays
      },
      productsUsed: recentProducts.map(p => ({
        name: p.name,
        category: p.category,
        usage: p.phase
      }))
    }
  }
  
  // Générer réponse coach
  static async generateResponse(userId: string, message: string) {
    const context = await this.buildUserContext(userId)
    
    const systemPrompt = `Tu es un coach IA spécialisé en soins de la peau pour DermAI. 
Tu es bienveillant, éducatif et personnalisé dans tes réponses.

CONTEXTE UTILISATEUR:
${JSON.stringify(context, null, 2)}

RÈGLES:
1. Réponses courtes et actionables (max 150 mots)
2. Toujours personnaliser selon le profil
3. Suggérer des produits du catalogue si pertinent
4. Être encourageant sur les progrès
5. Ne jamais donner de conseil médical

CAPACITÉS:
- Expliquer les routines et leur logique
- Suggérer des ajustements selon l'évolution
- Motiver pour la régularité
- Répondre aux questions sur les produits
- Donner des tips personnalisés`
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
      
      const responseContent = completion.choices[0].message.content
      
      // Extraire suggestions produits si mentionnées
      const suggestions = await this.extractProductSuggestions(responseContent)
      
      // Sauvegarder conversation
      await this.saveConversation(userId, message, responseContent)
      
      return {
        content: responseContent,
        suggestions,
        contextUsed: Object.keys(context)
      }
    } catch (error) {
      console.error('Erreur génération réponse coach:', error)
      
      // Fallback sur réponses pré-écrites si erreur
      return this.getFallbackResponse(message)
    }
  }
  
  // Extraire produits mentionnés
  static async extractProductSuggestions(content: string) {
    // Rechercher mentions de produits dans le texte
    const productMentions = content.match(/\b(sérum|crème|nettoyant|masque|lotion|huile)\b/gi) || []
    
    if (productMentions.length === 0) return []
    
    // Rechercher dans catalogue
    const suggestions = []
    for (const mention of productMentions) {
      const products = await supabase
        .from('products')
        .select('*')
        .ilike('category', `%${mention}%`)
        .limit(2)
      
      if (products.data) {
        suggestions.push(...products.data)
      }
    }
    
    return suggestions.slice(0, 3) // Max 3 suggestions
  }
  
  // Réponses fallback par catégorie
  static getFallbackResponse(message: string) {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('routine')) {
      return {
        content: "Pour une routine efficace, la régularité est clé ! Appliquez vos produits matin et soir dans l'ordre : nettoyant, sérum, crème. N'oubliez pas la protection solaire le matin.",
        suggestions: []
      }
    }
    
    if (lowerMessage.includes('produit')) {
      return {
        content: "Chaque produit a son rôle : le nettoyant purifie, le sérum traite en profondeur, la crème hydrate et protège. Choisissez selon vos besoins spécifiques.",
        suggestions: []
      }
    }
    
    return {
      content: "Je suis temporairement limité dans mes réponses. Pour des conseils personnalisés, consultez votre historique d'analyses ou vos étagères produits.",
      suggestions: []
    }
  }
}
```

---

### **JOUR 15 : Système de Badges**

**🏆 Prompt BadgeSystem :**
```typescript
// Créer src/components/dashboard/badges/BadgeSystem.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BadgeCard } from './BadgeCard'
import { BadgeNotification } from './BadgeNotification'
import { EmptyState } from '@/components/dashboard/common/EmptyState'
import { Award } from 'lucide-react'

const BADGE_CATEGORIES = {
  routine_streak: {
    title: 'Régularité Routine',
    description: 'Récompenses pour votre assiduité',
    color: 'from-orange-400 to-red-500'
  },
  analysis_count: {
    title: 'Analyses Complétées',
    description: 'Suivi régulier de votre peau',
    color: 'from-blue-400 to-indigo-500'
  },
  improvement: {
    title: 'Améliorations',
    description: 'Progrès visibles sur vos scores',
    color: 'from-green-400 to-emerald-500'
  },
  discovery: {
    title: 'Découvertes Produits',
    description: 'Explorer de nouveaux soins',
    color: 'from-purple-400 to-pink-500'
  }
}

export function BadgeSystem() {
  const [badges, setBadges] = useState({})
  const [newBadge, setNewBadge] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchUserBadges()
    checkNewBadges()
  }, [])
  
  const fetchUserBadges = async () => {
    try {
      const response = await fetch('/api/badges')
      const data = await response.json()
      
      // Grouper par catégorie
      const grouped = data.reduce((acc, badge) => {
        if (!acc[badge.badge_type]) {
          acc[badge.badge_type] = []
        }
        acc[badge.badge_type].push(badge)
        return acc
      }, {})
      
      setBadges(grouped)
    } catch (error) {
      console.error('Erreur chargement badges:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const checkNewBadges = async () => {
    try {
      const response = await fetch('/api/badges/check', {
        method: 'POST'
      })
      const newBadges = await response.json()
      
      if (newBadges.length > 0) {
        // Afficher notification pour chaque nouveau badge
        newBadges.forEach((badge, index) => {
          setTimeout(() => {
            setNewBadge(badge)
            setTimeout(() => setNewBadge(null), 5000)
          }, index * 1000)
        })
        
        // Recharger la liste
        fetchUserBadges()
      }
    } catch (error) {
      console.error('Erreur vérification badges:', error)
    }
  }
  
  const totalBadges = Object.values(badges).flat().length
  
  if (loading) {
    return <BadgeSystemSkeleton />
  }
  
  return (
    <div className="space-y-6">
      {/* Header avec total */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Vos Accomplissements</h2>
        <p className="text-gray-600">
          {totalBadges} badge{totalBadges > 1 ? 's' : ''} obtenu{totalBadges > 1 ? 's' : ''}
        </p>
      </div>
      
      {totalBadges === 0 ? (
        <EmptyState
          icon={Award}
          title="Aucun badge pour le moment"
          description="Continuez votre routine et vos analyses pour débloquer des badges !"
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(BADGE_CATEGORIES).map(([type, category]) => {
            const categoryBadges = badges[type] || []
            
            return (
              <div key={type} className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{category.title}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['bronze', 'silver', 'gold', 'platinum'].map(level => {
                    const badge = categoryBadges.find(b => b.badge_level === level)
                    
                    return (
                      <BadgeCard
                        key={level}
                        badge={badge}
                        type={type}
                        level={level}
                        gradientColor={category.color}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Notification nouveau badge */}
      <AnimatePresence>
        {newBadge && (
          <BadgeNotification
            badge={newBadge}
            onClose={() => setNewBadge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
```

**🏅 Prompt BadgeCard Component :**
```typescript
// Créer src/components/dashboard/badges/BadgeCard.tsx
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

const BADGE_CONFIGS = {
  routine_streak: {
    bronze: { icon: '🥉', days: 7, title: 'Première Semaine' },
    silver: { icon: '🥈', days: 30, title: 'Un Mois Régulier' },
    gold: { icon: '🥇', days: 90, title: 'Trois Mois Assidus' },
    platinum: { icon: '💎', days: 365, title: 'Une Année Parfaite' }
  },
  analysis_count: {
    bronze: { icon: '🔍', count: 3, title: 'Explorateur Curieux' },
    silver: { icon: '📊', count: 10, title: 'Analyste Régulier' },
    gold: { icon: '🎯', count: 25, title: 'Expert en Suivi' },
    platinum: { icon: '🏆', count: 50, title: 'Maître du Diagnostic' }
  },
  improvement: {
    bronze: { icon: '📈', percent: 10, title: 'Premiers Progrès' },
    silver: { icon: '⭐', percent: 25, title: 'Belle Évolution' },
    gold: { icon: '✨', percent: 50, title: 'Transformation Visible' },
    platinum: { icon: '🌟', percent: 75, title: 'Métamorphose Complète' }
  },
  discovery: {
    bronze: { icon: '🧴', products: 5, title: 'Curieux des Produits' },
    silver: { icon: '🛍️', products: 15, title: 'Collectionneur Averti' },
    gold: { icon: '💄', products: 30, title: 'Expert Produits' },
    platinum: { icon: '👑', products: 50, title: 'Connaisseur Ultime' }
  }
}

export function BadgeCard({ badge, type, level, gradientColor }) {
  const config = BADGE_CONFIGS[type][level]
  const isUnlocked = !!badge
  
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative ${isUnlocked ? 'cursor-pointer' : ''}`}
    >
      <div className={`
        relative p-6 rounded-xl text-center transition-all
        ${isUnlocked 
          ? 'bg-gradient-to-br ' + gradientColor + ' text-white shadow-lg hover:shadow-xl' 
          : 'bg-gray-100 text-gray-400'
        }
      `}>
        {/* Icône badge */}
        <div className="text-5xl mb-3">
          {isUnlocked ? config.icon : <Lock className="h-12 w-12 mx-auto opacity-50" />}
        </div>
        
        {/* Titre */}
        <h4 className={`font-semibold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
          {config.title}
        </h4>
        
        {/* Critère */}
        <p className={`text-sm mt-1 ${isUnlocked ? 'text-white/80' : 'text-gray-400'}`}>
          {type === 'routine_streak' && `${config.days} jours`}
          {type === 'analysis_count' && `${config.count} analyses`}
          {type === 'improvement' && `+${config.percent}%`}
          {type === 'discovery' && `${config.products} produits`}
        </p>
        
        {/* Date obtention */}
        {isUnlocked && badge.earned_at && (
          <p className="text-xs text-white/60 mt-2">
            Obtenu le {new Date(badge.earned_at).toLocaleDateString('fr-FR')}
          </p>
        )}
        
        {/* Badge "nouveau" */}
        {isUnlocked && badge.is_new && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Nouveau !
          </div>
        )}
      </div>
    </motion.div>
  )
}
```

**✅ Prompt Vérification Sprint 2.5 :**
```bash
# Tests complets Sprint 2.5
# 1. Coach IA répond avec contexte
# 2. Suggestions produits pertinentes
# 3. Interface chat fluide
# 4. Badges débloqués automatiquement
# 5. Notifications badges animées
# 6. Performance API optimisée
```

---

## 🎯 **MÉTRIQUES DE VALIDATION FINALE**

### **Checklist Fonctionnelle Phase 2**
- [ ] **Dashboard responsive** mobile/desktop
- [ ] **Widgets temps réel** avec données actuelles
- [ ] **Historique analyses** avec filtres et pagination
- [ ] **Comparaison photos** slider interactif
- [ ] **Calendrier routine** avec streaks visuels
- [ ] **Étagères produits** drag & drop fonctionnel
- [ ] **Paramètres complets** profil + notifications + RGPD
- [ ] **Coach IA contextuel** réponses personnalisées
- [ ] **Badges motivants** attribution automatique

### **KPIs de Succès**
```typescript
const phase2Success = {
  // Engagement
  sessionDuration: '>5min',
  widgetsUsed: '2+',
  dashboardVisits: 'quotidien',
  
  // Routine
  adoptionRate: '>60%',
  streak7Days: '>30%',
  completionRate: '>45%',
  
  // Retention
  d7Retention: '>50%',
  d30Retention: '>30%',
  
  // Features
  comparisonUsage: '>40%',
  coachAdoption: '>25%',
  badgesEarned: '3+ par user'
}
```

---

## 📚 **DOCUMENTATION & RESSOURCES**

### **APIs & Libraries**
- **React Calendar** : https://github.com/wojtekmaj/react-calendar
- **React Beautiful DnD** : https://github.com/atlassian/react-beautiful-dnd
- **Recharts** : https://recharts.org/
- **React Joyride** : https://react-joyride.com/
- **Framer Motion** : https://www.framer.com/motion/

### **Fichiers de Support**
- `docs/api-documentation-phase2.md` - Documentation API complète
- `docs/ui-components-phase2.md` - Guide composants dashboard
- `docs/testing-strategy-phase2.md` - Stratégie de tests

---

**🔄 Statut :** Planning Phase 2 PRÊT À EXÉCUTER ✅  
**📅 Durée totale :** 3-4 semaines (15-20 jours ouvrés)  
**🎯 Objectif :** Dashboard engageant pour rétention quotidienne  
**🚀 Prochaine étape :** Démarrer Sprint 2.1 - Architecture Dashboard

