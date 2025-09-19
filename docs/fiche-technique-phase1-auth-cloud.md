# 🔧 FICHE TECHNIQUE PHASE 1 - Authentification & Cloud Storage

> **Version :** 1.0  
> **Date :** 17 septembre 2025  
> **Durée estimée :** 5 jours ouvrés  
> **Priorité :** CRITIQUE

---

## 🎯 **OBJECTIF PHASE 1**

Implémenter l'authentification utilisateur et la sauvegarde cloud tout en **préservant le mode invité existant**. L'architecture découplée actuelle permet cette migration sans impact sur les autres fonctionnalités.

### **Livrables Attendus**
- ✅ Authentification NextAuth.js (Google OAuth + Email/Password)
- ✅ Base de données Supabase avec RLS
- ✅ Migration automatique analyses locales → cloud
- ✅ Mode invité préservé avec limitation (1 analyse)
- ✅ Stockage hybride (cloud + fallback local)

---

## 🏗️ **ARCHITECTURE TECHNIQUE**

### **Stack Technologique Phase 1**
```typescript
// Authentification
- NextAuth.js 4.24.11 (déjà installé)
- Providers: Google OAuth + Email/Password
- Session management sécurisé

// Base de Données
- Supabase (PostgreSQL + Storage + RLS)
- Région: Europe West (RGPD compliant)
- Projet: dermai-v2-prod

// Stockage Hybride
- Cloud: Supabase Storage (photos) + PostgreSQL (analyses)
- Local: IndexedDB (fallback hors ligne)
- Migration: Automatique à l'inscription
```

### **Schéma Base de Données Supabase**

#### **Tables Principales**
```sql
-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table utilisateurs (extend auth.users)
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

-- Table analyses utilisateur
CREATE TABLE user_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  photos_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shared_publicly BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  deleted_at TIMESTAMP WITH TIME ZONE NULL, -- Soft delete
  
  -- Métadonnées techniques
  source TEXT DEFAULT 'web', -- 'web', 'mobile', 'api'
  version TEXT DEFAULT '2.0',
  migrated_from_local BOOLEAN DEFAULT FALSE
);

-- Index pour performance
CREATE INDEX idx_user_analyses_user_id ON user_analyses(user_id);
CREATE INDEX idx_user_analyses_created_at ON user_analyses(created_at DESC);
CREATE INDEX idx_user_analyses_share_token ON user_analyses(share_token) WHERE share_token IS NOT NULL;
```

#### **Row Level Security (RLS)**
```sql
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

CREATE POLICY "Users can soft delete own analyses" ON user_analyses
  FOR UPDATE USING (auth.uid() = user_id);
```

#### **Storage Buckets**
```sql
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

---

## 🔧 **CONFIGURATION TECHNIQUE**

### **Variables d'Environnement Requises**

#### **Supabase**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Supabase Auth
SUPABASE_JWT_SECRET=your-jwt-secret
```

#### **NextAuth.js**
```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### **Existantes à Conserver**
```env
# OpenAI (déjà configuré)
OPENAI_API_KEY=sk-...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### **Structure Fichiers à Créer**

```typescript
// Configuration
src/lib/supabase.ts              // Client Supabase
src/lib/auth.ts                  // Configuration NextAuth
src/middleware.ts                // Protection routes

// API Routes
src/app/api/auth/[...nextauth]/route.ts  // NextAuth handler
src/app/api/analyses/route.ts            // CRUD analyses
src/app/api/migration/route.ts           // Migration données

// Pages Auth
src/app/auth/signin/page.tsx     // Connexion
src/app/auth/signup/page.tsx     // Inscription
src/app/auth/error/page.tsx      // Erreurs auth

// Services
src/services/auth/authService.ts         // Logique auth
src/services/storage/cloudStorage.ts     // Stockage cloud
src/services/migration/migrationService.ts // Migration données

// Hooks
src/hooks/useAuth.ts             // Hook authentification
src/hooks/useCloudStorage.ts     // Hook stockage cloud

// Types
src/types/auth.ts                // Types authentification
src/types/database.ts            // Types base de données
```

---

## 📋 **PRÉREQUIS TECHNIQUES**

