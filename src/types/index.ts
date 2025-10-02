export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface PhotoUpload {
  id: string
  file: File
  preview: string
  type: PhotoType
  quality: 'good' | 'medium' | 'poor'
}

export type PhotoType = 
  | 'face-frontal' 
  | 'close-up-zone' 
  | 'profile-left' 
  | 'profile-right' 
  | 'texture-macro'

export interface SkinAnalysis {
  id: string
  userId: string
  photos: PhotoUpload[]
  scores: SkinScores
  beautyAssessment: BeautyAssessment
  recommendations: ProductRecommendations
  createdAt: Date
  // Support pour les données V2 de la refonte IA-First
  diagnostic?: {
    skinType?: string
    scores?: SkinScores
    skinAgeEstimate?: number
    generalObservation?: string
    zoneSpecificIssues?: Array<{
      zone: string
      problem: string
      intensity: 'légère' | 'modérée' | 'intense'
      description: string
    }>
  }
}

export interface SkinScores {
  hydration: ScoreDetail
  wrinkles: ScoreDetail // rides
  firmness: ScoreDetail // fermeté
  radiance: ScoreDetail // éclat
  pores: ScoreDetail
  spots: ScoreDetail // taches
  darkCircles: ScoreDetail // cernes
  skinAge: ScoreDetail // âge de la peau
  overall: number
}

export interface ScoreDetail {
  value: number // 0-100
  justification: string
  confidence: number // 0-1
  basedOn: string[]
}

export interface BeautyAssessment {
  skinType?: string // Type de peau global (ex: "Peau mixte", "Peau grasse")
  mainConcern: string
  intensity: 'légère' | 'modérée' | 'intense'
  concernedZones: string[]
  specificities?: SkinSpecificity[] // Nouvelles spécificités détaillées avec intensité
  visualFindings: string[]
  expectedImprovement: string
  improvementTimeEstimate?: string // Nouveau: temps pour atteindre 90/100
  // Nouvelle structure pour évaluation beauté globale + par zones
  estimatedSkinAge?: number
  overview?: string[]
  zoneSpecific?: ZoneSpecificIssue[]
}

export interface SkinSpecificity {
  name: string // ex: "Poils incarnés post-rasage"
  intensity: 'légère' | 'modérée' | 'intense'
  zones: string[] // ex: ["menton", "cou"]
}

export interface ZoneSpecificIssue {
  zone: string
  problems: ZoneProblem[] // Nouveau: plusieurs problèmes par zone
  description?: string // Optionnel maintenant
}

export interface ZoneProblem {
  name: string // Nom du problème (ex: "Poils incarnés", "Rougeurs")
  intensity: 'légère' | 'modérée' | 'intense'
  description?: string // Description optionnelle du problème
}

// Garder l'ancienne interface pour compatibilité
export interface ZoneSpecificIssueLegacy {
  zone: string
  intensity: 'légère' | 'modérée' | 'intense'
  concerns: string[]
  description: string
}

export interface ProductRecommendations {
  immediate: string[]
  routine: NewRoutineStructure | AdvancedRoutine // Nouvelle structure avec catalogId
  products: string[]
  lifestyle: string[]
  // Nouvelle structure pour recommandations globales/localisées
  overview?: string
  zoneSpecificCare?: string
  restrictions?: string
  localizedRoutine?: LocalizedRoutineStep[]
  // Optionnel: données enrichies pour l'UI produit
  productsDetailed?: RecommendedProductCard[]
  // Optionnel: routine structurée (obsolète, remplacé par AdvancedRoutine)
  routineBreakdown?: {
    morning: string[]
    evening: string[]
    weekly: string[]
  }
  // NOUVELLE ROUTINE UNIFIÉE (remplace zones à surveiller + routine)
  unifiedRoutine?: UnifiedRoutineStep[]
}

// Nouvelle structure de routine avec catalogId obligatoire
export interface NewRoutineStructure {
  immediate: NewRoutineStep[]
  adaptation: NewRoutineStep[]
  maintenance: NewRoutineStep[]
}

export interface NewRoutineStep {
  name: string
  frequency: 'quotidien' | 'hebdomadaire' | 'ponctuel'
  timing: 'matin' | 'soir' | 'matin_et_soir'
  catalogId: string // ID obligatoire du catalogue
  application: string
  startDate: string
}

