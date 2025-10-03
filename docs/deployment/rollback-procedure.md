# 🔴 Procédure Rollback Urgence - GPT-5

**Version :** 1.0  
**Date :** 30 septembre 2025  
**Objectif :** Rollback <2 minutes en cas d'incident critique

---

## 🚨 **QUAND DÉCLENCHER UN ROLLBACK ?**

### **Triggers Automatiques**

| Trigger | Seuil | Gravité |
|---------|-------|---------|
| **Latency P95** | >60s pendant >10min | 🔴 Critique |
| **Taux erreur** | >5% | 🔴 Critique |
| **Budget quotidien** | >$600 | 🟠 Majeur |
| **Erreur grossesse** | ≥1 cas | 🔴 Critique |
| **Compliance** | <95% | 🟠 Majeur |
| **Incident utilisateur** | Critique (data loss, etc.) | 🔴 Critique |

---

## ⚡ **ROLLBACK RAPIDE (<2 MINUTES)**

### **Méthode 1 : Feature Flag (RECOMMANDÉ)**

```bash
# ══════════════════════════════════════════════════════════════
# ROLLBACK EXPRESS - DÉSACTIVER GPT-5
# ══════════════════════════════════════════════════════════════

# 1️⃣ Désactiver GPT-5 Routine (fallback GPT-4o)
vercel env rm USE_GPT5_ROUTINE production
vercel env add USE_GPT5_ROUTINE false production

# 2️⃣ Redéployer IMMÉDIATEMENT
vercel deploy --prod --yes

# ⏱️ Temps estimé: 90 secondes
```

**Résultat :**
- ✅ GPT-5 Thinking désactivé
- ✅ Fallback automatique GPT-4o
- ✅ Latency réduite (~15s vs ~30s)
- ✅ Coût réduit (-60%)

---

### **Méthode 2 : Rollout 0% (Alternative)**

```bash
# ══════════════════════════════════════════════════════════════
# ROLLBACK PROGRESSIF - ROLLOUT 0%
# ══════════════════════════════════════════════════════════════

# 1️⃣ Passer rollout à 0%
vercel env rm GPT5_ROLLOUT_PERCENTAGE production
vercel env add GPT5_ROLLOUT_PERCENTAGE 0 production

# 2️⃣ Redéployer
vercel deploy --prod --yes

# ⏱️ Temps estimé: 90 secondes
```

**Résultat :**
- ✅ 100% trafic sur GPT-4o
- ✅ GPT-5 reste activé (rollout 0%)
- ✅ Possibilité de remonter graduellement

---

## 🔍 **VÉRIFICATION POST-ROLLBACK**

### **Étape 1 : Vérifier Fallback Actif**

```bash
# Test API (vérifier modèle utilisé)
curl -X POST https://dermai-v2.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/request-test.json | \
  jq '.metadata.model'

# Résultat attendu: "gpt-4o"
```

---

### **Étape 2 : Analyser Logs (5 dernières minutes)**

```bash
# Vérifier aucun appel GPT-5
vercel logs --prod --since=5m | grep "gpt-5-thinking" | wc -l
# Résultat attendu: 0

# Vérifier appels GPT-4o
vercel logs --prod --since=5m | grep "gpt-4o" | wc -l
# Résultat attendu: >0

# Détecter erreurs
vercel logs --prod --since=5m | grep -E "error|ERROR" | wc -l
# Résultat attendu: 0 ou faible
```

---

### **Étape 3 : Valider Métriques**

```bash
# Latency moyenne (doit baisser)
vercel logs --prod --since=5m | grep "duration_ms" | \
  jq '.metadata.duration_ms' | \
  awk '{sum+=$1; count++} END {print "Latency moyenne:", sum/count, "ms"}'

# Résultat attendu: <20000ms (20s)
```

---

## 📢 **COMMUNICATION INCIDENT**

### **Template Slack (#incidents)**

```markdown
🚨 **ROLLBACK GPT-5 DÉCLENCHÉ**

**Heure :** [HH:MM]
**Trigger :** [Latency/Erreur/Budget/etc.]
**Action :** GPT-5 désactivé → Fallback GPT-4o actif

**Status :**
- ✅ Rollback terminé (<2min)
- ✅ GPT-4o opérationnel
- ⏳ Analyse root cause en cours

**Impact utilisateurs :** Minime (fallback transparent)

**Prochaines étapes :**
1. Analyse logs
2. Identification root cause
3. Fix + re-déploiement progressif

**Contact :** @cto @dev-on-call
```

---

### **Template Email Stakeholders**

