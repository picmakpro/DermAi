# ⚙️ Configuration GPT-5 - Staging & Production

**Date:** 30 septembre 2025  
**Version:** Routine V2 + GPT-5 Thinking

---

## 📋 **VARIABLES D'ENVIRONNEMENT REQUISES**

### **🤖 Modèles IA V2**

```bash
# Étape 1 : Diagnostic Pur (Vision)
AI_MODEL_DIAGNOSTIC=chatgpt-5

# Étape 2 : Routine Personnalisée (Reasoning)
AI_MODEL_ROUTINE=gpt-5-thinking

# Étape 3 : Sélection Produits (Précision)
AI_MODEL_PRODUCTS=gpt-4o
```

---

### **🎛️ Feature Flags**

```bash
# Activer GPT-5 pour Diagnostic
USE_GPT5_DIAGNOSTIC=true

# Activer GPT-5 Thinking pour Routine
USE_GPT5_ROUTINE=true

# Rollout progressif (% trafic GPT-5)
# STAGING: 100%
# PRODUCTION: 10% → 25% → 50% → 100%
GPT5_ROLLOUT_PERCENTAGE=100
```

---

### **⏱️ Timeouts (Ajustés GPT-5)**

```bash
# Étape 1 : Diagnostic (25s vs 20s GPT-4o)
TIMEOUT_DIAGNOSTIC_MS=25000

# Étape 2 : Routine (50s vs 45s, reasoning overhead)
TIMEOUT_ROUTINE_MS=50000

# Étape 3 : Produits (inchangé)
TIMEOUT_PRODUCTS_MS=30000
```

---

### **💰 Monitoring Coûts**

```bash
# Budget quotidien (USD)
OPENAI_DAILY_BUDGET_USD=500

# Webhook Slack pour alertes
OPENAI_COST_ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR_WEBHOOK
```

---

### **🔒 Sécurité & Validation**

```bash
# Validation stricte Budget/Style
ENABLE_ROUTINE_VALIDATION=true

# Bloquer si grossesse + rétinoïde
STRICT_PREGNANCY_VALIDATION=true
```

---

### **📈 Observabilité**

```bash
# Niveau de log
LOG_LEVEL=debug

# Logs détaillés GPT-5 (reasoning_tokens, fallback)
LOG_GPT5_DETAILS=true

# Métriques temps réel
ENABLE_METRICS=true
```

---

## 🚀 **PROCÉDURE CONFIGURATION VERCEL**

### **Staging**

```bash
# 1. Configurer variables Vercel Staging
vercel env add AI_MODEL_DIAGNOSTIC chatgpt-5 staging
vercel env add AI_MODEL_ROUTINE gpt-5-thinking staging
vercel env add USE_GPT5_DIAGNOSTIC true staging
vercel env add USE_GPT5_ROUTINE true staging
vercel env add GPT5_ROLLOUT_PERCENTAGE 100 staging
vercel env add TIMEOUT_DIAGNOSTIC_MS 25000 staging
vercel env add TIMEOUT_ROUTINE_MS 50000 staging
vercel env add OPENAI_DAILY_BUDGET_USD 500 staging
vercel env add ENABLE_ROUTINE_VALIDATION true staging
vercel env add LOG_LEVEL debug staging
vercel env add LOG_GPT5_DETAILS true staging

# 2. Déployer
vercel deploy --env=staging
```

---

### **Production (Rollout Progressif)**

#### **Phase 1 : 10% Trafic**

```bash
# Variables Production (démarrer 10%)
vercel env add AI_MODEL_DIAGNOSTIC chatgpt-5 production
vercel env add AI_MODEL_ROUTINE gpt-5-thinking production
vercel env add USE_GPT5_DIAGNOSTIC true production
vercel env add USE_GPT5_ROUTINE true production
vercel env add GPT5_ROLLOUT_PERCENTAGE 10 production  # ✅ 10%
vercel env add TIMEOUT_DIAGNOSTIC_MS 25000 production
vercel env add TIMEOUT_ROUTINE_MS 50000 production
vercel env add OPENAI_DAILY_BUDGET_USD 500 production
vercel env add ENABLE_ROUTINE_VALIDATION true production
vercel env add STRICT_PREGNANCY_VALIDATION true production
vercel env add LOG_LEVEL info production  # info en prod (pas debug)
vercel env add LOG_GPT5_DETAILS true production

# Déployer
vercel deploy --prod
```

