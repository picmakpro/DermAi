# 📊 Guide Monitoring - DermAI V2 + GPT-5

**Version :** 1.0  
**Date :** 30 septembre 2025  
**Statut :** 🟢 Opérationnel

---

## 🎯 **OBJECTIFS MONITORING**

### **Métriques Critiques**

| Métrique | Cible | Alerte Si |
|----------|-------|-----------|
| **Coût quotidien** | <$500 | >$500 (100%) ou >$400 (80%) |
| **Latency P95 Étape 2** | <35s | >45s |
| **Compliance routines** | 100% | <98% |
| **Sécurité grossesse** | 100% | 1 seul cas |
| **Taux erreur** | <1% | >2% |

---

## 💰 **MONITORING COÛTS**

### **Module CostMonitor**

**Fichier :** `src/utils/CostMonitor.ts`

#### **Fonctionnalités**

1. **Calcul coût par modèle** : GPT-5, GPT-4o, pricing différencié
2. **Tracking quotidien** : Cumul en temps réel (in-memory ou Redis)
3. **Alerting** : Webhook Slack/Discord si dépassement budget
4. **Métriques** : Export pour Grafana/Datadog

#### **Pricing Utilisé**

```typescript
const PRICING = {
  'chatgpt-5': {
    input: $0.03/1K tokens,
    output: $0.06/1K tokens
  },
  'gpt-5-thinking': {
    input: $0.04/1K tokens,
    output: $0.08/1K tokens,
    reasoning: $0.12/1K tokens  // x1.5 premium
  },
  'gpt-4o': {
    input: $0.0025/1K tokens,
    output: $0.01/1K tokens
  }
}
```

#### **Utilisation**

```typescript
import { CostMonitor } from '@/utils/CostMonitor'

// Calcul coût
const cost = CostMonitor.calculateCost('gpt-5-thinking', {
  prompt: 2000,
  completion: 3000,
  reasoning: 400,  // GPT-5 Thinking uniquement
  total: 5400
})

// Tracking quotidien
const summary = CostMonitor.trackCost(cost)

console.log(summary)
// {
//   date: '2025-09-30',
//   total_usd: 145.50,
//   total_requests: 650,
//   by_model: {
//     'gpt-5-thinking': { requests: 400, total_cost: 98.20 },
//     'gpt-4o': { requests: 250, total_cost: 47.30 }
//   },
//   budget_limit_usd: 500,
//   percentage_used: 29.1
// }
```

---

## 📝 **LOGS STRUCTURÉS**

### **Logs Étape 1 : Diagnostic**

```json
{
  "level": "info",
  "message": "🤖 RÉPONSE OPENAI ÉTAPE 1:",
  "requestId": "req_abc123",
  "operation": "diagnostic_success",
  "stage": "response_received",
  "metadata": {
    "model": "chatgpt-5",
    "fallbackUsed": false,
    "tokensUsed": 1800,
    "tokensPrompt": 1200,
    "tokensCompletion": 600,
    "duration_ms": 2340,
    "finishReason": "stop",
    "responseLength": 1450,
    "cost_usd": 0.072,
    "daily_cost_total_usd": 145.50,
    "daily_budget_percentage": 29.1
  }
}
```

### **Logs Étape 2 : Routine (GPT-5 Thinking)**

```json
{
  "level": "info",
  "message": "🧬 ÉTAPE 2 - Routine personnalisée SUCCESS:",
  "requestId": "req_abc123",
  "operation": "routine_generation",
  "stage": "success",
  "metadata": {
    "model": "gpt-5-thinking",
    "fallbackUsed": false,
    "tokensUsed": 5400,
    "tokensPrompt": 2000,
    "tokensCompletion": 3000,
    "tokensReasoning": 400,    // ✅ GPT-5 Thinking
    "duration_ms": 18500,
    "finishReason": "stop",
    "cost_usd": 0.148,
    "cost_breakdown": {
      "input_cost": 0.080,
      "output_cost": 0.240,
      "reasoning_cost": 0.048
    },
    "daily_cost_total_usd": 145.65,
    "daily_budget_percentage": 29.13
  }
}
```

