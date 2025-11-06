# 🚀 GUIDE SETUP SUPABASE - Phase 2

**Date** : 3 Octobre 2025  
**Durée estimée** : 10-15 minutes

---

## 📋 PRÉREQUIS

- [ ] Compte Supabase (gratuit) : https://supabase.com
- [ ] Node.js installé
- [ ] Accès au projet DermAI V2

---

## 🎯 ÉTAPE 1 : Créer projet Supabase

### 1.1 Création projet

1. Aller sur https://supabase.com
2. Se connecter ou créer un compte
3. **New Project**
   - **Name** : `dermai-v2-products`
   - **Database Password** : Générer un mot de passe fort (le sauvegarder !)
   - **Region** : `Europe (Frankfurt)` (ou la plus proche)
   - **Plan** : Free Tier (500 MB - largement suffisant pour 110-2000 produits)

4. Attendre ~2 minutes pour la création

### 1.2 Récupérer les credentials

Une fois le projet créé, aller dans **Settings** → **API** :

📝 Copier ces valeurs :
```
Project URL : https://xxxxxxxxxxxxx.supabase.co
anon public : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
service_role : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M... (secret !)
```

---

## 🎯 ÉTAPE 2 : Configurer .env.local

### 2.1 Créer/Mettre à jour `.env.local`

```bash
cd /Users/mak/dermai-v2
```

Ajouter ces lignes à `.env.local` :

```bash
# ===== SUPABASE (Phase 2) =====
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Secret !

# Feature flag (Phase 2)
USE_SUPABASE_CATALOG=false  # false pour développement, true pour production
```

⚠️ **IMPORTANT** :
- `NEXT_PUBLIC_*` = Visible côté client
- `SUPABASE_SERVICE_ROLE_KEY` = Secret backend SEULEMENT (ne JAMAIS exposer)

---

## 🎯 ÉTAPE 3 : Installer Supabase CLI (optionnel)

```bash
# macOS
brew install supabase/tap/supabase

# Ou npm global
npm install -g supabase
```

### 3.1 Login

```bash
supabase login
```

### 3.2 Link projet

```bash
cd /Users/mak/dermai-v2
supabase link --project-ref xxxxxxxxxxxxx
```

_(Remplacer `xxxxxxxxxxxxx` par l'ID du projet visible dans l'URL)_

---

## 🎯 ÉTAPE 4 : Créer la table `products`

### Option A : Via Supabase UI (Recommandé pour première fois)

1. Aller dans **SQL Editor** (sidebar gauche)
2. **New Query**
3. Copier le contenu de `supabase/migrations/20251003_create_products_table.sql`
4. **Run** (ou Cmd/Ctrl + Enter)

✅ Succès si message : "Success. No rows returned"

### Option B : Via CLI

```bash
cd /Users/mak/dermai-v2
supabase db push
```

---

## 🎯 ÉTAPE 5 : Vérifier la création

### 5.1 Via UI

1. **Table Editor** (sidebar)
2. Vérifier que table `products` existe
3. Colonnes visibles : catalog_id, name, brand, care_type, etc.

### 5.2 Via SQL

Dans **SQL Editor**, exécuter :

```sql
-- Vérifier structure table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products';

-- Vérifier index
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'products';

-- Test insertion (sera supprimé ensuite)
INSERT INTO products (
  catalog_id, name, brand, category, care_type,
  target_skin_types, price, application_timing
) VALUES (
  'test_001',
  'Test Product',
  'Test Brand',
  'serum',
  'hydratation',
  ARRAY['normal'],
  10.00,
  'both'
);

-- Vérifier
SELECT * FROM products;

-- Supprimer test
DELETE FROM products WHERE catalog_id = 'test_001';
```

✅ Si tout fonctionne → Table prête !

---

## 🎯 ÉTAPE 6 : Migrer les 110 produits

Cette étape sera faite avec le script automatique.

```bash
cd /Users/mak/dermai-v2
npx tsx scripts/migrate-to-supabase.ts
```

_(Script sera créé à l'étape suivante)_

---

## 📊 MÉTRIQUES ATTENDUES

Après migration complète :

| Métrique | Valeur |
|----------|--------|
| **Products count** | 110 |
| **Database size** | ~220 KB |
| **Index size** | ~60 KB |
| **Query latency** | <50ms |

---

## 🔧 TROUBLESHOOTING

### Erreur : "relation products already exists"

✅ Normal si vous relancez la migration. La table existe déjà.

**Solution** : 
```sql
DROP TABLE IF EXISTS products CASCADE;
```
Puis relancer la migration.

### Erreur : "permission denied for table products"

❌ RLS (Row Level Security) bloque.

**Solution** :
- Utiliser `SUPABASE_SERVICE_ROLE_KEY` dans le script backend
- Ou désactiver temporairement RLS :
```sql
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

### Query lente (>100ms)

**Vérifier index** :
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'products'
ORDER BY idx_scan DESC;
```

Si `idx_scan = 0` → Index pas utilisé (vérifier queries)

---

## ✅ CHECKLIST FINALE

- [ ] Projet Supabase créé
- [ ] Credentials copiées dans `.env.local`
- [ ] Table `products` créée avec succès
- [ ] Index créés (12 index)
- [ ] Triggers créés (2 triggers)
- [ ] RLS activé
- [ ] Test insertion/suppression réussi

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ Setup Supabase (cette étape)
2. 🔄 Script migration 110 produits
3. 📦 ProductDatabaseLoaderV2
4. 🧪 Tests + Feature flag
5. 🚀 Production

---

**Support** : Docs complète dans `docs/architecture/SUPABASE-SCHEMA.md`

