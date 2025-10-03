# 📚 GUIDE DÉMARRAGE : Scaling DermAI V2

**Date** : 2 Octobre 2025  
**Objectif** : Passer de 110 → 2000+ produits avec scoring ingrédients

---

## 🎯 DOCUMENTS CRÉÉS

### 📋 Plan Principal

**`MASTER-PLAN-SCALING-V2.md`** - Vue d'ensemble complète
- Timeline 10 semaines
- 5 phases détaillées
- Métriques succès
- Risques & mitigation
- Budget total ($300/an)

---

### 🏗️ Architecture Technique

**`CARETYPE-TAXONOMY-V2.md`** - Nouvelle taxonomie 10 types
- Évolution 6 → 10 careTypes
- Spécification complète chaque type
- Script migration 110 produits
- Mapping ingrédients clés

**`INGREDIENT-SCORING-ARCHITECTURE.md`** - Scoring V2 basé ingrédients
- Formule détaillée 5 critères
- Database 200-300 ingrédients
- Compatibilité × skinType
- Exemples calculs complets

**`SUPABASE-SCHEMA.md`** - Database PostgreSQL scalable
- Schema complet table `products`
- Index optimisés (GIN, composite)
- Queries optimisées
- Monitoring & sécurité

---

## 🚀 DÉMARRAGE RAPIDE

### Étape 1 : Comprendre l'Architecture

```bash
# Lire dans cet ordre :
1. MASTER-PLAN-SCALING-V2.md          # Vue d'ensemble
2. CARETYPE-TAXONOMY-V2.md            # Comprendre nouveaux types
3. INGREDIENT-SCORING-ARCHITECTURE.md # Comprendre scoring V2
4. SUPABASE-SCHEMA.md                 # Comprendre database
```

---

### Étape 2 : Phase 0 (Semaine 1)

**Objectif** : Stabiliser système actuel

#### Sprint 0.1 : Enrichir 110 Produits restrictedZones

```bash
# 1. Créer script enrichissement
touch scripts/enrich-110-products-zones.ts

# 2. Implémenter logique :
# - Si contient AHA, BHA, Retinol, Niacinamide >5% 
#   → restrictedZones: ['lèvres', 'yeux']
# - Si eye cream → restrictedZones: []
# - Si lip balm → restrictedZones: []

# 3. Run script
npm run ts-node scripts/enrich-110-products-zones.ts

# 4. Review manuel 31 produits traitement
code src/data/enrichedCatalogV2.json

# 5. Tests E2E
npm run test:e2e -- --grep "restrictedZones"
```

**Validation** : 0 anomalie zones (produit inadapté lèvres/yeux)

---

### Étape 3 : Phase 1 (Semaine 2)

**Objectif** : Migrer taxonomie 6 → 10 careTypes

#### Sprint 1.1 : Modifier Schémas Zod

```bash
# 1. Modifier productsDatabase.ts
code src/data/productsDatabase.ts
# Ajouter : 'anti-age', 'eclat', 'traitement-cible', 'apaisement'

# 2. Modifier routine.ts
code src/schemas/v2/routine.ts
# Ajouter : 'tonification' + 4 nouveaux types

# 3. Modifier prompts IA
code src/services/ai/core/prompts/routinePersonnalisee.ts
# Documenter nouveaux types
```

#### Sprint 1.2 : Migration 110 Produits

```bash
# 1. Créer script migration
touch scripts/migrate-caretype-v2.ts

# 2. Run migration automatique
npm run ts-node scripts/migrate-caretype-v2.ts
# → 31 produits 'traitement' reclassifiés

# 3. Review manuel
code src/data/enrichedCatalogV2.json

# 4. Tests
npm run test:unit -- ProductMatcher
npm run test:e2e
```

**Validation** : Aucune erreur Zod + matching fonctionne

---

### Étape 4 : Phase 2 (Semaines 3-4)

**Objectif** : Migration Supabase (0 régression)

#### Sprint 2.1 : Setup Supabase

