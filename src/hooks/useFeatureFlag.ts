'use client'

import { useState, useEffect } from 'react'

/**
 * SPRINT 3 - REFONTE ROUTINES V2
 * Hook pour gérer les feature flags
 * Permet l'activation/désactivation progressive de nouvelles fonctionnalités
 */

// Type pour les feature flags disponibles
type FeatureFlag = 
  | 'NEW_ROUTINE_DISPLAY'  // Nouvelle interface routines V2
  | 'ENHANCED_PRODUCTS'    // Section produits enrichie
  | 'AI_COACH'            // Coach IA
  | 'GAMIFICATION'        // Système de badges

// Configuration des feature flags (pourrait venir d'une API ou variables d'env)
const FEATURE_FLAGS: Record<FeatureFlag, boolean> = {
  NEW_ROUTINE_DISPLAY: process.env.NEXT_PUBLIC_FEATURE_NEW_ROUTINE_DISPLAY === 'false' ? false : true, // ACTIVÉ PAR DÉFAUT
  ENHANCED_PRODUCTS: process.env.NEXT_PUBLIC_FEATURE_ENHANCED_PRODUCTS === 'true' || true,
  AI_COACH: process.env.NEXT_PUBLIC_FEATURE_AI_COACH === 'true' || false,
  GAMIFICATION: process.env.NEXT_PUBLIC_FEATURE_GAMIFICATION === 'true' || false
}

// Hook pour utiliser un feature flag
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [isEnabled, setIsEnabled] = useState(false)
  
  useEffect(() => {
    // Vérifier d'abord les paramètres URL (pour tests/démo)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const urlFlag = urlParams.get(`feature_${flag.toLowerCase()}`)
      
      if (urlFlag !== null) {
        setIsEnabled(urlFlag === 'true')
        return
      }
    }
    
    // Sinon utiliser la configuration par défaut
    setIsEnabled(FEATURE_FLAGS[flag] || false)
  }, [flag])
  
  return isEnabled
}

// Hook pour obtenir tous les feature flags actifs
export function useAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const [flags, setFlags] = useState(FEATURE_FLAGS)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const updatedFlags = { ...FEATURE_FLAGS }
      
      // Vérifier chaque flag dans l'URL
      Object.keys(FEATURE_FLAGS).forEach((flag) => {
        const urlFlag = urlParams.get(`feature_${flag.toLowerCase()}`)
        if (urlFlag !== null) {
          updatedFlags[flag as FeatureFlag] = urlFlag === 'true'
        }
      })
      
      setFlags(updatedFlags)
    }
  }, [])
  
  return flags
}

// Utilitaire pour activer un feature flag via URL
export function getFeatureFlagUrl(flag: FeatureFlag, enabled: boolean): string {
  if (typeof window === 'undefined') return ''
  
  const url = new URL(window.location.href)
  const paramName = `feature_${flag.toLowerCase()}`
  
  if (enabled) {
    url.searchParams.set(paramName, 'true')
  } else {
    url.searchParams.delete(paramName)
  }
  
  return url.toString()
}
