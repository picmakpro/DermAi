/**
 * 🔧 HELPERS AFFICHAGE ROUTINES - SPRINT 1 CORRECTIONS
 * Fonctions utilitaires pour corriger badges, titres, timing, zones
 */

import { Globe, MapPin, Clock, Calendar } from 'lucide-react'
import type { UnifiedRoutineStep } from '@/types'

/**
 * CORRECTION 1: Badges temporaires précis
 * Logique basée sur category + isTemporaryTreatment au lieu de applicationDuration
 */
export const isTemporaryTreatment = (step: UnifiedRoutineStep): boolean => {
  // Catégories temporaires par nature
  if (['spot-treatment', 'healing', 'repair', 'cicatrisation'].includes(step.category)) return true
  
  // Durée explicitement temporaire
  if (step.applicationDuration?.includes('jusqu\'à') || 
      step.applicationDuration?.includes('cicatrisation') ||
      step.applicationDuration?.includes('amélioration') ||
      step.applicationDuration?.includes('disparition')) return true
  
  // Traitements spécifiques avec zones ciblées = souvent temporaires
  if (step.category === 'treatment' && step.targetArea === 'specific') return true
  
  // Base care = continu (jamais temporaire)
  if (['cleansing', 'hydration', 'protection', 'moisturizing'].includes(step.category)) return false
  
  return false
}

/**
 * Badge continu explicite pour produits de base
 */
export const isContinuousTreatment = (step: UnifiedRoutineStep): boolean => {
  return ['cleansing', 'hydration', 'protection', 'moisturizing'].includes(step.category) ||
         step.applicationDuration?.includes('continu') ||
         step.applicationDuration?.includes('En continu') ||
         (step.frequency === 'daily' && !isTemporaryTreatment(step))
}

/**
 * CORRECTION 2: Titres cohérents IA - SPRINT 1 AMÉLIORATION
 * Validation et nettoyage des titres générés par l'IA avec standardisation
 */
