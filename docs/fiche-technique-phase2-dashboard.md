# 🏠 FICHE TECHNIQUE PHASE 2 - Dashboard Utilisateur

> **Version :** 1.0  
> **Date :** 18 septembre 2025  
> **Durée estimée :** 3-4 semaines  
> **Priorité :** CRITIQUE - Engagement & Rétention

---

## 🎯 **OBJECTIF PHASE 2**

Construire un dashboard complet qui transforme DermAI d'un **outil ponctuel** en **compagnon quotidien** de soin de la peau, maximisant l'engagement utilisateur et la rétention long terme.

### **Livrables Attendus**
- ✅ Dashboard avec sidebar responsive et widgets prioritaires
- ✅ Historique analyses avec comparaison avant/après interactive
- ✅ Routine tracker avec calendrier de complétion mensuel
- ✅ Étagères produits personnalisables (liées aux diagnostics + produits perso)
- ✅ Système de badges symboliques motivants
- ✅ Coach IA contextuel intégré (GPT-4o)
- ✅ Paramètres utilisateur avancés avec préférences

---

## 🏗️ **ARCHITECTURE TECHNIQUE**

### **Stack Technologique Phase 2**
```typescript
// Frontend Dashboard
- Next.js 15 App Router (pages dashboard/*)
- Recharts (graphiques comparaison)
- React-Calendar (routine tracker)
- React DnD (étagères produits)
- Framer Motion (animations badges)

// Backend Extensions
- Supabase (nouvelles tables dashboard)
- OpenAI GPT-4o (coach IA contextuel)
- Sharp/Supabase Storage (compression images)

// Cache & Performance
- SWR/TanStack Query (cache client)
- Supabase RLS (sécurité données)
- Compression images automatique
```

### **Structure Frontend Dashboard**
```typescript
src/app/dashboard/
├── layout.tsx                 // Sidebar + navigation
├── page.tsx                   // Vue d'ensemble (widgets)
├── analyses/
│   ├── page.tsx              // Liste paginée + filtres
│   ├── [id]/page.tsx         // Détail analyse
│   └── compare/page.tsx      // Comparaison interactive
├── routine/
│   ├── page.tsx              // Calendrier tracker
│   ├── shelves/page.tsx      // Étagères produits
│   └── coach/page.tsx        // Chat IA (optionnel)
├── progress/
│   └── page.tsx              // Évolution + badges
└── settings/
    └── page.tsx              // Paramètres utilisateur

src/components/dashboard/
├── layout/
│   ├── Sidebar.tsx           // Navigation principale
│   ├── DashboardHeader.tsx   // Header avec user menu
│   └── MobileNav.tsx         // Burger menu mobile
├── widgets/
│   ├── OverviewStats.tsx     // Métriques générales
│   ├── LastAnalysis.tsx      // Dernière analyse
│   ├── RoutineToday.tsx      // Routine du jour
│   ├── ProgressChart.tsx     // Graphique évolution
│   └── RecentBadges.tsx      // Badges récents
├── analyses/
│   ├── AnalysisList.tsx      // Liste avec pagination
│   ├── AnalysisCard.tsx      // Card individuelle
│   ├── ComparisonSlider.tsx  // Slider avant/après
│   └── ScoreComparison.tsx   // Graphique scores
├── routine/
│   ├── RoutineCalendar.tsx   // Calendrier mensuel
│   ├── ProductShelves.tsx    // Étagères drag & drop
│   ├── ShelfEditor.tsx       // Édition étagère
│   └── CompletionTracker.tsx // Tracking complétion
├── coach/
│   ├── AICoachModal.tsx      // Chat modal
│   ├── ChatMessage.tsx       // Message individuel
│   └── QuickSuggestions.tsx  // Suggestions rapides
├── badges/
│   ├── BadgeCard.tsx         // Badge individuel
│   ├── BadgeNotification.tsx // Popup nouveau badge
│   └── ProgressBadge.tsx     // Badge avec progression
└── settings/
    ├── ProfileSettings.tsx   // Paramètres profil
    ├── NotificationSettings.tsx // Préférences notifications
    └── PrivacySettings.tsx   // Paramètres confidentialité
```

---

## 🗄️ **MODÈLES DE DONNÉES**

### **Extensions Base de Données Supabase**

