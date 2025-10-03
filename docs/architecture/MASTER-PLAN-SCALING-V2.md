# 🚀 MASTER PLAN : Scaling Catalogue & Architecture Ingrédients

**Date** : 2 Octobre 2025  
**Version** : 2.0 - Migration Complète  
**Objectif** : Passer de 110 → 2000+ produits avec scoring ingrédients dermatologiques

---

## 📋 VUE D'ENSEMBLE

### Problématique Actuelle

**Limitations** :
- ❌ **110 produits seulement** → Couverture 75% profils (insuffisant)
- ❌ **Scoring générique** → Ignore compatibilité ingrédients × skinType
- ❌ **Taxonomie incohérente** → `careType` trop générique ("traitement")
- ❌ **Scaling impossible** → JSON statique non scalable >500 produits
- ❌ **Anomalies sécurité** → Produits inadaptés zones sensibles (lèvres/yeux)

### Objectifs V2

**Cibles** :
- ✅ **2000+ produits** → Couverture 95% profils
- ✅ **Scoring ingrédients** → Compatibilité skinType (35% du score)
- ✅ **Taxonomie précise** → 10 careTypes spécialisés
- ✅ **Scalabilité** → Supabase + pagination (50k+ produits)
- ✅ **Sécurité zones** → `restrictedZones` strict (0 anomalie)

**ROI** :
- **+27% couverture** profils utilisateurs
- **+15% précision** matching (scores 70-85 vs 60-70)
- **+233% alternatives** par step (8-10 vs 3)

---

## 📅 PLANNING GLOBAL

### Timeline : 10 Semaines (2.5 mois)

| Phase | Durée | Objectif | Fichier Détail |
|-------|-------|----------|----------------|
| **Phase 0** | 1 sem | Corrections Step 3 actuelles | `PHASE-0-CORRECTIONS.md` |
| **Phase 1** | 1 sem | Refonte taxonomie careType | `PHASE-1-TAXONOMIE.md` |
| **Phase 2** | 2 sem | Migration Supabase | `PHASE-2-SUPABASE.md` |
| **Phase 3** | 2 sem | Scoring ingrédients | `PHASE-3-INGREDIENTS.md` |
| **Phase 4** | 3 sem | Import Amazon 2000 | `PHASE-4-IMPORT-AMAZON.md` |
| **Phase 5** | 1 sem | Optimisations & production | `PHASE-5-PRODUCTION.md` |

---

## 🏗️ ARCHITECTURE CIBLE

```
AMAZON API (2000+ produits)
  ↓
GPT-4o-mini Enrichment ($0.33)
  ↓
SUPABASE PostgreSQL (2000+ produits enrichis)
  ↓
ProductDatabaseLoaderV2 (query filtré par careType)
  ↓
ProductMatcherV2 (scoring 5 critères dont 35% ingrédients)
  ↓
Sélection optimale (8-10 alternatives par step)
```

### Nouveaux Composants

1. **Taxonomie careType V2** : 10 types (détail: `CARETYPE-TAXONOMY-V2.md`)
2. **Ingredient Database** : 200-300 ingrédients (détail: `INGREDIENT-DATABASE.md`)
3. **Supabase Schema** : Table `products` (détail: `SUPABASE-SCHEMA.md`)
4. **Scoring V2** : 5 critères (détail: `SCORING-ALGORITHM-V2.md`)
5. **GPT-4 Pipeline** : Enrichissement automatisé (détail: `GPT4-ENRICHMENT.md`)

---

## 📊 MÉTRIQUES SUCCÈS

### KPIs Globaux

| Métrique | Avant | Cible | Méthode Validation |
|----------|-------|-------|-------------------|
| **Catalogue** | 110 | **2000+** | Supabase COUNT(*) |
| **Couverture profils** | 75% | **95%** | Tests 1000 profils variés |
| **Matching scores** | 60-70 | **70-85** | Moyenne scores top 1 |
| **Alternatives/step** | 3 | **8-10** | Stats matching |
| **Anomalies zones** | 2-3% | **0%** | Tests restrictedZones |
| **Query latency** | 19ms | **<100ms** | Monitoring P95 |
| **Coût mensuel** | $0 | **<$30** | Supabase billing |

---

