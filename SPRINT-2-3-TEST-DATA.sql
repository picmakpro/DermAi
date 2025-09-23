-- =============================================
-- DONNÉES DE TEST SPRINT 2.3
-- =============================================
-- ⚠️ REMPLACEZ 'your-user-id' par votre vrai UUID utilisateur

-- 1. Récupérer votre user_id (exécutez d'abord cette query)
SELECT id, email, full_name FROM profiles LIMIT 5;

-- 2. Une fois que vous avez votre user_id, remplacez-le dans les queries ci-dessous
-- Exemple: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- =============================================
-- DONNÉES DE TEST ROUTINE COMPLETIONS
-- =============================================

-- Complétions des 7 derniers jours (remplacez YOUR_USER_ID)
INSERT INTO routine_completions (user_id, completion_date, phase, completed, notes) VALUES
  ('YOUR_USER_ID', CURRENT_DATE, 'morning', true, 'Routine matinale complète'),
  ('YOUR_USER_ID', CURRENT_DATE, 'evening', false, null),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '1 day', 'morning', true, 'Bien appliqué le sérum'),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '1 day', 'evening', true, 'Routine complète'),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '2 days', 'morning', true, null),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '2 days', 'evening', false, 'Oublié la crème de nuit'),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '3 days', 'morning', true, null),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '3 days', 'evening', true, null),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '4 days', 'morning', false, 'Pas eu le temps'),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '4 days', 'evening', true, null),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '5 days', 'morning', true, null),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '5 days', 'evening', true, null),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '6 days', 'morning', true, null),
  ('YOUR_USER_ID', CURRENT_DATE - INTERVAL '6 days', 'evening', false, null)
ON CONFLICT (user_id, completion_date, phase) DO NOTHING;

-- =============================================
-- DONNÉES DE TEST ÉTAGÈRES PRODUITS
-- =============================================

-- Étagère personnalisée "Ma routine hiver"
INSERT INTO user_product_shelves (
  user_id, 
  shelf_name, 
  shelf_type, 
  products, 
  display_order
) VALUES (
  'YOUR_USER_ID',
  'Ma routine hiver',
  'custom',
  '[
    {
      "id": "custom-cleanser-1",
      "name": "Nettoyant Doux Hydratant",
      "brand": "CeraVe",
      "type": "custom",
      "category": "cleanser",
      "phase": "both",
      "user_notes": "Parfait pour ma peau sèche en hiver"
    },
    {
      "id": "custom-serum-1", 
      "name": "Sérum Acide Hyaluronique",
      "brand": "The Ordinary",
      "type": "custom",
      "category": "serum",
      "phase": "both",
      "user_notes": "Hydratation intense"
    },
    {
      "id": "custom-moisturizer-1",
      "name": "Crème Hydratante Réparatrice",
      "brand": "La Roche-Posay",
      "type": "custom", 
      "category": "moisturizer",
      "phase": "evening",
      "user_notes": "Très nourrissante pour la nuit"
    }
  ]'::jsonb,
  0
) ON CONFLICT DO NOTHING;

-- Étagère personnalisée "Produits à tester"
INSERT INTO user_product_shelves (
  user_id,
  shelf_name,
  shelf_type, 
  products,
  display_order
) VALUES (
  'YOUR_USER_ID',
  'Produits à tester',
  'custom',
  '[
    {
      "id": "custom-exfoliant-1",
      "name": "Exfoliant BHA 2%",
      "brand": "Paula''s Choice",
      "type": "custom",
      "category": "exfoliant", 
      "phase": "evening",
      "user_notes": "À introduire progressivement"
    },
    {
      "id": "custom-sunscreen-1",
      "name": "Crème Solaire Fluide SPF50",
      "brand": "Avène",
      "type": "custom",
      "category": "sunscreen",
      "phase": "morning",
      "user_notes": "Texture légère, pas de traces blanches"
    }
  ]'::jsonb,
  1
) ON CONFLICT DO NOTHING;

-- =============================================
-- VÉRIFICATIONS
-- =============================================

-- Vérifier les complétions créées
SELECT 
  completion_date,
  phase,
  completed,
  notes
FROM routine_completions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY completion_date DESC, phase;

-- Vérifier les étagères créées  
SELECT 
  shelf_name,
  shelf_type,
  jsonb_array_length(products) as product_count,
  display_order
FROM user_product_shelves
WHERE user_id = 'YOUR_USER_ID'
ORDER BY display_order;

-- Calculer le streak actuel (doit retourner un nombre > 0)
SELECT calculate_current_streak('YOUR_USER_ID') as current_streak;


