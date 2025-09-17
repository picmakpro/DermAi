# 🔧 GUIDE DE CONFIGURATION - Variables d'Environnement

> **Statut :** Configuration requise pour Jour 5  
> **Prérequis :** Vérifications Jour 4 passées ✅  
> **Durée :** 15-30 minutes

---

## 🎯 **OBJECTIF**

Configurer toutes les variables d'environnement nécessaires pour tester l'authentification et le stockage cloud avant d'implémenter les pages d'authentification du Jour 5.

---

## 📋 **ÉTAPES DE CONFIGURATION**

### **1. Créer le fichier .env.local**

```bash
# Dans le répertoire racine du projet
touch .env.local
```

### **2. Configuration Supabase**

#### **A. Créer le projet Supabase**
1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet :
   - **Nom :** `dermai-v2-prod`
   - **Région :** `Europe West (eu-west-1)` (RGPD compliant)
   - **Plan :** Free (suffisant pour les tests)

#### **B. Récupérer les clés**
1. Dans le dashboard Supabase → Settings → API
2. Copier les valeurs suivantes :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...votre-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...votre-service-role-key...
SUPABASE_JWT_SECRET=your-jwt-secret
```

#### **C. Créer les tables**
Exécuter dans Supabase SQL Editor :

```sql
-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table profiles (extend auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free',
  analyses_count INTEGER DEFAULT 0,
  last_analysis_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table user_analyses
CREATE TABLE user_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  photos_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shared_publicly BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  deleted_at TIMESTAMP WITH TIME ZONE NULL,
  source TEXT DEFAULT 'web',
  version TEXT DEFAULT '2.0',
  migrated_from_local BOOLEAN DEFAULT FALSE
);

-- Index pour performance
CREATE INDEX idx_user_analyses_user_id ON user_analyses(user_id);
CREATE INDEX idx_user_analyses_created_at ON user_analyses(created_at DESC);
CREATE INDEX idx_user_analyses_share_token ON user_analyses(share_token) WHERE share_token IS NOT NULL;

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analyses ENABLE ROW LEVEL SECURITY;

-- Politiques profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques user_analyses
CREATE POLICY "Users can view own analyses" ON user_analyses
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (shared_publicly = true AND deleted_at IS NULL)
  );

CREATE POLICY "Users can insert own analyses" ON user_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON user_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Bucket pour photos utilisateurs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-photos', 'user-photos', false);

-- Politique storage
CREATE POLICY "Users can upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### **3. Configuration Google OAuth**

#### **A. Google Cloud Console**
1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créer un nouveau projet ou utiliser existant
3. Activer l'API Google+ (ou Google Identity)
4. Aller dans "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Type d'application : "Web application"
6. Origines JavaScript autorisées :
   - `http://localhost:3000` (développement)
   - `https://your-app.vercel.app` (production)
7. URI de redirection autorisées :
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-app.vercel.app/api/auth/callback/google`

#### **B. Récupérer les clés**
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### **4. Configuration NextAuth.js**

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-minimum
```

**Générer un secret sécurisé :**
```bash
openssl rand -base64 32
```

### **5. Configuration existante à conserver**

```env
# OpenAI (déjà configuré)
OPENAI_API_KEY=sk-...votre-clé-existante...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 📄 **FICHIER .env.local COMPLET**

```env
# Configuration DermAI V2 - Phase 1 Auth & Cloud

# OpenAI Configuration (OBLIGATOIRE - déjà configuré)
OPENAI_API_KEY=sk-your-existing-openai-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
SUPABASE_JWT_SECRET=your-jwt-secret

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-minimum

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# APIs d'affiliation (Optionnelles - existantes)
SEPHORA_API_KEY=your-sephora-api-key
DOUGLAS_API_KEY=your-douglas-api-key
AMAZON_ACCESS_KEY=your-amazon-access-key
AMAZON_SECRET_KEY=your-amazon-secret-key
AMAZON_ASSOCIATE_TAG=your-amazon-associate-tag
```

---

## 🧪 **TESTS DE VALIDATION**

### **1. Test Supabase**
```bash
# Démarrer le serveur
npm run dev

# Tester la connexion Supabase
curl http://localhost:3000/api/test-supabase
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Configuration Supabase validée ✅",
  "tests": {
    "connection": "✅ Connexion Supabase OK",
    "serviceRole": "✅ Service Role OK",
    "environment": {
      "supabaseUrl": true,
      "supabaseAnonKey": true,
      "supabaseServiceKey": true,
      "nextAuthSecret": true,
      "googleClientId": true,
      "googleClientSecret": true
    }
  }
}
```

### **2. Test Page Interactive**
1. Aller sur `http://localhost:3000/test-cloud-migration`
2. Cliquer sur "Se connecter avec Google"
3. Autoriser l'application
4. Vérifier que l'utilisateur est connecté

### **3. Test Stockage Cloud**
1. Une fois connecté, cliquer sur "Récupérer analyses cloud"
2. Cliquer sur "Sauvegarder analyse test"
3. Re-cliquer sur "Récupérer analyses cloud"
4. Vérifier que l'analyse apparaît

### **4. Test Migration**
1. Cliquer sur "Créer analyse locale test"
2. Cliquer sur "Vérifier statut migration"
3. Cliquer sur "Migrer analyses locales"
4. Vérifier que la migration s'est bien passée

---

## 🐛 **DÉPANNAGE**

### **Erreur "Variables d'environnement Supabase manquantes"**
- Vérifier que `.env.local` est dans le répertoire racine
- Redémarrer le serveur de développement
- Vérifier que les clés Supabase sont correctes

### **Erreur Google OAuth**
- Vérifier que les domaines sont autorisés dans Google Cloud Console
- Vérifier que l'API Google+ est activée
- Vérifier les URI de redirection

### **Erreur "Non authentifié"**
- Vérifier que NextAuth est configuré
- Vérifier que NEXTAUTH_SECRET est défini
- Vider le cache du navigateur

### **Erreur RLS Supabase**
- Vérifier que les politiques RLS sont créées
- Vérifier que les tables existent
- Vérifier que l'utilisateur est bien créé dans auth.users

---

## ✅ **CRITÈRES DE SUCCÈS**

- [ ] **Variables d'environnement** : Toutes configurées
- [ ] **Supabase** : Projet créé, tables créées, RLS activé
- [ ] **Google OAuth** : Configuré et fonctionnel
- [ ] **Test Supabase** : API retourne success: true
- [ ] **Test Authentification** : Connexion Google fonctionne
- [ ] **Test Cloud Storage** : Sauvegarde/récupération OK
- [ ] **Test Migration** : Migration locale → cloud OK

---

**🔄 Statut :** Configuration requise avant Jour 5 ⚠️  
**📅 Prochaine étape :** Implémentation pages d'authentification  
**🎯 Objectif :** Environnement de test fonctionnel pour Phase 1

---

## 📞 **SUPPORT**

En cas de problème :
1. Vérifier les logs du serveur de développement
2. Vérifier les logs Supabase (Dashboard → Logs)
3. Vérifier la console du navigateur
4. Consulter la documentation NextAuth.js et Supabase
