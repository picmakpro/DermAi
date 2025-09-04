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
  skinType?: string // Global skin type (ex: "Combination skin", "Oily skin")
  mainConcern: string
  // value used in logic; keep as-is (French)
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
  name: string // ex: "Ingrown hairs after shaving"
  // value used in logic; keep as-is (French)
  intensity: 'légère' | 'modérée' | 'intense'
  zones: string[] // ex: ["menton", "cou"]
}

export interface ZoneSpecificIssue {
  zone: string
  problems: ZoneProblem[] // Nouveau: plusieurs problèmes par zone
  description?: string // Optionnel maintenant
}

export interface ZoneProblem {
  name: string // Problem name (ex: "Ingrown hairs", "Redness")
  // value used in logic; keep as-is (French)
  intensity: 'légère' | 'modérée' | 'intense'
  description?: string // Description optionnelle du problème
}

// Garder l'ancienne interface pour compatibilité
export interface ZoneSpecificIssueLegacy {
  zone: string
  // value used in logic; keep as-is (French)
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
}

// Interface pour timing badges
export interface TimingBadgeInfo {
  badge: string // Le texte du badge principal
  icon: string // Icône(s) matin/soir 
  details?: string // Détails comme "1x/semaine, soir sans rétinol"
  color: 'blue' | 'purple' | 'green' | 'orange' // Couleur du badge
}