### **Comptes & Accès Requis**
- [ ] **Compte Supabase** : Créer projet `dermai-v2-prod` (région EU West)
- [ ] **Google Cloud Console** : Configurer OAuth pour authentification
- [ ] **Accès Vercel** : Variables d'environnement production
- [ ] **Domaine** : Configuration pour production (optionnel Phase 1)

### **Configuration Locale**
- [ ] **Node.js 18+** : Version compatible Next.js 15
- [ ] **Variables d'env** : Fichier `.env.local` configuré
- [ ] **Base de données** : Supabase projet initialisé
- [ ] **Tests** : Environnement de test fonctionnel

### **Validation Fonctionnelle**
- [ ] **Mode invité** : Application fonctionne parfaitement
- [ ] **Analyse IA** : API `/api/analyze` opérationnelle
- [ ] **Stockage local** : IndexedDB + SessionStorage fonctionnels
- [ ] **Déploiement** : Vercel deployment sans erreurs

---

## 🔄 **STRATÉGIE DE MIGRATION**

### **Approche Progressive Sans Casse**

#### **Étape 1 : Coexistence (Jour 1-2)**
```typescript
// Mode hybride : invité + authentifié en parallèle
const useHybridStorage = () => {
  const { user } = useAuth()
  
  if (user) {
    return useCloudStorage() // Utilisateur connecté
  } else {
    return useLocalStorage() // Mode invité
  }
}
```

#### **Étape 2 : Migration Automatique (Jour 3-4)**
```typescript
// À l'inscription, migrer automatiquement
const migrateLocalAnalyses = async (userId: string) => {
  const localAnalyses = await getLocalAnalyses()
  
  for (const analysis of localAnalyses) {
    await saveAnalysisToCloud(userId, {
      ...analysis,
      migrated_from_local: true,
      source: 'migration'
    })
  }
  
  // Optionnel : nettoyer local après confirmation
  await clearLocalAnalyses()
}
```

#### **Étape 3 : Limitation Mode Invité (Jour 5)**
```typescript
// Limiter à 1 analyse en mode invité
const checkAnalysisLimit = async () => {
  const { user } = useAuth()
  
  if (!user) {
    const localCount = await getLocalAnalysesCount()
    if (localCount >= 1) {
      throw new Error('Inscription requise pour plus d\'analyses')
    }
  }
}
```

### **Fallback Strategy**
```typescript
// Toujours garder fallback local
const saveAnalysis = async (analysis: SkinAnalysis) => {
  try {
    // Essayer cloud d'abord
    if (user) {
      await saveToCloud(analysis)
    }
  } catch (error) {
    // Fallback local en cas d'erreur
    await saveToLocal(analysis)
    console.warn('Sauvegarde locale utilisée:', error)
  }
}
```

---

## 🔒 **SÉCURITÉ & CONFORMITÉ**

### **Mesures de Sécurité Phase 1**

#### **Authentification**
- **NextAuth.js** : Gestion sécurisée des sessions
- **JWT Tokens** : Expiration automatique (24h)
- **CSRF Protection** : Intégré NextAuth.js
- **Rate Limiting** : Protection brute force (à implémenter)

#### **Base de Données**
- **RLS Supabase** : Isolation complète des données utilisateur
- **Soft Delete** : Pas de suppression définitive immédiate
- **Audit Trail** : Log des connexions et accès sensibles
- **Chiffrement** : TLS en transit, chiffrement au repos

#### **Stockage Fichiers**
- **Buckets privés** : Pas d'accès public aux photos
- **Politiques strictes** : Utilisateur ne voit que ses photos
- **Compression** : Réduction taille pour sécurité/performance
- **Validation** : Types de fichiers autorisés uniquement

### **Conformité RGPD**
- **Consentement** : Explicite pour stockage cloud
- **Droit à l'oubli** : Suppression complète possible
- **Portabilité** : Export des données utilisateur
- **Rétention** : 12 mois max pour comptes gratuits

---

## 📊 **MÉTRIQUES & MONITORING**

### **KPIs Phase 1**
- **Taux d'inscription** : % utilisateurs invités → inscrits
- **Migration réussie** : % analyses locales migrées sans erreur
- **Rétention** : % utilisateurs qui reviennent après inscription
- **Performance** : Temps de connexion/inscription
- **Erreurs** : Taux d'échec authentification/migration

