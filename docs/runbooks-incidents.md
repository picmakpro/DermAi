# 🚨 RUNBOOKS INCIDENTS - DermAI V2

> **Guide opérationnel pour la gestion des incidents en production**  
> *Version : 1.0 - Sprint 4 Validation E2E*

---

## 📋 **VUE D'ENSEMBLE**

Ce document contient les procédures standardisées pour diagnostiquer et résoudre les incidents de production de DermAI V2. Chaque runbook suit le format : **Détection → Diagnostic → Action → Validation → Post-mortem**.

---

## 🔥 **INCIDENTS CRITIQUES (P0)**

### **INCIDENT P0-001 : Taux d'erreur > 10%**

#### **🚨 DÉTECTION**
- **Alerte** : Dashboard monitoring ou Vercel Analytics
- **Seuil** : Error rate > 10% sur 5 minutes consécutives
- **Impact** : Service dégradé pour tous les utilisateurs

#### **🔍 DIAGNOSTIC**
```bash
# 1. Vérifier statut API OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# 2. Vérifier logs Vercel
vercel logs --app dermai-v2 --since 10m

# 3. Vérifier métriques internes
curl https://dermai-v2.vercel.app/api/analyze?metrics=true
```

#### **⚡ ACTIONS IMMÉDIATES**
1. **Activer fallback mode** (si pas déjà fait)
   ```typescript
   // Dans analysis.service.ts
   const FORCE_FALLBACK = true // Activer temporairement
   ```

2. **Réduire charge serveur**
   - Limiter analyses simultanées à 5 max
   - Activer compression extrême images

3. **Communication utilisateurs**
   - Bannière "Maintenance en cours"
   - Estimation temps de résolution

#### **🔧 RÉSOLUTION**
- **Si erreur OpenAI** : Attendre rétablissement + monitoring
- **Si erreur Vercel** : Redéployer version stable
- **Si erreur code** : Rollback immédiat vers commit stable

#### **✅ VALIDATION**
- Error rate < 2% pendant 15 minutes consécutives
- Tests E2E passent sur environnement de production
- Fallback désactivé progressivement

#### **📝 POST-MORTEM**
- Documenter cause racine
- Améliorer monitoring si nécessaire
- Mettre à jour runbook avec nouvelles découvertes

---

### **INCIDENT P0-002 : Service complètement indisponible**

#### **🚨 DÉTECTION**
- **Alerte** : Uptime monitoring < 95%
- **Symptômes** : 500/502/503 errors sur toutes les routes
- **Impact** : Service inaccessible

#### **🔍 DIAGNOSTIC**
```bash
# 1. Vérifier statut Vercel
curl -I https://dermai-v2.vercel.app/

# 2. Vérifier déploiement récent
vercel ls dermai-v2

# 3. Vérifier variables d'environnement
vercel env ls
```

#### **⚡ ACTIONS IMMÉDIATES**
1. **Rollback immédiat**
   ```bash
   # Revenir au dernier déploiement stable
   vercel rollback dermai-v2 --to [DEPLOYMENT_ID]
   ```

2. **Page de maintenance**
   - Activer page statique de maintenance
   - Communication transparente aux utilisateurs

#### **🔧 RÉSOLUTION**
1. Identifier commit problématique
2. Corriger en local
3. Déployer fix avec tests complets
4. Monitoring intensif post-déploiement

---

## ⚠️ **INCIDENTS ÉLEVÉS (P1)**

### **INCIDENT P1-001 : Latence > 45s**

#### **🚨 DÉTECTION**
- **Seuil** : P95 latency > 45s pendant 10 minutes
- **Impact** : Expérience utilisateur dégradée

#### **🔍 DIAGNOSTIC**
```bash
# Vérifier performance API
curl -w "@curl-format.txt" -o /dev/null -s https://dermai-v2.vercel.app/api/analyze

# Vérifier usage mémoire Vercel
vercel logs --app dermai-v2 | grep "Memory"
```

#### **⚡ ACTIONS**
1. **Optimisation immédiate**
   - Activer compression extrême images
   - Réduire qualité compression à 0.3
   - Limiter à 2 analyses simultanées

2. **Monitoring renforcé**
   - Surveiller usage mémoire
   - Tracker taille payloads

#### **🔧 RÉSOLUTION**
- Optimiser prompts si nécessaire
- Ajuster limites Vercel
- Implémenter cache Redis si récurrent

---

### **INCIDENT P1-002 : Usage mémoire > 90%**

#### **🚨 DÉTECTION**
- **Seuil** : Memory usage > 90% pendant 5 minutes
- **Risque** : Crash imminent du service

#### **🔍 DIAGNOSTIC**
```javascript
// Vérifier mémoire côté client
console.log(performance.memory)

// Vérifier côté serveur
process.memoryUsage()
```

#### **⚡ ACTIONS**
1. **Libération mémoire immédiate**
   - Forcer garbage collection
   - Réduire cache en mémoire
   - Compression maximale images

2. **Limitation temporaire**
   - Max 1 analyse simultanée
   - Timeout réduit à 20s

---

## 📊 **INCIDENTS MOYENS (P2)**

### **INCIDENT P2-001 : Incohérence diagnostic-produits**

#### **🚨 DÉTECTION**
- **Seuil** : Coherence score < 80% pendant 1 heure
- **Impact** : Qualité recommandations dégradée