#### **Phase 2 : 25% Trafic (après validation 10%)**

```bash
vercel env rm GPT5_ROLLOUT_PERCENTAGE production
vercel env add GPT5_ROLLOUT_PERCENTAGE 25 production
vercel deploy --prod
```

#### **Phase 3 : 50% Trafic**

```bash
vercel env rm GPT5_ROLLOUT_PERCENTAGE production
vercel env add GPT5_ROLLOUT_PERCENTAGE 50 production
vercel deploy --prod
```

#### **Phase 4 : 100% GA**

```bash
vercel env rm GPT5_ROLLOUT_PERCENTAGE production
vercel env add GPT5_ROLLOUT_PERCENTAGE 100 production
vercel deploy --prod
```

---

## 🔄 **ROLLBACK D'URGENCE**

### **Désactiver GPT-5 (<30s)**

```bash
# Méthode 1 : Feature flag (plus rapide)
vercel env rm USE_GPT5_ROUTINE production
vercel env add USE_GPT5_ROUTINE false production

# Méthode 2 : Rollout 0%
vercel env rm GPT5_ROLLOUT_PERCENTAGE production
vercel env add GPT5_ROLLOUT_PERCENTAGE 0 production

# Redéployer
vercel deploy --prod
```

### **Vérifier Fallback Actif**

```bash
# Vérifier logs production
vercel logs --prod | grep "model"

# Devrait afficher:
# ✅ "model": "gpt-4o" (fallback actif)
# ❌ "model": "gpt-5-thinking" (désactivé)
```

---

## 📊 **MÉTRIQUES À SURVEILLER**

### **Grafana Dashboard**

Variables à monitorer :
- `model_used` (gpt-5-thinking vs gpt-4o)
- `fallback_triggered` (true/false)
- `tokens_reasoning` (GPT-5 uniquement)
- `routine_generation_duration_ms` (P50, P95, P99)
- `openai_cost_usd_daily` (cumul)
- `routine_validation_errors` (count)
- `pregnancy_violations` (MUST be 0)

### **Alertes**

```yaml
# Alert 1: Latency élevée
- condition: P95 > 45s (45000ms)
  action: Slack #tech-alerts
  
# Alert 2: Budget dépassé
- condition: daily_cost > $500
  action: Slack #tech-cto + Email

# Alert 3: Validation échoue
- condition: validation_errors > 2% requests
  action: Slack #tech-alerts + PagerDuty

# Alert 4: Grossesse violation
- condition: pregnancy_violations > 0
  action: Slack #tech-alerts + Email CTO + Rollback auto
```

---

## ✅ **CHECKLIST DÉPLOIEMENT**

### **Avant Staging**
- [ ] Variables configurées Vercel Staging
- [ ] OPENAI_API_KEY valide (testé)
- [ ] Webhook Slack configuré (alerte testée)
- [ ] Dashboard Grafana prêt

### **Avant Production 10%**
- [ ] Tests Staging 100% OK (>50 analyses)
- [ ] Latency P95 <35s validé
- [ ] Coût moyen <$0.25/analyse
- [ ] 0 erreur grossesse
- [ ] Compliance 100%
- [ ] Rollback testé (staging)

### **Avant Passage 25% → 50% → 100%**
- [ ] 4h trafic stable au palier précédent
- [ ] Aucune régression latency
- [ ] Budget quotidien respecté
- [ ] Satisfaction utilisateurs ≥ baseline

---

## 📚 **RÉFÉRENCES**

- Plan implémentation : `docs/plan-implementation-routine-v2-gpt5.md`
- Rollback procédure : `archive/prompts-backup-20250930/README-ROLLBACK.md`
- Prompt V3 source : `docs/Prompt-RoutineV3`

---

**Configuration documentée : 30 septembre 2025**  
**Prochaine révision : Après Sprint 1**