```bash
# 1. Créer projet Supabase
# → https://supabase.com

# 2. Configurer .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx..." >> .env.local
echo "SUPABASE_SERVICE_KEY=eyJxxx..." >> .env.local

# 3. Créer migration
npx supabase migration new create_products_table

# 4. Copier SQL depuis SUPABASE-SCHEMA.md
code supabase/migrations/XXXXXX_create_products_table.sql

# 5. Appliquer migration
npx supabase link --project-ref xxx
npx supabase db push
```

#### Sprint 2.2 : Migrer 110 Produits

```bash
# 1. Créer script migration
touch scripts/migrate-to-supabase.ts

# 2. Implémenter (voir SUPABASE-SCHEMA.md)

# 3. Run migration
npm run ts-node scripts/migrate-to-supabase.ts

# 4. Vérifier
npx supabase db execute "SELECT COUNT(*) FROM products WHERE status = 'active';"
# Expected : 110
```

#### Sprint 2.3 : ProductDatabaseLoaderV2

```bash
# 1. Créer loader V2
touch src/services/products/ProductDatabaseLoaderV2.ts

# 2. Implémenter (voir SUPABASE-SCHEMA.md)

# 3. Adapter ProductMatcher avec feature flag
code src/services/products/ProductMatcher.ts
# USE_SUPABASE_CATALOG=true → V2, false → V1
```

#### Sprint 2.4 : Tests E2E

```bash
# Tests avec Supabase
USE_SUPABASE_CATALOG=true npm run test:e2e

# Vérifier :
# - Latency <100ms
# - Complétude 100%
# - Matching scores identiques (±2%)
```

**Rollback plan** : `USE_SUPABASE_CATALOG=false`

---

### Étape 5 : Phase 3 (Semaines 5-6)

**Objectif** : Scoring ingrédients (35% du score)

#### Sprint 3.1 : Ingredient Database

```bash
# 1. Créer database
touch src/data/ingredientCompatibilityDatabase.ts

# 2. Implémenter 50 ingrédients critiques
# (voir INGREDIENT-SCORING-ARCHITECTURE.md)

# Focus prioritaire :
# - Retinol, Niacinamide, AHA, BHA
# - Vitamin C, Hyaluronic Acid
# - Alcohol Denat, Fragrance
```

#### Sprint 3.2 : Enrichir 110 Produits Ingrédients

```bash
# 1. Créer script GPT-4
touch scripts/enrich-110-products-ingredients.ts

# 2. Run enrichissement
npm run ts-node scripts/enrich-110-products-ingredients.ts
# Coût : $0.11

# 3. Review 20 produits aléatoires

# 4. Update Supabase
# (ajouter colonne ingredients si nécessaire)
```

#### Sprint 3.3 : ProductMatcherV2

```bash
# 1. Créer matcher V2
touch src/services/products/ProductMatcherV2.ts

# 2. Implémenter scoring 5 critères
# (voir INGREDIENT-SCORING-ARCHITECTURE.md)

# 3. Tests A/B
node scripts/compare-scoring-v1-v2.ts

# Validation : V2 > V1
# - Scores moyens : +11%
# - Anomalies zones : 0%
# - Satisfaction : +42%
```

---

### Étape 6 : Phase 4 (Semaines 7-9)

**Objectif** : Import 2000 produits Amazon

#### Setup Amazon API

```bash
# 1. Créer compte Amazon Associates
# → https://affiliate-program.amazon.com

# 2. Obtenir API credentials
# Access Key + Secret Key

# 3. Configurer .env.local
echo "AMAZON_ACCESS_KEY=xxx" >> .env.local
echo "AMAZON_SECRET_KEY=xxx" >> .env.local
```

#### Import Progressif

```bash
# Import batch 100 (x20 = 2000)
for i in {1..20}; do
  node scripts/import-amazon-batch.ts --batch $i --count 100
  # → Fetch Amazon API
  # → Enrichir GPT-4o-mini ($0.017/batch)
  # → Valider Zod
  # → Review 10 produits random
  # → Import Supabase
done

# Total : 2000 produits
# Coût : $0.33
# Durée : ~40h (dont 20h GPT-4 passive)
```

**Validation continue** :
```bash
# Après chaque batch
npm run test:e2e -- --grep "matching"
```

---

### Étape 7 : Phase 5 (Semaine 10)

**Objectif** : Production + monitoring

