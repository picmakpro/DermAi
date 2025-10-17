# 💾 SUPABASE SCHEMA : Database Produits Scalable

**Date** : 2 Octobre 2025  
**Version** : 2.0  
**Objectif** : Schema PostgreSQL optimisé pour 2000+ produits

---

## 📊 TABLE PRINCIPALE : `products`

### Schema Complet

```sql
CREATE TABLE products (
  -- ===== IDENTITÉ =====
  catalog_id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'cleanser', 'toner', 'serum', 'treatment', 'moisturizer', 
    'sunscreen', 'mask', 'exfoliant', 'balm', 'oil',
    'eye-care', 'face-oil', 'lip-care', 'mist', 'primer'
  )),
  
  -- ===== MÉTADONNÉES DERMATOLOGIQUES =====
  care_type VARCHAR(50) NOT NULL CHECK (care_type IN (
    'nettoyage', 'tonification', 'hydratation', 'protection',
    'anti-age', 'eclat', 'traitement-cible', 'apaisement',
    'exfoliation', 'masque'
  )),
  target_skin_types TEXT[] NOT NULL DEFAULT '{}',
  target_concerns TEXT[] NOT NULL DEFAULT '{}',
  active_ingredients TEXT[] NOT NULL DEFAULT '{}',
  allergens TEXT[] NOT NULL DEFAULT '{}',
  
  -- ===== INGRÉDIENTS COMPLETS (Phase 3) =====
  ingredients TEXT[] DEFAULT '{}',  -- Liste INCI complète
  
  -- ===== ZONES & SÉCURITÉ =====
  target_zones TEXT[] NOT NULL DEFAULT '{visage entier}',
  restricted_zones TEXT[] NOT NULL DEFAULT '{}',
  suitable_sensitive_areas BOOLEAN DEFAULT false,
  warnings TEXT,
  
  -- ===== MÉTADONNÉES SÉCURITÉ =====
  comedogenic BOOLEAN DEFAULT false,
  irritant BOOLEAN DEFAULT false,
  photosensitizing BOOLEAN DEFAULT false,
  pregnancy_safe BOOLEAN DEFAULT true,
  
  -- ===== SCORING =====
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0 AND price <= 500),
  popularity INTEGER DEFAULT 50 CHECK (popularity >= 0 AND popularity <= 100),
  dermatologist_rating INTEGER DEFAULT 70 CHECK (dermatologist_rating >= 0 AND dermatologist_rating <= 100),
  
  -- ===== TIMING & RETAIL =====
  application_timing VARCHAR(20) NOT NULL CHECK (application_timing IN ('morning', 'evening', 'both')),
  image_url TEXT,
  retailers JSONB DEFAULT '[]',
  
  -- ===== GESTION =====
  source VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (source IN ('amazon', 'manual', 'sephora', 'douglas')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ===== ANALYTICS =====
  selection_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0.0,
  
  -- ===== EXTENSIONS FLEXIBLES =====
  metadata JSONB DEFAULT '{}'
);

-- ===== INDEX OPTIMISÉS =====

-- Index simples (lookup rapide)
CREATE INDEX idx_products_care_type ON products(care_type);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_source ON products(source);

-- Index GIN pour arrays (search dans arrays)
CREATE INDEX idx_products_target_skin_types ON products USING GIN(target_skin_types);
CREATE INDEX idx_products_target_concerns ON products USING GIN(target_concerns);
CREATE INDEX idx_products_restricted_zones ON products USING GIN(restricted_zones);
CREATE INDEX idx_products_ingredients ON products USING GIN(ingredients);

-- Index composite (queries fréquentes)
CREATE INDEX idx_products_care_type_status ON products(care_type, status);
CREATE INDEX idx_products_care_type_price ON products(care_type, price);
CREATE INDEX idx_products_status_popularity ON products(status, popularity DESC);

-- Index partiel (seulement produits actifs)
CREATE INDEX idx_active_products_care_type ON products(care_type) WHERE status = 'active';

-- ===== RLS (Row Level Security) =====
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read (tous peuvent lire produits actifs)
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (status = 'active');

-- Admin write (seulement admins peuvent modifier)
CREATE POLICY "Admin can manage products"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- ===== TRIGGERS =====

-- Trigger : Update last_updated automatiquement
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_updated
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated();

-- Trigger : Calcul conversion_rate automatique
CREATE OR REPLACE FUNCTION calculate_conversion_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.view_count > 0 THEN
    NEW.conversion_rate = (NEW.click_count::DECIMAL / NEW.view_count) * 100;
  ELSE
    NEW.conversion_rate = 0.0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_conversion_rate
  BEFORE INSERT OR UPDATE OF view_count, click_count ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_conversion_rate();
```

