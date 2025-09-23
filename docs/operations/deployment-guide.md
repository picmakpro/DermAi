# 🚀 GUIDE DÉPLOIEMENT PRODUCTION - DermAI V2

> **Procédures complètes pour déploiement sécurisé en production**  
> *Version : 1.0 - Sprint 4 Validation E2E*

---

## 📋 **CHECKLIST PRÉ-DÉPLOIEMENT**

### ✅ **Validation Technique**
- [ ] **Tests E2E** : 100% passés (Playwright)
- [ ] **Tests Unitaires** : Couverture >90% services critiques
- [ ] **Tests Performance** : Latence P95 <25s validée
- [ ] **Tests Charge** : 50 analyses simultanées sans crash
- [ ] **Validation Mobile** : Responsive design testé
- [ ] **Linting** : Aucune erreur ESLint/TypeScript
- [ ] **Build Production** : `npm run build` sans erreur

### ✅ **Validation Fonctionnelle**
- [ ] **Parcours Complet** : Upload → Questionnaire → Analyse → Résultats
- [ ] **Gestion Erreurs** : Timeouts, fallback, retry testés
- [ ] **Cohérence Diagnostic** : Validation croisée produits/budget
- [ ] **Compression Images** : Adaptative selon mémoire
- [ ] **Monitoring** : Métriques temps réel opérationnelles

### ✅ **Sécurité et Configuration**
- [ ] **Variables Environnement** : Toutes définies et sécurisées
- [ ] **Clés API** : Rotation récente et accès restreint
- [ ] **Headers Sécurité** : CSP, HSTS, X-Frame-Options
- [ ] **Audit Dépendances** : `npm audit` sans vulnérabilités critiques
- [ ] **Logs Sensibles** : Aucune donnée personnelle exposée

---

## 🔧 **CONFIGURATION ENVIRONNEMENT**

### **Variables d'Environnement Requises**

#### **Production (Vercel)**
```env
# IA et APIs
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxx
NODE_ENV=production

# Application
NEXT_PUBLIC_APP_URL=https://dermai-v2.vercel.app
NEXT_PUBLIC_APP_NAME=DermAI V2

# Monitoring et Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://xxxxxxxxx@sentry.io/xxxxxxx

# Features Flags
ENABLE_FALLBACK=true
ENABLE_MONITORING=true
ENABLE_COMPRESSION_ADAPTIVE=true

# Limites et Performance
MAX_CONCURRENT_ANALYSES=10
COMPRESSION_QUALITY_DEFAULT=0.6
TIMEOUT_CLIENT_MS=30000
TIMEOUT_SERVER_MS=35000

# Sécurité
ALLOWED_ORIGINS=https://dermai-v2.vercel.app
CSP_REPORT_URI=https://dermai-v2.report-uri.com/r/d/csp/enforce
```

#### **Staging (Test)**
```env
# Hérite de production avec overrides
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://dermai-v2-staging.vercel.app
OPENAI_API_KEY=sk-test-xxxxxxxxxxxxxxxxx
ENABLE_DEBUG_LOGS=true
```

### **Configuration Vercel (vercel.json)**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "functions": {
    "src/app/api/analyze/route.ts": {
      "maxDuration": 35,
      "memory": 1024,
      "regions": ["iad1"]
    },
    "src/app/api/chat/route.ts": {
      "maxDuration": 15,
      "memory": 512,
      "regions": ["iad1"]
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://api.openai.com https://www.google-analytics.com; frame-ancestors 'none';"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/health",
      "destination": "/api/test"
    }
  ]
}
```

---

## 🎯 **PROCÉDURES DE DÉPLOIEMENT**

### **Déploiement Standard (Feature)**

#### **1. Préparation**
```bash
# 1. Synchroniser avec main
git checkout main
git pull origin main

# 2. Créer branche feature
git checkout -b feat/sprint4-optimizations

# 3. Développement et tests
npm run test
npm run test:e2e
npm run lint

# 4. Build local validation
npm run build
```

#### **2. Tests Pré-Déploiement**
```bash
# Tests complets
npm run test:coverage
npm run test:e2e -- --project="chromium"

# Validation performance
npm run test:e2e -- --grep "performance"

# Audit sécurité
npm audit --audit-level=moderate
```

#### **3. Déploiement Staging**
```bash
# Deploy vers staging
vercel --target staging

# Tests sur staging
curl -f https://dermai-v2-staging.vercel.app/api/test
npm run test:e2e -- --config=playwright.staging.config.ts
```

#### **4. Déploiement Production**
```bash
# Merge vers main
git checkout main
git merge feat/sprint4-optimizations
git push origin main

# Deploy production
vercel --prod

# Validation immédiate
curl -f https://dermai-v2.vercel.app/api/test
```

### **Déploiement Hotfix (Urgence)**

#### **Procédure Accélérée**
```bash
# 1. Branche hotfix depuis main
git checkout main
git checkout -b hotfix/critical-fix

# 2. Fix minimal et tests critiques
npm run test -- --testPathPattern="critical"
npm run build

# 3. Déploiement direct production
vercel --prod

# 4. Validation immédiate
./scripts/health-check.sh

# 5. Merge post-déploiement
git checkout main
git merge hotfix/critical-fix
```

### **Rollback d'Urgence**

#### **Procédure Rollback**
```bash
# 1. Identifier dernier déploiement stable
vercel ls dermai-v2

# 2. Rollback immédiat
vercel rollback dermai-v2 --to [DEPLOYMENT_ID]

# 3. Validation rollback
curl -f https://dermai-v2.vercel.app/api/test

