# 🎨 PHASE 2 : AMÉLIORATION UI/UX PAGE RÉSULTATS

> **Objectif :** Afficher badges pertinents, score matching et alternatives de manière claire

**Durée totale :** 1.5 jours (12h)  
**Priorité :** P1 (Haute)  
**Risque :** 🟢 Faible (modifications UI uniquement)

---

## 📋 **VUE D'ENSEMBLE**

### **Problèmes Identifiés**

❌ **Badges surchargés**
- Tous les badges affichés (timing, SPF, contours, alternance)
- Surcharge visuelle inutile
- SPF et contours devraient être dans restrictions

❌ **Pas de score de matching visible**
- Step 3 génère maintenant `matchingScore` (0-100)
- Mais aucun badge % sur les produits
- Utilisateur ne voit pas la pertinence

❌ **Alternatives non visibles**
- Step 3 génère 3-5 alternatives par produit
- Mais aucun bouton "Voir alternatives" dans routine
- Alternatives seulement dans section produits (loin)

❌ **Pas d'indicateur alternance**
- 2 traitements soir → doivent alterner
- `ui.needsAlternation` existe mais pas d'UI
- Pas de `suggestedNights[]` affiché

### **Résultat Attendu**

✅ Badges sélectifs : timing + alternance uniquement  
✅ Score matching visible sur tous produits (badge %)  
✅ Bouton "Voir alternatives" dans routine  
✅ Modal alternatives avec scores comparés  
✅ Indicateur alternance avec jours suggérés

---

## 🎯 **SPRINT UI-2A : Badges Sélectifs + Score Matching** (4h)

### **Objectif**
Réduire badges à l'essentiel + ajouter score matching

### **Tâches**

#### **2A.1 Créer composant BadgeScoreMatching**

**Créer :** `src/components/results/BadgeScoreMatching.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'

interface BadgeScoreMatchingProps {
  score: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BadgeScoreMatching({ 
  score, 
  size = 'md',
  className = '' 
}: BadgeScoreMatchingProps) {
  
  // Couleur selon score
  const getColorClasses = (score: number) => {
    if (score >= 85) return 'from-green-500 to-emerald-600'
    if (score >= 70) return 'from-blue-500 to-cyan-600'
    if (score >= 50) return 'from-amber-500 to-orange-600'
    return 'from-gray-500 to-gray-600'
  }
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        inline-flex items-center gap-1.5
        bg-gradient-to-r ${getColorClasses(score)}
        text-white font-semibold rounded-full
        shadow-lg
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <svg 
        className="w-3 h-3" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span>{score}% compatible</span>
    </motion.div>
  )
}

// Variante compacte pour petits espaces
export function BadgeScoreCompact({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 85) return 'bg-green-500'
    if (score >= 70) return 'bg-blue-500'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-gray-500'
  }
  
  return (
    <span className={`
      inline-flex items-center justify-center
      ${getColor(score)} text-white
      text-xs font-bold
      w-10 h-10 rounded-full
      shadow-md
    `}>
      {score}
    </span>
  )
}
```

#### **2A.2 Modifier affichage badges routine**

**Modifier :** `src/components/routine/RoutineV3Final.tsx` (ou composant actif)

**Identifier la section badges (chercher "badge" ou "timing") :**

```typescript
// ANCIEN CODE (affiche tous les badges)
const badges = []
if (step.timing === 'soir') badges.push('Soir uniquement')
if (step.ui?.isPhotosensitizing) badges.push('SPF indispensable') // ❌ À RETIRER
if (step.ui?.avoidEyeArea) badges.push('Éviter contour') // ❌ À RETIRER
if (step.ui?.needsAlternation) badges.push('Alterner')

// NOUVEAU CODE (sélectif)
const badges = []

// ✅ Badge timing (si pertinent)
if (step.timing === 'soir' && step.category === 'traitement') {
  badges.push({ 
    text: 'Soir uniquement', 
    color: 'from-purple-500 to-indigo-600' 
  })
}

// ✅ Badge alternance (si 2 traitements)
if (step.ui?.needsAlternation) {
  badges.push({ 
    text: 'Alterner', 
    color: 'from-amber-500 to-orange-600',
    icon: '🔄'
  })
}

// ❌ SPF et contours → DÉPLACÉS dans restrictions[]
// Ces infos sont déjà dans step.restrictions
```