### **Monitoring Technique**
```typescript
// Métriques à tracker
interface Phase1Metrics {
  auth: {
    signups_total: number
    signins_total: number
    oauth_success_rate: number
    password_reset_requests: number
  }
  migration: {
    analyses_migrated: number
    migration_success_rate: number
    migration_errors: string[]
  }
  storage: {
    cloud_saves_total: number
    local_fallbacks: number
    storage_errors: number
  }
}
```

---

## ⚠️ **RISQUES & MITIGATION**

### **Risques Identifiés**

#### **Technique**
- **Migration échouée** → Fallback local + retry automatique
- **Supabase indisponible** → Mode dégradé local complet
- **OAuth Google down** → Fallback email/password
- **Quota Supabase dépassé** → Alertes + upgrade automatique

#### **UX**
- **Friction inscription** → Onboarding simplifié
- **Perte données locales** → Confirmation utilisateur avant nettoyage
- **Performance dégradée** → Cache intelligent + optimisations

#### **Business**
- **Abandon utilisateurs** → A/B test flow d'inscription
- **Coûts Supabase** → Monitoring usage + alertes
- **RGPD non-compliance** → Audit juridique + corrections

### **Plan de Rollback**
```typescript
// En cas de problème critique
const rollbackToLocalOnly = async () => {
  // 1. Désactiver auth dans middleware
  // 2. Forcer mode invité pour tous
  // 3. Sauvegarder analyses cloud vers local
  // 4. Communiquer aux utilisateurs
}
```

---

## 🧪 **TESTS & VALIDATION**

### **Tests Unitaires**
- **Services auth** : Connexion, inscription, déconnexion
- **Migration** : Transfert données local → cloud
- **RLS** : Isolation données utilisateur
- **Fallbacks** : Mode dégradé fonctionnel

### **Tests d'Intégration**
- **Flow complet** : Invité → inscription → migration → utilisation
- **OAuth** : Google auth end-to-end
- **Stockage** : Cloud + fallback local
- **Sécurité** : Tentatives d'accès non autorisées

### **Tests E2E**
- **Parcours utilisateur** : Analyse invité → inscription → dashboard
- **Responsive** : Mobile + desktop
- **Performance** : Temps de chargement < 2s
- **Accessibilité** : Navigation clavier + screen readers

---

## 🚀 **CRITÈRES DE SUCCÈS**

### **Fonctionnels**
- [ ] **Inscription Google** : Fonctionnelle en 1 clic
- [ ] **Migration automatique** : 100% analyses locales transférées
- [ ] **Mode invité** : Limité à 1 analyse, puis inscription
- [ ] **Fallback local** : Fonctionne si cloud indisponible
- [ ] **RLS** : Utilisateurs voient uniquement leurs données

### **Techniques**
- [ ] **Performance** : Connexion < 2s, migration < 5s
- [ ] **Sécurité** : Audit sécurité passé sans faille critique
- [ ] **Monitoring** : Métriques temps réel opérationnelles
- [ ] **Tests** : 95%+ couverture code critique
- [ ] **Documentation** : Procédures admin complètes

### **Business**
- [ ] **Taux inscription** : >30% utilisateurs invités s'inscrivent
- [ ] **Rétention** : >70% utilisateurs inscrits reviennent D7
- [ ] **Migration** : >95% analyses migrées sans perte
- [ ] **Support** : <5% tickets liés à l'authentification
- [ ] **Coûts** : Budget Supabase respecté (<50€/mois)

---

## 📚 **DOCUMENTATION ASSOCIÉE**

### **Références Techniques**
- **NextAuth.js** : https://next-auth.js.org/
- **Supabase Auth** : https://supabase.com/docs/guides/auth
- **RLS Supabase** : https://supabase.com/docs/guides/auth/row-level-security

### **Fichiers de Configuration**
- `docs/planning-execution-phase1-auth-cloud.md` - Planning détaillé avec prompts
- `docs/runbooks-auth-incidents.md` - Procédures d'incident (à créer)
- `docs/api-documentation-phase1.md` - Documentation API (à créer)

---

**🔄 Statut :** Fiche technique Phase 1 PRÊTE ✅  
**📅 Prochaine étape :** Création planning d'exécution avec prompts opérationnels  
**⚡ Durée estimée :** 5 jours ouvrés  
**🎯 Objectif :** Architecture auth + cloud sans casser l'existant

