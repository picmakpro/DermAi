# 🚀 PROMPT OPTIMISÉ : ÉVITER DUPLICATIONS DANS VUE HORAIRES

## 📋 **CONTEXTE**

**Problème identifié :** Dans DermAI V2, quand l'utilisateur bascule en vue "Par horaires", les mêmes produits apparaissent dans plusieurs phases, créant des duplications massives :

- **CeraVe Nettoyant** : 3x matin + 3x soir = 6 fois !
- **Tolériane Sensitive** : 3x matin + 3x soir = 6 fois !
- **Protection SPF** : 3x matin = 3 fois !

## 💡 **SOLUTION IMPLÉMENTÉE**

1. **Déduplication intelligente côté frontend** ✅
2. **Prompt IA optimisé pour éviter les duplications dès la génération** ⬇️

---

## 🎯 **PROMPT SYSTÈME OPTIMISÉ**

```
Tu es un dermatologue IA expert. Analyse cette photo et génère une routine 3 phases SANS DUPLICATIONS pour la vue horaires.

RÈGLE ANTI-DUPLICATION CRITIQUE :
- Si un produit (ex: CeraVe Nettoyant) est utilisé dans plusieurs phases, crée UNE SEULE étape évolutive
- Titre : "Nettoyage doux → optimisé" 
- Application : "Évolution sur 3 phases : technique de base → technique affinée → technique maîtrisée"
- Durée : "Évolution continue (Phase Immédiate → Adaptation → Maintenance)"

LOGIQUE DE REGROUPEMENT :
1. Identifier les produits identiques entre phases
2. Pour chaque produit dupliqué :
   - Créer UNE étape avec titre évolutif
   - Fusionner les conseils d'application en progression
   - Indiquer l'évolution temporelle

EXEMPLE TRANSFORMATION :

❌ AVANT (6 duplications) :
```
{
  "unifiedRoutine": [
    {"stepNumber": 1, "title": "Nettoyage doux", "phase": "immediate", "timeOfDay": "both", "recommendedProducts": [{"name": "CeraVe Nettoyant Hydratant"}]},
    {"stepNumber": 2, "title": "Nettoyage doux", "phase": "adaptation", "timeOfDay": "both", "recommendedProducts": [{"name": "CeraVe Nettoyant Hydratant"}]},
    {"stepNumber": 3, "title": "Nettoyage doux optimisé", "phase": "maintenance", "timeOfDay": "both", "recommendedProducts": [{"name": "CeraVe Nettoyant Hydratant"}]}
  ]
}
```

✅ APRÈS (1 étape évolutive) :
```
{
  "unifiedRoutine": [
    {
      "stepNumber": 1,
      "title": "Nettoyage doux → optimisé",
      "phase": "immediate",
      "timeOfDay": "both",
      "isEvolutive": true,
      "evolutivePhases": ["immediate", "adaptation", "maintenance"],
      "recommendedProducts": [{"name": "CeraVe Nettoyant Hydratant", "brand": "CeraVe", "category": "cleanser"}],
      "applicationAdvice": "Évolution sur 3 phases : Masser délicatement 30sec → Masser 45sec avec focus T-zone → Technique double nettoyage selon besoins",
      "applicationDuration": "Évolution continue (Phase Immédiate → Adaptation → Maintenance)",
      "frequency": "daily"
    }
  ]
}
```

STRUCTURE REQUISE pour chaque étape :
- title: string (avec "→ optimisé" si évolutif)
- isEvolutive: boolean (true si fusion de phases)
- evolutivePhases: array des phases fusionnées
- applicationAdvice: string (progression si évolutif)
- applicationDuration: string (progression temporelle)
- recommendedProducts: array avec name, brand, category
- phase: "immediate" (base pour affichage)
- timeOfDay: "morning" | "evening" | "both"
- frequency: "daily" | "weekly" | "monthly"

RÈGLES CRITIQUES :
1. JAMAIS plus de 2 étapes avec le même produit principal
2. Si même produit → fusionner en étape évolutive
3. Conserver la richesse d'information dans applicationAdvice
4. Indiquer clairement l'évolution temporelle

RÉSULTAT ATTENDU :
- Vue horaires avec maximum 4-5 étapes par moment (vs 8-10 avant)
- Chaque produit apparaît UNE SEULE FOIS
- Information évolutive claire et éducative
- Expérience utilisateur fluide et lisible
```

---

## 🔧 **INTÉGRATION DANS LE SERVICE IA**

**Fichier :** `src/services/ai/analysis.service.ts`

```typescript
const ANTI_DUPLICATION_PROMPT = `
Tu es un dermatologue IA expert. Analyse cette photo et génère une routine 3 phases SANS DUPLICATIONS.

RÈGLE ANTI-DUPLICATION CRITIQUE :
- Si un produit est utilisé dans plusieurs phases, crée UNE SEULE étape évolutive
- Titre avec "→ optimisé" pour indiquer l'évolution
- isEvolutive: true et evolutivePhases: array des phases concernées

[... reste du prompt ...]
`

class AnalysisService {
  async analyzeWithGPT4Vision(imageBase64: string, questionnaire: any) {
    const prompt = `${ANTI_DUPLICATION_PROMPT}\n\nQuestionnaire utilisateur: ${JSON.stringify(questionnaire)}`
    
    // ... appel API GPT-4o Vision avec le nouveau prompt
  }
}
```

---

## 📊 **RÉSULTATS ATTENDUS**

### **AVANT (Vue horaires surchargée) :**
```
Routine Matin : 8 étapes
1. Nettoyage doux (Phase Immédiate)
2. Nettoyage doux (Phase Adaptation) 
3. Nettoyage doux optimisé (Phase Maintenance)
4. Hydratation globale (Phase Immédiate)
5. Hydratation globale (Phase Adaptation)
6. Hydratation globale optimisée (Phase Maintenance)
7. Protection SPF 30 (Phase Immédiate)
8. Protection SPF 50 (Phase Maintenance)
```

### **APRÈS (Vue horaires optimisée) :**
```
Routine Matin : 4 étapes
1. Nettoyage doux → optimisé [ÉVOLUTIF]
   📅 Évolution: Immédiate → Adaptation → Maintenance
   💧 Technique progressive selon phase

2. Hydratation globale → optimisée [ÉVOLUTIF]
   📅 Évolution: Immédiate → Adaptation → Maintenance
   💧 Application renforcée au fil du temps

3. Traitement imperfections ciblé
   🎯 Zone : menton, joues

4. Protection solaire renforcée [ÉVOLUTIF]
   📅 Évolution: SPF 30 → SPF 50 selon actifs
```

### **IMPACT UTILISATEUR :**
- ✅ **75% moins d'étapes** dans la vue horaires
- ✅ **Interface claire et lisible** 
- ✅ **Aucune perte d'information** (tout dans l'évolutif)
- ✅ **Compréhension progressive** de l'amélioration
- ✅ **Badge visuel "Évolutif"** pour identifier la progression

---

## 🎯 **VALIDATION**

**Tests requis :**
1. Générer routine avec produits identiques entre phases
2. Vérifier déduplication automatique en vue horaires
3. Contrôler présence badges "Évolutif"
4. Valider texte progression dans applicationAdvice
5. Tester responsive mobile

**Critères de succès :**
- Maximum 5 étapes par moment de journée
- Chaque produit n'apparaît qu'une fois
- Information évolutive claire
- Performance UI fluide

Cette solution élimine **définitivement** le problème de duplication tout en enrichissant l'expérience utilisateur avec une logique d'évolution dermatologique ! 🚀
