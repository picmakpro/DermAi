# ⚡ QUICKSTART - DERMAI V2 CURSOR 2.0

**Temps de lecture** : 3 minutes  
**Temps de setup** : 5 minutes  
**Prêt à coder** : Immédiatement après

---

## 🎯 EN 3 ÉTAPES

### 1️⃣ LIRE (2 min)
```bash
# Configuration globale
cat .cursor/CURSOR.md

# Sprint 1 (prêt à exécuter)
cat docs/SPRINT_1_EXECUTION.md
```

### 2️⃣ VÉRIFIER (2 min)
```bash
# Environnement
npm run type-check && npm run lint && npm run dev
```

### 3️⃣ LANCER (1 min)
```bash
# Créer branche
git checkout -b feature/step3-hybrid

# Lancer agent
@agent backend "Implémenter HybridProductSelector selon docs/SPRINT_1_EXECUTION.md"
```

---

## 📁 FICHIERS CRÉÉS

```
✅ .cursor/
   ├── CURSOR.md       - Configuration globale
   ├── FRONTEND.md     - Patterns React
   ├── BACKEND.md      - Patterns API
   ├── RULES.md        - Règles de code
   └── README.md       - Guide utilisation

✅ docs/
   ├── IMPLEMENTATION_PLAN.md          - Roadmap 8 sprints
   ├── ARCHITECTURE.md                 - Architecture technique
   ├── SPRINT_1_EXECUTION.md           - Sprint 1 détaillé
   └── MIGRATION_CURSOR_2.0_RAPPORT.md - Rapport migration

✅ Racine
   ├── MIGRATION_COMPLETE.md - Guide complet
   └── QUICKSTART.md         - Ce fichier
```

---

## 🚀 SPRINT 1 (5 JOURS)

### Objectif
Finaliser **Step 3 Hybride** (sélection produits) avec **100% fiabilité**

### 3 Agents Parallèles

**Jour 1-2** : Backend + Frontend
```bash
@agent backend "Implémenter HybridProductSelector selon docs/SPRINT_1_EXECUTION.md"
@agent frontend "Afficher scores + alternatives selon docs/SPRINT_1_EXECUTION.md"
```

**Jour 3** : Tests
```bash
@agent tests "Créer tests Step 3 selon docs/SPRINT_1_EXECUTION.md"
```

**Jour 4-5** : Validation
```bash
npm run test && npm run test:e2e && npm run build
```

### Résultat Attendu
- ✅ 100% complétude (0 "produit non spécifié")
- ✅ 3+ alternatives par produit
- ✅ Performance < 5s (vs 15-20s avant)
- ✅ Score matching visible partout

---

## 🤖 AGENTS DISPONIBLES

```bash
@agent backend    # Services, API routes
@agent frontend   # Composants React, UI
@agent tests      # Tests unitaires + E2E
@agent database   # Migrations Supabase
@agent performance # Optimisations
@agent security   # Audit sécurité
@agent devops     # CI/CD, déploiement
```

---

## 📚 DOCUMENTATION

### À Lire Maintenant
1. `.cursor/CURSOR.md` - Configuration (10 min)
2. `docs/SPRINT_1_EXECUTION.md` - Sprint 1 (20 min)

### À Lire Pendant Dev
3. `.cursor/FRONTEND.md` - Si composants
4. `.cursor/BACKEND.md` - Si services
5. `.cursor/RULES.md` - Avant commit

### À Lire Pour Planifier
6. `docs/IMPLEMENTATION_PLAN.md` - Roadmap 8 sprints
7. `docs/ARCHITECTURE.md` - Architecture technique

---

## ✅ CHECKLIST

### Avant de Commencer
- [ ] Node.js >= 20
- [ ] `.env.local` configuré
- [ ] `npm install` exécuté
- [ ] `.cursor/CURSOR.md` lu
- [ ] `docs/SPRINT_1_EXECUTION.md` lu

### Avant de Commit
- [ ] `npm run type-check` → 0 erreur
- [ ] `npm run lint` → 0 erreur
- [ ] `npm run test` → 100% passant
- [ ] `npm run build` → OK

---

## 🎯 COMMANDES ESSENTIELLES

```bash
# Dev
npm run dev              # Serveur dev
npm run type-check       # TypeScript
npm run lint             # ESLint

# Tests
npm run test             # Tests unitaires
npm run test:e2e         # Tests E2E
npm run test:coverage    # Coverage

# Build
npm run build            # Build production
npm run start            # Serveur production

# Validation complète
npm run type-check && npm run lint && npm run test && npm run build
```

---

## 💡 TIPS

### Recherche Rapide
```bash
grep -r "pattern" .cursor/
```

### Validation Rapide
```bash
npm run type-check && npm run lint && npm run test && echo "✅ OK"
```

### Agents Parallèles
```bash
@agent backend "Tâche 1"
@agent frontend "Tâche 2"
@agent tests "Tâche 3"
```

---

## 🚨 RÈGLES

### ❌ INTERDICTIONS
- Pas de `any` en TypeScript
- Pas de commit sans tests
- Pas de secrets hardcodés

### ✅ OBLIGATIONS
- Lire `.cursor/CURSOR.md` avant de démarrer
- Suivre patterns `FRONTEND.md` / `BACKEND.md`
- Tester avant commit

---

## 📞 SUPPORT

### Blocage ?
1. Relire `.cursor/CURSOR.md`
2. Consulter `FRONTEND.md` / `BACKEND.md`
3. Vérifier `RULES.md`
4. Rollback si nécessaire

---

## 🎉 PRÊT !

**Prochaine action** : Exécuter Sprint 1  
**Commande** : `@agent backend "Implémenter HybridProductSelector selon docs/SPRINT_1_EXECUTION.md"`  
**Durée** : 5 jours  
**Résultat** : Step 3 stable (100% fiabilité)

---

**Bon développement ! 🚀**