---

## 📈 QUERIES OPTIMISÉES

### 1. Load Products by careType (ProductDatabaseLoaderV2)

```sql
-- Query principale ProductMatcher
SELECT *
FROM products
WHERE status = 'active'
  AND care_type = $1                        -- Index: idx_products_care_type_status
  AND price <= $2                           -- Index: idx_products_care_type_price
  AND target_skin_types @> ARRAY[$3]::TEXT[]  -- Index GIN: idx_products_target_skin_types
  AND NOT (restricted_zones && ARRAY[$4]::TEXT[])  -- Index GIN: idx_products_restricted_zones
ORDER BY dermatologist_rating DESC
LIMIT 200;

-- Temps attendu : 20-50ms (vs 200ms sans index)
```

### 2. Analytics : Top Produits

```sql
-- Produits les plus sélectionnés
SELECT 
  name,
  brand,
  care_type,
  selection_count,
  conversion_rate,
  price
FROM products
WHERE status = 'active'
ORDER BY selection_count DESC
LIMIT 50;

-- Temps attendu : <10ms
```

### 3. Analytics : Coverage careType

```sql
-- Distribution careType
SELECT 
  care_type,
  COUNT(*) as count,
  ROUND(AVG(price), 2) as avg_price,
  ROUND(AVG(dermatologist_rating), 2) as avg_rating,
  ROUND(AVG(selection_count), 2) as avg_selections
FROM products
WHERE status = 'active'
GROUP BY care_type
ORDER BY count DESC;

-- Temps attendu : <20ms
```

### 4. Maintenance : Produits Inactifs

```sql
-- Produits jamais sélectionnés (à désactiver)
SELECT 
  catalog_id,
  name,
  brand,
  care_type,
  created_at
FROM products
WHERE status = 'active'
  AND selection_count = 0
  AND created_at < NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Temps attendu : <30ms
```

---

## 🔧 MIGRATIONS SUPABASE

### Migration 1 : Create Table

```bash
# Créer migration
npx supabase migration new create_products_table

# Éditer : supabase/migrations/XXXXXX_create_products_table.sql
# (copier SQL ci-dessus)

# Appliquer
npx supabase db push
```

### Migration 2 : Add Ingredients (Phase 3)

```sql
-- Si besoin d'ajouter colonne ingredients après Phase 2
ALTER TABLE products
ADD COLUMN IF NOT EXISTS ingredients TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_ingredients 
  ON products USING GIN(ingredients);
```

---

## 📊 SIZING & PERFORMANCE

### Estimation Taille Database

**2000 produits** :
```
Row size moyenne : ~2 KB
Total rows : 2000
Database size : 2000 × 2 KB = 4 MB

Index size :
- Index simples (6) : ~200 KB
- Index GIN (4) : ~600 KB
- Index composite (3) : ~300 KB
Total index : ~1.1 MB

Total database : ~5.1 MB
```

**Supabase Free Tier** : 500 MB → ✅ Largement suffisant

---

### Performance Attendue