### **Logs Validation Compliance**

```json
{
  "level": "info",
  "message": "🔍 Validation compliance routine",
  "requestId": "req_abc123",
  "operation": "routine_validation",
  "stage": "post_processing",
  "metadata": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "metrics": {
      "treatmentsCount": 2,
      "hebdosCount": 1,
      "morningStepsCount": 3,
      "eveningStepsCount": 4
    }
  }
}
```

---

## 🚨 **ALERTING**

### **Configuration Webhook**

**.env Production**
```bash
# Budget quotidien (USD)
OPENAI_DAILY_BUDGET_USD=500

# Webhook Slack/Discord/Teams
OPENAI_COST_ALERT_WEBHOOK=https://hooks.slack.com/services/xxx/yyy/zzz
```

### **Alertes Automatiques**

| Seuil | Message | Action |
|-------|---------|--------|
| **80% budget** | ⚠️ Budget quotidien 80% : $400 / $500 | Warning console |
| **100% budget** | 🚨 Budget quotidien dépassé : $520 / $500 | Webhook + console |

### **Format Alerte Slack**

```json
{
  "text": "🚨 Budget OpenAI quotidien dépassé",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*🚨 ALERTE BUDGET OPENAI*\n\n• Date: 2025-09-30\n• Coût actuel: $520.00\n• Budget limite: $500\n• Dépassement: 4%\n• Requêtes: 2340"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Répartition par modèle:*\n• gpt-5-thinking: 1500 req, $390.00\n• gpt-4o: 840 req, $130.00"
      }
    }
  ]
}
```

---

## 📊 **DASHBOARD GRAFANA (optionnel)**

### **Métriques Exportées**

**Endpoint :** `GET /api/monitoring/metrics`

```typescript
// src/app/api/monitoring/metrics/route.ts
import { CostMonitor } from '@/utils/CostMonitor'

export async function GET() {
  const metrics = CostMonitor.getMetrics()
  
  return Response.json({
    daily_cost_total: metrics.daily_cost_total,
    daily_requests_total: metrics.daily_requests_total,
    daily_budget_percentage: metrics.daily_budget_percentage,
    model_costs: metrics.model_costs
  })
}
```

### **Panels Grafana Recommandés**

#### **Panel 1 : Coûts Quotidiens**
```yaml
Query: sum(rate(openai_cost_usd_total[1d]))
Thresholds:
  - $400 (orange)
  - $500 (red)
```

#### **Panel 2 : Distribution Modèles**
```yaml
Query: sum by (model) (rate(openai_requests_total[24h]))
Type: Pie chart
```

#### **Panel 3 : Latency P95 Étape 2**
```yaml
Query: histogram_quantile(0.95, rate(routine_generation_duration_ms[5m]))
Thresholds:
  - 35s (green)
  - 45s (red)
```

#### **Panel 4 : Compliance Rate**
```yaml
Query: (sum(routine_validation_success) / sum(routine_validation_total)) * 100
Thresholds:
  - 98% (orange)
  - 100% (green)
```

---

## 🔍 **REQUÊTES LOGS**

### **Filtrer par requestId**

```bash
# Production logs (Vercel)
vercel logs --prod | grep "req_abc123"

# Logs locaux
grep "req_abc123" logs/app.log
```

### **Analyser coûts quotidiens**

```bash
# Extraire métriques coûts
grep "daily_cost_total_usd" logs/app.log | \
  jq '.metadata.daily_cost_total_usd' | \
  tail -1
```

### **Détecter erreurs validation**

```bash
# Routines non conformes
grep "Routine non conforme" logs/app.log | \
  jq '{requestId, errors: .metadata.errors}'
```

### **Statistiques par modèle**

```bash
# Compter requêtes par modèle
grep "RÉPONSE OPENAI" logs/app.log | \
  jq '.metadata.model' | \
  sort | uniq -c
```

---

## 📈 **MÉTRIQUES BUSINESS**

### **KPIs Mensuels**