#### **🔍 DIAGNOSTIC**
```bash
# Vérifier logs cohérence
curl https://dermai-v2.vercel.app/api/analyze?metrics=true | jq '.coherence'

# Analyser patterns d'incohérence
grep "Incohérence détectée" logs/
```

#### **⚡ ACTIONS**
1. **Validation renforcée**
   - Activer validation stricte CoherenceValidator
   - Logs détaillés des incohérences

2. **Ajustement prompts**
   - Réviser prompts si pattern récurrent
   - Tester avec échantillon contrôlé

---

### **INCIDENT P2-002 : Fallback usage > 15%**

#### **🚨 DÉTECTION**
- **Seuil** : Fallback usage > 15% pendant 2 heures
- **Impact** : Qualité service dégradée

#### **🔍 DIAGNOSTIC**
- Analyser causes activation fallback
- Vérifier stabilité OpenAI API
- Examiner patterns d'erreurs

#### **⚡ ACTIONS**
1. **Investigation approfondie**
   - Logs détaillés erreurs OpenAI
   - Test manuel API OpenAI

2. **Optimisation fallback**
   - Améliorer qualité fallback statistique
   - Communication transparente utilisateurs

---

## 🛠️ **OUTILS DE DIAGNOSTIC**

### **Dashboard Monitoring**
```bash
# URL monitoring principal
https://dermai-v2.vercel.app/api/analyze?metrics=true

# Métriques clés à surveiller
{
  "uptime": "99.8%",
  "errorRate": "0.3%",
  "avgLatency": "18.5s",
  "p95Latency": "42.1s",
  "consistencyScore": "96.2%",
  "fallbackUsage": "2.1%",
  "memoryUsage": "67.3%"
}
```

### **Scripts de Diagnostic**
```bash
# Test complet santé service
./scripts/health-check.sh

# Test performance sous charge
./scripts/load-test.sh

# Validation E2E rapide
npm run test:e2e -- --grep "parcours complet"
```

### **Logs Structurés**
```bash
# Filtrer par type d'erreur
vercel logs | jq 'select(.level == "error")'

# Analyser latence par endpoint
vercel logs | jq 'select(.endpoint == "/api/analyze") | .duration'

# Tracer requête spécifique
vercel logs | jq 'select(.requestId == "req_123")'
```

---

## 📞 **ESCALADE ET COMMUNICATION**

### **Niveaux d'Escalade**
1. **P0 (Critique)** : Notification immédiate équipe + CEO
2. **P1 (Élevé)** : Notification équipe technique dans 15min
3. **P2 (Moyen)** : Rapport quotidien + suivi hebdomadaire

### **Canaux de Communication**
- **Slack** : #dermai-incidents (temps réel)
- **Email** : incidents@dermai.com (notifications)
- **Status Page** : status.dermai.com (communication publique)

### **Templates de Communication**

#### **Incident en cours**
```
🚨 INCIDENT P0 - Service DermAI Dégradé

STATUT: Investigation en cours
IMPACT: Analyses indisponibles (estimation 15min)
CAUSE: Investigating API timeout issues
ACTIONS: Fallback mode activé, équipe mobilisée

Prochaine mise à jour: 14h30
```

#### **Résolution incident**
```
✅ INCIDENT P0 - RÉSOLU

DURÉE: 23 minutes (13h45 - 14h08)
CAUSE: OpenAI API instability
RÉSOLUTION: Fallback mode + API recovery
IMPACT: ~150 utilisateurs affectés

Post-mortem: Jeudi 14h00
```

---

## 🔄 **AMÉLIORATION CONTINUE**

### **Métriques de Performance Runbooks**
- **MTTR** (Mean Time To Recovery) : < 15 minutes P0
- **MTTD** (Mean Time To Detection) : < 2 minutes P0
- **Faux positifs alertes** : < 5%
- **Couverture incidents** : 100% des cas documentés

### **Révision Mensuelle**
1. Analyser incidents du mois
2. Identifier patterns récurrents
3. Améliorer runbooks et monitoring
4. Former équipe sur nouveaux cas

### **Tests de Chaos**
- **Hebdomadaire** : Simulation panne OpenAI API
- **Mensuel** : Test complet disaster recovery
- **Trimestriel** : Exercice escalade équipe complète

---

## 📚 **RÉFÉRENCES RAPIDES**

### **URLs Critiques**
- Production : https://dermai-v2.vercel.app
- API Health : https://dermai-v2.vercel.app/api/test
- Metrics : https://dermai-v2.vercel.app/api/analyze?metrics=true
- Vercel Dashboard : https://vercel.com/dashboard

### **Contacts d'Urgence**
- **Équipe Tech** : +33 X XX XX XX XX
- **Vercel Support** : support@vercel.com
- **OpenAI Support** : help@openai.com

### **Commandes Rapides**
```bash
# Rollback immédiat
vercel rollback dermai-v2

# Logs temps réel
vercel logs --follow

# Test santé complet
curl -f https://dermai-v2.vercel.app/api/test || echo "FAIL"

# Métriques instantanées
curl -s https://dermai-v2.vercel.app/api/analyze?metrics=true | jq
```

---

*Runbooks Incidents DermAI V2 - Version 1.0*  
*Dernière mise à jour : Sprint 4 - Validation E2E*  
*Prochaine révision : Post-production*
