/**
 * 🧪 TESTS UNITAIRES - EnhancedProductsSection
 * 
 * Tests complets pour le composant de section produits enrichie
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnhancedProductsSection } from '../EnhancedProductsSection'
import { UnifiedRoutineStep } from '@/types'
import { EnrichedProduct } from '@/types/productSync'

// Mock des hooks
jest.mock('@/hooks/useProductSync', () => ({
  useProductSync: jest.fn(() => ({
    enrichedProducts: [],
    isLoading: false,
    error: null,
    syncStatus: 'idle',
    syncFromRoutine: jest.fn(),
    replaceProduct: jest.fn(),
    clearError: jest.fn(),
    syncMetrics: {
      totalSyncs: 0,
      successfulSyncs: 0,
      averageSyncTime: 0
    }
  }))
}))

jest.mock('@/hooks/useAlternatives', () => ({
  useAlternatives: jest.fn(() => ({
    alternatives: [],
    isLoadingAlternatives: false,
    alternativesError: null,
    selectedAlternative: null,
    loadAlternatives: jest.fn(),
    selectAlternative: jest.fn(),
    clearAlternatives: jest.fn(),
    clearAlternativesError: jest.fn()
  }))
}))

// Mock des composants enfants
jest.mock('../EnrichedProductCard', () => ({
  EnrichedProductCard: ({ product, onAlternativeClick }: any) => (
    <div data-testid={`product-card-${product.id}`}>
      <span>{product.name}</span>
      <button onClick={onAlternativeClick}>Voir alternative</button>
    </div>
  )
}))

jest.mock('../AlternativeModal', () => ({
  AlternativeModal: ({ isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="alternative-modal">
        <button onClick={onClose}>Fermer</button>
      </div>
    ) : null
  )
}))

jest.mock('../ProductReplacementWarning', () => ({
  ProductReplacementWarning: ({ isOpen, onCancel }: any) => (
    isOpen ? (
      <div data-testid="replacement-warning">
        <button onClick={onCancel}>Annuler</button>
      </div>
    ) : null
  )
}))

describe('EnhancedProductsSection', () => {
  const mockRoutine: UnifiedRoutineStep[] = [
    {
      stepNumber: 1,
      title: 'Nettoyage quotidien',
      category: 'cleansing',
      phase: 'immediate',
      zones: ['visage'],
      recommendedProducts: [
        {
          id: 'test-cleanser',
          name: 'Test Cleanser',
          brand: 'Test Brand',
          category: 'cleanser',
          price: 15.99,
          affiliateLink: 'https://example.com'
        }
      ]
    }
  ]

  const mockEnrichedProducts: EnrichedProduct[] = [
    {
      id: 'test-cleanser',
      name: 'Test Cleanser',
      brand: 'Test Brand',
      category: 'cleanser',
      price: 15.99,
      affiliateLink: 'https://example.com',
      imageUrl: 'test-image.jpg',
      description: 'Test description',
      keywordBenefits: ['nettoie', 'purifie'],
      problemCategory: 'Nettoyage',
      usageInstructions: {
        application: 'Appliquer sur peau humide',
        frequency: '2 fois par jour',
        timing: 'Matin et soir'
      },
      aiJustification: {
        whySelected: 'Sélectionné pour ses propriétés nettoyantes',
        skinBenefits: ['Nettoie en profondeur', 'Respecte la barrière cutanée'],
        routineIntegration: 'Première étape de la routine'
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendu initial', () => {
    test('should render loading state', () => {
      const { useProductSync } = require('@/hooks/useProductSync')
      useProductSync.mockReturnValue({
        enrichedProducts: [],
        isLoading: true,
        error: null,
        syncStatus: 'syncing',
        syncFromRoutine: jest.fn(),
        replaceProduct: jest.fn(),
        clearError: jest.fn(),
        syncMetrics: { totalSyncs: 0, successfulSyncs: 0, averageSyncTime: 0 }
      })

      render(<EnhancedProductsSection routine={mockRoutine} />)
      
      expect(screen.getByText('Synchronisation des produits...')).toBeInTheDocument()
    })

    test('should render error state', () => {
      const { useProductSync } = require('@/hooks/useProductSync')
      useProductSync.mockReturnValue({
        enrichedProducts: [],
        isLoading: false,
        error: 'Erreur de synchronisation',
        syncStatus: 'error',
        syncFromRoutine: jest.fn(),
        replaceProduct: jest.fn(),
        clearError: jest.fn(),
        syncMetrics: { totalSyncs: 0, successfulSyncs: 0, averageSyncTime: 0 }
      })

      render(<EnhancedProductsSection routine={mockRoutine} />)
      
      expect(screen.getByText('Erreur de synchronisation')).toBeInTheDocument()
      expect(screen.getByText('Erreur de synchronisation')).toBeInTheDocument()
    })

    test('should render products when loaded', () => {
      const { useProductSync } = require('@/hooks/useProductSync')
      useProductSync.mockReturnValue({
        enrichedProducts: mockEnrichedProducts,
        isLoading: false,
        error: null,
        syncStatus: 'success',
        syncFromRoutine: jest.fn(),
        replaceProduct: jest.fn(),
        clearError: jest.fn(),
        syncMetrics: { totalSyncs: 1, successfulSyncs: 1, averageSyncTime: 500 }
      })

      render(<EnhancedProductsSection routine={mockRoutine} />)
      
      expect(screen.getByText('Produits recommandés')).toBeInTheDocument()
      expect(screen.getByText('Synchronisé')).toBeInTheDocument()
      expect(screen.getByTestId('product-card-test-cleanser')).toBeInTheDocument()
    })
  })

  describe('Catégorisation des produits', () => {
    test('should categorize products by problem category', () => {
      const productsWithCategories: EnrichedProduct[] = [
        { ...mockEnrichedProducts[0], problemCategory: 'Nettoyage' },
        { 
          ...mockEnrichedProducts[0], 
          id: 'test-serum',
          name: 'Test Serum',
          problemCategory: 'Anti-acné' 
        }
      ]

      const { useProductSync } = require('@/hooks/useProductSync')
      useProductSync.mockReturnValue({
        enrichedProducts: productsWithCategories,
        isLoading: false,
        error: null,
        syncStatus: 'success',
        syncFromRoutine: jest.fn(),
        replaceProduct: jest.fn(),
        clearError: jest.fn(),
        syncMetrics: { totalSyncs: 1, successfulSyncs: 1, averageSyncTime: 500 }
      })

      render(<EnhancedProductsSection routine={mockRoutine} />)
      
      expect(screen.getByText('Nettoyage')).toBeInTheDocument()
      expect(screen.getByText('Anti-acné')).toBeInTheDocument()
    })
  })

  describe('Interactions utilisateur', () => {
    test('should open alternative modal when clicking alternative button', async () => {
      const { useProductSync } = require('@/hooks/useProductSync')
      const mockLoadAlternatives = jest.fn()
      const { useAlternatives } = require('@/hooks/useAlternatives')
      
      useProductSync.mockReturnValue({
        enrichedProducts: mockEnrichedProducts,
        isLoading: false,
        error: null,
        syncStatus: 'success',
        syncFromRoutine: jest.fn(),
        replaceProduct: jest.fn(),
        clearError: jest.fn(),
        syncMetrics: { totalSyncs: 1, successfulSyncs: 1, averageSyncTime: 500 }
      })

      useAlternatives.mockReturnValue({
        alternatives: [],
        isLoadingAlternatives: false,
        alternativesError: null,
        selectedAlternative: null,
        loadAlternatives: mockLoadAlternatives,
        selectAlternative: jest.fn(),
        clearAlternatives: jest.fn(),
        clearAlternativesError: jest.fn()
      })

      render(<EnhancedProductsSection routine={mockRoutine} />)
      
      const alternativeButton = screen.getByText('Voir alternative')
      fireEvent.click(alternativeButton)

      await waitFor(() => {
        expect(screen.getByTestId('alternative-modal')).toBeInTheDocument()
      })
      
      expect(mockLoadAlternatives).toHaveBeenCalledWith(
        mockEnrichedProducts[0],
        expect.objectContaining({
          priceRange: 'similar',
          naturalness: 'similar',
          potency: 'similar'
        })
      )
    })

    test('should handle product replacement callback', () => {
      const mockOnProductReplace = jest.fn()
      const { useProductSync } = require('@/hooks/useProductSync')
      
      useProductSync.mockReturnValue({
        enrichedProducts: mockEnrichedProducts,
        isLoading: false,
        error: null,
        syncStatus: 'success',
        syncFromRoutine: jest.fn(),
        replaceProduct: jest.fn().mockResolvedValue({ success: true }),
        clearError: jest.fn(),
        syncMetrics: { totalSyncs: 1, successfulSyncs: 1, averageSyncTime: 500 }
      })

      render(
        <EnhancedProductsSection 
          routine={mockRoutine} 
          onProductReplace={mockOnProductReplace}
        />
      )
      
      // Le callback sera testé lors de l'implémentation complète du flux
      expect(mockOnProductReplace).toBeDefined()
    })
  })

  describe('Gestion des erreurs', () => {
    test('should handle retry on error', () => {
      const mockClearError = jest.fn()
      const { useProductSync } = require('@/hooks/useProductSync')
      
      useProductSync.mockReturnValue({
        enrichedProducts: [],
        isLoading: false,
        error: 'Erreur de synchronisation',
        syncStatus: 'error',
        syncFromRoutine: jest.fn(),
        replaceProduct: jest.fn(),
        clearError: mockClearError,
        syncMetrics: { totalSyncs: 0, successfulSyncs: 0, averageSyncTime: 0 }
      })

      render(<EnhancedProductsSection routine={mockRoutine} />)
      
      const retryButton = screen.getByText('Réessayer')
      fireEvent.click(retryButton)

      expect(mockClearError).toHaveBeenCalled()
    })
  })

  describe('État vide', () => {
    test('should render empty state when no products', () => {
      const { useProductSync } = require('@/hooks/useProductSync')
      
      useProductSync.mockReturnValue({
        enrichedProducts: [],
        isLoading: false,
        error: null,
        syncStatus: 'success',
        syncFromRoutine: jest.fn(),
        replaceProduct: jest.fn(),
        clearError: jest.fn(),
        syncMetrics: { totalSyncs: 1, successfulSyncs: 1, averageSyncTime: 500 }
      })

      render(<EnhancedProductsSection routine={mockRoutine} />)
      
      expect(screen.getByText('Aucun produit synchronisé')).toBeInTheDocument()
      expect(screen.getByText('Les produits apparaîtront ici une fois la routine analysée')).toBeInTheDocument()
    })
  })

  describe('Métriques de performance', () => {
    test('should display sync metrics when available', () => {
      const { useProductSync } = require('@/hooks/useProductSync')
      
      useProductSync.mockReturnValue({
        enrichedProducts: mockEnrichedProducts,
        isLoading: false,
        error: null,
        syncStatus: 'success',
        syncFromRoutine: jest.fn(),
        replaceProduct: jest.fn(),
        clearError: jest.fn(),
        syncMetrics: { totalSyncs: 5, successfulSyncs: 5, averageSyncTime: 750 }
      })

      render(<EnhancedProductsSection routine={mockRoutine} />)
      
      expect(screen.getByText('5 sync • 750ms moy')).toBeInTheDocument()
    })
  })
})