**Ajouter score matching :**

```typescript
import { BadgeScoreMatching } from '@/components/results/BadgeScoreMatching'

// Dans le rendu du produit
{product?.matchingScore && (
  <div className="mt-2">
    <BadgeScoreMatching 
      score={product.matchingScore} 
      size="md"
    />
  </div>
)}

// OU version compacte en coin
<div className="absolute top-3 right-3">
  {product?.matchingScore && (
    <BadgeScoreCompact score={product.matchingScore} />
  )}
</div>
```

#### **2A.3 Vérifier restrictions incluent SPF/contours**

**S'assurer que le prompt Step 2 génère bien :**

```typescript
// Vérifier dans routinePersonnaliseeV3.ts
// Ligne ~119-121
restrictions[] inclut au minimum :
  - "Ne pas cumuler avec un autre traitement le même soir."
  - "Éviter le contour des yeux et des lèvres."
  - "SPF strict le lendemain." si ui.isPhotosensitizing=true
```

**Si manquant, ajouter dans le prompt Step 2 :**

```typescript
restrictions[] doit obligatoirement inclure (si applicable) :
- "Éviter le contour des yeux et lèvres" si avoidEyeArea=true
- "Appliquer SPF50+ le lendemain matin" si isPhotosensitizing=true
- "Ne pas cumuler avec autre traitement le même soir" si needsAlternation=true
```

### **DoD Sprint UI-2A**

- [ ] BadgeScoreMatching créé et testé
- [ ] Badges réduits à timing + alternance
- [ ] SPF/contours retirés des badges
- [ ] Score matching affiché sur tous produits
- [ ] Restrictions vérifiées (incluent SPF/contours)
- [ ] Test visuel : pas de surcharge, score visible
- [ ] Commit : "feat: add matching score badge and reduce UI badges to essentials"

---

## 🎯 **SPRINT UI-2B : Indicateur Alternance** (3h)

### **Objectif**
Créer composant visuel pour alternance 2 traitements

### **Tâches**

#### **2B.1 Créer composant AlternanceIndicator**

**Créer :** `src/components/routine/AlternanceIndicator.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import { Calendar, AlertCircle } from 'lucide-react'

interface AlternanceIndicatorProps {
  suggestedNights?: string[] // ["Lun", "Mar", "Mer"]
  pairWithStepId?: number
  pairWithTitle?: string
  className?: string
}

export function AlternanceIndicator({ 
  suggestedNights = [],
  pairWithStepId,
  pairWithTitle,
  className = '' 
}: AlternanceIndicatorProps) {
  
  const allDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-amber-50 border-2 border-amber-200 rounded-xl p-4
        ${className}
      `}
    >
      {/* Titre avec icône */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
          <span className="text-lg">🔄</span>
        </div>
        <h4 className="font-semibold text-amber-900">
          Alternance requise
        </h4>
      </div>
      
      {/* Message principal */}
      <div className="flex items-start gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          {pairWithTitle ? (
            <>Alterner avec <strong>"{pairWithTitle}"</strong> : ne pas cumuler le même soir.</>
          ) : (
            <>Ne pas cumuler avec un autre traitement le même soir.</>
          )}
        </p>
      </div>
      
      {/* Planning suggéré */}
      {suggestedNights.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-medium text-amber-700 uppercase">
              Jours suggérés
            </span>
          </div>
          
          <div className="flex gap-1.5">
            {allDays.map((day) => {
              const isActive = suggestedNights.includes(day)
              
              return (
                <div
                  key={day}
                  className={`
                    flex-1 text-center py-2 rounded-lg text-xs font-medium
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'bg-amber-100 text-amber-400'
                    }
                  `}
                >
                  {day}
                </div>
              )
            })}
          </div>
          
          <p className="text-xs text-amber-700 mt-2">
            💡 Commencer 2 soirs/semaine, augmenter à 3 après 2 semaines si bien toléré
          </p>
        </div>
      )}
    </motion.div>
  )
}
```

#### **2B.2 Intégrer AlternanceIndicator dans routine**

**Modifier le composant routine (RoutineV3Final ou équivalent) :**

```typescript
import { AlternanceIndicator } from './AlternanceIndicator'

