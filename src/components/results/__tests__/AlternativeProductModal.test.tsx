/**
 * 🧪 TESTS - AlternativeProductModal
 * 
 * Tests unitaires pour le modal de comparaison des alternatives
 * 
 * Version: 1.0 - Sprint 2
 * Date: 17 septembre 2025
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AlternativeProductModal } from '../AlternativeProductModal'
import { ProductDetail } from '@/schemas/v3/products'

// Mock framer-motion pour éviter les erreurs de test
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

describe('AlternativeProductModal', () => {
  const mockCurrentProduct: ProductDetail = {
    catalogId: 'test-product-1',
    productName: 'Sérum Hydratant',
    brand: 'Test Brand',
    price: 25.99,
    ranking: 1,
    justification: 'Produit optimal pour votre type de peau mixte avec zones sensibles',
    applicationAdvice: 'Appliquer matin et soir sur peau propre',
    timing: 'matin et soir',
    targetZones: ['visage entier'],
    differentiators: ['Acide hyaluronique', 'Testé dermatologiquement', 'Sans parfum'],
    priceComparison: 'Rapport qualité/prix optimal',
    strengthComparison: 'Efficacité équilibrée'
  }

  const mockAlternatives: ProductDetail[] = [
    {
      catalogId: 'test-product-2',
      productName: 'Sérum Premium',
      brand: 'Premium Brand',
      price: 45.99,
      ranking: 2,
      justification: 'Alternative premium avec actifs concentrés pour résultats rapides',
      applicationAdvice: 'Appliquer le soir uniquement, commencer 2 fois par semaine',
      timing: 'matin et soir',
      targetZones: ['visage entier'],
      differentiators: ['Rétinol encapsulé', 'Formule concentrée', 'Marque dermatologique'],
      priceComparison: 'Premium (+77%)',
      strengthComparison: 'Plus puissant et concentré'
    },
    {
      catalogId: 'test-product-3',
      productName: 'Sérum Économique',
      brand: 'Budget Brand',
      price: 12.99,
      ranking: 3,
      justification: 'Option économique sans compromis sur l\'efficacité, idéale pour débuter',
      applicationAdvice: 'Usage quotidien matin et soir, convient aux peaux sensibles',
      timing: 'matin et soir',
      targetZones: ['visage entier'],
      differentiators: ['Prix accessible', 'Hypoallergénique', 'Formule douce'],
      priceComparison: 'Économique (-50%)',
      strengthComparison: 'Plus doux, moins irritant'
    }
  ]

  const defaultProps = {
    isOpen: true,
    currentProduct: mockCurrentProduct,
    alternatives: mockAlternatives,
    isLoading: false,
    error: null,
    onSelect: jest.fn(),
    onClose: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendu et affichage', () => {
    test('affiche le modal quand isOpen est true', () => {
      render(<AlternativeProductModal {...defaultProps} />)
      
      expect(screen.getByText('Alternatives pour Sérum Hydratant')).toBeInTheDocument()
      expect(screen.getByText('Comparez les options et choisissez celle qui vous convient le mieux')).toBeInTheDocument()
    })

    test('n\'affiche pas le modal quand isOpen est false', () => {
      render(<AlternativeProductModal {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Alternatives pour Sérum Hydratant')).not.toBeInTheDocument()
    })

    test('n\'affiche pas le modal quand currentProduct est null', () => {
      render(<AlternativeProductModal {...defaultProps} currentProduct={null} />)
      
      expect(screen.queryByText('Alternatives pour')).not.toBeInTheDocument()
    })

    test('affiche le produit principal avec le badge #1 Recommandé', () => {
      render(<AlternativeProductModal {...defaultProps} />)
      
      expect(screen.getByText('Produit recommandé (#1)')).toBeInTheDocument()
      expect(screen.getByText('Test Brand Sérum Hydratant')).toBeInTheDocument()
      expect(screen.getByText('25.99€')).toBeInTheDocument()
    })

    test('affiche les alternatives avec leurs rankings', () => {
      render(<AlternativeProductModal {...defaultProps} />)
      
      // Alternative #2
      expect(screen.getByText('Premium Brand Sérum Premium')).toBeInTheDocument()
      expect(screen.getByText('45.99€')).toBeInTheDocument()
      expect(screen.getByText('Premium (+77%)')).toBeInTheDocument()
      
      // Alternative #3
      expect(screen.getByText('Budget Brand Sérum Économique')).toBeInTheDocument()
      expect(screen.getByText('12.99€')).toBeInTheDocument()
      expect(screen.getByText('Économique (-50%)')).toBeInTheDocument()
    })
  })

  describe('États de chargement et d\'erreur', () => {
    test('affiche l\'indicateur de chargement', () => {
      render(<AlternativeProductModal {...defaultProps} isLoading={true} />)
      
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument() // spinner
    })

    test('affiche le message d\'erreur', () => {
      const errorMessage = 'Erreur de chargement des alternatives'
      render(<AlternativeProductModal {...defaultProps} error={errorMessage} />)
      
      expect(screen.getByText(`Erreur lors du chargement des alternatives: ${errorMessage}`)).toBeInTheDocument()
    })

    test('affiche le message quand aucune alternative n\'est disponible', () => {
      render(<AlternativeProductModal {...defaultProps} alternatives={[]} />)
      
      expect(screen.getByText('Aucune alternative disponible pour ce produit')).toBeInTheDocument()
    })
  })

  describe('Interactions utilisateur', () => {
    test('appelle onClose quand on clique sur le bouton fermer', () => {
      const mockOnClose = jest.fn()
      render(<AlternativeProductModal {...defaultProps} onClose={mockOnClose} />)
      
      const closeButton = screen.getByRole('button', { name: /fermer/i })
      fireEvent.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('appelle onClose quand on clique sur l\'overlay', () => {
      const mockOnClose = jest.fn()
      render(<AlternativeProductModal {...defaultProps} onClose={mockOnClose} />)
      
      // Cliquer sur l'overlay (premier div avec la classe fixed)
      const overlay = screen.getByRole('dialog').parentElement
      fireEvent.click(overlay!)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('n\'appelle pas onClose quand on clique sur le contenu du modal', () => {
      const mockOnClose = jest.fn()
      render(<AlternativeProductModal {...defaultProps} onClose={mockOnClose} />)
      
      const modalContent = screen.getByText('Alternatives pour Sérum Hydratant')
      fireEvent.click(modalContent)
      
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('appelle onSelect avec le bon produit quand on sélectionne une alternative', () => {
      const mockOnSelect = jest.fn()
      render(<AlternativeProductModal {...defaultProps} onSelect={mockOnSelect} />)
      
      const selectButtons = screen.getAllByText('Choisir cette alternative')
      fireEvent.click(selectButtons[0]) // Première alternative
      
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
      expect(mockOnSelect).toHaveBeenCalledWith(mockAlternatives[0])
    })
  })

  describe('Informations éducatives', () => {
    test('affiche les informations d\'aide pour choisir', () => {
      render(<AlternativeProductModal {...defaultProps} />)
      
      expect(screen.getByText('Comment choisir ?')).toBeInTheDocument()
      expect(screen.getByText(/Produit #1.*Le plus adapté à votre diagnostic/)).toBeInTheDocument()
      expect(screen.getByText(/Produit #2.*Alternative de qualité équivalente/)).toBeInTheDocument()
      expect(screen.getByText(/Produit #3.*Option économique ou spécialisée/)).toBeInTheDocument()
    })
  })

  describe('Accessibilité', () => {
    test('le modal a les attributs ARIA appropriés', () => {
      render(<AlternativeProductModal {...defaultProps} />)
      
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
    })

    test('le bouton fermer est accessible au clavier', () => {
      const mockOnClose = jest.fn()
      render(<AlternativeProductModal {...defaultProps} onClose={mockOnClose} />)
      
      const closeButton = screen.getByRole('button', { name: /fermer/i })
      closeButton.focus()
      fireEvent.keyDown(closeButton, { key: 'Enter' })
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Responsive et animations', () => {
    test('applique les bonnes classes CSS pour le responsive', () => {
      render(<AlternativeProductModal {...defaultProps} />)
      
      const modalContent = screen.getByRole('dialog')
      expect(modalContent).toHaveClass('max-w-5xl', 'w-full', 'max-h-[90vh]')
    })

    test('affiche les alternatives dans une grille responsive', () => {
      render(<AlternativeProductModal {...defaultProps} />)
      
      const alternativesContainer = screen.getByText('Alternatives disponibles').nextElementSibling
      expect(alternativesContainer).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-2')
    })
  })
})
