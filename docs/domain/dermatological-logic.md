# 🔬 Logique Dermatologique DermAI V3 - Référence Prompts IA

## 🎯 **OBJECTIF DE CE DOCUMENT**

**Base technique pour les prompts IA** - Étape 2 (Routine) et Étape 3 (Produits)
- **Piliers porteurs** : Règles scientifiques non-négociables
- **Mesures clés** : Durées, compatibilités, progressions
- **Structure exploitable** : Format direct pour intégration prompts

---

## 🧬 **FONDEMENTS SCIENTIFIQUES VALIDÉS**

### **Cycle Cellulaire de Référence (Niveau A)**
```
Renouvellement épidermique : 28 ± 4 jours (peau normale)
Facteur âge : +7 jours par décennie après 30 ans
Adaptation actifs : 14-21 jours minimum
Récupération barrière : 5-14 jours maximum
```

### **Durées Physiologiques par Actif (Niveaux A/B)**
- **Rétinoïdes** : 2-4 semaines adaptation minimum (A)
- **AHA/BHA** : 1-2 semaines préparation (A)
- **Vitamine C** : 7-10 jours introduction progressive (B)
- **Niacinamide** : Tolérance immédiate, efficacité 2-4 semaines (B)

## 🏗️ **ARCHITECTURE 3 PHASES - RÈGLES PILIERS**

### **Phase Immédiate (1-3 semaines) - STABILISER**
**Objectif** : Réparer barrière + traiter urgent + établir base durable
**Principe** : Douceur maximale, zéro irritation, préparation cutanée
**Durée personnalisée** :
- Base : 14 jours
- +7 jours si âge >50 ans
- +3 jours par problème intense
- +5 jours si peau sensible

### **Phase Adaptation (3-8 semaines) - INTRODUIRE**
**Objectif** : Conserver base + introduire actifs progressifs
**Principe** : Tolérance progressive, montée en puissance contrôlée
**Durée personnalisée** :
- Base : 28 jours
- +7 jours par actif complexe (rétinol, AHA, BHA)
- +2 jours par zone traitée

### **Phase Maintenance (Continu) - MAINTENIR**
**Objectif** : Maintenir acquis + prévenir rechutes
**Principe** : Routine établie, soins d'entretien, prévention

## 🔗 **LOGIQUE DE TRANSITION - RÈGLES CRITIQUES**

### **Base Durable vs Temporaire**
**Base Durable** (à conserver entre phases) :
- Nettoyage quotidien
- Hydratation adaptée au type de peau
- Protection SPF ≥30

**Traitements Temporaires** (avec critères visuels) :
- Cicatrisation : "jusqu'à fermeture complète"
- Imperfections : "jusqu'à réduction visible"
- Rougeurs : "jusqu'à apaisement"

## 🧪 **COMPATIBILITÉS D'ACTIFS - MATRICE SIMPLIFIÉE**

### **Associations Validées (Niveaux A/B)**
```
✅ Vitamine C + Niacinamide (B) - Synergie antioxydante
✅ Azélaïque + Tout actif (A/B) - Très bien toléré
✅ SPF + Tout actif (A) - Protection obligatoire
```

### **Associations à Alterner (Niveau C)**
```
⚠️ AHA/BHA + Rétinoïde - Alterner jours/zones (irritation cumulative)
⚠️ BPO + Rétinoïde - Séparer moments d'application
```

### **Contre-indications Absolues**
```
❌ Rétinoïdes + Grossesse/Allaitement (A)
❌ Sur-exfoliation (>3 actifs exfoliants simultanés)
```

## 📊 **PERSONNALISATION PAR PROFIL - RÈGLES CLÉS**

### **Selon Âge (Facteur Physiologique)**
- **<25 ans** : Tolérance élevée, focus prévention
- **25-40 ans** : Équilibre correction/prévention
- **40-55 ans** : Douceur accrue, anti-âge prioritaire
- **>55 ans** : Douceur maximale, hydratation renforcée

### **Selon Type de Peau (Facteur Barrière)**
- **Sèche** : Hydratation++, actifs doux, céramides
- **Grasse** : Régulation sébum, BHA, niacinamide
- **Mixte** : Approche zonée (T-zone vs joues)
- **Sensible** : Progression ultra-lente, azélaïque privilégié

