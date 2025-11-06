-- =============================================
-- SPRINT 2.3 - TABLES SUPABASE ROUTINE & ÉTAGÈRES
-- =============================================

-- Table Routine Completions
CREATE TABLE IF NOT EXISTS routine_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('morning', 'evening')),
  completed BOOLEAN DEFAULT FALSE,
  products_used TEXT[], -- IDs des produits utilisés
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unicité par utilisateur/date/phase
  UNIQUE(user_id, completion_date, phase)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date ON routine_completions(user_id, completion_date DESC);
CREATE INDEX IF NOT EXISTS idx_routine_completions_streak ON routine_completions(user_id, completed, completion_date);

-- Table Étagères Produits
CREATE TABLE IF NOT EXISTS user_product_shelves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  shelf_name TEXT NOT NULL,
  shelf_type TEXT DEFAULT 'custom' CHECK (shelf_type IN ('custom', 'analysis_linked')),
  linked_analysis_id UUID REFERENCES user_analyses(id) ON DELETE SET NULL,
  products JSONB NOT NULL DEFAULT '[]', -- Array de produits
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_shelves_user_id ON user_product_shelves(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_user_shelves_active ON user_product_shelves(user_id, is_active) WHERE is_active = true;

-- Extension Table Profiles pour dashboard
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dashboard_preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS routine_reminder_time TIME DEFAULT '09:00:00';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_dashboard_visit TIMESTAMP WITH TIME ZONE;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_product_shelves ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour routine_completions
CREATE POLICY "Users can manage own routine completions" ON routine_completions
  FOR ALL USING (auth.uid() = user_id);

-- Politiques RLS pour user_product_shelves  
CREATE POLICY "Users can manage own shelves" ON user_product_shelves
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- FONCTIONS UTILITAIRES
-- =============================================

-- Fonction pour calculer le streak actuel
CREATE OR REPLACE FUNCTION calculate_current_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  day_completion RECORD;
BEGIN
  -- Boucle pour compter les jours consécutifs
  LOOP
    -- Vérifier si l'utilisateur a complété au moins une phase ce jour
    SELECT EXISTS(
      SELECT 1 FROM routine_completions 
      WHERE user_id = user_uuid 
        AND completion_date = check_date 
        AND completed = true
    ) AS has_completion INTO day_completion;
    
    IF day_completion.has_completion THEN
      streak := streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
    
    -- Sécurité : limiter à 1000 jours
    IF streak >= 1000 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une étagère depuis une analyse
CREATE OR REPLACE FUNCTION create_shelf_from_analysis(
  user_uuid UUID,
  analysis_uuid UUID,
  analysis_data JSONB
)
RETURNS UUID AS $$
DECLARE
  shelf_id UUID;
  shelf_name TEXT;
  products_array JSONB := '[]';
  product JSONB;
BEGIN
  -- Générer nom de l'étagère
  shelf_name := 'Routine Analyse du ' || TO_CHAR(NOW(), 'DD/MM/YYYY');
  
  -- Extraire les produits de l'analyse
  IF analysis_data ? 'routine' AND analysis_data->'routine' ? 'phases' THEN
    FOR product IN SELECT * FROM jsonb_array_elements(analysis_data->'routine'->'phases')
    LOOP
      IF product ? 'products' THEN
        products_array := products_array || (product->'products');
      END IF;
    END LOOP;
  END IF;
  
  -- Créer l'étagère
  INSERT INTO user_product_shelves (
    user_id,
    shelf_name,
    shelf_type,
    linked_analysis_id,
    products,
    display_order
  ) VALUES (
    user_uuid,
    shelf_name,
    'analysis_linked',
    analysis_uuid,
    products_array,
    COALESCE((
      SELECT MAX(display_order) + 1 
      FROM user_product_shelves 
      WHERE user_id = user_uuid
    ), 0)
  ) RETURNING id INTO shelf_id;
  
  RETURN shelf_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables
CREATE TRIGGER update_routine_completions_updated_at
  BEFORE UPDATE ON routine_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_product_shelves_updated_at
  BEFORE UPDATE ON user_product_shelves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DONNÉES DE TEST (OPTIONNEL)
-- =============================================

-- Insérer quelques complétions de test pour l'utilisateur connecté
-- (Remplacer 'your-user-id' par un vrai UUID utilisateur)
/*
INSERT INTO routine_completions (user_id, completion_date, phase, completed) VALUES
  ('your-user-id', CURRENT_DATE, 'morning', true),
  ('your-user-id', CURRENT_DATE, 'evening', false),
  ('your-user-id', CURRENT_DATE - INTERVAL '1 day', 'morning', true),
  ('your-user-id', CURRENT_DATE - INTERVAL '1 day', 'evening', true),
  ('your-user-id', CURRENT_DATE - INTERVAL '2 days', 'morning', true),
  ('your-user-id', CURRENT_DATE - INTERVAL '2 days', 'evening', false);
*/

-- =============================================
-- VÉRIFICATIONS
-- =============================================

-- Vérifier que les tables ont été créées
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('routine_completions', 'user_product_shelves');

-- Vérifier les politiques RLS
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('routine_completions', 'user_product_shelves');

COMMIT;
