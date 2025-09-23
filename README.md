# 🧬 DermAI V2 - Diagnostic Dermatologique IA

> Application révolutionnaire de diagnostic dermatologique utilisant GPT-4o Vision pour des analyses précises et des recommandations personnalisées.

## ✨ Fonctionnalités

- 🤖 **Architecture IA-First Pure** - 4 étapes 100% IA avec GPT-4o Vision
- 📸 **Upload professionnel** - Interface drag & drop intuitive  
- 🎯 **Routine 3 Phases** - Logique dermatologique scientifique
- 📊 **Scores détaillés** - 8 paramètres cutanés analysés
- 🛍️ **Catalogue interne** - Sélection intelligente sans fallback générique
- 📱 **Interface éducative** - Durées personnalisées et critères visuels

## 🚀 Technologies

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **IA**: OpenAI GPT-4o Vision API (architecture déterministe)
- **Architecture**: App Router, validation Zod, retry intelligent
- **Performance**: Cache multi-niveaux, compression adaptative

## 🛠️ Installation

Cloner le repository
git clone https://github.com/YOUR_USERNAME/dermai-v2.git
cd dermai-v2

Installer les dépendances
npm install

Configurer les variables d'environnement
cp .env.example .env.local
Ajouter votre clé OpenAI dans .env.local

Lancer en développement
npm run dev

## 🔧 Configuration

### Variables d'environnement requises

OPENAI_API_KEY=sk-your-openai-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

## 📋 État du Projet

### ✅ Fonctionnalités Terminées
- [x] Architecture IA-First Pure (4 étapes)
- [x] Routine 3 phases dermatologique
- [x] Interface éducative avec durées intelligentes
- [x] Upload photos professionnel avec validation
- [x] Déploiement Vercel optimisé
- [x] Logique de transition produits intelligente

### 🚧 En Cours
- [ ] Authentification NextAuth.js + Supabase
- [ ] Dashboard utilisateur complet
- [ ] Système de cache Redis

### 🔮 Prochaines Étapes
- [ ] Tests utilisateur complets
- [ ] Optimisation prompts IA
- [ ] Intégration APIs d'affiliation
- [ ] Coach IA conversationnel

## 📚 Documentation

Pour une documentation complète, consultez :
- **[docs/spec.md](./docs/spec.md)** - Spécifications techniques complètes
- **[docs/README.md](./docs/README.md)** - Index de toute la documentation
- **[docs/architecture/](./docs/architecture/)** - Architecture technique
- **[docs/domain/](./docs/domain/)** - Logique dermatologique

## 🎯 Objectifs Business

- **Modèle** : Catalogue interne + commissions d'affiliation
- **Cible** : Zéro fallback générique, 95% personnalisation
- **Conversion** : >12% diagnostic → achat (catalogue intelligent)
- **AOV** : 35€ panier moyen optimisé

---

**DermAI V2** - Révolutionner le diagnostic dermatologique par l'IA 🚀