### **Selon Problèmes Prioritaires**
- **Imperfections** : BHA + rétinoïde (alternance)
- **Hyperpigmentation** : Vitamine C + azélaïque + SPF teinté
- **Vieillissement** : Rétinoïde + vitamine C + SPF quotidien
- **Rosacée** : Azélaïque + éviter AHA forts

## 🎯 **ARCHITECTURE V3 - MÉTADONNÉES TECHNIQUES**

### **Format JSON V3 - Champs Obligatoires**
```typescript
interface AiRoutineItem {
  // Identification
  id: string
  title: string
  category: 'cleanser' | 'treatment' | 'moisturizer' | 'spf' | 'exfoliant' | 'mask'
  
  // Timing & Fréquence
  timing: 'morning' | 'evening' | 'weekly' // JAMAIS "both"
  frequency: 'daily' | '2x/week' | '1x/week' | string
  
  // Instructions (OBLIGATOIRES V3)
  applicationInstructions: string
  restrictions: string[]
  targetZones: string[]
  
  // Métadonnées Temporaires
  isTemporary: boolean
  introduceFromWeek?: number // 0 = immédiat, 1 = semaine 2
  applicationDuration?: string // "4-6 semaines"
}
```

### **Règles de Mapping V3**
```
frequency !== "daily" → timing = "weekly" (OBLIGATOIRE)
timing "matin" → slot "morning"
timing "soir" → slot "evening"
timing "hebdomadaire" → slot "weekly"
```

## 📋 **EXEMPLES TYPES SIMPLIFIÉS**

### **Peau Jeune Mixte (25 ans)**
```
Phase Immédiate (14 jours) :
- Nettoyage doux matin/soir
- Hydratation légère zones sèches
- SPF 30 quotidien
- BHA T-zone (temporaire jusqu'à amélioration)

Phase Adaptation (28 jours) :
- Base conservée
- + Niacinamide 3x/semaine
- BHA → prévention 1x/semaine
```

### **Peau Mature Sensible (55 ans)**
```
Phase Immédiate (21 jours = 14+7 âge) :
- Nettoyage très doux
- Réparation barrière (temporaire)
- Hydratation renforcée
- SPF 50

Phase Adaptation (35 jours = 28+7 actif) :
- Base conservée
- + Rétinol 1x/semaine progression lente
- + Vitamine C matin faible dose
```

## ✅ **CRITÈRES DE VALIDATION PROMPTS IA**

### **Validation Technique V3 (Étape 2 & 3)**
- **Champs obligatoires** : applicationInstructions, restrictions, targetZones présents
- **Timing cohérent** : Jamais "both", règle hebdomadaire respectée
- **Métadonnées temporaires** : introduceFromWeek, applicationDuration si isTemporary=true
- **Progression logique** : Base durable conservée entre phases

### **Validation Dermatologique (Niveaux A/B/C)**
- **Cycle cellulaire respecté** : Durées basées sur physiologie (28±4 jours)
- **Compatibilités validées** : Matrice scientifique respectée
- **Personnalisation effective** : Facteurs âge/type peau/problèmes intégrés
- **Sécurité garantie** : Contre-indications absolues respectées

### **Métriques Cibles Actuelles**
- **Reproductibilité** : 95% résultats identiques (température 0.0)
- **Personnalisation** : 95% routines différentes pour diagnostics différents
- **Cohérence** : 90% cohérence diagnostic → routine → produits
- **Performance** : <30s latence P95, <2% taux d'erreur

---

## 📚 **RÉFÉRENCES SCIENTIFIQUES CONDENSÉES**

### **Preuves Niveau A (Evidence-Based)**
- SPF ≥30 quotidien ralentit photo-vieillissement (Hughes/Green, Ann Intern Med 2013)
- Rétinoïdes efficaces acné + anti-âge (JAAD Guidelines 2024)
- Azélaïque sûr grossesse/allaitement (AAD 2025)

### **Preuves Niveau B (Consensus Expert)**
- Cycle cellulaire 28±4 jours, +7j/décennie >30 ans (Lambers 2006)
- Vitamine C + Niacinamide compatibles (Al-Niaimi 2017)
- BHA lipophile, AHA hydrophile (mécanismes différents)

---

*Documentation technique DermAI V3 - Référence Prompts IA*  
*Dernière mise à jour : Janvier 2025 - Architecture V3 Intégrée*


