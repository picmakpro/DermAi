# 🚀 Guide Déploiement Production - Routine V2 + GPT-5

**Version :** 2.0  
**Date :** 30 septembre 2025  
**Statut :** 🟢 Production Ready

---

## 📋 **PRÉREQUIS**

### **Vérifications Obligatoires**

- [ ] Tous les tests passent (43/43 tests unitaires)
- [ ] Build local réussi (`npm run build`)
- [ ] Accès OpenAI API Key avec GPT-5 activé
- [ ] Accès Vercel CLI (`vercel --version`)
- [ ] Budget mensuel GPT-5 approuvé ($2,000-3,000/mois)
- [ ] Webhook Slack/Discord configuré (optionnel)
- [ ] Rollback procedure testée

---

## 🎯 **STRATÉGIE DÉPLOIEMENT**

### **Rollout Progressif (Recommandé)**

```
Staging 100%  →  Production 10%  →  Production 25%  →  Production 50%  →  Production 100%
   (2h)             (4h)               (6h)              (12h)             (24h)
```

**Principe :** Augmenter graduellement le pourcentage de trafic utilisant GPT-5 tout en surveillant métriques.

---

## 📦 **PHASE 1 : DÉPLOIEMENT STAGING**

### **Étape 1.1 : Configuration Staging**

```bash
cd /Users/mak/dermai-v2

# Configurer variables staging via Vercel Dashboard
# https://vercel.com/your-team/dermai-v2/settings/environment-variables
```

**Variables Staging :**
```bash
# Feature flags (100% GPT-5 en staging)
USE_GPT5_DIAGNOSTIC=true
USE_GPT5_ROUTINE=true
GPT5_ROLLOUT_PERCENTAGE=100

# Budget staging (plus bas que prod)
OPENAI_DAILY_BUDGET_USD=100

# Timeouts
TIMEOUT_DIAGNOSTIC_MS=25000
TIMEOUT_ROUTINE_MS=50000
```

---

### **Étape 1.2 : Build & Tests Pré-Déploiement**

```bash
# 1️⃣ LINTER
npm run lint

# 2️⃣ TYPES
npx tsc --noEmit

# 3️⃣ TESTS UNITAIRES
npm test

# 4️⃣ BUILD PRODUCTION
npm run build
```

**Résultats attendus :**
```
✅ Lint: 0 errors, 0 warnings
✅ TypeScript: 0 errors
✅ Tests: 43/43 passed (100%)
✅ Build: Success (.next/ créé)
```

---

### **Étape 1.3 : Déploiement Staging**

```bash
# Déployer sur staging
vercel deploy --env=preview

# Attendre déploiement (2-3 min)
# URL: https://dermai-v2-xxxxx.vercel.app
```

---

### **Étape 1.4 : Smoke Tests Staging**

```bash
# Test 1: Health check
curl https://dermai-v2-xxxxx.vercel.app/api/health

# Test 2: Analyse complète (requête test)
curl -X POST https://dermai-v2-xxxxx.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/request-essentiel-express.json

# Test 3: Vérifier logs
vercel logs --env=preview | grep "gpt-5-thinking"
```

**Validation :**
- [ ] Health check répond 200 OK
- [ ] Analyse complète réussie (<60s)
- [ ] Logs montrent `model: gpt-5-thinking`
- [ ] Aucune erreur critique

---

## 🚀 **PHASE 2 : PRODUCTION ROLLOUT 10%**

### **Étape 2.1 : Configuration Production 10%**

```bash
# Via Vercel Dashboard ou CLI
vercel env add GPT5_ROLLOUT_PERCENTAGE 10 production
vercel env add USE_GPT5_DIAGNOSTIC true production
vercel env add USE_GPT5_ROUTINE true production
vercel env add OPENAI_DAILY_BUDGET_USD 500 production
vercel env add TIMEOUT_ROUTINE_MS 50000 production
```

---

### **Étape 2.2 : Déploiement Production**

```bash
# Déployer en production
vercel deploy --prod

# URL: https://dermai-v2.vercel.app
```

---

### **Étape 2.3 : Validation Rollout 10% (4 heures)**

**Métriques à surveiller :**

| Métrique | Cible | Alerte Si |
|----------|-------|-----------|
| Latency P95 Étape 2 | <35s | >45s |
| Coût moyen/analyse | <$0.25 | >$0.35 |
| Taux erreur | <1% | >2% |
| Compliance routines | 100% | <98% |
| Taux fallback | <10% | >20% |

**Commandes monitoring :**

```bash
# 1. Analyser logs (dernière heure)
vercel logs --prod --since=1h | grep "gpt-5-thinking" | wc -l

# 2. Vérifier coûts quotidiens
vercel logs --prod --since=1h | grep "daily_cost_total_usd" | tail -1

# 3. Détecter erreurs
vercel logs --prod --since=1h | grep -E "error|ERROR" | wc -l

# 4. Vérifier compliance
vercel logs --prod --since=1h | grep "Validation compliance" | grep "valid: true" | wc -l
```

