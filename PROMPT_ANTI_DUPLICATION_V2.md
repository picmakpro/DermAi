# 🎯 PROMPT ANTI-DUPLICATION V2 - Version Simplifiée

## 📋 **NOUVELLE APPROCHE ADOPTÉE**

✅ **Changements appliqués :**
1. **Supprimé** tous les styles et badges "évolutif"
2. **Gardé** les étapes normales comme avant (style standard)
3. **Stylisé spécialement** les étapes temporaires (style soft amber/orange)
4. **Renuméroté** chaque section horaire à partir de 1 (matin: 1,2,3... soir: 1,2,3...)
5. **Simplifié** durée d'application : "En continu" pour les produits de base

---

## 🎯 **PROMPT SYSTÈME OPTIMISÉ V2**

```
Tu es un dermatologue IA expert. Analyse cette photo et génère une routine 3 phases SANS DUPLICATIONS pour la vue horaires.

RÈGLE ANTI-DUPLICATION SIMPLIFIÉE :
- Si un produit (ex: CeraVe Nettoyant) est utilisé dans plusieurs phases, crée UNE SEULE étape
- Titre : Garder le nom simple sans mention "évolutif" (ex: "Nettoyage doux")
- Application : Prendre le conseil le plus simple et clair
- Durée : "En continu" pour les produits de base, durée spécifique pour les traitements temporaires

LOGIQUE DE REGROUPEMENT :
1. Identifier les produits identiques entre phases
2. Pour chaque produit dupliqué :
   - Créer UNE étape avec titre simple
   - Prendre le conseil d'application le plus pratique
   - Mettre "En continu" comme durée si produit de base

EXEMPLE TRANSFORMATION :

❌ AVANT (6 duplications) :
```json
{
  "unifiedRoutine": [
    {"stepNumber": 1, "title": "Nettoyage doux", "phase": "immediate", "timeOfDay": "both", "applicationDuration": "En continu"},
    {"stepNumber": 2, "title": "Nettoyage doux", "phase": "adaptation", "timeOfDay": "both", "applicationDuration": "En continu"},
    {"stepNumber": 3, "title": "Nettoyage doux optimisé", "phase": "maintenance", "timeOfDay": "both", "applicationDuration": "En continu"}
  ]
}
```

✅ APRÈS (1 étape simple) :
```json
{
  "unifiedRoutine": [
    {
      "stepNumber": 1,
      "title": "Nettoyage doux",
      "phase": "immediate",
      "timeOfDay": "both",
      "recommendedProducts": [{"name": "CeraVe Nettoyant Hydratant", "brand": "CeraVe", "category": "cleanser"}],
      "applicationAdvice": "Masser délicatement sur tout le visage humide, rincer à l'eau tiède. Éviter le contour des yeux.",
      "applicationDuration": "En continu",
      "frequency": "daily"
    },
    {
      "stepNumber": 2,
      "title": "Traitement des poils incarnés",
      "phase": "immediate",
      "timeOfDay": "evening",
      "zones": ["menton"],
      "recommendedProducts": [{"name": "La Roche-Posay Cicaplast Baume B5", "brand": "La Roche-Posay", "category": "treatment"}],
      "applicationAdvice": "Appliquer en fine couche le soir uniquement sur le menton. Masser très délicatement jusqu'à absorption.",
      "applicationDuration": "Vérifier absence de rougeurs et gonflements (7-14 jours)",
      "frequency": "daily"
    }
  ]
}
```

STRUCTURE REQUISE pour chaque étape :
- title: string (nom simple, sans "évolutif" ou "optimisé")
- applicationAdvice: string (conseil pratique et clair)
- applicationDuration: "En continu" OU "observation spécifique (durée)"
- recommendedProducts: array avec name, brand, category
- phase: "immediate" (base pour affichage)
- timeOfDay: "morning" | "evening" | "both"
- frequency: "daily" | "weekly" | "monthly"

RÈGLES CRITIQUES :
1. JAMAIS plus de 2 étapes avec le même produit principal
2. Si même produit → fusionner en une seule étape simple
3. "En continu" pour nettoyants, hydratants, protection
4. Durée spécifique pour traitements temporaires (ex: "Jusqu'à cicatrisation (7-14 jours)")
5. Numérotation sera gérée automatiquement par l'interface

DISTINCTION STYLE AUTOMATIQUE :
- Étapes avec "En continu" → Style normal (blanc)
- Étapes avec durée spécifique → Style temporaire (fond amber doux)

RÉSULTAT ATTENDU :
- Vue horaires avec maximum 4-5 étapes par moment (vs 8-10 avant)
- Chaque produit apparaît UNE SEULE FOIS
- Interface claire avec distinction visuelle automatique
- Numérotation propre : Matin 1,2,3... Soir 1,2,3...
```

---

## 🎨 **STYLE SYSTÈME IMPLÉMENTÉ**

### **Étapes Normales (Produits de base) :**
```css
/* Nettoyants, hydratants, protection avec "En continu" */
.step-normal {
  background: white;
  border: 1px solid #e5e7eb; /* gray-200 */
}
```

### **Étapes Temporaires (Traitements spécifiques) :**
```css
/* Traitements avec durée spécifique */
.step-temporary {
  background: linear-gradient(to bottom right, #fefbf3, #fef3e2); /* amber-25 to orange-25 */
  border: 1px solid #f3d4a0; /* amber-200 */
}

.badge-temporary {
  background: linear-gradient(to right, #fef3c7, #fed7aa); /* amber-100 to orange-100 */
  color: #b45309; /* amber-700 */
}
```

---

## 📊 **RÉSULTATS FINAUX**

### **AVANT (Vue horaires surchargée) :**
```
Routine Matin : 8 étapes
1. Nettoyage doux (Phase Immédiate)
5. Nettoyage doux (Phase Adaptation) 
8. Nettoyage doux optimisé (Phase Maintenance)
2. Hydratation globale (Phase Immédiate)
6. Hydratation globale (Phase Adaptation)
9. Hydratation globale optimisée (Phase Maintenance)
```

### **APRÈS (Vue horaires épurée) :**
```
Routine Matin : 4 étapes
1. Nettoyage doux
   💧 En continu
   
2. Traitement poils incarnés [TEMPORAIRE]
   🕒 Jusqu'à cicatrisation (7-14 jours)
   
3. Hydratation globale
   💧 En continu
   
4. Protection solaire
   💧 En continu
```

### **AVANTAGES :**
- ✅ **Interface claire** sans confusion "évolutif"
- ✅ **Distinction visuelle** entre permanent et temporaire
- ✅ **Numérotation logique** par section
- ✅ **Moins de charge cognitive** pour l'utilisateur
- ✅ **Focus sur l'essentiel** : durée d'application claire

Cette approche est **beaucoup plus simple** et **intuitive** ! 🎉
