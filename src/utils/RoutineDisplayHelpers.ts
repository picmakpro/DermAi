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
  // Traitements spécifiques temporaires (flag explicite)
  if (step.isTemporaryTreatment === true) return true
  
  // Catégories temporaires par nature
  if (['spot-treatment', 'healing', 'repair', 'cicatrisation'].includes(step.category)) return true
  
  // Critères visuels = temporaire
  if (step.visualCriteria || step.hasVisualCriteria) return true
  
  // Durée explicitement temporaire
  if (step.applicationDuration?.includes('jusqu\'à') || 
      step.applicationDuration?.includes('cicatrisation') ||
      step.applicationDuration?.includes('amélioration') ||
      step.applicationDuration?.includes('disparition')) return true
  
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
 * CORRECTION 2: Titres cohérents IA
 * Validation et nettoyage des titres générés par l'IA
 */
export const validateAndCleanTitle = (title: string, category: string): string => {
  if (!title || typeof title !== 'string') {
    return getFallbackTitle(category)
  }
  
  // Supprimer artefacts génération
  let cleaned = title
    .replace(/je ne sais pas/gi, '')
    .replace(/undefined/gi, '')
    .replace(/null/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Supprimer mentions évolutives redondantes
  cleaned = cleaned
    .replace(/(optimisée?|renforcée?|→\s*(évolutif|optimisé))/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Fallback par catégorie si titre incohérent
  if (cleaned.length < 5 || cleaned.includes('undefined') || cleaned === '') {
    return getFallbackTitle(category)
  }
  
  return cleaned
}

/**
 * Fallbacks par catégorie pour titres incohérents
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
    repair: 'Soin réparateur'
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
 * Helper pour formater la durée d'application
 */
export const formatApplicationDuration = (duration?: string): string => {
  if (!duration) return ''
  
  // Nettoyage et formatage
  return duration
    .replace(/^(1-2|2-3|3-4|4-6|6-8)\s*(semaines?|mois)/gi, (match) => {
      return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
    })
    .replace(/jusqu'à/gi, 'Jusqu\'à')
    .replace(/en continu/gi, 'En continu')
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