// Dans le rendu d'un step
{step.ui?.needsAlternation && (
  <div className="mt-4">
    <AlternanceIndicator
      suggestedNights={step.ui.suggestedNights || []}
      pairWithStepId={step.ui.pairWithStepId}
      pairWithTitle={
        // Trouver le titre du step pairé
        routine.phases
          .flatMap(p => Object.values(p.slots).flat())
          .find(s => s.id === step.ui?.pairWithStepId)?.title
      }
    />
  </div>
)}
```

#### **2B.3 Tester avec cas alternance**

**Créer routine de test avec 2 traitements :**

```typescript
// scripts/test-alternance.ts

const testRoutineAlternance = {
  phases: [{
    id: 'adaptation',
    slots: {
      evening: [
        {
          id: 'treatment-1',
          title: 'Traitement Acide Glycolique',
          category: 'traitement',
          ui: {
            needsAlternation: true,
            pairWithStepId: 'treatment-2',
            suggestedNights: ['Lun', 'Mer', 'Ven'],
            isPhotosensitizing: true
          }
        },
        {
          id: 'treatment-2',
          title: 'Traitement Rétinol',
          category: 'traitement',
          ui: {
            needsAlternation: true,
            pairWithStepId: 'treatment-1',
            suggestedNights: ['Mar', 'Jeu', 'Sam'],
            isPhotosensitizing: true
          }
        }
      ]
    }
  }]
}

// Vérifier :
// - AlternanceIndicator affiché sur les 2 traitements
// - Jours suggérés différents et visibles
// - Message "Alterner avec..." correct
```

### **DoD Sprint UI-2B**

- [ ] AlternanceIndicator créé et stylé
- [ ] Planning jours suggérés affiché
- [ ] Message alternance clair
- [ ] Intégré dans routine
- [ ] Test cas 2 traitements validé
- [ ] Responsive mobile OK
- [ ] Commit : "feat: add alternance indicator with suggested nights calendar"

---

## 🎯 **SPRINT UI-2C : Alternatives Visibles** (4h)

### **Objectif**
Afficher bouton "Voir alternatives" + modal comparaison

### **Tâches**

#### **2C.1 Créer composant ModalAlternatives**

**Créer :** `src/components/results/ModalAlternatives.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { BadgeScoreMatching } from './BadgeScoreMatching'

interface Alternative {
  catalogId: string
  name: string
  brand?: string
  price: number
  imageUrl?: string
  matchingScore: number
}

interface ModalAlternativesProps {
  isOpen: boolean
  onClose: () => void
  primaryProduct: {
    name: string
    brand: string
    price: number
    imageUrl?: string
    matchingScore: number
  }
  alternatives: Alternative[]
}

