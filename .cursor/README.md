# 📚 Configuration Cursor 2.0 - DermAI V2

Ce dossier contient la configuration complète pour le développement avec **Cursor 2.0 Multi-Agents**.

---

## 📁 FICHIERS

### **CURSOR.md** - Configuration Globale
**Quand le lire** : Avant de commencer tout développement

**Contenu** :
- Stack technique (Frontend + Backend + DevOps)
- Structure du projet (arborescence complète)
- Conventions de nommage (fichiers, code, types)
- Règles générales (TypeScript, React, Next.js)
- Commandes essentielles (dev, test, build)
- Design system (palette, typographie)
- Variables d'environnement
- Métriques de qualité

**Utilisation** :
```bash
# Lire avant de démarrer
cat .cursor/CURSOR.md

# Vérifier stack
npm --version  # >= 8.0
node --version # >= 20.0
```

---

### **FRONTEND.md** - Patterns React/Next.js
**Quand le lire** : Avant de créer/modifier des composants React

**Contenu** :
- Architecture composants (hiérarchie, composition)
- Patterns Next.js (App Router, Server vs Client)
- State management (React Query, Context)
- Hooks customs (patterns, exemples)
- Forms & validation (React Hook Form + Zod)
- Styling (Tailwind CSS, Framer Motion)
- Performance (code splitting, memoization)
- Exemples complets

**Utilisation** :
```bash
# Créer nouveau composant
@agent frontend "Créer composant ProductCard selon .cursor/FRONTEND.md"

# Vérifier patterns
grep -A 10 "Composants" .cursor/FRONTEND.md
```

---

### **BACKEND.md** - Patterns API & Services
**Quand le lire** : Avant de créer/modifier des services ou API routes

**Contenu** :
- Architecture services (structure, principes)
- API Routes Next.js (pattern standard)
- Services IA (diagnostic, routine)
- Database Supabase (client, loader)
- Validation & sécurité (Zod, sanitization)
- Error handling (erreurs typées)
- Performance & cache (Redis, compression)
- Exemples complets

**Utilisation** :
```bash
# Créer nouveau service
@agent backend "Créer service AnalysisService selon .cursor/BACKEND.md"

# Vérifier patterns API
grep -A 10 "API Routes" .cursor/BACKEND.md
```

---

### **RULES.md** - Règles de Code
**Quand le lire** : Avant chaque commit

**Contenu** :
- Principes fondamentaux (Code Quality, Type Safety)
- Conventions TypeScript (naming, types)
- Conventions React (composants, hooks)
- Conventions styling (Tailwind)
- Error handling (erreurs typées)
- Logging (logs structurés)
- Testing (tests unitaires, E2E)
- Sécurité (env vars, sanitization)
- Interdictions strictes (any, console.log)
- Checklist avant commit

**Utilisation** :
```bash
# Vérifier avant commit
npm run type-check  # 0 erreur
npm run lint        # 0 erreur
npm run test        # 100% passant

# Checklist complète
grep -A 20 "CHECKLIST AVANT COMMIT" .cursor/RULES.md
```

---

## 🔄 WORKFLOW DÉVELOPPEMENT

### 1. Avant de Commencer
```bash
# Lire configuration globale
cat .cursor/CURSOR.md

# Vérifier environnement
npm run type-check
npm run lint
```

### 2. Pendant le Développement
```bash
# Créer composant frontend
@agent frontend "Créer ProductCard selon .cursor/FRONTEND.md"

# Créer service backend
@agent backend "Créer AnalysisService selon .cursor/BACKEND.md"

# Vérifier règles
cat .cursor/RULES.md
```

### 3. Avant de Commit
```bash
# Checklist complète
npm run type-check  # TypeScript
npm run lint        # ESLint
npm run test        # Tests unitaires
npm run build       # Build production

# Si tout passe → Commit
git add .
git commit -m "feat(component): add ProductCard"
```

---

## 🤖 AGENTS CURSOR DISPONIBLES

### **@agent backend**
**Spécialité** : Services, API routes, database

**Exemples** :
```bash
@agent backend "Créer HybridProductSelector selon .cursor/BACKEND.md"
@agent backend "Ajouter validation Zod dans AnalysisService"
@agent backend "Optimiser query Supabase dans ProductLoader"
```

### **@agent frontend**
**Spécialité** : Composants React, pages, UI