#### **Table Routine Completions**
```sql
CREATE TABLE routine_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  phase TEXT NOT NULL, -- 'morning' | 'evening'
  completed BOOLEAN DEFAULT FALSE,
  products_used TEXT[], -- IDs des produits utilisés
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unicité par utilisateur/date/phase
  UNIQUE(user_id, completion_date, phase)
);

-- Index pour performance
CREATE INDEX idx_routine_completions_user_date ON routine_completions(user_id, completion_date DESC);
CREATE INDEX idx_routine_completions_streak ON routine_completions(user_id, completed, completion_date);
```

#### **Table Étagères Produits**
```sql
CREATE TABLE user_product_shelves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  shelf_name TEXT NOT NULL,
  shelf_type TEXT DEFAULT 'custom', -- 'custom' | 'analysis_linked'
  linked_analysis_id UUID REFERENCES user_analyses(id) ON DELETE SET NULL,
  products JSONB NOT NULL DEFAULT '[]', -- Array de produits
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Structure produit dans JSONB
-- {
--   "id": "product-uuid",
--   "name": "Sérum Vitamine C",
--   "brand": "The Ordinary",
--   "type": "internal" | "custom",
--   "category": "serum",
--   "phase": "morning" | "evening" | "both",
--   "affiliate_link": "https://...",
--   "user_notes": "Fonctionne bien"
-- }

CREATE INDEX idx_user_shelves_user_id ON user_product_shelves(user_id, display_order);
```

#### **Table Badges Utilisateur**
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'routine_streak', 'analysis_count', 'improvement', 'discovery'
  badge_level TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
  badge_criteria JSONB NOT NULL, -- Critères d'obtention
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_new BOOLEAN DEFAULT TRUE, -- Pour notifications
  
  -- Contrainte unicité par type/niveau
  UNIQUE(user_id, badge_type, badge_level)
);

-- Exemples de badges
-- routine_streak: 7, 30, 90, 365 jours consécutifs
-- analysis_count: 3, 10, 25, 50 analyses
-- improvement: 10%, 25%, 50% amélioration scores
-- discovery: 5, 15, 30 produits testés

CREATE INDEX idx_user_badges_user_earned ON user_badges(user_id, earned_at DESC);
CREATE INDEX idx_user_badges_new ON user_badges(user_id, is_new) WHERE is_new = true;
```

#### **Table Conversations Coach IA**
```sql
CREATE TABLE ai_coach_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_title TEXT, -- Auto-généré ou user-défini
  messages JSONB NOT NULL DEFAULT '[]', -- Array de messages
  context_data JSONB, -- Données contextuelles utilisées
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Structure message dans JSONB
-- {
--   "id": "msg-uuid",
--   "role": "user" | "assistant",
--   "content": "Message text",
--   "timestamp": "2025-09-18T10:30:00Z",
--   "context_used": ["profile", "last_analysis", "routine"]
-- }

CREATE INDEX idx_ai_conversations_user_last ON ai_coach_conversations(user_id, last_message_at DESC);
```

#### **Extension Table Profiles**
```sql
-- Ajouter colonnes pour dashboard
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  dashboard_preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  routine_reminder_time TIME DEFAULT '09:00:00',
  timezone TEXT DEFAULT 'Europe/Paris',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_dashboard_visit TIMESTAMP WITH TIME ZONE;

-- Structure dashboard_preferences
-- {
--   "widgets_order": ["last_analysis", "routine_today", "progress_chart", "badges"],
--   "default_comparison_period": "30_days",
--   "routine_view": "calendar" | "list",
--   "theme": "light" | "dark"
-- }

-- Structure notification_settings
-- {
--   "routine_reminders": true,
--   "analysis_reminders": true,
--   "badge_notifications": true,
--   "coach_suggestions": true,
--   "email_frequency": "weekly" | "monthly" | "never"
-- }
```

---

## 🎨 **SPÉCIFICATIONS UI/UX**

### **Dashboard Layout Responsive**

#### **Desktop (>1024px)**
```typescript
// Layout principal
<div className="flex h-screen bg-gray-50">
  {/* Sidebar fixe 280px */}
  <Sidebar className="w-70 bg-white shadow-sm" />
  
  {/* Contenu principal */}
  <main className="flex-1 overflow-y-auto">
    <DashboardHeader />
    <div className="p-6">
      {children}
    </div>
  </main>