export const validateAndCleanTitle = (
  title: string, 
  category: string, 
  product?: any
): string => {
  if (!title || typeof title !== 'string') {
    return getFallbackTitle(category)
  }
  
  // 1. Nettoyer artefacts IA existants + nouveaux
  let cleaned = title
    .replace(/je ne sais pas/gi, '')
    .replace(/undefined|null/gi, '')
    .replace(/(optimisée?|renforcée?|→\s*(évolutif|optimisé))/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  // 2. NOUVEAU : Standardiser par catégorie si titre contient nom produit exact
  if (product?.name && cleaned.toLowerCase().includes(product.name.toLowerCase())) {
    cleaned = getCategoryTitle(category, product)
  }
  
  // 3. NOUVEAU : Validation longueur (5-60 caractères)
  if (cleaned.length < 5 || cleaned.length > 60) {
    return getFallbackTitle(category)
  }
  
  // 4. Validation cohérence finale
  if (cleaned === '') {
    return getFallbackTitle(category)
  }
  
  return cleaned
}

/**
 * NOUVEAU : Titres standardisés par catégorie avec contexte produit
 */
const getCategoryTitle = (category: string, product: any): string => {
  const templates: Record<string, string> = {
    cleansing: `Nettoyage ${product?.skinType || 'adapté'}`,
    treatment: `Traitement ${product?.targetProblem || 'ciblé'}`,
    hydration: `Hydratation ${product?.skinType || 'quotidienne'}`,
    moisturizing: `Hydratation ${product?.skinType || 'quotidienne'}`,
    protection: 'Protection solaire quotidienne',
    exfoliation: 'Exfoliation douce',
    'spot-treatment': `Traitement ${product?.targetArea || 'localisé'}`,
    healing: 'Soin réparateur',
    repair: 'Soin réparateur'
  }
  return templates[category] || 'Soin personnalisé'
}

/**
 * Fallbacks par catégorie pour titres incohérents - SPRINT 1 ENRICHISSEMENT
 */
const getFallbackTitle = (category: string): string => {
  const fallbacks: Record<string, string> = {
    cleansing: 'Nettoyage doux quotidien',
    hydration: 'Hydratation adaptée',
    moisturizing: 'Hydratation adaptée',
    protection: 'Protection solaire',
    treatment: 'Soin ciblé',
    exfoliation: 'Exfoliation douce',
    'spot-treatment': 'Traitement localisé',
    healing: 'Soin réparateur',
    repair: 'Soin réparateur',
    // NOUVEAU : Plus de catégories
    toning: 'Tonification équilibrante',
    serum: 'Sérum concentré',
    mask: 'Masque intensif',
    essence: 'Essence hydratante',
    oil: 'Huile nourrissante',
    mist: 'Brume rafraîchissante',
    balm: 'Baume réparateur'
  }
  
  return fallbacks[category] || 'Soin personnalisé'
}

/**
 * CORRECTION 3: Timing précis et adapté
 * Affichage timing détaillé au lieu de générique
 */
export const getDetailedTiming = (step: UnifiedRoutineStep): string => {
  const { timeOfDay, frequency, frequencyDetails } = step
  
  // Timing spécifique avec fréquence (priorité)
  if (frequencyDetails && typeof frequencyDetails === 'string') {
    return frequencyDetails
  }
  
  // Mapping précis timeOfDay
  const timingMap: Record<string, string> = {
    'morning': 'Matin uniquement',
    'evening': 'Soir uniquement', 
    'both': 'Matin et soir'
  }
  
  // Mapping précis frequency
  const frequencyMap: Record<string, string> = {
    'daily': 'Quotidien',
    'weekly': 'Hebdomadaire',
    'monthly': 'Mensuel',
    'progressive': 'Progressif',
    'as-needed': 'Au besoin'
  }
  
  // Combinaisons spécifiques courantes
  if (timeOfDay === 'both' && frequency === 'daily') return 'Matin et soir'
  if (timeOfDay === 'evening' && frequency === 'weekly') return '2-3x/semaine soir'
  if (timeOfDay === 'morning' && frequency === 'daily') return 'Chaque matin'
  if (timeOfDay === 'evening' && frequency === 'daily') return 'Chaque soir'
  
  // Combinaison timing + fréquence
  if (timeOfDay && frequency) {
    const timing = timingMap[timeOfDay] || timeOfDay
    const freq = frequencyMap[frequency] || frequency
    
    // Éviter redondance "Quotidien matin et soir"
    if (timing === 'Matin et soir' && freq === 'Quotidien') return timing
    
    return `${timing} - ${freq}`
  }
  
  // Fallback sur timeOfDay ou frequency seul
  if (timeOfDay) return timingMap[timeOfDay] || timeOfDay
  if (frequency) return frequencyMap[frequency] || frequency
  
  return 'Selon routine'
}

/**
 * CORRECTION 4: Badges zones différenciés
 * Badge "Visage entier" vs zones spécifiques avec couleurs distinctes
 */
export const renderZoneBadge = (step: UnifiedRoutineStep) => {
  const { targetArea, zones } = step
  
  // Badge "Visage entier" - couleur bleue
  if (targetArea === 'global' || !zones || zones.length === 0 || 
      (Array.isArray(zones) && zones.some(z => z.toLowerCase().includes('visage') || z.toLowerCase().includes('global')))) {
    return {
      type: 'global',
      className: 'flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium',
      icon: Globe,
      text: 'Visage entier'
    }
  }
  
  // Badge zones spécifiques - couleur violette
  if (targetArea === 'specific' && zones && zones.length > 0) {
    const zoneText = zones.length > 2 
      ? `${zones.slice(0, 2).join(', ')} +${zones.length - 2}`
      : zones.join(', ')
      
    return {
      type: 'specific',
      className: 'flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium',
      icon: MapPin,
      text: `Zones : ${zoneText}`
    }
  }
  
  return null
}

/**
 * Helper pour obtenir l'icône de timing
 */
export const getTimingIcon = (timeOfDay: string) => {
  const icons: Record<string, any> = {
    'morning': '☀️',
    'evening': '🌙', 
    'both': '🕐'
  }
  
  return icons[timeOfDay] || '🕐'
}

/**
 * SPRINT 3 : Helper pour formater la durée d'application avec contexte de phase
 */
export const formatApplicationDuration = (
  step: UnifiedRoutineStep, 
  phaseContext?: PhaseContext
): string => {
  
  // Durées progressives précises
  if (step.frequency === 'progressive') {
    return getProgressiveDuration(step, phaseContext)
  }
  
  // Fréquences hebdomadaires précises
  if (step.frequency === 'weekly') {
    return getWeeklyFrequency(step)
  }
  
  // Critères visuels avec estimation
  if (step.applicationDuration?.toLowerCase().includes('jusqu\'à')) {
    return getVisualCriteriaDuration(step)
  }
  
  // Durée standard avec nettoyage
  if (step.applicationDuration) {
    return step.applicationDuration
      .replace(/^(1-2|2-3|3-4|4-6|6-8)\s*(semaines?|mois)/gi, (match) => {
        return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
      })
      .replace(/jusqu'à/gi, 'Jusqu\'à')
      .replace(/en continu/gi, 'En continu')
  }
  
  return 'En continu'
}

/**
 * SPRINT 3 : Durées progressives précises avec contexte
 */
const getProgressiveDuration = (step: UnifiedRoutineStep, context?: PhaseContext): string => {
  const baseWeeks = context?.phaseWeeks || 4
  const introWeeks = Math.ceil(baseWeeks / 2)
  
  return `Commencer 2x/semaine, puis quotidien après ${introWeeks} semaines`
}

/**
 * SPRINT 3 : Fréquences hebdomadaires précises par catégorie
 */
const getWeeklyFrequency = (step: UnifiedRoutineStep): string => {
  if (step.category === 'exfoliation') {
    const intensity = step.zones?.length && step.zones.length > 2 ? 'légère' : 'modérée'
    return intensity === 'légère' ? '2x par semaine maximum' : '1x par semaine'
  }
  
  if (step.category === 'treatment' && step.zones && step.zones.length > 0) {
    return 'Commencer 2x/semaine, augmenter selon tolérance'
  }
  
  return '1x par semaine, même jour chaque semaine'
}

/**
 * SPRINT 3 : Critères visuels avec estimations temporelles
 */
const getVisualCriteriaDuration = (step: UnifiedRoutineStep): string => {
  const criteria = step.applicationDuration?.toLowerCase() || ''
  
  // Détection plus flexible des mots-clés
  if (criteria.includes('cicatrisation')) {
    return 'Jusqu\'à cicatrisation (7-14 jours estimés)'
  }
  
  if (criteria.includes('amélioration')) {
    return 'Jusqu\'à amélioration (2-4 semaines estimées)'
  }
  
  if (criteria.includes('disparition')) {
    return 'Jusqu\'à disparition (3-6 semaines estimées)'
  }
  
  // Si aucun mot-clé reconnu mais contient "jusqu'à", retourner tel quel
  if (criteria.includes('jusqu\'à')) {
    return step.applicationDuration || 'Selon évolution'
  }
  
  return step.applicationDuration || 'Selon évolution'
}

/**
 * Interface pour le contexte de phase (Sprint 3)
 */
export interface PhaseContext {
  phaseWeeks: number
  previousPhaseCompleted: boolean
  userSkinType: string
  hasUrgentIssues?: boolean
}

/**
 * Helper pour déterminer la priorité d'affichage d'une étape
 */
export const getStepPriority = (step: UnifiedRoutineStep): number => {
  // Ordre logique : nettoyage > traitement > hydratation > protection
  const priorityMap: Record<string, number> = {
    'cleansing': 1,
    'treatment': 2,
    'spot-treatment': 2,
    'healing': 2,
    'repair': 2,
    'hydration': 3,
    'moisturizing': 3,
    'protection': 4,
    'exfoliation': 5
  }
  
  return priorityMap[step.category] || 6
}

/**
 * Helper pour valider la cohérence d'une étape
 */
export const validateStepCoherence = (step: UnifiedRoutineStep): {
  isValid: boolean
  issues: string[]
} => {
  const issues: string[] = []
  
  // Vérifier titre
  if (!step.title || step.title.length < 3) {
    issues.push('Titre manquant ou trop court')
  }
  
  // Vérifier catégorie
  const validCategories = ['cleansing', 'treatment', 'hydration', 'moisturizing', 'protection', 'exfoliation', 'spot-treatment', 'healing', 'repair']
  if (!validCategories.includes(step.category)) {
    issues.push(`Catégorie invalide: ${step.category}`)
  }
  
  // Vérifier timing
  const validTimings = ['morning', 'evening', 'both']
  if (!validTimings.includes(step.timeOfDay)) {
    issues.push(`Timing invalide: ${step.timeOfDay}`)
  }
  
  // Vérifier produits recommandés
  if (!step.recommendedProducts || step.recommendedProducts.length === 0) {
    issues.push('Aucun produit recommandé')
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

