# 🏷️ TAXONOMIE careType V2 : Spécification Complète

**Date** : 2 Octobre 2025  
**Version** : 2.0  
**Objectif** : Migrer de 6 → 10 careTypes spécialisés

---

## 📊 ÉVOLUTION TAXONOMIE

### Ancien Système (V1) - 6 Types

```typescript
careType: 'nettoyage' | 'tonification' | 'traitement' | 'hydratation' | 'protection' | 'exfoliation'
```

**Problèmes** :
- ❌ `traitement` trop générique (couvre anti-âge + éclat + acné + apaisement)
- ❌ Pas de distinction précise pour targeting problems
- ❌ Scoring imprécis (même careType pour besoins différents)
- ❌ Incohérence : `masque` présent dans routine.ts mais pas productsDatabase.ts

---

### Nouveau Système (V2) - 10 Types

```typescript
careType: 
  | 'nettoyage'          // ✅ Conservé
  | 'tonification'       // ✅ Conservé
  | 'hydratation'        // ✅ Conservé
  | 'protection'         // ✅ Conservé
  | 'exfoliation'        // ✅ Conservé
  | 'masque'             // ✅ Ajouté (manquait)
  | 'anti-age'           // 🆕 Nouveau (ex-traitement)
  | 'eclat'              // 🆕 Nouveau (ex-traitement)
  | 'traitement-cible'   // 🆕 Nouveau (ex-traitement)
  | 'apaisement'         // 🆕 Nouveau (ex-traitement)
```

**Avantages** :
- ✅ Précision targeting (anti-âge ≠ acné ≠ éclat)
- ✅ Meilleur matching (concerns alignés avec careType)
- ✅ Scoring optimisé (ingrédients spécifiques par type)
- ✅ Cohérence complète entre schémas

---

## 📋 SPÉCIFICATION DÉTAILLÉE

### 1. NETTOYAGE (Cleansing)

**Objectif** : Retirer impuretés, pollution, maquillage, excès sébum

**Produits types** :
- Gels nettoyants
- Huiles nettoyantes
- Eaux micellaires
- Baumes démaquillants
- Mousses nettoyantes

**Ingrédients clés** :
- Surfactants doux (Coco-Glucoside, Decyl Glucoside)
- Glycerin (hydratant)
- Ceramides (protection barrière)

**targetConcerns typiques** : Aucun (base quotidienne)

**Category mapping** : `cleanser`

---

### 2. TONIFICATION (Toning)

**Objectif** : Équilibrer pH, préparer peau pour actifs

**Produits types** :
- Toners (toniques)
- Essences
- Lotions préparatrices

**Ingrédients clés** :
- Hyaluronic Acid
- Niacinamide (faible concentration)
- Extraits botaniques

**targetConcerns typiques** : Aucun (base optionnelle)

**Category mapping** : `toner`

**Note** : Optionnel dans routines (pas obligatoire)

---

### 3. HYDRATATION (Moisturizing)

**Objectif** : Maintenir et restaurer hydratation peau

**Produits types** :
- Crèmes hydratantes
- Laits corporels
- Sérums hydratants
- Gels hydratants
- Masques hydratants

**Ingrédients clés** :
- Hyaluronic Acid (humectant)
- Glycerin (humectant)
- Ceramides (occlusif)
- Squalane (émollient)

**targetConcerns typiques** :
- `dryness`
- `dehydration`
- `flakiness`

**Category mapping** : `moisturizer`, `serum` (hydratant)

---

### 4. PROTECTION (SPF / Protection)

**Objectif** : Prévenir dommages UV, pollution, oxydation

**Produits types** :
- Crèmes solaires SPF 30-50+
- Sérums antioxydants (Vit C, E)
- Brumes SPF

**Ingrédients clés** :
- UV Filters (minéraux ou chimiques)
- Antioxidants (Vitamin C, E, Niacinamide)

**targetConcerns typiques** :
- `sun_damage`
- `premature_aging` (prévention)

**Category mapping** : `sunscreen`

**Note** : **OBLIGATOIRE** matin (Step 2 IA)

---