</div>
```

#### **Mobile (<1024px)**
```typescript
// Layout mobile avec burger menu
<div className="flex flex-col h-screen bg-gray-50">
  <MobileHeader />
  <main className="flex-1 overflow-y-auto p-4">
    {children}
  </main>
  <MobileNav /> {/* Bottom navigation */}
</div>
```

### **Page d'Accueil Dashboard - Widgets Prioritaires**

#### **Grid Layout Responsive**
```typescript
// Desktop: Grid 3 colonnes
// Mobile: Stack vertical

const DashboardOverview = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Colonne 1 - Analyse récente */}
    <div className="lg:col-span-2">
      <LastAnalysisWidget />
      <RoutineTodayWidget />
    </div>
    
    {/* Colonne 2 - Métriques */}
    <div>
      <OverviewStatsWidget />
      <ProgressChartWidget />
      <RecentBadgesWidget />
    </div>
  </div>
)
```

#### **Widgets Spécifiques**

**1. LastAnalysisWidget**
```typescript
// Affichage dernière analyse avec CTA
- Photo principale + date
- Scores principaux (3 meilleurs/pires)
- Bouton "Voir détail" + "Nouvelle analyse"
- Suggestion "Comparer avec précédente"
```

**2. RoutineTodayWidget**
```typescript
// Routine du jour avec tracking
- Phase matin/soir avec produits
- Checkboxes de complétion
- Progression streak actuelle
- Bouton "Ouvrir calendrier"
```

**3. OverviewStatsWidget**
```typescript
// Métriques générales
- Nombre total d'analyses
- Streak routine actuel
- Amélioration score global
- Badges obtenus
```

**4. ProgressChartWidget**
```typescript
// Graphique évolution (Recharts)
- Courbe scores sur 6 mois
- Sélecteur critère (hydratation, rides, etc.)
- Annotations événements (nouvelle routine)
```

**5. RecentBadgesWidget**
```typescript
// Derniers badges avec animations
- 3 badges les plus récents
- Animation "nouveau" si earned < 7 jours
- Bouton "Voir tous les badges"
```

---

## 📊 **FONCTIONNALITÉS DÉTAILLÉES**

### **1. Historique & Comparaison d'Analyses**

#### **Liste Analyses avec Filtres**
```typescript
// Composant AnalysisList
interface AnalysisFilters {
  dateRange: 'last_month' | 'last_3_months' | 'last_year' | 'all'
  scoreImprovement: 'all' | 'improved' | 'declined' | 'stable'
  hasPhotos: boolean
  searchQuery: string
}

// Pagination : 10 analyses par page
// Tri : date DESC par défaut
// Actions : Voir détail, Comparer, Partager, Supprimer
```

#### **Comparaison Interactive**
```typescript
// Page /dashboard/analyses/compare
// URL: ?ids=analysis1,analysis2

const ComparisonPage = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Photos avant/après avec slider */}
    <ComparisonSlider 
      beforePhotos={analysis1.photos}
      afterPhotos={analysis2.photos}
      interactive={true}
    />
    
    {/* Graphique scores */}
    <ScoreComparison
      beforeScores={analysis1.scores}
      afterScores={analysis2.scores}
      showTrend={true}
    />
  </div>
)
```

**Slider Interactif Photos**
```typescript
// Composant ComparisonSlider
- Slider horizontal pour naviguer entre photos
- Overlay "Avant" / "Après" avec dates
- Zoom sur clic + navigation tactile
- Export image comparaison
```

### **2. Routine Tracker avec Calendrier**

#### **Vue Calendrier Mensuelle**
```typescript
// Composant RoutineCalendar (React-Calendar)
const RoutineCalendar = () => {
  // Affichage : mois actuel par défaut
  // Navigation : flèches mois précédent/suivant
  // Indicateurs par jour :
  //   - Vert : routine complète (matin + soir)
  //   - Orange : routine partielle (matin OU soir)
  //   - Gris : pas de routine
  //   - Blanc : jour futur
  
  return (
    <Calendar
      tileContent={({ date }) => (
        <RoutineDayIndicator 
          date={date}
          completion={getCompletionForDate(date)}
        />
      )}
      onClickDay={handleDayClick}
    />
  )
}
```

#### **Interaction Jour Spécifique**
```typescript
// Clic sur jour → Modal détail
const DayDetailModal = ({ date, completion }) => (
  <Modal>
    <h3>Routine du {formatDate(date)}</h3>
    
    {/* Phase matin */}
    <RoutinePhase 
      phase="morning"
      products={completion.morning.products}
      completed={completion.morning.completed}
      onToggle={handleToggleCompletion}
    />
    
    {/* Phase soir */}
    <RoutinePhase 
      phase="evening"
      products={completion.evening.products}
      completed={completion.evening.completed}
      onToggle={handleToggleCompletion}
    />
    
    {/* Notes optionnelles */}
    <TextArea 
      placeholder="Notes sur la routine..."
      value={completion.notes}
      onChange={handleNotesChange}
    />
  </Modal>
)
```

#### **Calcul Streaks & Statistiques**
```typescript
// Service RoutineStatsService
class RoutineStatsService {
  // Streak actuel (jours consécutifs)
  static getCurrentStreak(userId: string): Promise<number>
  