#### Monitoring

```sql
-- Dashboard Supabase
SELECT 
  care_type,
  COUNT(*) as count,
  AVG(price) as avg_price,
  AVG(dermatologist_rating) as avg_rating
FROM products
WHERE status = 'active'
GROUP BY care_type;
```

#### Cron Updates

```bash
# Cron daily : Update prix Amazon
# 0 3 * * * node scripts/update-amazon-prices.ts
```

#### Déploiement

```bash
# Feature flag ON
echo "USE_SUPABASE_CATALOG=true" >> .env.production

# Deploy Vercel
git push origin main

# Monitoring 48h
# → Query latency P95 <100ms
# → Error rate <1%
# → Cache hit rate >80%
```

---

## 📊 VALIDATION GLOBALE

### Métriques Succès

```bash
# Tests finaux (1000 analyses)
node scripts/test-coverage-2000.ts

# Expected :
# ✅ Catalogue : 2000+ produits
# ✅ Couverture : 95% profils
# ✅ Matching scores : 70-85/100
# ✅ Alternatives : 8-10 par step
# ✅ Anomalies zones : 0%
# ✅ Query latency : <100ms
# ✅ Coût mensuel : <$30
```

---

## ⚠️ TROUBLESHOOTING

### Problème : Latency Supabase >100ms

**Solution** :
```typescript
// Activer cache Redis
const USE_REDIS_CACHE = true
const CACHE_TTL = 3600  // 1h
```

---

### Problème : GPT-4 Enrichment Imprécis

**Solution** :
```bash
# Review 10% aléatoire
node scripts/validate-enrichment-quality.ts --sample 200

# Si taux erreur >5%
# → Ajuster prompt
# → Re-run batch affecté
```

---

### Problème : Budget Supabase Dépassé

**Solution** :
```sql
-- Activer cache agressif
-- Désactiver produits inactifs
UPDATE products 
SET status = 'inactive' 
WHERE selection_count = 0 
  AND created_at < NOW() - INTERVAL '30 days';
```

---

## 💰 BUDGET RÉCAPITULATIF

### Year 1

```
Setup one-time : $0.43
- GPT-4o-mini 2000 produits : $0.33
- GPT-4o-mini zones : $0.10

Récurrent : $300
- Supabase Pro : $25/mois × 12

Total Year 1 : $300.43
```

### ROI

```
+27% couverture profils
= +27% conversions potentielles
= Break-even si 38 clients/an (conversion moyenne $10)
```

---

## 📞 SUPPORT

**Questions** : Consulter documents détaillés dans `/docs/architecture/`

**Issues** : Créer ticket avec label `scaling-v2`

**Urgent** : Contacter CTO

---

## ✅ CHECKLIST COMPLÈTE

### Phase 0 (Sem 1)
- [ ] Script enrich restrictedZones
- [ ] Review 31 produits
- [ ] Tests E2E zones
- [ ] Validation 0 anomalie

### Phase 1 (Sem 2)
- [ ] Modifier schémas Zod
- [ ] Script migration careType
- [ ] Review 31 produits
- [ ] Tests intégration

### Phase 2 (Sem 3-4)
- [ ] Setup Supabase projet
- [ ] Migration schema SQL
- [ ] Migrer 110 produits
- [ ] ProductDatabaseLoaderV2
- [ ] Tests E2E feature flag
- [ ] Validation 0 régression

### Phase 3 (Sem 5-6)
- [ ] Ingredient database 50 ing
- [ ] Enrich 110 produits ingrédients
- [ ] ProductMatcherV2
- [ ] Tests A/B scoring
- [ ] Validation amélioration

### Phase 4 (Sem 7-9)
- [ ] Setup Amazon API
- [ ] Import 500 produits
- [ ] Import 1000 produits
- [ ] Import 2000 produits
- [ ] Tests coverage

### Phase 5 (Sem 10)
- [ ] Monitoring setup
- [ ] Cron prix Amazon
- [ ] Déploiement prod
- [ ] Validation 48h
- [ ] Documentation finale

---

**Version** : 1.0  
**Dernière mise à jour** : 2 Octobre 2025  
**Statut** : Prêt à démarrer Phase 0

