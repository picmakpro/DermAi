/**
 * 🧪 TESTS UNITAIRES - EnrichedProductCard
 * 
 * Tests complets pour le composant de carte produit enrichie
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnrichedProductCard } from '../EnrichedProductCard'
import { EnrichedProduct } from '@/types/productSync'

// Mock de Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onError, ...props }: any) => (
    <img 
      src={src} 
      alt={alt} 
      onError={onError}
      {...props}
    />
  )
}))

describe('EnrichedProductCard', () => {
  const mockProduct: EnrichedProduct = {
    id: 'test-product',
    name: 'Test Vitamin C Serum',
    brand: 'Test Brand',
    category: 'serum',
    price: 25.99,
    originalPrice: 29.99,
    affiliateLink: 'https://example.com/product',
    imageUrl: 'https://example.com/image.jpg',
    description: 'Un sérum à la vitamine C pour illuminer la peau',
    keywordBenefits: ['Anti-oxydant', 'Éclat', 'Protection'],
    problemCategory: 'Taches & Éclat',
    rating: 4.5,
    usageInstructions: {
      application: 'Appliquer quelques gouttes sur peau propre',
      frequency: '1 fois par jour',
      timing: 'Matin'
    },
    aiJustification: {
      whySelected: 'Sélectionné pour ses propriétés antioxydantes et éclaircissantes',
      skinBenefits: ['Réduit les taches', 'Améliore l\'éclat', 'Protège contre les radicaux libres'],
      routineIntegration: 'À utiliser après le nettoyage et avant la crème hydratante'
    },
    routineContext: {
      stepTitle: 'Traitement antioxydant',
      stepNumber: 2,
      phase: 'immediate',
      category: 'treatment',
      targetZones: ['visage']
    }
  }

  const mockOnAlternativeClick = jest.fn()
  const mockOnPurchaseClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock window.open
    global.window.open = jest.fn()
  })

  describe('Rendu de base', () => {
    test('should render product information correctly', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      expect(screen.getByText('Test Vitamin C Serum')).toBeInTheDocument()
      expect(screen.getByText('Test Brand')).toBeInTheDocument()
      expect(screen.getByText('25,99 €')).toBeInTheDocument()
      expect(screen.getByText('29,99 €')).toBeInTheDocument() // Prix original
      expect(screen.getByText('Taches & Éclat')).toBeInTheDocument()
    })

    test('should render product image', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      const image = screen.getByAltText('Test Vitamin C Serum')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    test('should render rating when available', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      expect(screen.getByText('4.5')).toBeInTheDocument()
    })

    test('should render keyword benefits', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      expect(screen.getByText('Anti-oxydant')).toBeInTheDocument()
      expect(screen.getByText('Éclat')).toBeInTheDocument()
      expect(screen.getByText('Protection')).toBeInTheDocument()
    })
  })

  describe('Badge alternatif', () => {
    test('should show alternative badge when product is alternative', () => {
      const alternativeProduct = {
        ...mockProduct,
        isAlternative: true
      }

      render(
        <EnrichedProductCard 
          product={alternativeProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      expect(screen.getByText('Alternative')).toBeInTheDocument()
    })

    test('should show alternative badge when showAlternativeBadge is true', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
          showAlternativeBadge={true}
        />
      )

      expect(screen.getByText('Alternative')).toBeInTheDocument()
    })
  })

  describe('Bulles d\'information', () => {
    test('should show usage instructions on hover', async () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      const usageButton = screen.getByText('Mode d\'emploi')
      fireEvent.mouseEnter(usageButton)

      await waitFor(() => {
        expect(screen.getByText('Application')).toBeInTheDocument()
        expect(screen.getByText('Appliquer quelques gouttes sur peau propre')).toBeInTheDocument()
        expect(screen.getByText('Fréquence')).toBeInTheDocument()
        expect(screen.getByText('1 fois par jour')).toBeInTheDocument()
        expect(screen.getByText('Moment')).toBeInTheDocument()
        expect(screen.getByText('Matin')).toBeInTheDocument()
      })
    })

    test('should show AI justification on hover', async () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      const justificationButton = screen.getByText('Pourquoi ce produit ?')
      fireEvent.mouseEnter(justificationButton)

      await waitFor(() => {
        expect(screen.getByText('Sélection IA')).toBeInTheDocument()
        expect(screen.getByText('Sélectionné pour ses propriétés antioxydantes et éclaircissantes')).toBeInTheDocument()
        expect(screen.getByText('Bénéfices pour votre peau')).toBeInTheDocument()
        expect(screen.getByText('Réduit les taches')).toBeInTheDocument()
      })
    })

    test('should hide tooltips on mouse leave', async () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      const usageButton = screen.getByText('Mode d\'emploi')
      fireEvent.mouseEnter(usageButton)

      await waitFor(() => {
        expect(screen.getByText('Application')).toBeInTheDocument()
      })

      fireEvent.mouseLeave(usageButton)

      await waitFor(() => {
        expect(screen.queryByText('Application')).not.toBeInTheDocument()
      })
    })
  })

  describe('Actions utilisateur', () => {
    test('should handle purchase click', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
          onPurchaseClick={mockOnPurchaseClick}
        />
      )

      const purchaseButton = screen.getByText('Acheter')
      fireEvent.click(purchaseButton)

      expect(global.window.open).toHaveBeenCalledWith(
        'https://example.com/product',
        '_blank',
        'noopener,noreferrer'
      )
      expect(mockOnPurchaseClick).toHaveBeenCalled()
    })

    test('should handle alternative click', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      const alternativeButton = screen.getByText('Alternative')
      fireEvent.click(alternativeButton)

      expect(mockOnAlternativeClick).toHaveBeenCalled()
    })

    test('should disable buttons when loading', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
          isLoading={true}
        />
      )

      const purchaseButton = screen.getByText('Acheter')
      const alternativeButton = screen.getByText('Alternative')

      expect(purchaseButton).toBeDisabled()
      expect(alternativeButton).toBeDisabled()
    })

    test('should disable purchase button when no affiliate link', () => {
      const productWithoutLink = {
        ...mockProduct,
        affiliateLink: undefined
      }

      render(
        <EnrichedProductCard 
          product={productWithoutLink}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      const purchaseButton = screen.getByText('Acheter')
      expect(purchaseButton).toBeDisabled()
    })
  })

  describe('Gestion des erreurs d\'image', () => {
    test('should show fallback when image fails to load', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      const image = screen.getByAltText('Test Vitamin C Serum')
      fireEvent.error(image)

      expect(screen.getByText('Image non disponible')).toBeInTheDocument()
    })

    test('should show fallback when no image URL', () => {
      const productWithoutImage = {
        ...mockProduct,
        imageUrl: undefined
      }

      render(
        <EnrichedProductCard 
          product={productWithoutImage}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      expect(screen.getByText('Image non disponible')).toBeInTheDocument()
    })
  })

  describe('Informations contextuelles', () => {
    test('should show routine context when available', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      expect(screen.getByText('Étape 2: Traitement antioxydant')).toBeInTheDocument()
    })

    test('should not show routine context when not available', () => {
      const productWithoutContext = {
        ...mockProduct,
        routineContext: undefined
      }

      render(
        <EnrichedProductCard 
          product={productWithoutContext}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      expect(screen.queryByText(/Étape/)).not.toBeInTheDocument()
    })
  })

  describe('Formatage des prix', () => {
    test('should format prices correctly', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      expect(screen.getByText('25,99 €')).toBeInTheDocument()
      expect(screen.getByText('29,99 €')).toBeInTheDocument()
    })

    test('should not show original price when same as current price', () => {
      const productSamePrice = {
        ...mockProduct,
        originalPrice: 25.99
      }

      render(
        <EnrichedProductCard 
          product={productSamePrice}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      const priceElements = screen.getAllByText('25,99 €')
      expect(priceElements).toHaveLength(1) // Seulement le prix actuel
    })
  })

  describe('Accessibilité', () => {
    test('should have proper ARIA labels', () => {
      render(
        <EnrichedProductCard 
          product={mockProduct}
          onAlternativeClick={mockOnAlternativeClick}
        />
      )

      const purchaseButton = screen.getByText('Acheter')
      const alternativeButton = screen.getByText('Alternative')

      expect(purchaseButton).toBeInTheDocument()
      expect(alternativeButton).toBeInTheDocument()
    })
  })
})
