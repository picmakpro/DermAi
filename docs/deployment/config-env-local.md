# ⚙️ Configuration .env.local - Tests Locaux GPT-5

**Date :** 30 septembre 2025  
**Objectif :** Tester GPT-5 en local avant déploiement

---

## 📝 **VARIABLES À AJOUTER DANS .env.local**

Ouvrez votre fichier `.env.local` et ajoutez/vérifiez ces variables :

```bash
# ══════════════════════════════════════════════════════════════
# 🔑 OPENAI API (OBLIGATOIRE)
# ══════════════════════════════════════════════════════════════

OPENAI_API_KEY=sk-proj-votre-clé-api-ici

# ══════════════════════════════════════════════════════════════
# 🤖 MODÈLES GPT-5 (NOUVEAUX)
# ══════════════════════════════════════════════════════════════

# Modèle pour diagnostic (étape 1)
AI_MODEL_DIAGNOSTIC=chatgpt-5

# Modèle pour routine personnalisée (étape 2)
AI_MODEL_ROUTINE=gpt-5-thinking

# ══════════════════════════════════════════════════════════════
# 🎚️ FEATURE FLAGS GPT-5 (NOUVEAUX)
# ══════════════════════════════════════════════════════════════

# Activer GPT-5 pour diagnostic (true/false)
USE_GPT5_DIAGNOSTIC=true

# Activer GPT-5 pour routine (true/false)
USE_GPT5_ROUTINE=true

# Rollout 100% en local (tous les tests utilisent GPT-5)
GPT5_ROLLOUT_PERCENTAGE=100

# ══════════════════════════════════════════════════════════════
# ⏱️ TIMEOUTS (OPTIONNEL - ajustés pour GPT-5)
# ══════════════════════════════════════════════════════════════

# Timeout diagnostic (GPT-5 peut être légèrement plus lent)
TIMEOUT_DIAGNOSTIC_MS=25000

# Timeout routine (GPT-5 Thinking nécessite plus de temps)
TIMEOUT_ROUTINE_MS=50000

# Timeout sélection produits
TIMEOUT_PRODUCTS_MS=30000

# ══════════════════════════════════════════════════════════════
# 💰 MONITORING COÛTS (OPTIONNEL)
# ══════════════════════════════════════════════════════════════

# Budget quotidien pour tests locaux (plus bas que prod)
OPENAI_DAILY_BUDGET_USD=50

# Webhook Slack/Discord (optionnel, laisser vide pour local)
# OPENAI_COST_ALERT_WEBHOOK=

# ══════════════════════════════════════════════════════════════
# 📊 LOGGING (OPTIONNEL)
# ══════════════════════════════════════════════════════════════

# Niveau de logs (info pour voir détails GPT-5)
LOG_LEVEL=info

# Logs structurés JSON
LOG_STRUCTURED=true

# ══════════════════════════════════════════════════════════════
# 🌐 NEXT.JS (DÉJÀ PRÉSENT NORMALEMENT)
# ══════════════════════════════════════════════════════════════

NEXT_PUBLIC_ENV=development
```

---

## ✅ **VARIABLES MINIMALES REQUISES**

Si vous voulez tester rapidement, voici le **strict minimum** :

```bash
# 1. API Key OpenAI (OBLIGATOIRE)
OPENAI_API_KEY=sk-proj-votre-clé-api-ici

# 2. Activer GPT-5 (OBLIGATOIRE)
USE_GPT5_DIAGNOSTIC=true
USE_GPT5_ROUTINE=true
GPT5_ROLLOUT_PERCENTAGE=100
```

Les autres variables ont des valeurs par défaut fonctionnelles.

---

## 🧪 **PROCÉDURE TEST LOCAL**

### **Étape 1 : Vérifier Configuration**

```bash
cd /Users/mak/dermai-v2

# Vérifier que .env.local existe
ls -la .env.local

# Éditer le fichier (ajouter variables ci-dessus)
code .env.local  # ou nano .env.local
```

---

### **Étape 2 : Installer Dépendances**

```bash
# Si pas déjà fait
npm install
```

---

### **Étape 3 : Lancer Tests Unitaires**

```bash
# Lancer tous les tests (43 tests)
npm test

# Résultat attendu :
# ✅ openai-config : 27/27 passed
# ✅ routineValidator : 12/12 passed
# ✅ routineSnapshots : 4/4 passed
# TOTAL : 43/43 passed (100%)
```

---

### **Étape 4 : Build Local**

```bash
# Vérifier TypeScript
npx tsc --noEmit

# Build production
npm run build

# Résultat attendu :
# ✅ Build successful
# ✅ .next/ directory created
```

---

### **Étape 5 : Lancer Dev Server**

```bash
# Démarrer serveur développement
npm run dev

# URL : http://localhost:3000
```

---