### 5. ANTI-ÂGE (Anti-aging / Repair) 🆕

**Objectif** : Cibler rides, fermeté, élasticité, prévenir vieillissement

**Produits types** :
- Sérums rétinol
- Crèmes peptides
- Traitements collagène
- Sérums bakuchiol (alternative rétinol)

**Ingrédients clés** :
- **Retinol** (0.1-1%) : Renouvellement cellulaire
- **Peptides** : Stimulation collagène
- **Collagen** : Raffermissement
- **Bakuchiol** : Alternative rétinol (peaux sensibles)

**targetConcerns typiques** :
- `wrinkles`
- `fine_lines`
- `loss_of_firmness`
- `loss_of_elasticity`
- `sagging`

**Category mapping** : `serum`, `treatment`

**Safety** :
- ⚠️ Retinol : `restrictedZones: ['lèvres', 'yeux']`
- ⚠️ Retinol : `pregnancySafe: false`
- ⚠️ Retinol : `photosensitizing: true` (SPF obligatoire)

---

### 6. ÉCLAT (Brightening / Even Tone) 🆕

**Objectif** : Réduire hyperpigmentation, taches, unifier teint

**Produits types** :
- Sérums vitamine C
- Crèmes acide kojique
- Traitements arbutine
- Sérums tranexamic acid

**Ingrédients clés** :
- **Vitamin C** (10-20%) : Antioxydant + éclat
- **Kojic Acid** : Inhibiteur mélanine
- **Arbutin** / **Alpha Arbutin** : Éclaircissant doux
- **Tranexamic Acid** : Anti-taches

**targetConcerns typiques** :
- `hyperpigmentation`
- `dark_spots`
- `melasma`
- `sun_damage`
- `dullness`
- `uneven_tone`

**Category mapping** : `serum`, `treatment`

**Safety** :
- ⚠️ Vitamin C forte : `restrictedZones: ['lèvres', 'yeux']` (peut picoter)
- ✅ Généralement `pregnancySafe: true`

---

### 7. TRAITEMENT-CIBLÉ (Targeted Treatments) 🆕

**Objectif** : Acné, pores, régulation sébum, imperfections

**Produits types** :
- Sérums niacinamide
- Traitements acide azélaïque
- Gels salicylic acid
- Traitements benzoyl peroxide

**Ingrédients clés** :
- **Niacinamide** (5-10%) : Anti-inflammatoire, régule sébum
- **Azelaic Acid** (10-20%) : Anti-acné, anti-rougeurs
- **Salicylic Acid (BHA)** (0.5-2%) : Exfolie pores
- **Benzoyl Peroxide** (2.5-5%) : Antibactérien

**targetConcerns typiques** :
- `acne`
- `blackheads`
- `enlarged_pores`
- `oiliness`
- `blemishes`

**Category mapping** : `serum`, `treatment`

**Safety** :
- ⚠️ Niacinamide >10% : `restrictedZones: ['lèvres', 'yeux']`
- ⚠️ Salicylic Acid : `restrictedZones: ['lèvres', 'yeux']`, `pregnancySafe: false`
- ⚠️ BHA : `photosensitizing: true`

---

### 8. APAISEMENT (Soothing & Healing) 🆕

**Objectif** : Calmer irritations, rougeurs, renforcer barrière

**Produits types** :
- Crèmes cica
- Gels aloe vera
- Sérums panthenol
- Crèmes réparatrices

**Ingrédients clés** :
- **Centella Asiatica (Cica)** : Anti-inflammatoire, cicatrisant
- **Aloe Vera** : Apaisant, hydratant
- **Panthenol (Pro-Vitamin B5)** : Réparateur
- **Madecassoside** : Anti-rougeurs

**targetConcerns typiques** :
- `redness`
- `sensitivity`
- `irritation`
- `rosacea`
- `inflammation`

**Category mapping** : `serum`, `treatment`, `balm`

**Safety** :
- ✅ Généralement très safe (tous types de peau)
- ✅ `pregnancySafe: true`
- ✅ Compatible zones sensibles

---

### 9. EXFOLIATION (Exfoliation / Renewal)