  // Meilleur streak historique
  static getBestStreak(userId: string): Promise<number>
  
  // Taux de complétion sur période
  static getCompletionRate(userId: string, days: number): Promise<number>
  
  // Jours de la semaine les plus réguliers
  static getWeekdayStats(userId: string): Promise<WeekdayStats>
  
  // Progression mensuelle
  static getMonthlyProgress(userId: string): Promise<MonthlyStats[]>
}
```

### **3. Étagères Produits Personnalisables**

#### **Types d'Étagères**
```typescript
// 1. Étagères liées aux diagnostics (auto-générées)
interface AnalysisLinkedShelf {
  type: 'analysis_linked'
  linkedAnalysisId: string
  name: string // "Routine Analyse du 15/09/2025"
  products: Product[] // Produits recommandés par l'IA
  canEdit: false // Lecture seule, mais peut dupliquer
}

// 2. Étagères personnalisées (créées par user)
interface CustomShelf {
  type: 'custom'
  name: string // "Ma routine hiver"
  products: (InternalProduct | CustomProduct)[]
  canEdit: true
  canReorder: true
}
```

#### **Interface Étagères**
```typescript
// Page /dashboard/routine/shelves
const ProductShelvesPage = () => (
  <div>
    {/* Actions globales */}
    <div className="flex justify-between mb-6">
      <h1>Mes Étagères Produits</h1>
      <Button onClick={handleCreateShelf}>
        Créer une étagère
      </Button>
    </div>
    
    {/* Liste étagères avec drag & drop */}
    <DragDropContext onDragEnd={handleReorderShelves}>
      <Droppable droppableId="shelves">
        {shelves.map(shelf => (
          <ShelfCard 
            key={shelf.id}
            shelf={shelf}
            onEdit={handleEditShelf}
            onDelete={handleDeleteShelf}
          />
        ))}
      </Droppable>
    </DragDropContext>
  </div>
)
```

#### **Éditeur d'Étagère**
```typescript
// Composant ShelfEditor
const ShelfEditor = ({ shelf, onSave }) => (
  <Modal size="large">
    {/* Nom étagère */}
    <Input 
      label="Nom de l'étagère"
      value={shelf.name}
      onChange={handleNameChange}
    />
    
    {/* Recherche produits internes */}
    <ProductSearch 
      onSelect={handleAddInternalProduct}
      placeholder="Rechercher dans le catalogue..."
    />
    
    {/* Ajout produit personnalisé */}
    <CustomProductForm 
      onAdd={handleAddCustomProduct}
    />
    
    {/* Liste produits avec drag & drop */}
    <DragDropContext onDragEnd={handleReorderProducts}>
      <ProductList 
        products={shelf.products}
        onRemove={handleRemoveProduct}
        onEdit={handleEditProduct}
      />
    </DragDropContext>
    
    {/* Actions */}
    <div className="flex gap-4">
      <Button variant="secondary" onClick={onCancel}>
        Annuler
      </Button>
      <Button onClick={handleSave}>
        Sauvegarder
      </Button>
    </div>
  </Modal>
)
```

#### **Suggestion Mise à Jour Étagères**
```typescript
// Quand nouveau diagnostic disponible
const ShelfUpdateSuggestion = ({ shelf, newAnalysis }) => (
  <Alert variant="info" className="mb-4">
    <Icon name="lightbulb" />
    <div>
      <p>Votre nouvelle analyse suggère des produits différents pour cette étagère.</p>
      <div className="flex gap-2 mt-2">
        <Button size="sm" onClick={handleViewSuggestions}>
          Voir les suggestions
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss}>
          Plus tard
        </Button>
      </div>
    </div>
  </Alert>
)
```

### **4. Coach IA Contextuel**

#### **Interface Chat Modal**
```typescript
// Composant AICoachModal (docké en bas à droite)
const AICoachModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  
  return (
    <>
      {/* Bouton flottant */}
      <FloatingButton 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6"
      >
        <Icon name="message-circle" />
        Coach IA
      </FloatingButton>
      
      {/* Modal chat */}
      <Modal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position="bottom-right"
        size="chat"
      >
        <ChatInterface 
          conversations={conversations}
          activeConversation={activeConversation}
          onSendMessage={handleSendMessage}
          onNewConversation={handleNewConversation}
        />
      </Modal>
    </>
  )
}
```

#### **Contexte Intelligent**
```typescript
// Service AICoachService
class AICoachService {
  // Construire contexte pour GPT-4o
  static async buildContext(userId: string): Promise<CoachContext> {
    const context = {
      profile: await getProfile(userId),
      lastAnalysis: await getLastAnalysis(userId),
      currentRoutine: await getCurrentRoutine(userId),
      recentProgress: await getRecentProgress(userId),
      activeShelves: await getActiveShelves(userId),
      recentBadges: await getRecentBadges(userId)
    }
    
    return this.summarizeContext(context)
  }
  