### **Étape 6 : Test Manuel Complet**

1. **Ouvrir navigateur** : http://localhost:3000

2. **Parcourir questionnaire** :
   - Upload 2 photos (front + side)
   - Profil : Âge 32, Genre Femme, Grossesse Oui
   - Localisation : Paris, France
   - Préoccupations : max 3
   - Budget : Confort
   - Style : Équilibrée
   - Soumettre

3. **Vérifier résultats** :
   - Analyse complète <60s
   - Routine générée avec globalAdvice
   - Pas d'actifs dangereux (grossesse)
   - Budget/Style respectés

4. **Vérifier logs terminal** :
   ```
   ✅ Chercher : "model": "gpt-5-thinking"
   ✅ Chercher : "cost_usd"
   ✅ Chercher : "tokensReasoning"
   ✅ Chercher : "Validation compliance"
   ```

---

## 🔍 **VÉRIFICATION LOGS DÉTAILLÉS**

### **Logs attendus dans le terminal**

```json
// Étape 1 : Diagnostic
{
  "message": "🤖 RÉPONSE OPENAI ÉTAPE 1:",
  "metadata": {
    "model": "chatgpt-5",
    "tokensUsed": 1800,
    "duration_ms": 2340,
    "cost_usd": 0.072,
    "fallbackUsed": false
  }
}

// Étape 2 : Routine
{
  "message": "🧬 ÉTAPE 2 - Routine personnalisée SUCCESS:",
  "metadata": {
    "model": "gpt-5-thinking",
    "tokensUsed": 5400,
    "tokensReasoning": 400,  // ✅ GPT-5 Thinking
    "duration_ms": 18500,
    "cost_usd": 0.328
  }
}

// Validation Compliance
{
  "message": "🔍 Validation compliance routine",
  "metadata": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "metrics": {
      "treatmentsCount": 2,
      "hebdosCount": 1
    }
  }
}
```

---

## 🚨 **PROBLÈMES COURANTS**

### **Erreur : "API Key invalide"**

```bash
# Vérifier que la clé est bien configurée
cat .env.local | grep OPENAI_API_KEY

# Vérifier que la clé a accès GPT-5
# (Tester sur https://platform.openai.com/playground)
```

**Solution :** Régénérer clé API sur OpenAI Dashboard

---

### **Erreur : "Model not found: chatgpt-5"**

```bash
# Votre compte n'a peut-être pas accès GPT-5 encore
# Fallback automatique vers GPT-4o
```

**Solution temporaire :**
```bash
# Tester d'abord avec GPT-4o
USE_GPT5_DIAGNOSTIC=false
USE_GPT5_ROUTINE=false
```

---

### **Timeout : "Request timeout"**

```bash
# GPT-5 Thinking peut prendre plus de temps
# Augmenter timeout
TIMEOUT_ROUTINE_MS=60000  # 60 secondes
```

---

### **Tests échouent : "Cannot find module"**

```bash
# Réinstaller dépendances
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 **MONITORING COÛTS LOCAUX**

### **Voir coûts en temps réel**

Les logs montrent automatiquement :
- `cost_usd` : Coût de la requête
- `daily_cost_total_usd` : Cumul quotidien
- `daily_budget_percentage` : % budget utilisé

### **Exemple budget quotidien**

```
10 tests complets locaux ≈ $2.50
50 tests complets locaux ≈ $12.50
Budget recommandé local : $50/jour
```

---

## ✅ **CHECKLIST TESTS LOCAUX**

Avant de déployer en staging/production :

- [ ] `.env.local` configuré avec variables GPT-5
- [ ] `npm test` → 43/43 tests passent
- [ ] `npm run build` → Build OK
- [ ] `npm run dev` → Serveur démarre sans erreur
- [ ] Test manuel complet → Routine générée
- [ ] Logs montrent `model: gpt-5-thinking`
- [ ] Validation compliance `valid: true`
- [ ] Aucun actif dangereux si grossesse
- [ ] Budget/Style respectés dans routine
- [ ] Coûts raisonnables (<$1/analyse)

---

## 🎯 **PROCHAINE ÉTAPE**

Une fois les tests locaux validés :

1. **Staging** : Déployer sur environnement de test
2. **Smoke tests** : 10 requêtes de validation
3. **Production 10%** : Rollout progressif

**Guide :** `docs/deployment/guide-deploiement-production.md`

---

## 📞 **AIDE**

**Problème configuration ?**
- Vérifier `docs/deployment/env-production.example` pour référence
- Comparer avec variables listées ci-dessus

**Erreur inattendue ?**
- Consulter `docs/deployment/rollback-procedure.md`
- Activer logs debug : `LOG_LEVEL=debug`

---

**Configuration mise à jour :** 30 septembre 2025  
**Testé avec :** Node.js 18+, Next.js 14, OpenAI SDK 4.x