**Exemples** :
```bash
@agent frontend "Créer AlternativesModal selon .cursor/FRONTEND.md"
@agent frontend "Ajouter loading state dans ProductCard"
@agent frontend "Optimiser performance ResultsPage"
```

### **@agent tests**
**Spécialité** : Tests unitaires, E2E

**Exemples** :
```bash
@agent tests "Créer tests HybridProductSelector"
@agent tests "Ajouter tests E2E pour Step 3"
@agent tests "Augmenter coverage ProductMatcher à 80%"
```

### **@agent database**
**Spécialité** : Migrations Supabase, schema

**Exemples** :
```bash
@agent database "Créer migration table analyses"
@agent database "Ajouter index sur products.care_type"
@agent database "Optimiser query performance"
```

### **@agent performance**
**Spécialité** : Optimisations, cache

**Exemples** :
```bash
@agent performance "Optimiser bundle size"
@agent performance "Ajouter cache Redis pour produits"
@agent performance "Améliorer Lighthouse score"
```

### **@agent security**
**Spécialité** : Audit sécurité, validation

**Exemples** :
```bash
@agent security "Audit sécurité API routes"
@agent security "Ajouter validation Zod manquante"
@agent security "Configurer headers sécurité"
```

### **@agent devops**
**Spécialité** : CI/CD, déploiement

**Exemples** :
```bash
@agent devops "Créer pipeline GitHub Actions"
@agent devops "Configurer Vercel deployment"
@agent devops "Ajouter monitoring Sentry"
```

---

## 📚 DOCUMENTATION ASSOCIÉE

### Interne
- `docs/IMPLEMENTATION_PLAN.md` - Roadmap 8 sprints
- `docs/ARCHITECTURE.md` - Architecture technique
- `docs/SPRINT_1_EXECUTION.md` - Sprint 1 détaillé
- `docs/spec.md` - Spécifications complètes

### Externe
- [Cursor 2.0 Docs](https://cursor.sh/docs)
- [Next.js 15](https://nextjs.org/docs)
- [React 19](https://react.dev)
- [Supabase](https://supabase.com/docs)

---

## 🚨 RÈGLES CRITIQUES

### ❌ INTERDICTIONS
1. **NE PAS** modifier `.cursor/` sans validation
2. **NE PAS** commit sans lire `RULES.md`
3. **NE PAS** utiliser `any` en TypeScript
4. **NE PAS** commit de secrets (`.env.local`)
5. **NE PAS** ignorer les erreurs de linter

### ✅ OBLIGATIONS
1. **TOUJOURS** lire `.cursor/CURSOR.md` avant de démarrer
2. **TOUJOURS** suivre patterns dans `FRONTEND.md` / `BACKEND.md`
3. **TOUJOURS** respecter règles dans `RULES.md`
4. **TOUJOURS** tester avant commit
5. **TOUJOURS** documenter code complexe (JSDoc)

---

## 💡 TIPS

### Recherche Rapide
```bash
# Trouver pattern spécifique
grep -r "pattern_name" .cursor/

# Voir exemple composant
grep -A 30 "Composant Feature Complet" .cursor/FRONTEND.md

# Voir exemple service
grep -A 30 "Service Complet" .cursor/BACKEND.md
```

### Validation Rapide
```bash
# Vérifier TypeScript
npm run type-check

# Vérifier ESLint
npm run lint

# Vérifier tests
npm run test

# Tout vérifier
npm run type-check && npm run lint && npm run test && echo "✅ OK"
```

### Agents Parallèles
```bash
# Lancer 3 agents simultanément
@agent backend "Tâche backend"
@agent frontend "Tâche frontend"
@agent tests "Tâche tests"

# Vérifier après
npm run type-check && npm run lint && npm run test
```

---

## 📞 SUPPORT

### En cas de blocage :
1. Relire `.cursor/CURSOR.md` section concernée
2. Consulter exemples dans `FRONTEND.md` / `BACKEND.md`
3. Vérifier règles dans `RULES.md`
4. Consulter `docs/ARCHITECTURE.md`
5. Rollback au commit précédent si nécessaire

### Validation avant merge :
- [ ] TypeScript 0 erreur (`npm run type-check`)
- [ ] ESLint 0 erreur (`npm run lint`)
- [ ] Tests 100% passants (`npm run test`)
- [ ] Build production OK (`npm run build`)
- [ ] Documentation mise à jour

---

**Dernière mise à jour** : 6 Novembre 2025  
**Version** : 1.0  
**Statut** : ✅ Opérationnel

