# 📸 PHASE 3 : RÉCAP UTILISATEUR

> **Objectif :** Ajouter section "Vos entrées" en fin de page résultats pour transparence

**Durée totale :** 0.5 jour (4h)  
**Priorité :** P1 (Moyenne)  
**Risque :** 🟢 Faible (affichage données existantes)

---

## 📋 **VUE D'ENSEMBLE**

### **Problème Identifié**

❌ **Manque de transparence**
- Utilisateur ne voit pas ses entrées après analyse
- Photos uploadées invisibles sur page résultats
- Questionnaire rempli non rappelé
- Paramètres (budget, UV, style) cachés

### **Résultat Attendu**

✅ Section "Vos entrées" en fin de page  
✅ Mini-galerie photos cliquables  
✅ Profil + questionnaire résumé  
✅ UV Band / Budget / Style affichés  
✅ Ancre #recap pour navigation

---

## 🎯 **SPRINT RECAP-3A : Créer Section Récap** (3h)

### **Objectif**
Créer composant affichant toutes les entrées utilisateur

### **Tâches**

#### **3A.1 Créer composant UserInputRecap**

**Créer :** `src/components/results/UserInputRecap.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Camera, 
  User, 
  MapPin, 
  DollarSign, 
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

interface UserInputRecapProps {
  photos: Array<{
    id: string
    preview: string
    type: string
  }>
  userProfile: {
    age: number
    gender: string
    skinType: string
    pregnancy?: boolean
  }
  skinConcerns: {
    primary: string[]
  }
  location?: {
    city?: string
    uvRiskBand?: string
  }
  constraints: {
    budgetTier?: string
    routineStyle?: string
  }
  className?: string
}

export function UserInputRecap({
  photos = [],
  userProfile,
  skinConcerns,
  location,
  constraints,
  className = ''
}: UserInputRecapProps) {
  
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  
  return (
    <section 
      id="recap" 
      className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 md:p-8 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Camera className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Vos entrées
          </h2>
          <p className="text-sm text-gray-600">
            Données utilisées pour votre analyse personnalisée
          </p>
        </div>
      </div>
      
      {/* Grid 2 colonnes desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Photos */}
        <RecapCard
          icon={<Camera className="w-5 h-5" />}
          title="Photos analysées"
          subtitle={`${photos.length} photo${photos.length > 1 ? 's' : ''}`}
        >
          <div className="grid grid-cols-3 gap-2 mt-3">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo.preview)}
                className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <img 
                  src={photo.preview} 
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </RecapCard>
        
        {/* Profil */}
        <RecapCard
          icon={<User className="w-5 h-5" />}
          title="Profil"
          subtitle="Informations personnelles"
        >
          <div className="mt-3 space-y-2">
            <RecapItem label="Âge" value={`${userProfile.age} ans`} />
            <RecapItem label="Genre" value={userProfile.gender} />
            <RecapItem label="Type de peau" value={userProfile.skinType} />
            {userProfile.pregnancy && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-2 mt-2">
                <AlertCircle className="w-4 h-4" />
                <span>Grossesse/Allaitement pris en compte</span>
              </div>
            )}
          </div>
        </RecapCard>
        
        {/* Préoccupations */}
        <RecapCard
          icon={<AlertCircle className="w-5 h-5" />}
          title="Préoccupations"
          subtitle={`${skinConcerns.primary.length} problème${skinConcerns.primary.length > 1 ? 's' : ''} identifié${skinConcerns.primary.length > 1 ? 's' : ''}`}
        >
          <div className="mt-3 flex flex-wrap gap-2">
            {skinConcerns.primary.map((concern, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full"
              >
                {concern}
              </span>
            ))}
          </div>
        </RecapCard>
        
        {/* Contexte */}
        <RecapCard
          icon={<MapPin className="w-5 h-5" />}
          title="Contexte & Préférences"
          subtitle="Paramètres de personnalisation"
        >
          <div className="mt-3 space-y-2">
            {location?.city && (
              <RecapItem 
                label="Localisation" 
                value={location.city} 
              />
            )}
            {location?.uvRiskBand && (
              <RecapItem 
                label="UV Risk" 
                value={location.uvRiskBand}
                badge={getUVBadgeColor(location.uvRiskBand)}
              />
            )}
            {constraints.budgetTier && (
              <RecapItem 
                label="Budget" 
                value={constraints.budgetTier}
                icon={<DollarSign className="w-4 h-4" />}
              />
            )}
            {constraints.routineStyle && (
              <RecapItem 
                label="Style routine" 
                value={constraints.routineStyle}
                icon={<Clock className="w-4 h-4" />}
              />
            )}
          </div>
        </RecapCard>
        
      </div>
      
      {/* CTA vérification */}
      <div className="mt-6 flex items-center justify-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:shadow"
        >
          <span className="font-medium">Vérifier mes entrées</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      
      {/* Modal photo */}
      {selectedPhoto && (
        <PhotoModal
          photoUrl={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </section>
  )
}

// Sous-composants

function RecapCard({ 
  icon, 
  title, 
  subtitle, 
  children 
}: { 
  icon: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-blue-600">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  )
}

function RecapItem({ 
  label, 
  value, 
  badge,
  icon 
}: { 
  label: string
  value: string
  badge?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={`font-medium ${badge || 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

function PhotoModal({ 
  photoUrl, 
  onClose 
}: { 
  photoUrl: string
  onClose: () => void 
}) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <motion.img
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        src={photoUrl}
        alt="Photo agrandie"
        className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
      />
    </div>
  )
}

