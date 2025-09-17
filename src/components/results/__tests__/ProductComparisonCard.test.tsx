/**
 * 🧪 TESTS - ProductComparisonCard
 * 
 * Tests unitaires pour la carte de comparaison de produits
 * 
 * Version: 1.0 - Sprint 2
 * Date: 17 septembre 2025
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductComparisonCard } from '../ProductComparisonCard'
import { ProductDetail } from '@/schemas/v3/products'

describe('ProductComparisonCard', () => {
  const mockProduct: ProductDetail = {
    catalogId: 'test-product-1',
    productName: 'Crème Hydratante',
    brand: 'Test Brand',
    price: 29.99,
    ranking: 1,
    justification: 'Crème parfaitement adaptée à votre peau mixte diagnostiquée avec zones sensibles. Formule avec céramides pour renforcer la barrière cutanée.',
    applicationAdvice: 'Appliquer matin et soir sur peau propre et sèche',
    timing: 'matin et soir',
    targetZones: ['visage entier', 'cou'],
    differentiators: ['Céramides', 'Acide hyaluronique', 'Sans parfum'],
    priceComparison: 'Rapport qualité/prix optimal',
    strengthComparison: 'Efficacité équilibrée',
    restrictions: ['Éviter le contour des yeux', 'Faire un test de tolérance']
  }

  const defaultProps = {
    product: mockProduct,
    isSelected: false,
    showRanking: false,
    showDetailedInfo: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendu de base', () => {
    test('affiche les informations principales du produit', () => {
      render(<ProductComparisonCard {...defaultProps} />)
      
      expect(screen.getByText('Test Brand Crème Hydratante')).toBeInTheDocument()
      expect(screen.getByText('29.99€')).toBeInTheDocument()
      expect(screen.getByText('Rapport qualité/prix optimal')).toBeInTheDocument()
      expect(screen.getByText('Efficacité équilibrée')).toBeInTheDocument()
    })

    test('affiche la justification du produit', () => {
      render(<ProductComparisonCard {...defaultProps} />)
      
      expect(screen.getByText(/Crème parfaitement adaptée à votre peau mixte/)).toBeInTheDocument()
    })

    test('affiche les différenciateurs', () => {
      render(<ProductComparisonCard {...defaultProps} />)
      
      expect(screen.getByText('Céramides')).toBeInTheDocument()
      expect(screen.getByText('Acide hyaluronique')).toBeInTheDocument()
      expect(screen.getByText('Sans parfum')).toBeInTheDocument()
    })
  })

  describe('Affichage des rankings', () => {
    test('affiche le badge ranking quand showRanking est true', () => {
      render(<ProductComparisonCard {...defaultProps} showRanking={true} />)
      
      expect(screen.getByText('#1 Recommandé')).toBeInTheDocument()
    })

    test('n\'affiche pas le badge ranking quand showRanking est false', () => {
      render(<ProductComparisonCard {...defaultProps} showRanking={false} />)
      
      expect(screen.queryByText('#1 Recommandé')).not.toBeInTheDocument()
    })

    test('affiche le bon badge pour ranking 2', () => {
      const productRank2 = { ...mockProduct, ranking: 2 as const }
      render(<ProductComparisonCard {...defaultProps} product={productRank2} showRanking={true} />)
      
      expect(screen.getByText('#2 Alternative')).toBeInTheDocument()
    })

    test('affiche le bon badge pour ranking 3', () => {
      const productRank3 = { ...mockProduct, ranking: 3 as const }
      render(<ProductComparisonCard {...defaultProps} product={productRank3} showRanking={true} />)
      
      expect(screen.getByText('#3 Économique')).toBeInTheDocument()
    })
  })

  describe('Informations détaillées', () => {
    test('affiche les informations détaillées quand showDetailedInfo est true', () => {
      render(<ProductComparisonCard {...defaultProps} showDetailedInfo={true} />)
      
      // Mode d'emploi
      expect(screen.getByText('Mode d\'emploi')).toBeInTheDocument()
      expect(screen.getByText('Appliquer matin et soir sur peau propre et sèche')).toBeInTheDocument()
      
      // Timing
      expect(screen.getByText('Quand')).toBeInTheDocument()
      expect(screen.getByText('matin et soir')).toBeInTheDocument()
      
      // Zones
      expect(screen.getByText('Où')).toBeInTheDocument()
      expect(screen.getByText('visage entier, cou')).toBeInTheDocument()
    })

    test('affiche les restrictions quand présentes', () => {
      render(<ProductComparisonCard {...defaultProps} showDetailedInfo={true} />)
      
      expect(screen.getByText('Précautions')).toBeInTheDocument()
      expect(screen.getByText('• Éviter le contour des yeux')).toBeInTheDocument()
      expect(screen.getByText('• Faire un test de tolérance')).toBeInTheDocument()
    })

    test('n\'affiche pas les restrictions quand elles sont absentes', () => {
      const productWithoutRestrictions = { ...mockProduct, restrictions: undefined }
      render(<ProductComparisonCard {...defaultProps} product={productWithoutRestrictions} showDetailedInfo={true} />)
      
      expect(screen.queryByText('Précautions')).not.toBeInTheDocument()
    })

    test('n\'affiche pas les informations détaillées quand showDetailedInfo est false', () => {
      render(<ProductComparisonCard {...defaultProps} showDetailedInfo={false} />)
      
      expect(screen.queryByText('Mode d\'emploi')).not.toBeInTheDocument()
      expect(screen.queryByText('Quand')).not.toBeInTheDocument()
      expect(screen.queryByText('Où')).not.toBeInTheDocument()
    })
  })

  describe('États de sélection', () => {
    test('affiche l\'état sélectionné quand isSelected est true', () => {
      render(<ProductComparisonCard {...defaultProps} isSelected={true} />)
      
      expect(screen.getByText('✓ Produit sélectionné')).toBeInTheDocument()
      expect(screen.queryByText('Choisir cette alternative')).not.toBeInTheDocument()
    })

    test('applique les bonnes classes CSS quand sélectionné', () => {
      const { container } = render(<ProductComparisonCard {...defaultProps} isSelected={true} />)
      
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('border-dermai-primary', 'ring-2', 'ring-dermai-primary/20')
    })

    test('affiche le bouton de sélection quand onSelect est fourni et non sélectionné', () => {
      const mockOnSelect = jest.fn()
      render(<ProductComparisonCard {...defaultProps} onSelect={mockOnSelect} />)
      
      expect(screen.getByText('Choisir cette alternative')).toBeInTheDocument()
    })

    test('n\'affiche pas le bouton de sélection quand déjà sélectionné', () => {
      const mockOnSelect = jest.fn()
      render(<ProductComparisonCard {...defaultProps} isSelected={true} onSelect={mockOnSelect} />)
      
      expect(screen.queryByText('Choisir cette alternative')).not.toBeInTheDocument()
    })
  })

  describe('Interactions utilisateur', () => {
    test('appelle onSelect quand on clique sur le bouton', () => {
      const mockOnSelect = jest.fn()
      render(<ProductComparisonCard {...defaultProps} onSelect={mockOnSelect} />)
      
      const selectButton = screen.getByText('Choisir cette alternative')
      fireEvent.click(selectButton)
      
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })

    test('le bouton de sélection a l\'effet hover', () => {
      const mockOnSelect = jest.fn()
      render(<ProductComparisonCard {...defaultProps} onSelect={mockOnSelect} />)
      
      const selectButton = screen.getByText('Choisir cette alternative')
      expect(selectButton).toHaveClass('hover:shadow-lg', 'transition-all')
    })
  })

  describe('Configuration des couleurs par ranking', () => {
    test('applique les bonnes couleurs pour ranking 1', () => {
      render(<ProductComparisonCard {...defaultProps} showRanking={true} />)
      
      const badge = screen.getByText('#1 Recommandé')
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200')
    })

    test('applique les bonnes couleurs pour ranking 2', () => {
      const productRank2 = { ...mockProduct, ranking: 2 as const }
      render(<ProductComparisonCard {...defaultProps} product={productRank2} showRanking={true} />)
      
      const badge = screen.getByText('#2 Alternative')
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200')
    })

    test('applique les bonnes couleurs pour ranking 3', () => {
      const productRank3 = { ...mockProduct, ranking: 3 as const }
      render(<ProductComparisonCard {...defaultProps} product={productRank3} showRanking={true} />)
      
      const badge = screen.getByText('#3 Économique')
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800', 'border-orange-200')
    })
  })

  describe('Responsive et layout', () => {
    test('applique les bonnes classes responsive', () => {
      const { container } = render(<ProductComparisonCard {...defaultProps} showDetailedInfo={true} />)
      
      // Vérifier la grille responsive pour timing/zones
      const gridContainer = screen.getByText('Quand').parentElement?.parentElement
      expect(gridContainer).toHaveClass('grid', 'grid-cols-2', 'gap-3')
    })

    test('gère correctement les longs textes', () => {
      const longJustification = 'A'.repeat(500)
      const productWithLongText = { ...mockProduct, justification: longJustification }
      
      render(<ProductComparisonCard {...defaultProps} product={productWithLongText} />)
      
      const justificationElement = screen.getByText(longJustification)
      expect(justificationElement).toHaveClass('leading-relaxed')
    })
  })

  describe('Accessibilité', () => {
    test('le bouton de sélection est accessible au clavier', () => {
      const mockOnSelect = jest.fn()
      render(<ProductComparisonCard {...defaultProps} onSelect={mockOnSelect} />)
      
      const selectButton = screen.getByText('Choisir cette alternative')
      selectButton.focus()
      fireEvent.keyDown(selectButton, { key: 'Enter' })
      
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })

    test('les badges ont les bonnes couleurs de contraste', () => {
      render(<ProductComparisonCard {...defaultProps} showRanking={true} />)
      
      const badge = screen.getByText('#1 Recommandé')
      // Vérifier que les couleurs ont un bon contraste
      expect(badge).toHaveClass('text-green-800') // Texte foncé sur fond clair
    })
  })
})
