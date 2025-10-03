-- ================================================
-- PHASE 2 : Migration Supabase - Table Products
-- Date : 3 Octobre 2025
-- Version : 2.0
-- Objectif : Schema PostgreSQL optimisé pour 2000+ produits
-- ================================================

-- ===== TABLE PRINCIPALE : products =====

CREATE TABLE IF NOT EXISTS products (
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
  -- ✅ PHASE 1 : careType V2 (10 types spécialisés)
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
  ingredients TEXT[] DEFAULT '{}',  -- Liste INCI complète (pour Phase 3)
  
  -- ===== ZONES & SÉCURITÉ =====
  -- ✅ PHASE 0 : restrictedZones
  target_zones TEXT[] NOT NULL DEFAULT '{visage entier}',
  restricted_zones TEXT[] NOT NULL DEFAULT '{}',
  suitable_sensitive_areas BOOLEAN DEFAULT false,
  warnings TEXT,
  
  -- ===== MÉTADONNÉES SÉCURITÉ (Phase 3) =====
  comedogenic BOOLEAN DEFAULT false,
  irritant BOOLEAN DEFAULT false,
  photosensitizing BOOLEAN DEFAULT false,
  pregnancy_safe BOOLEAN DEFAULT true,
  
  -- ===== SCORING =====
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0 AND price <= 500),
  popularity INTEGER DEFAULT 50 CHECK (popularity >= 0 AND popularity <= 100),
  dermatologist_rating INTEGER DEFAULT 70 CHECK (dermatologist_rating >= 0 AND dermatologist_rating <= 100),
  
  -- ===== TIMING & RETAIL =====
  application_timing VARCHAR(20) NOT NULL DEFAULT 'both' CHECK (application_timing IN ('morning', 'evening', 'both')),
  image_url TEXT,
  retailers JSONB DEFAULT '[]',
  
  -- ===== GESTION =====
  source VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (source IN ('amazon', 'manual', 'sephora', 'douglas')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'outdated')),
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
CREATE INDEX IF NOT EXISTS idx_products_care_type ON products(care_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);

-- Index GIN pour arrays (search dans arrays)
CREATE INDEX IF NOT EXISTS idx_products_target_skin_types ON products USING GIN(target_skin_types);
CREATE INDEX IF NOT EXISTS idx_products_target_concerns ON products USING GIN(target_concerns);
CREATE INDEX IF NOT EXISTS idx_products_restricted_zones ON products USING GIN(restricted_zones);
CREATE INDEX IF NOT EXISTS idx_products_ingredients ON products USING GIN(ingredients);

-- Index composite (queries fréquentes)
CREATE INDEX IF NOT EXISTS idx_products_care_type_status ON products(care_type, status);
CREATE INDEX IF NOT EXISTS idx_products_care_type_price ON products(care_type, price);
CREATE INDEX IF NOT EXISTS idx_products_status_popularity ON products(status, popularity DESC);

-- Index partiel (seulement produits actifs)
CREATE INDEX IF NOT EXISTS idx_active_products_care_type ON products(care_type) WHERE status = 'active';

-- ===== TRIGGERS =====

-- Trigger : Update last_updated automatiquement
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_updated ON products;
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

DROP TRIGGER IF EXISTS trigger_calculate_conversion_rate ON products;
CREATE TRIGGER trigger_calculate_conversion_rate
  BEFORE INSERT OR UPDATE OF view_count, click_count ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_conversion_rate();

-- ===== RLS (Row Level Security) =====
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Supprimer policies existantes si elles existent
DROP POLICY IF EXISTS "Public can read active products" ON products;
DROP POLICY IF EXISTS "Admin can manage products" ON products;
DROP POLICY IF EXISTS "Service role can manage products" ON products;

-- Public READ (anonymous + authenticated) - seulement produits actifs
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (status = 'active');

-- Service role FULL ACCESS (pour scripts backend)
CREATE POLICY "Service role can manage products"
  ON products FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===== COMMENTAIRES =====

COMMENT ON TABLE products IS 'Catalogue produits scalable pour DermAI V2 - Phases 0-5';
COMMENT ON COLUMN products.care_type IS 'Phase 1: Taxonomie V2 (10 types spécialisés)';
COMMENT ON COLUMN products.restricted_zones IS 'Phase 0: Zones où le produit ne doit PAS être appliqué';
COMMENT ON COLUMN products.ingredients IS 'Phase 3: Liste INCI complète pour scoring ingrédients';
COMMENT ON COLUMN products.source IS 'Phase 4: Source import (amazon, manual, sephora)';