| Query Type | Volume | Temps (avec index) | Temps (sans index) |
|------------|--------|--------------------|--------------------|
| **Load by careType** | 50-200 rows | **20-50ms** | 200-300ms ❌ |
| **Filter skinType** | 30-150 rows | **30-60ms** | 150-250ms ❌ |
| **Filter restricted zones** | 20-100 rows | **40-80ms** | 200-400ms ❌ |
| **Analytics queries** | 2000 rows | **<30ms** | 500-1000ms ❌ |

**Conclusion** : Index **essentiels** pour performance.

---

## 🔄 CACHE STRATEGY

### Cache Redis (optionnel, Phase 5+)

```typescript
interface CacheConfig {
  key: string
  ttl: number  // seconds
  data: EnrichedProduct[]
}

// Cache par careType
const CACHE_KEY = (careType: string) => `products:${careType}`
const CACHE_TTL = 3600  // 1h

async function getCachedProducts(careType: string): Promise<EnrichedProduct[] | null> {
  const cached = await redis.get(CACHE_KEY(careType))
  return cached ? JSON.parse(cached) : null
}

async function setCachedProducts(careType: string, products: EnrichedProduct[]): void {
  await redis.setex(CACHE_KEY(careType), CACHE_TTL, JSON.stringify(products))
}
```

**Avantages** :
- Query latency : 80ms → **5ms** (16x plus rapide)
- Réduction load Supabase : -95%

---

## 📊 MONITORING

### Queries Supabase Dashboard

**1. Database Size**
```sql
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as db_size,
  pg_size_pretty(pg_total_relation_size('products')) as table_size,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM products WHERE status = 'active') as active_products;
```

**2. Index Usage**
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'products'
ORDER BY idx_scan DESC;

-- Vérifier : idx_scan > 0 pour tous index critiques
```

**3. Slow Queries**
```sql
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%products%'
  AND mean_exec_time > 100  -- >100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Alert si queries >100ms
```

---

## 🔐 SÉCURITÉ

### RLS (Row Level Security)

**Politique actuelle** :
```sql
-- Public READ (anonymous + authenticated)
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (status = 'active');
```

**Évolution si besoin** :
```sql
-- Admin WRITE
CREATE POLICY "Admin can manage products"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- User analytics tracking (UPDATE seulement selection_count)
CREATE POLICY "Users can track selections"
  ON products FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Autoriser seulement update analytics
    OLD.catalog_id = NEW.catalog_id AND
    OLD.name = NEW.name AND
    OLD.price = NEW.price
  );
```

---

## 🚀 DÉPLOIEMENT

### Checklist Setup Supabase

1. ✅ Créer projet Supabase (supabase.com)
2. ✅ Configurer `.env.local` :
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...  # Admin key (backend only)
```

3. ✅ Run migrations :
```bash
npx supabase link --project-ref xxx
npx supabase db push
```

4. ✅ Migrer 110 produits :
```bash
node scripts/migrate-to-supabase.ts
```

5. ✅ Vérifier :
```sql
SELECT COUNT(*) FROM products WHERE status = 'active';
-- Expected : 110
```

6. ✅ Tests E2E :
```bash
USE_SUPABASE_CATALOG=true npm run test:e2e
```

---

## 💰 COÛTS SUPABASE

### Supabase Pro : $25/mois

**Included** :
- Database : 8 GB (vs 500 MB Free)
- Bandwidth : 100 GB/mois
- API requests : Unlimited
- Edge Functions : Unlimited
- Backups : Daily

**Projection usage DermAI** :
- Database size : ~5 MB (2000 produits)
- Queries/mois : ~50K (1 query/step × 17 steps × 3000 analyses)
- Bandwidth : ~200 MB/mois

**Conclusion** : **Largement dans limites Pro** ✅

---

**Version** : 2.0  
**Dernière mise à jour** : 2 Octobre 2025  
**Prochaine révision** : Post-migration (Sem 5)



