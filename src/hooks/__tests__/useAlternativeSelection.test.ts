/**
 * 🧪 TESTS - useAlternativeSelection Hook
 * 
 * Tests unitaires pour le hook de gestion des alternatives
 * 
 * Version: 1.0 - Sprint 2
 * Date: 17 septembre 2025
 */

import { renderHook, act } from '@testing-library/react'
import { useAlternativeSelection } from '../useAlternativeSelection'
import { SelectedProductWithAlternatives, ProductDetail } from '@/schemas/v3/products'

describe('useAlternativeSelection', () => {
  const mockPrimaryProduct: ProductDetail = {
    catalogId: 'primary-1',
    productName: 'Nettoyant Principal',
    brand: 'Brand A',
    price: 15.99,
    ranking: 1,
    justification: 'Produit optimal pour votre diagnostic',
    applicationAdvice: 'Appliquer matin et soir',
    timing: 'matin et soir',
    targetZones: ['visage entier'],
    differentiators: ['Céramides', 'pH neutre'],
    priceComparison: 'Optimal',
    strengthComparison: 'Équilibré'
  }

  const mockAlternatives: ProductDetail[] = [
    {
      catalogId: 'alt-1',
      productName: 'Nettoyant Premium',
      brand: 'Brand B',
      price: 25.99,
      ranking: 2,
      justification: 'Alternative premium avec actifs spécialisés',
      applicationAdvice: 'Appliquer le soir uniquement',
      timing: 'matin et soir',
      targetZones: ['visage entier'],
      differentiators: ['Actifs premium', 'Formule concentrée'],
      priceComparison: 'Premium (+63%)',
      strengthComparison: 'Plus puissant'
    },
    {
      catalogId: 'alt-2',
      productName: 'Nettoyant Économique',
      brand: 'Brand C',
      price: 9.99,
      ranking: 3,
      justification: 'Option économique sans compromis',
      applicationAdvice: 'Usage quotidien',
      timing: 'matin et soir',
      targetZones: ['visage entier'],
      differentiators: ['Prix accessible', 'Formule douce'],
      priceComparison: 'Économique (-37%)',
      strengthComparison: 'Plus doux'
    }
  ]

  const mockStep: SelectedProductWithAlternatives = {
    routineStepId: 1,
    primaryProduct: mockPrimaryProduct,
    alternatives: mockAlternatives,
    categoryRanking: {
      criteria: ['Efficacité', 'Prix', 'Tolérance'],
      justification: 'Classement basé sur votre diagnostic peau mixte',
      diversificationStrategy: '3 marques différentes, prix échelonnés'
    }
  }

  const mockInitialProducts = [mockStep]

  describe('Initialisation', () => {
    test('initialise avec les produits principaux sélectionnés par défaut', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      expect(result.current.selectedProducts.size).toBe(1)
      expect(result.current.selectedProducts.get(1)).toEqual(mockPrimaryProduct)
    })

    test('initialise avec le modal fermé', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      expect(result.current.modalState.isOpen).toBe(false)
      expect(result.current.modalState.currentStep).toBeNull()
      expect(result.current.modalState.currentProduct).toBeNull()
      expect(result.current.modalState.alternatives).toEqual([])
    })

    test('gère une liste vide de produits', () => {
      const { result } = renderHook(() => useAlternativeSelection([]))
      
      expect(result.current.selectedProducts.size).toBe(0)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Gestion du modal', () => {
    test('ouvre le modal avec les bonnes données', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      act(() => {
        result.current.openAlternativesModal(mockStep)
      })
      
      expect(result.current.modalState.isOpen).toBe(true)
      expect(result.current.modalState.currentStep).toEqual(mockStep)
      expect(result.current.modalState.currentProduct).toEqual(mockPrimaryProduct)
      expect(result.current.modalState.alternatives).toEqual(mockAlternatives)
    })

    test('ferme le modal', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      // Ouvrir d'abord
      act(() => {
        result.current.openAlternativesModal(mockStep)
      })
      
      // Puis fermer
      act(() => {
        result.current.closeAlternativesModal()
      })
      
      expect(result.current.modalState.isOpen).toBe(false)
      expect(result.current.modalState.currentStep).toBeNull()
      expect(result.current.modalState.currentProduct).toBeNull()
      expect(result.current.modalState.alternatives).toEqual([])
    })

    test('ouvre le modal avec le produit actuellement sélectionné', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      // Sélectionner une alternative d'abord
      act(() => {
        result.current.selectAlternative(mockAlternatives[0], 1)
      })
      
      // Puis ouvrir le modal
      act(() => {
        result.current.openAlternativesModal(mockStep)
      })
      
      expect(result.current.modalState.currentProduct).toEqual(mockAlternatives[0])
    })
  })

  describe('Sélection d\'alternatives', () => {
    test('sélectionne une alternative', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      act(() => {
        result.current.selectAlternative(mockAlternatives[0], 1)
      })
      
      expect(result.current.selectedProducts.get(1)).toEqual(mockAlternatives[0])
    })

    test('met à jour le produit courant dans le modal lors de la sélection', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      // Ouvrir le modal
      act(() => {
        result.current.openAlternativesModal(mockStep)
      })
      
      // Sélectionner une alternative
      act(() => {
        result.current.selectAlternative(mockAlternatives[1], 1)
      })
      
      expect(result.current.modalState.currentProduct).toEqual(mockAlternatives[1])
    })

    test('réinitialise la sélection au produit principal', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      // Sélectionner une alternative
      act(() => {
        result.current.selectAlternative(mockAlternatives[0], 1)
      })
      
      // Réinitialiser
      act(() => {
        result.current.resetSelection(1)
      })
      
      expect(result.current.selectedProducts.get(1)).toEqual(mockPrimaryProduct)
    })

    test('réinitialise toutes les sélections', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      // Sélectionner une alternative
      act(() => {
        result.current.selectAlternative(mockAlternatives[0], 1)
      })
      
      // Réinitialiser tout
      act(() => {
        result.current.resetAllSelections()
      })
      
      expect(result.current.selectedProducts.get(1)).toEqual(mockPrimaryProduct)
    })
  })

  describe('Utilitaires', () => {
    test('getSelectedProduct retourne le bon produit', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      expect(result.current.getSelectedProduct(1)).toEqual(mockPrimaryProduct)
      
      act(() => {
        result.current.selectAlternative(mockAlternatives[0], 1)
      })
      
      expect(result.current.getSelectedProduct(1)).toEqual(mockAlternatives[0])
    })

    test('getSelectedProduct retourne null pour un ID inexistant', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      expect(result.current.getSelectedProduct(999)).toBeNull()
    })

    test('hasAlternativeSelected détecte correctement les alternatives', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      // Initialement, produit principal sélectionné
      expect(result.current.hasAlternativeSelected(1)).toBe(false)
      
      // Après sélection d'une alternative
      act(() => {
        result.current.selectAlternative(mockAlternatives[0], 1)
      })
      
      expect(result.current.hasAlternativeSelected(1)).toBe(true)
    })
  })

  describe('Statistiques de sélection', () => {
    test('calcule correctement les statistiques initiales', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      const stats = result.current.getSelectionStats()
      
      expect(stats.totalSteps).toBe(1)
      expect(stats.primarySelected).toBe(1)
      expect(stats.alternativesSelected).toBe(0)
      expect(stats.selectionRate).toBe(0)
    })

    test('calcule correctement les statistiques après sélection d\'alternatives', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      act(() => {
        result.current.selectAlternative(mockAlternatives[0], 1)
      })
      
      const stats = result.current.getSelectionStats()
      
      expect(stats.totalSteps).toBe(1)
      expect(stats.primarySelected).toBe(0)
      expect(stats.alternativesSelected).toBe(1)
      expect(stats.selectionRate).toBe(1)
    })

    test('gère correctement les statistiques avec plusieurs étapes', () => {
      const multipleSteps = [
        mockStep,
        {
          ...mockStep,
          routineStepId: 2,
          primaryProduct: { ...mockPrimaryProduct, catalogId: 'primary-2' }
        }
      ]
      
      const { result } = renderHook(() => useAlternativeSelection(multipleSteps))
      
      // Sélectionner une alternative pour la première étape seulement
      act(() => {
        result.current.selectAlternative(mockAlternatives[0], 1)
      })
      
      const stats = result.current.getSelectionStats()
      
      expect(stats.totalSteps).toBe(2)
      expect(stats.primarySelected).toBe(1)
      expect(stats.alternativesSelected).toBe(1)
      expect(stats.selectionRate).toBe(0.5)
    })
  })

  describe('Gestion d\'erreurs', () => {
    test('gère les erreurs lors de l\'ouverture du modal', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      act(() => {
        result.current.openAlternativesModal(mockStep)
      })
      
      expect(result.current.error).toBeNull()
    })

    test('resetSelection ignore les IDs inexistants', () => {
      const { result } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      act(() => {
        result.current.resetSelection(999) // ID inexistant
      })
      
      // Ne devrait pas planter et ne pas affecter les autres sélections
      expect(result.current.selectedProducts.get(1)).toEqual(mockPrimaryProduct)
    })
  })

  describe('Performance et mémoire', () => {
    test('ne recrée pas les objets inutilement', () => {
      const { result, rerender } = renderHook(() => useAlternativeSelection(mockInitialProducts))
      
      const firstSelectedProducts = result.current.selectedProducts
      
      rerender()
      
      // Les objets doivent être les mêmes si rien n'a changé
      expect(result.current.selectedProducts).toBe(firstSelectedProducts)
    })

    test('gère efficacement les grandes listes de produits', () => {
      const largeProductList = Array.from({ length: 100 }, (_, i) => ({
        ...mockStep,
        routineStepId: i + 1,
        primaryProduct: { ...mockPrimaryProduct, catalogId: `primary-${i + 1}` }
      }))
      
      const { result } = renderHook(() => useAlternativeSelection(largeProductList))
      
      expect(result.current.selectedProducts.size).toBe(100)
      
      // Sélectionner quelques alternatives
      act(() => {
        result.current.selectAlternative(mockAlternatives[0], 1)
        result.current.selectAlternative(mockAlternatives[1], 50)
      })
      
      const stats = result.current.getSelectionStats()
      expect(stats.totalSteps).toBe(100)
      expect(stats.alternativesSelected).toBe(2)
      expect(stats.selectionRate).toBe(0.02)
    })
  })
})