  // Résumé intelligent pour optimiser coûts
  static summarizeContext(context: FullContext): CoachContext {
    return {
      skinType: context.profile.skinType,
      mainConcerns: context.lastAnalysis.topConcerns,
      currentProducts: context.currentRoutine.products.map(p => p.name),
      recentImprovements: context.recentProgress.improvements,
      strugglingAreas: context.recentProgress.declines,
      routineConsistency: context.recentProgress.completionRate
    }
  }
  
  // Envoyer message à GPT-4o
  static async sendMessage(
    userId: string,
    message: string,
    conversationId?: string
  ): Promise<CoachResponse> {
    const context = await this.buildContext(userId)
    
    const prompt = `
Tu es un coach IA spécialisé en soins de la peau. Voici le contexte de l'utilisateur :

PROFIL:
- Type de peau: ${context.skinType}
- Préoccupations principales: ${context.mainConcerns.join(', ')}

ROUTINE ACTUELLE:
- Produits utilisés: ${context.currentProducts.join(', ')}
- Régularité: ${context.routineConsistency}%

PROGRÈS RÉCENTS:
- Améliorations: ${context.recentImprovements.join(', ')}
- Difficultés: ${context.strugglingAreas.join(', ')}

QUESTION: ${message}

Réponds de manière personnalisée, bienveillante et éducative. Si pertinent, suggère des produits de notre catalogue interne.
    `
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    })
    
    return {
      content: response.choices[0].message.content,
      suggestions: this.extractProductSuggestions(response),
      contextUsed: Object.keys(context)
    }
  }
}
```

#### **Cache Réponses Fréquentes**
```typescript
// Cache Redis pour questions communes
const commonQuestions = {
  "routine_frequency": "Il est recommandé de suivre votre routine matin et soir...",
  "product_order": "L'ordre d'application des produits est important...",
  "skin_purging": "Le purging est un phénomène normal lors de l'introduction...",
  // ... autres réponses pré-écrites
}