# 4. Communication incident
# Utiliser template runbooks-incidents.md
```

---

## 📊 **MONITORING POST-DÉPLOIEMENT**

### **Validation Immédiate (0-15min)**
```bash
# 1. Health check complet
curl -f https://dermai-v2.vercel.app/api/test

# 2. Test parcours critique
npm run test:e2e -- --grep "parcours complet" --timeout 60000

# 3. Métriques baseline
curl -s https://dermai-v2.vercel.app/api/analyze?metrics=true | jq

# 4. Logs temps réel
vercel logs --follow --since 5m
```

### **Surveillance Continue (15min-2h)**
- **Error Rate** : Doit rester <2%
- **Latence P95** : Doit rester <30s
- **Memory Usage** : Doit rester <80%
- **Fallback Usage** : Doit rester <5%

### **Métriques de Succès (2h-24h)**
- **Uptime** : >99.5%
- **User Satisfaction** : Pas d'augmentation complaints
- **Performance** : Pas de dégradation vs baseline
- **Cohérence** : Score >90%

---

## 🔒 **SÉCURITÉ ET CONFORMITÉ**

### **Checklist Sécurité**
- [ ] **Rotation Clés** : Clés API <90 jours
- [ ] **Headers Sécurité** : CSP, HSTS, X-Frame-Options
- [ ] **Audit Logs** : Pas d'exposition données sensibles
- [ ] **Dépendances** : Aucune vulnérabilité critique
- [ ] **HTTPS** : Certificats valides et à jour

### **Conformité RGPD**
- [ ] **Consentement** : Collecte explicite données
- [ ] **Anonymisation** : Logs et analytics anonymisés
- [ ] **Droit Effacement** : Procédure suppression données
- [ ] **Portabilité** : Export données utilisateur

### **Audit de Sécurité**
```bash
# Scan vulnérabilités
npm audit --audit-level=moderate

# Test headers sécurité
curl -I https://dermai-v2.vercel.app | grep -E "(X-|Strict|Content-Security)"

# Validation HTTPS
openssl s_client -connect dermai-v2.vercel.app:443 -servername dermai-v2.vercel.app
```

---

## 🚨 **PROCÉDURES D'URGENCE**

### **Incident Critique (P0)**
1. **Détection** : Monitoring automatique ou rapport utilisateur
2. **Évaluation** : Impact et criticité (< 2 minutes)
3. **Action** : Rollback ou hotfix selon contexte
4. **Communication** : Notification équipe + utilisateurs
5. **Résolution** : Fix définitif + post-mortem

### **Contacts d'Urgence**
- **Tech Lead** : +33 X XX XX XX XX
- **DevOps** : devops@dermai.com
- **CEO** : ceo@dermai.com

### **Outils d'Urgence**
```bash
# Rollback immédiat
vercel rollback dermai-v2

# Status service
curl -f https://dermai-v2.vercel.app/health || echo "SERVICE DOWN"

# Logs erreurs
vercel logs | grep ERROR | tail -20

# Métriques instantanées
curl -s https://dermai-v2.vercel.app/api/analyze?metrics=true
```

---

## 📈 **OPTIMISATIONS PERFORMANCE**

### **Configuration Vercel Optimisée**
- **Régions** : US East (iad1) pour latence OpenAI optimale
- **Mémoire** : 1024MB pour analyses IA
- **Timeout** : 35s pour analyses complexes
- **Cache** : Headers optimisés pour assets statiques

### **Optimisations Code**
- **Compression Images** : Adaptative selon mémoire
- **Prompts** : Versions compactes (-40% tokens)
- **Bundle Splitting** : Lazy loading composants lourds
- **Service Worker** : Cache offline pour améliorer UX

### **Monitoring Performance**
```bash
# Lighthouse CI
npx lighthouse-ci autorun

# Bundle analyzer
npm run analyze

# Performance monitoring
curl -w "@curl-format.txt" https://dermai-v2.vercel.app
```

---

## 📚 **DOCUMENTATION ET FORMATION**

### **Documentation Technique**
- **Architecture** : `docs/architecture-fiabilite.md`
- **API** : `docs/api-documentation.md`
- **Runbooks** : `docs/runbooks-incidents.md`
- **Tests** : `tests/README.md`

### **Formation Équipe**
1. **Onboarding** : Architecture et stack technique
2. **Déploiement** : Procédures et outils
3. **Monitoring** : Dashboard et alertes
4. **Incidents** : Runbooks et escalade

### **Procédures Maintenance**
- **Hebdomadaire** : Audit logs et métriques
- **Mensuel** : Rotation clés et audit sécurité
- **Trimestriel** : Review architecture et optimisations
- **Annuel** : Audit complet sécurité et conformité

---

## ✅ **VALIDATION FINALE**

### **Go/No-Go Checklist**
- [ ] **Tests** : 100% E2E + >90% unitaires
- [ ] **Performance** : <25s P95 + <80% mémoire
- [ ] **Sécurité** : Audit clean + headers configurés
- [ ] **Monitoring** : Dashboard opérationnel + alertes
- [ ] **Documentation** : Runbooks à jour + équipe formée
- [ ] **Rollback** : Plan testé + procédure validée

### **Critères de Succès Post-Déploiement**
- **24h** : Aucun incident P0/P1
- **48h** : Métriques stables vs baseline
- **1 semaine** : Feedback utilisateurs positif
- **1 mois** : Objectifs business atteints

---

*Guide Déploiement Production DermAI V2 - Version 1.0*  
*Sprint 4 - Validation E2E et Optimisation*  
*Dernière mise à jour : 11 septembre 2025*
