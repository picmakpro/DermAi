'use client'

import { useState, useCallback, useMemo } from 'react'
import { ProductDetail, SelectedProductWithAlternatives } from '@/schemas/v3/products'

interface AlternativeSelectionState {
  selectedProducts: Map<number, ProductDetail> // routineStepId -> selected product
  modalState: {
    isOpen: boolean
    currentStep: SelectedProductWithAlternatives | null
    currentProduct: ProductDetail | null
    alternatives: ProductDetail[]
  }
  isLoading: boolean
  error: string | null
}

interface UseAlternativeSelectionReturn {
  // État
  selectedProducts: Map<number, ProductDetail>
  modalState: AlternativeSelectionState['modalState']
  isLoading: boolean
  error: string | null
  
  // Actions
  openAlternativesModal: (step: SelectedProductWithAlternatives) => void
  closeAlternativesModal: () => void
  selectAlternative: (product: ProductDetail, routineStepId: number) => void
  resetSelection: (routineStepId: number) => void
  resetAllSelections: () => void
  
  // Utilitaires
  getSelectedProduct: (routineStepId: number) => ProductDetail | null
  hasAlternativeSelected: (routineStepId: number) => boolean
  getSelectionStats: () => {
    totalSteps: number
    alternativesSelected: number
    primarySelected: number
    selectionRate: number
  }
}

/**
 * Hook pour gérer la sélection d'alternatives de produits
 * 
 * @param initialProducts - Produits initiaux avec alternatives (résultat V3)
 * @returns Interface complète de gestion des alternatives
 */
export function useAlternativeSelection(
  initialProducts: SelectedProductWithAlternatives[] = []
): UseAlternativeSelectionReturn {
  
  // État initial : tous les produits principaux sélectionnés par défaut
  const initialSelectedMap = useMemo(() => {
    const map = new Map<number, ProductDetail>()
    initialProducts.forEach(step => {
      map.set(step.routineStepId, step.primaryProduct)
    })
    return map
  }, [initialProducts])
  
  const [state, setState] = useState<AlternativeSelectionState>({
    selectedProducts: initialSelectedMap,
    modalState: {
      isOpen: false,
      currentStep: null,
      currentProduct: null,
      alternatives: []
    },
    isLoading: false,
    error: null
  })
  
  // Ouvrir le modal des alternatives
  const openAlternativesModal = useCallback((step: SelectedProductWithAlternatives) => {
    const currentProduct = state.selectedProducts.get(step.routineStepId) || step.primaryProduct
    
    setState(prev => ({
      ...prev,
      modalState: {
        isOpen: true,
        currentStep: step,
        currentProduct,
        alternatives: step.alternatives
      },
      error: null
    }))
  }, [state.selectedProducts])
  
  // Fermer le modal
  const closeAlternativesModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      modalState: {
        isOpen: false,
        currentStep: null,
        currentProduct: null,
        alternatives: []
      }
    }))
  }, [])
  
  // Sélectionner une alternative
  const selectAlternative = useCallback((product: ProductDetail, routineStepId: number) => {
    setState(prev => {
      const newSelectedProducts = new Map(prev.selectedProducts)
      newSelectedProducts.set(routineStepId, product)
      
      return {
        ...prev,
        selectedProducts: newSelectedProducts,
        modalState: {
          ...prev.modalState,
          currentProduct: product
        }
      }
    })
    
    // Fermer le modal après sélection
    setTimeout(() => {
      closeAlternativesModal()
    }, 500)
  }, [closeAlternativesModal])
  
  // Réinitialiser la sélection pour une étape (retour au produit principal)
  const resetSelection = useCallback((routineStepId: number) => {
    const originalStep = initialProducts.find(step => step.routineStepId === routineStepId)
    if (!originalStep) return
    
    setState(prev => {
      const newSelectedProducts = new Map(prev.selectedProducts)
      newSelectedProducts.set(routineStepId, originalStep.primaryProduct)
      
      return {
        ...prev,
        selectedProducts: newSelectedProducts
      }
    })
  }, [initialProducts])
  
  // Réinitialiser toutes les sélections
  const resetAllSelections = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedProducts: initialSelectedMap
    }))
  }, [initialSelectedMap])
  
  // Obtenir le produit sélectionné pour une étape
  const getSelectedProduct = useCallback((routineStepId: number): ProductDetail | null => {
    return state.selectedProducts.get(routineStepId) || null
  }, [state.selectedProducts])
  
  // Vérifier si une alternative est sélectionnée (pas le produit principal)
  const hasAlternativeSelected = useCallback((routineStepId: number): boolean => {
    const selectedProduct = state.selectedProducts.get(routineStepId)
    const originalStep = initialProducts.find(step => step.routineStepId === routineStepId)
    
    if (!selectedProduct || !originalStep) return false
    
    return selectedProduct.catalogId !== originalStep.primaryProduct.catalogId
  }, [state.selectedProducts, initialProducts])
  
  // Statistiques de sélection
  const getSelectionStats = useCallback(() => {
    const totalSteps = initialProducts.length
    let alternativesSelected = 0
    let primarySelected = 0
    
    initialProducts.forEach(step => {
      const selectedProduct = state.selectedProducts.get(step.routineStepId)
      if (selectedProduct) {
        if (selectedProduct.catalogId === step.primaryProduct.catalogId) {
          primarySelected++
        } else {
          alternativesSelected++
        }
      }
    })
    
    return {
      totalSteps,
      alternativesSelected,
      primarySelected,
      selectionRate: totalSteps > 0 ? alternativesSelected / totalSteps : 0
    }
  }, [state.selectedProducts, initialProducts])
  
  return {
    // État
    selectedProducts: state.selectedProducts,
    modalState: state.modalState,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    openAlternativesModal,
    closeAlternativesModal,
    selectAlternative,
    resetSelection,
    resetAllSelections,
    
    // Utilitaires
    getSelectedProduct,
    hasAlternativeSelected,
    getSelectionStats
  }
}