// Fallback si GPT-4o indisponible
const fallbackResponses = {
  general: "Je suis temporairement indisponible. Réessayez dans quelques minutes.",
  routine: "Consultez votre routine dans l'onglet dédié en attendant.",
  products: "Explorez vos étagères produits pour plus d'informations."
}
```

### **5. Système de Badges Symboliques**

#### **Types de Badges & Critères**

**Badges Routine (routine_streak)**
```typescript
const routineBadges = {
  bronze: { days: 7, title: "Première Semaine", icon: "🥉" },
  silver: { days: 30, title: "Un Mois Régulier", icon: "🥈" },
  gold: { days: 90, title: "Trois Mois Assidus", icon: "🥇" },
  platinum: { days: 365, title: "Une Année Parfaite", icon: "💎" }
}
```

**Badges Analyses (analysis_count)**
```typescript
const analysisBadges = {
  bronze: { count: 3, title: "Explorateur Curieux", icon: "🔍" },
  silver: { count: 10, title: "Analyste Régulier", icon: "📊" },
  gold: { count: 25, title: "Expert en Suivi", icon: "🎯" },
  platinum: { count: 50, title: "Maître du Diagnostic", icon: "🏆" }
}
```

**Badges Amélioration (improvement)**
```typescript
const improvementBadges = {
  bronze: { improvement: 10, title: "Premiers Progrès", icon: "📈" },
  silver: { improvement: 25, title: "Belle Évolution", icon: "⭐" },
  gold: { improvement: 50, title: "Transformation Visible", icon: "✨" },
  platinum: { improvement: 75, title: "Métamorphose Complète", icon: "🌟" }
}
```

**Badges Découverte (discovery)**
```typescript
const discoveryBadges = {
  bronze: { products: 5, title: "Curieux des Produits", icon: "🧴" },
  silver: { products: 15, title: "Collectionneur Averti", icon: "🛍️" },
  gold: { products: 30, title: "Expert Produits", icon: "💄" },
  platinum: { products: 50, title: "Connaisseur Ultime", icon: "👑" }
}
```

#### **Système de Notification Badges**
```typescript
// Service BadgeService
class BadgeService {
  // Vérifier nouveaux badges après action
  static async checkNewBadges(userId: string, action: BadgeAction): Promise<Badge[]> {
    const newBadges = []
    
    switch (action.type) {
      case 'routine_completed':
        const streak = await this.getCurrentStreak(userId)
        const routineBadge = this.checkRoutineBadge(streak)
        if (routineBadge) newBadges.push(routineBadge)
        break
        
      case 'analysis_completed':
        const analysisCount = await this.getAnalysisCount(userId)
        const analysisBadge = this.checkAnalysisBadge(analysisCount)
        if (analysisBadge) newBadges.push(analysisBadge)
        break
        
      case 'improvement_detected':
        const improvement = action.improvementPercent
        const improvementBadge = this.checkImprovementBadge(improvement)
        if (improvementBadge) newBadges.push(improvementBadge)
        break
    }
    
    // Sauvegarder nouveaux badges
    if (newBadges.length > 0) {
      await this.saveBadges(userId, newBadges)
      await this.showBadgeNotifications(newBadges)
    }
    
    return newBadges
  }
  