| Métrique | Calcul | Target |
|----------|--------|--------|
| **Coût moyen/analyse** | `total_cost / total_analyses` | <$0.25 |
| **Taux fallback** | `(fallback_requests / total_requests) * 100` | <10% |
| **Taux compliance** | `(valid_routines / total_routines) * 100` | >98% |
| **Latency moyenne Étape 2** | `avg(duration_ms)` | <25s |

### **Requête Exemple (Agrégation)**

```typescript
// Coût moyen/analyse sur 30 jours
const last30Days = Array.from({length: 30}, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - i)
  return date.toISOString().split('T')[0]
})

const totalCost = last30Days.reduce((sum, date) => {
  const summary = CostMonitor.getDailyCostSummary(date)
  return sum + summary.total_usd
}, 0)

const totalRequests = last30Days.reduce((sum, date) => {
  const summary = CostMonitor.getDailyCostSummary(date)
  return sum + summary.total_requests
}, 0)

const avgCostPerAnalysis = totalCost / totalRequests

console.log(`Coût moyen/analyse (30j) : $${avgCostPerAnalysis.toFixed(3)}`)
```

---

## 🛠️ **TROUBLESHOOTING**

### **Problème : Coûts trop élevés**

**Symptôme :** Dépassement budget quotidien récurrent

**Diagnostic :**
```bash
# Analyser distribution modèles
grep "RÉPONSE OPENAI" logs/app.log | \
  jq '{model: .metadata.model, cost: .metadata.cost_usd}' | \
  jq -s 'group_by(.model) | map({model: .[0].model, total_cost: (map(.cost) | add)})'
```

**Solutions :**
1. Augmenter `GPT5_ROLLOUT_PERCENTAGE` progressivement (éviter 100% immédiat)
2. Activer fallback GPT-4o pour 50% trafic (coût -60%)
3. Réduire `max_tokens` si routines trop longues
4. Ajuster budget quotidien (`OPENAI_DAILY_BUDGET_USD`)

---

### **Problème : Latency élevée Étape 2**

**Symptôme :** P95 >45s

**Diagnostic :**
```bash
grep "Routine personnalisée SUCCESS" logs/app.log | \
  jq '.metadata.duration_ms' | \
  sort -n | tail -100
```

**Solutions :**
1. Vérifier `reasoning_effort` (passer de `high` à `medium`)
2. Réduire `max_tokens` (4000 → 3000)
3. Fallback temporaire GPT-4o (plus rapide)
4. Augmenter timeout (`TIMEOUT_ROUTINE_MS`)

---

### **Problème : Compliance <98%**

**Symptôme :** Routines rejetées par validation

**Diagnostic :**
```bash
grep "Routine non conforme" logs/app.log | \
  jq '.metadata.errors' | \
  jq -s 'flatten | group_by(.) | map({error: .[0], count: length})'
```

**Solutions :**
1. Analyser erreurs fréquentes (Budget dépassé ? Grossesse ?)
2. Ajuster Prompt V3 si nécessaire
3. Vérifier limites Budget/Style (`BUDGET_LIMITS`, `STYLE_LIMITS`)
4. Améliorer prompt engineering (exemples + contraintes)

---

## ✅ **CHECKLIST MONITORING PRODUCTION**

- [ ] `OPENAI_DAILY_BUDGET_USD` configuré
- [ ] `OPENAI_COST_ALERT_WEBHOOK` configuré (Slack/Discord)
- [ ] Logs structurés activés (niveau `info`)
- [ ] Dashboard Grafana/Datadog opérationnel (optionnel)
- [ ] Alertes testées (80% et 100% budget)
- [ ] Endpoint `/api/monitoring/metrics` déployé (optionnel)
- [ ] Procédures troubleshooting documentées
- [ ] Accès logs production configuré (Vercel/AWS)

---

## 📚 **RÉFÉRENCES**

| Document | Description |
|----------|-------------|
| `src/utils/CostMonitor.ts` | Module monitoring coûts |
| `src/services/ai/AnalysisService.ts` | Logs enrichis pipeline IA |
| `docs/sprint4-rapport-complet.md` | Rapport Sprint 4 (ce document fait partie) |
| OpenAI Pricing | https://openai.com/api/pricing/ |

---

**Dernière mise à jour :** 30 septembre 2025  
**Contact :** #tech-ia Slack