// Helpers

function getUVBadgeColor(uvBand: string): string {
  const colors: Record<string, string> = {
    'VeryHigh': 'text-red-600',
    'High': 'text-orange-600',
    'Moderate': 'text-yellow-600',
    'Low': 'text-green-600'
  }
  return colors[uvBand] || 'text-gray-600'
}
```

#### **3A.2 Intégrer dans page résultats**

**Modifier :** `src/app/results/page.tsx`

```typescript
import { UserInputRecap } from '@/components/results/UserInputRecap'

// Dans le rendu de la page (après la section routine)
export default function ResultsPage() {
  // ... code existant ...
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* ... */}
      
      {/* Diagnostic */}
      {/* ... */}
      
      {/* Routine */}
      {/* ... */}
      
      {/* Produits */}
      {/* ... */}
      
      {/* ✨ NOUVEAU : Récap utilisateur */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <UserInputRecap
          photos={analysis.photos || []}
          userProfile={analysis.userProfile}
          skinConcerns={analysis.skinConcerns}
          location={{
            city: analysis.location?.city,
            uvRiskBand: analysis.uvRiskBand
          }}
          constraints={{
            budgetTier: analysis.constraints?.budgetTier,
            routineStyle: analysis.constraints?.routineStyle
          }}
        />
      </div>
      
      {/* Footer */}
      {/* ... */}
    </div>
  )
}
```

#### **3A.3 Ajouter navigation vers recap**

**Ajouter bouton dans header résultats :**

```typescript
// Dans le header de la page résultats
<div className="flex items-center gap-4">
  <button
    onClick={() => {
      document.getElementById('recap')?.scrollIntoView({ 
        behavior: 'smooth' 
      })
    }}
    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
  >
    <Camera className="w-4 h-4" />
    Voir mes entrées
  </button>
  
  {/* Autres boutons */}
</div>
```

**Ou ajouter dans menu sticky :**

```typescript
const menuItems = [
  { id: 'diagnostic', label: 'Diagnostic', icon: Activity },
  { id: 'routine', label: 'Routine', icon: List },
  { id: 'products', label: 'Produits', icon: ShoppingBag },
  { id: 'recap', label: 'Vos entrées', icon: Camera } // ✨ NOUVEAU
]
```

### **DoD Sprint RECAP-3A**

- [ ] UserInputRecap créé et stylé
- [ ] Photos mini-galerie cliquables
- [ ] Modal photo agrandie fonctionne
- [ ] Profil + préoccupations affichés
- [ ] UV/Budget/Style visibles
- [ ] Intégré page résultats
- [ ] Ancre #recap fonctionne
- [ ] Bouton navigation ajouté
- [ ] Commit : "feat: add user input recap section at bottom of results page"

---

## 🎯 **SPRINT RECAP-3B : Polish & Tests** (1h)

### **Objectif**
Finaliser récap et tester

### **Tâches**

#### **3B.1 Améliorer responsive**

```typescript
// Mobile : stack vertical
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* Cards */}
</div>

// Photos : 2 colonnes mobile, 3 desktop
<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
  {/* Photos */}
</div>
```

#### **3B.2 Ajouter états vides**

```typescript
// Si pas de photos
{photos.length === 0 ? (
  <p className="text-sm text-gray-400 italic">
    Aucune photo uploadée
  </p>
) : (
  <PhotoGallery photos={photos} />
)}