  // Notification popup animée
  static async showBadgeNotifications(badges: Badge[]) {
    for (const badge of badges) {
      toast.custom((t) => (
        <BadgeNotification 
          badge={badge}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ), {
        duration: 5000,
        position: 'top-right'
      })
    }
  }
}
```

#### **Interface Badges**
```typescript
// Page /dashboard/progress (inclut badges)
const ProgressPage = () => (
  <div className="space-y-8">
    {/* Graphiques évolution */}
    <ProgressCharts />
    
    {/* Section badges */}
    <div>
      <h2 className="text-2xl font-bold mb-6">Vos Accomplissements</h2>
      
      {/* Badges par catégorie */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BadgeCategory 
          title="Régularité Routine"
          badges={routineBadges}
          userBadges={userRoutineBadges}
        />
        <BadgeCategory 
          title="Analyses"
          badges={analysisBadges}
          userBadges={userAnalysisBadges}
        />
        <BadgeCategory 
          title="Améliorations"
          badges={improvementBadges}
          userBadges={userImprovementBadges}
        />
        <BadgeCategory 
          title="Découvertes"
          badges={discoveryBadges}
          userBadges={userDiscoveryBadges}
        />
      </div>
    </div>
  </div>
)
```

---

## 🔌 **API ROUTES NÉCESSAIRES**

### **Routes Analyses**
```typescript
// src/app/api/analyses/route.ts
GET    /api/analyses              // Liste avec filtres & pagination
POST   /api/analyses              // Créer nouvelle analyse

// src/app/api/analyses/[id]/route.ts
GET    /api/analyses/[id]         // Détail analyse
PUT    /api/analyses/[id]         // Modifier analyse
DELETE /api/analyses/[id]         // Supprimer (soft delete)

// src/app/api/analyses/compare/route.ts
POST   /api/analyses/compare      // Comparer 2+ analyses
```

### **Routes Routine**
```typescript
// src/app/api/routine/completions/route.ts
GET    /api/routine/completions   // Historique complétion
POST   /api/routine/completions   // Marquer complétion
PUT    /api/routine/completions   // Modifier complétion

// src/app/api/routine/stats/route.ts
GET    /api/routine/stats         // Statistiques (streaks, taux)

// src/app/api/routine/shelves/route.ts
GET    /api/routine/shelves       // Liste étagères
POST   /api/routine/shelves       // Créer étagère

// src/app/api/routine/shelves/[id]/route.ts
GET    /api/routine/shelves/[id]  // Détail étagère
PUT    /api/routine/shelves/[id]  // Modifier étagère
DELETE /api/routine/shelves/[id]  // Supprimer étagère
```

### **Routes Coach IA**
```typescript
// src/app/api/coach/conversations/route.ts
GET    /api/coach/conversations   // Liste conversations
POST   /api/coach/conversations   // Nouvelle conversation

// src/app/api/coach/conversations/[id]/route.ts
GET    /api/coach/conversations/[id]     // Historique conversation
POST   /api/coach/conversations/[id]     // Envoyer message

// src/app/api/coach/context/route.ts
GET    /api/coach/context         // Contexte utilisateur pour IA
```

### **Routes Badges**
```typescript
// src/app/api/badges/route.ts
GET    /api/badges                // Badges utilisateur
POST   /api/badges/check          // Vérifier nouveaux badges

// src/app/api/badges/[id]/route.ts
PUT    /api/badges/[id]           // Marquer badge comme vu
```

### **Routes Paramètres**
```typescript
// src/app/api/settings/profile/route.ts
GET    /api/settings/profile      // Paramètres profil
PUT    /api/settings/profile      // Modifier profil

// src/app/api/settings/notifications/route.ts
GET    /api/settings/notifications // Préférences notifications
PUT    /api/settings/notifications // Modifier préférences

// src/app/api/settings/dashboard/route.ts
GET    /api/settings/dashboard    // Préférences dashboard
PUT    /api/settings/dashboard    // Modifier préférences dashboard
```

---

## 🔒 **SÉCURITÉ & PERFORMANCE**

### **Row Level Security (RLS)**
```sql
-- Toutes les nouvelles tables héritent des politiques RLS

-- routine_completions
CREATE POLICY "Users can manage own routine completions" ON routine_completions
  FOR ALL USING (auth.uid() = user_id);

-- user_product_shelves  
CREATE POLICY "Users can manage own shelves" ON user_product_shelves
  FOR ALL USING (auth.uid() = user_id);

-- user_badges
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- ai_coach_conversations
CREATE POLICY "Users can manage own conversations" ON ai_coach_conversations
  FOR ALL USING (auth.uid() = user_id);
```

### **Optimisations Performance**
```typescript
// Cache client avec SWR
const useDashboardData = (userId: string) => {
  const { data: analyses } = useSWR(
    `/api/analyses?limit=5`,
    fetcher,
    { revalidateOnFocus: false }
  )
  
  const { data: routineStats } = useSWR(
    `/api/routine/stats`,
    fetcher,
    { refreshInterval: 60000 } // 1 minute
  )
  
  const { data: badges } = useSWR(
    `/api/badges`,
    fetcher,
    { revalidateOnFocus: false }
  )
  
  return { analyses, routineStats, badges }
}

// Compression images automatique
const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Redimensionner pour comparaisons (800x800 max)
      const maxSize = 800
      const ratio = Math.min(maxSize / img.width, maxSize / img.height)
      
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    }
    
    img.src = URL.createObjectURL(file)
  })
}
```

### **Gestion d'Erreurs**
```typescript
// Error Boundary pour dashboard
class DashboardErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log vers Sentry
    Sentry.captureException(error, {
      contexts: {
        react: errorInfo,
        user: { id: this.props.userId }
      }
    })
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <DashboardErrorFallback 
          onRetry={() => this.setState({ hasError: false })}
        />
      )
    }
    
    return this.props.children
  }
}