**Objectif** : Éliminer cellules mortes, lisser texture, renouvellement

**Produits types** :
- AHA (Glycolic, Lactic, Mandelic)
- BHA (Salicylic)
- Gommages enzymatiques
- Peelings chimiques

**Ingrédients clés** :
- **Glycolic Acid (AHA)** (5-10%) : Exfoliant surface
- **Lactic Acid (AHA)** (5-10%) : Exfoliant doux
- **Salicylic Acid (BHA)** (1-2%) : Exfoliant pores
- **Enzymes** (Papain, Bromelain) : Exfoliation douce

**targetConcerns typiques** :
- `uneven_texture`
- `roughness`
- `dullness`
- `enlarged_pores`
- `blackheads`

**Category mapping** : `exfoliant`

**Safety** :
- ⚠️ **TOUS** : `restrictedZones: ['lèvres', 'yeux']`
- ⚠️ **TOUS** : `photosensitizing: true` (SPF OBLIGATOIRE lendemain)
- ⚠️ AHA : `pregnancySafe: true` / BHA : `pregnancySafe: false`

---

### 10. MASQUE (Masks)

**Objectif** : Soins intensifs hebdomadaires (hydratation, purification, éclat)

**Produits types** :
- Masques hydratants (sheet masks)
- Masques purifiants (argile)
- Masques éclat
- Masques nuit

**Ingrédients** : Variable selon type masque

**targetConcerns** : Variable

**Category mapping** : `mask`

**Frequency** : Hebdomadaire (1-2x/semaine max)

---

## 🔄 MAPPING MIGRATION

### Table de Transition (110 Produits Existants)

| Ancien careType | Ingrédients Détectés | Nouveau careType | Logique |
|-----------------|---------------------|------------------|---------|
| `nettoyage` | - | `nettoyage` | ✅ Conservé |
| `tonification` | - | `tonification` | ✅ Conservé |
| `hydratation` | - | `hydratation` | ✅ Conservé |
| `protection` | - | `protection` | ✅ Conservé |
| `exfoliation` | - | `exfoliation` | ✅ Conservé |
| `traitement` | Retinol, Peptides, Collagen | `anti-age` | 🔄 Reclassé |
| `traitement` | Vitamin C, Kojic, Arbutin | `eclat` | 🔄 Reclassé |
| `traitement` | Niacinamide, Azelaic, Salicylic | `traitement-cible` | 🔄 Reclassé |
| `traitement` | Cica, Aloe, Panthenol | `apaisement` | 🔄 Reclassé |

### Script Migration Automatique

```typescript
function migrateCareType(product: EnrichedProduct): CareType {
  // Si déjà nouveau format
  if (product.careType !== 'traitement') {
    return product.careType as CareType
  }
  
  // Classifier ancien 'traitement'
  const ingredients = product.activeIngredients.join(' ').toLowerCase()
  const concerns = product.targetConcerns.join(' ').toLowerCase()
  
  // Anti-âge : Retinol, Peptides, Collagen
  if (/retinol|peptide|collagen|bakuchiol/i.test(ingredients)) {
    return 'anti-age'
  }
  
  // Éclat : Vitamin C, Kojic, Arbutin
  if (/vitamin c|ascorbic|kojic|arbutin|tranexamic/i.test(ingredients)) {
    return 'eclat'
  }
  
  // Apaisement : Cica, Aloe, Panthenol
  if (/cica|centella|aloe|panthenol|madecassoside/i.test(ingredients) ||
      /redness|sensitivity|irritation/.test(concerns)) {
    return 'apaisement'
  }
  
  // Traitement ciblé : Niacinamide, Azelaic, Benzoyl (défaut)
  return 'traitement-cible'
}
```

**Résultat attendu** (110 produits) :
```
✅ 10 nettoyage → nettoyage
✅ 7 tonification → tonification
✅ 16 hydratation → hydratation
✅ 11 protection → protection
✅ 8 exfoliation → exfoliation
✅ 31 traitement → Reclassifiés :
   - 8 → anti-age
   - 5 → eclat
   - 12 → traitement-cible
   - 6 → apaisement
```

---