// Si pas de localisation
{!location?.city && (
  <RecapItem 
    label="Localisation" 
    value="Non renseignée" 
    badge="text-gray-400"
  />
)}
```

#### **3B.3 Tester parcours complet**

**Test E2E :**
1. Upload photos
2. Remplir questionnaire complet
3. Lancer analyse
4. Scroller en bas page résultats
5. **Vérifier section récap :**
   - [ ] Visible avec ancre #recap
   - [ ] Photos affichées (miniatures)
   - [ ] Clic photo → modal agrandie
   - [ ] Profil complet visible
   - [ ] Préoccupations affichées
   - [ ] UV/Budget/Style présents
6. Clic "Vérifier mes entrées" → scroll top
7. Clic menu "Vos entrées" → scroll #recap

### **DoD Sprint RECAP-3B**

- [ ] Responsive mobile validé
- [ ] États vides gérés
- [ ] Test E2E complet OK
- [ ] Navigation fluide
- [ ] Commit : "test: validate user input recap with E2E tests"

---

## 🚨 **SPRINTS DE DEBUG**

### **DEBUG-1 : Photos Ne S'Affichent Pas**

**Symptôme :** Mini-galerie vide

**Diagnostic :**
```typescript
console.log('Photos data:', analysis.photos)
console.log('Photos length:', analysis.photos?.length)
```

**Solutions :**
1. Vérifier que photos sont dans `analysis`
2. Vérifier format : `{ id, preview, type }`
3. Fallback si preview manquant :
```typescript
<img 
  src={photo.preview || photo.url || '/placeholder.jpg'} 
  alt="Photo"
/>
```

### **DEBUG-2 : Modal Photo Ne S'Ouvre Pas**

**Symptôme :** Clic miniature sans effet

**Diagnostic :**
```typescript
console.log('Selected photo:', selectedPhoto)
console.log('Photo URL:', photo.preview)
```

**Solutions :**
1. Vérifier `useState` déclaré
2. Vérifier `onClick` bien lié
3. Vérifier z-index modal (>50)

### **DEBUG-3 : Ancre #recap Pas Trouvée**

**Symptôme :** Navigation #recap ne fonctionne pas

**Diagnostic :**
```typescript
console.log('Element #recap:', document.getElementById('recap'))
```

**Solutions :**
1. Vérifier `id="recap"` sur section
2. Vérifier scroll behavior :
```typescript
document.getElementById('recap')?.scrollIntoView({ 
  behavior: 'smooth',
  block: 'start'
})
```

---

## ✅ **CHECKLIST FINALE PHASE 3**

Avant de passer à Phase 4 (Tests & Validation) :

### **Composant**
- [ ] UserInputRecap créé
- [ ] RecapCard, RecapItem sous-composants
- [ ] PhotoModal pour agrandissement
- [ ] Helpers UV badge colors

### **Intégration**
- [ ] Intégré page résultats (fin)
- [ ] Ancre #recap fonctionnelle
- [ ] Navigation menu vers #recap
- [ ] CTA "Vérifier entrées" scroll top

### **Contenu**
- [ ] Photos miniatures cliquables
- [ ] Profil affiché (âge, genre, type peau)
- [ ] Préoccupations badges
- [ ] UV/Budget/Style visibles
- [ ] Grossesse badge si applicable

### **UX**
- [ ] Responsive mobile/desktop
- [ ] Modal photo fluide
- [ ] États vides gérés
- [ ] Navigation smooth

### **Tests**
- [ ] Test E2E complet validé
- [ ] Photos s'affichent
- [ ] Modal fonctionne
- [ ] Ancre #recap OK

### **Commits Recommandés**
```bash
git commit -m "feat: add user input recap section at bottom of results page"
git commit -m "test: validate user input recap with E2E tests"
```

---

## 🎯 **RÉSULTAT ATTENDU**

À la fin de cette phase :

✅ **Section récap visible :** En fin de page résultats  
✅ **Photos accessibles :** Mini-galerie + modal  
✅ **Profil complet :** Âge, genre, type peau, grossesse  
✅ **Contexte affiché :** UV, budget, style routine  
✅ **Navigation fluide :** Ancre #recap + menu

---

**📍 PROCHAINE ÉTAPE :** `05-TESTS-VALIDATION.md`

**⏱️ DURÉE TOTALE PHASE 3 :** ~4h (0.5 jour)  
**🎯 VALIDATION :** Test E2E + ancre #recap fonctionnelle