// Fallbacks gracieux
const DashboardWithFallbacks = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  </ErrorBoundary>
)
```

---

## 📊 **MÉTRIQUES DE SUCCÈS PHASE 2**

### **KPIs Engagement Dashboard**
```typescript
interface DashboardMetrics {
  // Adoption
  dashboard_activation_rate: number    // % users qui visitent dashboard
  daily_active_users: number          // DAU dashboard
  session_duration_avg: number        // Temps moyen par session
  pages_per_session: number           // Pages vues par session
  
  // Routine Tracking
  routine_adoption_rate: number       // % users qui trackent routine
  routine_completion_rate: number     // % complétion quotidienne
  streak_7_days_rate: number          // % users avec streak 7+ jours
  streak_30_days_rate: number         // % users avec streak 30+ jours
  
  // Comparaison Analyses
  comparison_usage_rate: number       // % users qui comparent analyses
  repeat_analysis_rate: number        // % users avec 2+ analyses
  improvement_detection_rate: number  // % analyses montrant amélioration
  
  // Coach IA
  coach_adoption_rate: number         // % users qui utilisent coach
  messages_per_conversation: number   // Messages moyens par conversation
  coach_satisfaction_rate: number     // % conversations positives
  
  // Badges & Gamification
  badge_earning_rate: number          // Badges moyens par user
  badge_notification_ctr: number      // % clics sur notifications badges
  
  // Rétention
  d1_retention: number                // % retour J+1
  d7_retention: number                // % retour J+7
  d30_retention: number               // % retour J+30
}
```

### **Objectifs Cibles Phase 2**
```typescript
const phase2Targets = {
  dashboard_activation_rate: 85,      // 85% des users visitent dashboard
  session_duration_avg: 300,          // 5 minutes par session
  routine_adoption_rate: 60,          // 60% trackent leur routine
  routine_completion_rate: 45,        // 45% complétion quotidienne
  streak_7_days_rate: 30,             // 30% avec streak 7+ jours
  comparison_usage_rate: 40,          // 40% comparent leurs analyses
  coach_adoption_rate: 25,            // 25% utilisent le coach IA
  d7_retention: 50,                   // 50% reviennent dans la semaine
  d30_retention: 30                   // 30% reviennent dans le mois
}
```

---

## 🚀 **CRITÈRES DE SUCCÈS PHASE 2**

### **Fonctionnels**
- [ ] **Dashboard responsive** : Fonctionne parfaitement mobile + desktop
- [ ] **Historique analyses** : Liste, filtres, pagination opérationnels
- [ ] **Comparaison interactive** : Slider photos + graphiques scores
- [ ] **Routine tracker** : Calendrier avec complétion et streaks
- [ ] **Étagères produits** : Création, édition, drag & drop fonctionnels
- [ ] **Coach IA** : Réponses contextuelles pertinentes
- [ ] **Badges symboliques** : Attribution automatique + notifications

### **Techniques**
- [ ] **Performance** : Chargement dashboard <2s
- [ ] **Sécurité** : RLS validé sur toutes les nouvelles tables
- [ ] **Cache** : SWR optimise les requêtes répétées
- [ ] **Responsive** : Design adaptatif sans régression mobile
- [ ] **Tests** : Couverture >80% sur composants critiques

### **Business**
- [ ] **Engagement** : Session moyenne >5 minutes
- [ ] **Rétention** : 50% D7, 30% D30
- [ ] **Adoption routine** : 60% des users trackent
- [ ] **Coach IA** : 25% d'adoption, satisfaction >80%
- [ ] **Comparaisons** : 40% des users comparent analyses

---

## 📚 **DOCUMENTATION ASSOCIÉE**

### **Références Techniques**
- **Recharts** : https://recharts.org/en-US/
- **React Calendar** : https://github.com/wojtekmaj/react-calendar
- **React DnD** : https://react-dnd.github.io/react-dnd/
- **SWR** : https://swr.vercel.app/

### **Fichiers de Configuration**
- `docs/planning-execution-phase2-dashboard.md` - Planning détaillé avec prompts
- `docs/api-documentation-phase2.md` - Documentation API complète
- `docs/ui-components-phase2.md` - Guide composants dashboard

---

**🔄 Statut :** Fiche technique Phase 2 PRÊTE ✅  
**📅 Prochaine étape :** Création planning d'exécution avec prompts opérationnels  
**⚡ Durée estimée :** 3-4 semaines  
**🎯 Objectif :** Dashboard engageant pour rétention quotidienne