export function ModalAlternatives({ 
  isOpen, 
  onClose, 
  primaryProduct,
  alternatives 
}: ModalAlternativesProps) {
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              Alternatives disponibles
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
            {/* Produit principal (référence) */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-3">
                Produit sélectionné :
              </p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <ProductComparisonCard 
                  product={primaryProduct}
                  isPrimary={true}
                />
              </div>
            </div>
            
            {/* Liste alternatives */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500 mb-3">
                {alternatives.length} alternatives recommandées :
              </p>
              
              {alternatives
                .sort((a, b) => b.matchingScore - a.matchingScore)
                .map((alt, index) => (
                  <motion.div
                    key={alt.catalogId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductComparisonCard 
                      product={alt}
                      primaryPrice={primaryProduct.price}
                      primaryScore={primaryProduct.matchingScore}
                    />
                  </motion.div>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// Sous-composant carte produit
function ProductComparisonCard({ 
  product, 
  isPrimary = false,
  primaryPrice,
  primaryScore
}: any) {
  
  const priceDiff = primaryPrice ? product.price - primaryPrice : 0
  const scoreDiff = primaryScore ? product.matchingScore - primaryScore : 0
  
  return (
    <div className={`
      bg-white border rounded-xl p-4 transition-all
      ${isPrimary ? 'border-blue-300' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}
    `}>
      <div className="flex items-start gap-4">
        {/* Image */}
        {product.imageUrl && (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
        )}
        
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">
                {product.name}
              </h4>
              {product.brand && (
                <p className="text-sm text-gray-500">{product.brand}</p>
              )}
            </div>
            
            <BadgeScoreMatching score={product.matchingScore} size="sm" />
          </div>
          
          {/* Prix */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-900">
              {product.price}€
            </span>
            
            {/* Comparaison prix */}
            {!isPrimary && priceDiff !== 0 && (
              <div className={`
                flex items-center gap-1 text-sm font-medium
                ${priceDiff < 0 ? 'text-green-600' : 'text-amber-600'}
              `}>
                {priceDiff < 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    <span>-{Math.abs(priceDiff).toFixed(2)}€</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>+{priceDiff.toFixed(2)}€</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Comparaison score */}
          {!isPrimary && scoreDiff !== 0 && (
            <p className={`
              text-xs mt-1
              ${scoreDiff >= 0 ? 'text-green-600' : 'text-amber-600'}
            `}>
              {scoreDiff >= 0 ? '+' : ''}{scoreDiff} pts de compatibilité
            </p>
          )}
          
          {/* CTA */}
          {!isPrimary && (
            <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Choisir cette alternative
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

#### **2C.2 Ajouter bouton "Voir alternatives" dans routine**

**Modifier composant routine :**

```typescript
import { useState } from 'react'
import { ModalAlternatives } from '@/components/results/ModalAlternatives'

// État pour modal
const [modalOpen, setModalOpen] = useState(false)
const [selectedProduct, setSelectedProduct] = useState<any>(null)

// Dans le rendu du produit
{product?.alternatives && product.alternatives.length > 0 && (
  <button
    onClick={() => {
      setSelectedProduct(product)
      setModalOpen(true)
    }}
    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
  >
    <span>Voir {product.alternatives.length} alternatives</span>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
)}

{/* Modal alternatives */}
{selectedProduct && (
  <ModalAlternatives
    isOpen={modalOpen}
    onClose={() => setModalOpen(false)}
    primaryProduct={{
      name: product.productName || product.name,
      brand: product.brand,
      price: product.price,
      imageUrl: product.imageUrl,
      matchingScore: product.matchingScore
    }}
    alternatives={product.alternatives}
  />
)}
```

#### **2C.3 Tester modal alternatives**

**Test visuel :**
1. Routine avec produits ayant alternatives
2. Clic "Voir X alternatives"
3. Modal s'ouvre avec :
   - Produit principal en haut (fond bleu)
   - 3-5 alternatives en dessous
   - Scores visibles
   - Prix comparés (±€)
4. Clic overlay → modal se ferme
5. Responsive mobile OK

### **DoD Sprint UI-2C**

- [ ] ModalAlternatives créé et stylé
- [ ] ProductComparisonCard avec comparaison prix/score
- [ ] Bouton "Voir alternatives" intégré routine
- [ ] Modal ouvre/ferme correctement
- [ ] Alternatives triées par score DESC
- [ ] Responsive mobile validé
- [ ] Commit : "feat: add alternatives modal with product comparison"

---

## 🎯 **SPRINT UI-2D : Polish & Responsive** (1h)

### **Objectif**
Finaliser responsive et micro-interactions

### **Tâches**

#### **2D.1 Optimiser mobile**

**Vérifier sur mobile (< 768px) :**

```typescript
// BadgeScoreMatching : réduire taille
<BadgeScoreMatching 
  score={score} 
  size={isMobile ? 'sm' : 'md'} 
/>

// AlternanceIndicator : stack vertical
<div className="lg:flex lg:items-center gap-4">
  <div className="flex-1 mb-3 lg:mb-0">
    {/* Message */}
  </div>
  <div className="lg:w-auto">
    {/* Planning jours */}
  </div>
</div>

// ModalAlternatives : full screen mobile
<motion.div
  className={`
    relative bg-white rounded-2xl shadow-2xl
    w-full max-h-[90vh] overflow-hidden
    ${isMobile ? 'h-full rounded-none' : 'max-w-4xl'}
  `}
>
```

#### **2D.2 Ajouter micro-interactions**

```typescript
// Hover sur badge score
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  <BadgeScoreMatching score={score} />
</motion.div>

// Animation entrée alternatives
{alternatives.map((alt, i) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.1 }}
  >
    {/* Alternative card */}
  </motion.div>
))}
```

#### **2D.3 Tests finaux**

**Checklist :**
- [ ] Desktop (1920px) : layout parfait
- [ ] Tablet (768px) : responsive OK
- [ ] Mobile (375px) : tout accessible
- [ ] Badges non surchargés
- [ ] Score visible partout
- [ ] Modal alternatives fluide
- [ ] Animations smooth

### **DoD Sprint UI-2D**

- [ ] Responsive mobile/tablet/desktop
- [ ] Micro-interactions ajoutées
- [ ] Tests visuels validés sur 3 tailles
- [ ] Commit : "style: optimize responsive and add micro-interactions"

---

## 🚨 **SPRINTS DE DEBUG**

### **DEBUG-1 : Badge Score Non Affiché**

**Symptôme :** Score matching absent sur produits

**Diagnostic :**
```typescript
// Vérifier dans console
console.log('Product data:', product)
console.log('matchingScore:', product?.matchingScore)
```

**Solutions :**
1. Vérifier Step 3 génère bien `matchingScore`
2. Vérifier enrichissement mappe le score
3. Fallback si score absent :
```typescript
{product?.matchingScore ? (
  <BadgeScoreMatching score={product.matchingScore} />
) : (
  <span className="text-xs text-gray-400">Score non disponible</span>
)}
```

### **DEBUG-2 : Modal Ne S'Ouvre Pas**

**Symptôme :** Clic bouton alternatives ne fait rien

**Diagnostic :**
```typescript
console.log('Alternatives:', product?.alternatives)
console.log('Modal state:', modalOpen)
```

**Solutions :**
1. Vérifier `alternatives` existe et non vide
2. Vérifier `useState` bien déclaré
3. Vérifier `z-index` du modal (doit être >50)

### **DEBUG-3 : AlternanceIndicator Pas Affiché**

**Symptôme :** Indicateur alternance invisible

**Diagnostic :**
```typescript
console.log('UI flags:', step.ui)
console.log('needsAlternation:', step.ui?.needsAlternation)
```

**Solutions :**
1. Vérifier Step 2 génère `ui.needsAlternation`
2. Vérifier enrichissement mappe `ui.*`
3. Forcer affichage pour test :
```typescript
{(step.ui?.needsAlternation || step.category === 'traitement') && (
  <AlternanceIndicator {...props} />
)}
```

---

## ✅ **CHECKLIST FINALE PHASE 2**

Avant de passer à Phase 3 (Récap Utilisateur) :

### **Badges**
- [ ] BadgeScoreMatching créé et testé
- [ ] Score affiché sur tous produits
- [ ] Badges réduits à timing + alternance
- [ ] SPF/contours dans restrictions

### **Alternance**
- [ ] AlternanceIndicator créé
- [ ] Planning jours suggérés visible
- [ ] Message clair
- [ ] Test 2 traitements OK

### **Alternatives**
- [ ] ModalAlternatives créé
- [ ] Bouton "Voir alternatives" visible
- [ ] Modal ouvre/ferme OK
- [ ] Comparaison prix/score
- [ ] Alternatives triées par score

### **Polish**
- [ ] Responsive mobile/tablet/desktop
- [ ] Micro-interactions fluides
- [ ] Tests visuels validés

### **Commits Recommandés**
```bash
git commit -m "feat: add matching score badge and reduce UI badges to essentials"
git commit -m "feat: add alternance indicator with suggested nights calendar"
git commit -m "feat: add alternatives modal with product comparison"
git commit -m "style: optimize responsive and add micro-interactions"
```

---

## 🎯 **RÉSULTAT ATTENDU**

À la fin de cette phase :

✅ **Badges pertinents :** Timing + alternance uniquement  
✅ **Score visible :** Badge % sur tous produits  
✅ **Alternatives accessibles :** Bouton + modal comparaison  
✅ **Alternance claire :** Indicateur avec jours suggérés  
✅ **UI propre :** Pas de surcharge, design cohérent

---

**📍 PROCHAINE ÉTAPE :** `04-RECAP-UTILISATEUR.md`

**⏱️ DURÉE TOTALE PHASE 2 :** ~12h (1.5 jours)  
**🎯 VALIDATION :** Tests visuels 3 devices + modal fluide