**Checklist validation 4h :**
- [ ] ≥50 analyses GPT-5 réussies
- [ ] Latency P95 <35s
- [ ] Coût moyen <$0.25/analyse
- [ ] 0 erreur grossesse
- [ ] Compliance 100%
- [ ] Aucun incident critique

---

## 📈 **PHASE 3 : MONTÉE PROGRESSIVE**

### **Rollout 25% (6 heures)**

```bash
# J+0 16h00
vercel env add GPT5_ROLLOUT_PERCENTAGE 25 production
vercel deploy --prod
```

**Validation 6h :**
- [ ] Latency stable
- [ ] Budget quotidien <$500
- [ ] Aucune régression

---

### **Rollout 50% (12 heures)**

```bash
# J+1 10h00
vercel env add GPT5_ROLLOUT_PERCENTAGE 50 production
vercel deploy --prod
```

**Validation 12h :**
- [ ] Métriques stables
- [ ] Budget quotidien <$500
- [ ] Satisfaction utilisateurs

---

### **Rollout 100% (24 heures)**

```bash
# J+2 10h00
vercel env add GPT5_ROLLOUT_PERCENTAGE 100 production
vercel deploy --prod
```

**Validation 24h :**
- [ ] 100% trafic GPT-5
- [ ] Métriques stables
- [ ] Aucun incident

---

## 🔴 **ROLLBACK D'URGENCE**

### **Procédure Rollback (<2 minutes)**

```bash
# 1️⃣ DÉSACTIVER GPT-5 IMMÉDIATEMENT
vercel env add USE_GPT5_ROUTINE false production
vercel deploy --prod

# 2️⃣ VÉRIFIER FALLBACK GPT-4o
curl https://dermai-v2.vercel.app/api/analyze | grep "gpt-4o"

# 3️⃣ ALERTER ÉQUIPE
# Slack: #incidents
# Message: "GPT-5 désactivé → Fallback GPT-4o actif"

# 4️⃣ ANALYSER LOGS
vercel logs --prod --since=10m | grep -E "error|ERROR"
```

**Triggers rollback :**
- Latency P95 >60s pendant >10min
- Taux erreur >5%
- Budget quotidien >$600
- Erreur grossesse détectée
- Incident critique utilisateur

---

## 📊 **MONITORING POST-DÉPLOIEMENT**

### **Dashboard Métriques**

**Accès :** https://vercel.com/your-team/dermai-v2/analytics

**Métriques clés :**
1. **Requests/hour** : Trafic total
2. **P95 latency** : Performance
3. **Error rate** : Fiabilité
4. **Cost/analysis** : Budget

---

### **Logs Structurés**

```bash
# Filtrer par requestId
vercel logs --prod | grep "req_abc123"

# Analyser coûts quotidiens
vercel logs --prod | grep "daily_cost_total_usd" | tail -1

# Détecter erreurs validation
vercel logs --prod | grep "Routine non conforme"

# Stats par modèle
vercel logs --prod | grep "RÉPONSE OPENAI" | \
  jq '.metadata.model' | sort | uniq -c
```

---

### **Alertes Slack/Discord**

**Webhook configuré :** `OPENAI_COST_ALERT_WEBHOOK`

**Alertes automatiques :**
- ⚠️ Budget 80% ($400/$500)
- 🚨 Budget 100% ($500/$500)
- ❌ Erreur grossesse détectée
- 🔴 Taux erreur >2%

---

## ✅ **CHECKLIST FINALE**

### **Pré-Déploiement**
- [ ] Tests 43/43 passent
- [ ] Build local OK
- [ ] Variables staging configurées
- [ ] Smoke tests staging OK
- [ ] Rollback procedure testée

### **Déploiement Production**
- [ ] Variables production configurées
- [ ] Rollout 10% déployé
- [ ] Validation 4h OK
- [ ] Rollout 25% déployé
- [ ] Validation 6h OK
- [ ] Rollout 50% déployé
- [ ] Validation 12h OK
- [ ] Rollout 100% déployé
- [ ] Validation 24h OK

### **Post-Déploiement**
- [ ] Monitoring actif
- [ ] Alertes configurées
- [ ] Documentation à jour
- [ ] Équipe informée
- [ ] Runbook rollback disponible

---

## 📚 **RÉFÉRENCES**

| Document | Description |
|----------|-------------|
| `docs/deployment/env-production.example` | Variables environnement |
| `docs/deployment/rollback-procedure.md` | Procédure rollback détaillée |
| `docs/monitoring-guide.md` | Guide monitoring production |
| `docs/sprint5-rapport-complet.md` | Rapport Sprint 5 |

---

## 🆘 **SUPPORT URGENCE**

**Contacts :**
- Slack : `#tech-ia`
- Email : cto@dermai.com
- On-call : +33 X XX XX XX XX

**Escalation :**
1. Développeur on-call (0-30min)
2. CTO (30min-2h)
3. CEO (>2h / incident critique)

---

**Guide mis à jour :** 30 septembre 2025  
**Prochaine révision :** Après rollout 100%