export interface LocalizedRoutineStep {
  zone: string
  priority: 'haute' | 'moyenne' | 'basse'
  steps: LocalizedStep[]
}

export interface LocalizedStep {
  name: string
  frequency: 'quotidien' | 'hebdomadaire' | 'ponctuel'
  timing: 'matin' | 'soir' | 'selon_besoin'
  catalogId: string // ID obligatoire du catalogue
  application: string
  duration: string
  resume: string
}

// Import du nouveau système de routine
export interface AdvancedRoutine {
  immediate: AdvancedRoutineStep[]
  adaptation: AdvancedRoutineStep[]
  maintenance: AdvancedRoutineStep[]
}

export interface AdvancedRoutineStep {
  title: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'as-needed' | 'progressive'
  timeOfDay: 'morning' | 'evening' | 'both'
  frequencyDetails?: string
  phase: 'immediate' | 'adaptation' | 'maintenance'
  startAfterDays?: number
  category: 'cleansing' | 'treatment' | 'hydration' | 'protection' | 'exfoliation'
  productSuggestion?: string
  applicationTips: string[]
}

export interface RecommendedProductCard {
  name: string
  brand: string
  price: number
  imageUrl: string
  affiliateLink: string
  frequency: 'Quotidien' | 'Hebdomadaire' | 'Ponctuel'
  benefits: string[]
  badges?: string[]
}

export interface Product {
  id: string
  name: string
  brand: string
  price: number
  description: string
  activeIngredients: string[]
  affiliateLink: string
  commission: number
  whyRecommended: string
  compatibilityScore: number
}

export interface RoutineStep {
  order: number
  product: Product
  instructions: string
  frequency: string
  tips: string
}

export interface ProductBundle {
  products: Product[]
  totalPrice: number
  savings: number
  description: string
}

// Nouvelle structure pour routine unifiée (intégration zones + traitements + phases/timing)
export interface UnifiedRoutineStep {
  stepNumber: number
  title: string // "Traitement des rougeurs — Zones : joues, front"
  targetArea: 'global' | 'specific' // Global = visage entier, Specific = zones ciblées
  zones?: string[] // ["menton", "joues"] si targetArea = 'specific'
  
  // Blocs conservés identiques
  recommendedProducts: RecommendedProduct[]
  applicationAdvice: string
  restrictions?: string[]
  
  // Métadonnées pour l'IA + nouvelles données phases/timing
  treatmentType: 'cleansing' | 'treatment' | 'moisturizing' | 'protection'
  priority: number
  phase: 'immediate' | 'adaptation' | 'maintenance'
  
  // Nouvelles propriétés pour l'UI phases/temporelle
  frequency: 'daily' | 'weekly' | 'monthly' | 'as-needed' | 'progressive'
  timeOfDay: 'morning' | 'evening' | 'both'
  frequencyDetails?: string
  startAfterDays?: number
  category: 'cleansing' | 'treatment' | 'hydration' | 'protection' | 'exfoliation'
  
  // NOUVEAUX CHAMPS pour amélioration UX
  applicationDuration?: string // "Jusqu'à teint plus homogène (1-2 semaines)" | "En continu"
  timingBadge?: string // "Quotidien 🌙" | "Hebdomadaire 🌙" | "Progressif"
  timingDetails?: string // "1x/semaine, soir sans rétinol" | "tous les 2 jours"
  
  // NOUVEAUX CHAMPS pour déduplication vue horaires
  isEvolutive?: boolean // Marque si cette étape est le résultat d'une fusion de plusieurs phases
  evolutivePhases?: ('immediate' | 'adaptation' | 'maintenance')[] // Les phases fusionnées
}

// Interface pour produit recommandé dans la routine unifiée
export interface RecommendedProduct {
  id: string
  name: string
  brand: string
  category: string
  price?: number
  affiliateLink?: string
  catalogId?: string
  justification?: string // 🔥 SPRINT 2: Ajout justification pour affichage
}

// Interface pour timing badges
export interface TimingBadgeInfo {
  badge: string // Le texte du badge principal
  icon: string // Icône(s) matin/soir 
  details?: string // Détails comme "1x/semaine, soir sans rétinol"
  color: 'blue' | 'purple' | 'green' | 'orange' // Couleur du badge
}