## ⚠️ RISQUES MAJEURS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| GPT-4 enrichment imprécis | 20% | Moyen | Review 10% + validation auto |
| Latency Supabase >100ms | 10% | Moyen | Cache Redis 1h |
| Amazon API quota | 30% | Faible | Rate limiting 1/s |
| Budget explosion | 5% | Moyen | Monitoring + alertes |
| Régression matching | 10% | Haut | A/B testing + feature flags |

---

## 🎯 APPROCHE INCRÉMENTALE (SÉCURITÉ)

### Principe : Chaque Phase = 0 Régression

1. **Phase 0** : Stabiliser actuel (restrictedZones 110 produits)
2. **Phase 1** : Taxonomie V2 avec migration 110 produits (tests E2E)
3. **Phase 2** : Supabase avec 110 produits (feature flag + rollback)
4. **Phase 3** : Scoring V2 avec A/B testing (validation amélioration)
5. **Phase 4** : Import progressif 500→1000→2000 (validation continue)
6. **Phase 5** : Monitoring + cron (automatisation)

**Garantie** : À chaque étape, **prod fonctionnelle** avec possibilité rollback.

---

## 📚 DOCUMENTS ASSOCIÉS (Détaillés)

### Architecture

- `CARETYPE-TAXONOMY-V2.md` - Spécification complète 10 careTypes
- `INGREDIENT-DATABASE.md` - 200-300 ingrédients avec compatibilité
- `SUPABASE-SCHEMA.md` - Schéma database complet + index
- `SCORING-ALGORITHM-V2.md` - Formule détaillée 5 critères

### Phases Exécution

- `PHASE-0-CORRECTIONS.md` - Enrichir 110 produits restrictedZones
- `PHASE-1-TAXONOMIE.md` - Migration 6 → 10 careTypes
- `PHASE-2-SUPABASE.md` - Setup database + loader V2
- `PHASE-3-INGREDIENTS.md` - Scoring compatibilité ingrédients
- `PHASE-4-IMPORT-AMAZON.md` - Pipeline GPT-4 + import 2000
- `PHASE-5-PRODUCTION.md` - Monitoring + cron + déploiement

### Guides Techniques

- `GPT4-ENRICHMENT-GUIDE.md` - Prompts optimisés + validation
- `AMAZON-API-INTEGRATION.md` - Setup API + rate limiting
- `MIGRATION-SCRIPTS-GUIDE.md` - Scripts automatisés détaillés

---

## 🚀 DÉMARRAGE RAPIDE

### Étape 1 : Phase 0 (Sem 1)

```bash
# Enrichir 110 produits avec restrictedZones
node scripts/enrich-110-products-zones.ts

# Tests E2E
npm run test:e2e -- --grep "restrictedZones"

# Validation : 0 anomalie zones
```

### Étape 2 : Phase 1 (Sem 2)

```bash
# Migrer taxonomie careType V2
node scripts/migrate-caretype-v2.ts

# Tests intégration
npm run test:unit -- ProductMatcher
npm run test:e2e
```

### Étape 3 : Phase 2 (Sem 3-4)

```bash
# Setup Supabase
npx supabase migration new create_products_table
npx supabase db push

# Migrer 110 produits
node scripts/migrate-to-supabase.ts

# Tests avec feature flag
USE_SUPABASE_CATALOG=true npm run test:e2e
```

**Continuer** : Voir fichiers PHASE-*.md pour détails complets.

---

## 💰 BUDGET TOTAL

### One-Time (Setup)

```
GPT-4o-mini enrichment 2000 produits : $0.33
GPT-4o-mini zones 2000 produits : $0.10
Migration scripts développement : $0 (internal)
Total setup : $0.43
```

### Récurrent (Mensuel)

```
Supabase Pro : $25/mois
Amazon API : $0 (affilié)
Maintenance : 2h/mois (internal)
Total mensuel : $25
```

### Year 1

```
Setup : $0.43
Récurrent : $25 × 12 = $300
Total Year 1 : $300.43
```

**ROI** : +27% couverture = +27% conversions potentielles

---

## 📞 CONTACT & SUPPORT

**CTO** : [Contact]  
**Repo** : `dermai-v2`  
**Branch strategy** : Feature branches par phase  
**PR Reviews** : Obligatoires avant merge main

---

**Version** : 1.0  
**Dernière mise à jour** : 2 Octobre 2025  
**Prochaine révision** : Fin Phase 2 (Sem 4)