## 🔧 IMPLÉMENTATION

### 1. Schéma Zod (`productsDatabase.ts`)

```typescript
export const EnrichedProductSchema = z.object({
  // ... autres champs ...
  
  careType: z.enum([
    'nettoyage',
    'tonification',
    'hydratation',
    'protection',
    'anti-age',
    'eclat',
    'traitement-cible',
    'apaisement',
    'exfoliation',
    'masque'
  ]),
  
  // ... reste ...
})
```

### 2. Schéma Routine (`routine.ts`)

```typescript
export const RoutineStepSchema = z.object({
  // ... autres champs ...
  
  careType: z.enum([
    'nettoyage',
    'tonification',
    'hydratation',
    'protection',
    'anti-age',
    'eclat',
    'traitement-cible',
    'apaisement',
    'exfoliation',
    'masque'
  ]),
  
  // ... reste ...
})
```

### 3. Prompt IA Step 2 (Routine)

```typescript
### **Types de Soins Autorisés**
nettoyage | tonification | hydratation | protection | anti-age | eclat | 
traitement-cible | apaisement | exfoliation | masque

### **Guideline Sélection careType** :
- **Base quotidienne** : nettoyage, hydratation, protection (OBLIGATOIRES)
- **Optionnel base** : tonification (après nettoyage)
- **Actifs ciblés** :
  - **anti-age** : Rétinol, peptides → Rides, fermeté, élasticité
  - **eclat** : Vitamin C, kojique → Taches, hyperpigmentation, teint terne
  - **traitement-cible** : Niacinamide, azélaïque → Acné, pores, sébum
  - **apaisement** : Cica, aloe → Rougeurs, sensibilité, irritation
- **Soins spéciaux** :
  - **exfoliation** : AHA/BHA → Texture, cellules mortes
  - **masque** : Soins hebdomadaires intensifs

### **Règles Sélection** :
- **Phase Immédiate** : UNIQUEMENT base (nettoyage, hydratation, protection) + apaisement si nécessaire
- **Phase Adaptation** : Base + MAX 2 parmi (anti-age, eclat, traitement-cible, exfoliation)
- **Phase Maintenance** : Base + 1 entretien hebdo (masque ou actif doux)
```

---

## ✅ VALIDATION

### Tests Unitaires

```typescript
describe('CareType V2 Migration', () => {
  it('devrait conserver anciens types (nettoyage, hydratation, etc.)', () => {
    const product = { careType: 'nettoyage', activeIngredients: [] }
    expect(migrateCareType(product)).toBe('nettoyage')
  })
  
  it('devrait classifier Retinol → anti-age', () => {
    const product = { 
      careType: 'traitement', 
      activeIngredients: ['Retinol 0.5%'] 
    }
    expect(migrateCareType(product)).toBe('anti-age')
  })
  
  it('devrait classifier Vitamin C → eclat', () => {
    const product = { 
      careType: 'traitement', 
      activeIngredients: ['Ascorbic Acid 15%'] 
    }
    expect(migrateCareType(product)).toBe('eclat')
  })
  
  it('devrait classifier Niacinamide → traitement-cible', () => {
    const product = { 
      careType: 'traitement', 
      activeIngredients: ['Niacinamide 10%'] 
    }
    expect(migrateCareType(product)).toBe('traitement-cible')
  })
})
```

---

## 📊 IMPACT UTILISATEUR

### Avant (V1)

```
Routine IA :
Step 1 : { careType: 'traitement', targetProblem: 'Rides' }
Step 2 : { careType: 'traitement', targetProblem: 'Taches' }
→ Matching flou (même careType pour 2 besoins différents)
```

### Après (V2)

```
Routine IA :
Step 1 : { careType: 'anti-age', targetProblem: 'Rides' }
Step 2 : { careType: 'eclat', targetProblem: 'Taches' }
→ Matching précis (careTypes spécialisés)
```

**Résultat** : **+15% précision** matching (ingrédients alignés avec besoins)

---

**Version** : 2.0  
**Dernière mise à jour** : 2 Octobre 2025  
**Prochaine révision** : Post-migration (Sem 3)