```
Objet: [INCIDENT RÉSOLU] Rollback GPT-5 → GPT-4o

Bonjour,

Suite à un incident technique détecté à [HH:MM], nous avons procédé à un rollback rapide du système GPT-5 vers GPT-4o (fallback stable).

Détails :
- Trigger: [Latency élevée/Erreurs/etc.]
- Action: Rollback feature flag (<2min)
- Impact: Minime (fallback transparent pour utilisateurs)
- Status: Résolu, système stable

Prochaines étapes :
1. Analyse root cause (en cours)
2. Fix et tests (estimation 2-4h)
3. Re-déploiement progressif (après validation)

Équipe DermAI Tech
```

---

## 🔬 **ANALYSE ROOT CAUSE**

### **Checklist Investigation**

- [ ] **Logs erreurs** : Identifier pattern commun
- [ ] **Métriques** : Comparer avant/après incident
- [ ] **Trafic** : Vérifier pic inhabituel
- [ ] **Config** : Valider variables environnement
- [ ] **OpenAI** : Vérifier status API OpenAI
- [ ] **Infra** : Vérifier Vercel status

---

### **Commandes Diagnostiques**

```bash
# 1. Logs complets incident (dernière heure avant rollback)
vercel logs --prod --since=1h --until=[timestamp-rollback] | \
  grep -E "error|ERROR|timeout|TIMEOUT" > incident-logs.txt

# 2. Métriques détaillées
vercel logs --prod --since=1h --until=[timestamp-rollback] | \
  jq '{
    model: .metadata.model, 
    duration: .metadata.duration_ms, 
    cost: .metadata.cost_usd, 
    error: .error
  }' > incident-metrics.json

# 3. Requêtes problématiques
vercel logs --prod --since=1h --until=[timestamp-rollback] | \
  grep "duration_ms.*[6-9][0-9][0-9][0-9][0-9]" | \
  jq '.requestId' > slow-requests.txt
```

---

## 🔄 **RETOUR PROGRESSIF GPT-5**

### **Après Fix Validé**

```bash
# 1️⃣ STAGING : Valider fix
vercel deploy --env=preview

# Smoke tests (10 requêtes)
for i in {1..10}; do
  curl -X POST https://dermai-v2-xxxxx.vercel.app/api/analyze \
    -H "Content-Type: application/json" \
    -d @tests/fixtures/request-test-$i.json
done

# 2️⃣ PRODUCTION 10% : Re-activer progressivement
vercel env add GPT5_ROLLOUT_PERCENTAGE 10 production
vercel deploy --prod

# Validation 2h
# [Surveiller métriques]

# 3️⃣ MONTÉE GRADUELLE : 25% → 50% → 100%
# [Suivre procédure déploiement progressive]
```

---

## 📊 **POST-MORTEM**

### **Template Rapport Incident**

```markdown
# Post-Mortem - Incident GPT-5 [DATE]

## Résumé
- **Date/Heure :** [HH:MM]
- **Durée :** [Xmin]
- **Impact :** [X utilisateurs / Y requêtes]
- **Résolution :** Rollback GPT-4o

## Timeline
- [HH:MM] : Détection anomalie (Latency >60s)
- [HH:MM+2] : Alerte automatique déclenchée
- [HH:MM+3] : Rollback initié
- [HH:MM+5] : Rollback validé
- [HH:MM+30] : Analyse root cause démarrée

## Root Cause
[Description technique détaillée]

## Actions Correctives
1. [Action 1] - Responsable: [Nom] - ETA: [Date]
2. [Action 2] - Responsable: [Nom] - ETA: [Date]

## Leçons Apprises
- [Leçon 1]
- [Leçon 2]

## Prévention Future
- [Amélioration 1]
- [Amélioration 2]
```

---

## ✅ **CHECKLIST ROLLBACK COMPLET**

### **Pendant l'incident**
- [ ] Rollback déclenché (<2min)
- [ ] Vérification fallback GPT-4o OK
- [ ] Logs analysés (5 dernières minutes)
- [ ] Équipe alertée (Slack)
- [ ] Stakeholders informés (Email)

### **Post-rollback**
- [ ] Root cause identifiée
- [ ] Fix développé et testé
- [ ] Validation staging OK
- [ ] Re-déploiement progressif planifié
- [ ] Post-mortem rédigé
- [ ] Actions préventives définies

---

## 📚 **RÉFÉRENCES RAPIDES**

| Commande | Description |
|----------|-------------|
| `vercel env add USE_GPT5_ROUTINE false production` | Désactiver GPT-5 |
| `vercel deploy --prod --yes` | Déployer immédiatement |
| `vercel logs --prod --since=5m` | Logs 5 dernières minutes |
| `vercel env ls production` | Lister variables prod |

---

## 🆘 **CONTACTS URGENCE**

**On-call :** +33 X XX XX XX XX  
**Slack :** `#incidents`  
**Email :** cto@dermai.com

---

**Procédure validée :** 30 septembre 2025  
**Dernière révision :** Post-déploiement GPT-5  
**Prochaine révision :** Mensuelle