// 🔥 NOUVEAUX TYPES - SPRINT 1 REFONTE IA-FIRST
// Types pour profil utilisateur et contraintes (input AIRoutineGenerator)
export interface UserProfile {
  age: number
  gender?: 'homme' | 'femme' | 'autre'
  skinType: string
  lifestyle?: string
}

export interface SkinConcerns {
  primary?: string[]
  secondary?: string[]
  intensity?: 'légère' | 'modérée' | 'intense'
}

// Import des types de routine personnalisée depuis schemas V2
export type { 
  PersonalizedRoutine
} from '@/schemas/v2/routine'

// Import des types de sélection produits depuis schemas V2
export type { 
  ProductSelection,
  SelectedProduct,
  BudgetBreakdown
} from '@/schemas/v2/products'

// Types UserConstraints défini localement (utilisé par prompts IA)
export interface UserConstraints {
  budget?: string // "50-100€", "Pas de limite", etc.
  timeAvailable?: string // "5 min matin", "15 min soir", etc.
  allergies?: string[] // Ingrédients à éviter
  currentRoutine?: string // Routine actuelle si mentionnée
  lifestyle?: string // "Voyage fréquent", "Vie active", etc.
  preferences?: string[] // Préférences spécifiques
}

// 🔥 NOUVEAUX TYPES - SPRINT 2 REFONTE IA-FIRST
// Types pour sélection produits IA

export interface BudgetConstraints {
  maxBudget: number // Budget maximum en euros
  priority: 'essential' | 'balanced' | 'premium' // Priorité budgétaire
  flexibility: number // Flexibilité 0-20% du budget
}

export interface UserPreferences {
  brandPreferences?: string[] // Marques préférées
  avoidIngredients?: string[] // Ingrédients à éviter
  texturePreferences?: string[] // Préférences de texture
  lifestyle?: 'busy' | 'standard' | 'thorough' // Mode de vie
  travelFrequent?: boolean // Voyage fréquent
  sensitivityLevel?: 'low' | 'medium' | 'high' // Niveau de sensibilité
}

export interface ProductCatalog {
  products: CatalogProduct[]
  lastUpdated: Date
  version: string
}

export interface CatalogProduct {
  id: string
  name: string
  brand: string
  category: string
  price: number
  currency: string
  imageUrl?: string
  affiliateLink?: string
  activeIngredients?: string[]
  skinTypes?: string[]
  benefits?: string[]
  // 🔥 NOUVEAUX CHAMPS - ENRICHISSEMENT CATALOGUE SPRINT 2
  pH?: number // pH du produit
  concentration?: string // Concentration des actifs
  compatibilities?: string[] // Compatibilités avec autres ingrédients
  contraindications?: string[] // Contre-indications
  applicationOrder?: number // Ordre d'application recommandé
  photosensitizing?: boolean // Produit photosensibilisant
  pregnancySafe?: boolean // Sûr pendant grossesse
  targetZones?: string[] // Zones d'application spécifiques
  potency?: 'gentle' | 'medium' | 'strong' // Puissance du produit
  texture?: string // Texture du produit
  finishType?: string // Type de fini
  volumeSize?: number // Taille en ml
  usageDuration?: string // Durée d'usage estimée
  clinicallyTested?: boolean // Testé cliniquement
  dermatologistRecommended?: boolean // Recommandé par dermatologues
  awards?: string[] // Prix ou certifications
  reviewScore?: number // Score d'avis clients
  availability?: 'in-stock' | 'limited' | 'out-of-stock' // Disponibilité
}

// 🔄 EXPORTS SYNCHRONISATION PRODUITS ↔ ROUTINE
export type {
  EnrichedProduct,
  AlternativeProduct,
  ProductProblemCategory,
  SyncResult,
  ProductReplacement,
  ComparisonMatrix,
  ComparisonCriterion,
  ProductRoutineContext
} from './productSync'

export type {
  AlternativeServiceConfig,
  AlternativeSearchResult,
  AlternativeCriteria,
  PriceFilter,
  NaturalnessFilter,
  PotencyFilter,
  AlternativeScoring,
  ComparisonMetadata,
  AlternativeFeedback,
  AlternativeStats,
  ComparisonType,
  AlternativeStatus,
  AlternativeAlgorithmConfig
} from './alternatives'
