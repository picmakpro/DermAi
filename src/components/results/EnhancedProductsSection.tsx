/**
 * 🎨 SECTION PRODUITS ENRICHIE V3 - TOP 3 ALTERNATIVES
 * 
 * Composant principal pour l'affichage des produits recommandés
 * avec système Top 3 par catégorie et alternatives intelligentes
 * 
 * Version: 2.0 - Sprint 2
 * Date: 17 septembre 2025
 */

'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Sparkles, AlertCircle, RefreshCw, CheckCircle, Shuffle, Crown, BarChart3 } from 'lucide-react'
import { UnifiedRoutineStep } from '@/types'
import { SelectedProductWithAlternatives, ProductDetail } from '@/schemas/v3/products'
import { useAlternativeSelection } from '@/hooks/useAlternativeSelection'
import { useProductRanking } from '@/hooks/useProductRanking'
import { AlternativeProductModal } from './AlternativeProductModal'
import { ProductComparisonCard } from './ProductComparisonCard'

interface EnhancedProductsSectionProps {
  // Nouvelles props V3 - Top 3 produits
  productsV3: SelectedProductWithAlternatives[]
  routine: UnifiedRoutineStep[]
  onProductSelect?: (product: ProductDetail, routineStepId: number) => void
  className?: string
  showAlternativesButton?: boolean
  enableProductComparison?: boolean
}

export const EnhancedProductsSection: React.FC<EnhancedProductsSectionProps> = ({
  productsV3,
  routine,
  onProductSelect,
  className = '',
  showAlternativesButton = true,
  enableProductComparison = true
}) => {
  // Hooks V3 - Top 3 alternatives
  const {
    selectedProducts,
    modalState,
    isLoading,
    error,
    openAlternativesModal,
    closeAlternativesModal,
    selectAlternative,
    resetSelection,
    getSelectionStats
  } = useAlternativeSelection(productsV3)
  
  const {
    analyzeProduct,
    compareProducts,
    getRecommendationForUser
  } = useProductRanking()
  
  // État local pour les statistiques
  const [showStats, setShowStats] = useState(false)
  const selectionStats = getSelectionStats()
  
  // Gestion de la sélection d'alternative
  const handleAlternativeSelect = (product: ProductDetail, routineStepId: number) => {
    selectAlternative(product, routineStepId)
    onProductSelect?.(product, routineStepId)
  }
  
  // Synchronisation avec la routine si nécessaire
  useEffect(() => {
    // Logique de synchronisation si nécessaire
  }, [routine, productsV3])

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-8 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-dermai-primary" />
          <span className="text-gray-600">Chargement des produits...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-red-200 p-8 ${className}`}>
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <AlertCircle className="w-6 h-6" />
          <span className="font-medium">Erreur de chargement</span>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {/* En-tête avec statistiques */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-dermai-primary/10 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-dermai-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Produits Recommandés
              </h2>
              <p className="text-gray-600">
                {productsV3?.length || 0} étapes • {(productsV3?.length || 0) * 3} produits analysés
              </p>
            </div>
          </div>
          
          {/* Bouton statistiques */}
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Statistiques</span>
          </button>
        </div>

        {/* Statistiques de sélection */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 rounded-lg p-4 mb-4"
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectionStats.primarySelected}
                  </div>
                  <div className="text-sm text-blue-600">Recommandés</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {selectionStats.alternativesSelected}
                  </div>
                  <div className="text-sm text-orange-600">Alternatives</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(selectionStats.selectionRate * 100)}%
                  </div>
                  <div className="text-sm text-green-600">Personnalisation</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Liste des produits */}
      <div className="p-6 space-y-6">
        {productsV3?.map((step, index) => {
          const selectedProduct = selectedProducts.get(step.routineStepId) || step.primaryProduct
          const isAlternativeSelected = selectedProduct.catalogId !== step.primaryProduct.catalogId
          
          return (
            <motion.div
              key={step.routineStepId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              {/* En-tête de l'étape */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-dermai-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.routineStepId}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Étape {step.routineStepId}
                    </h3>
                    {isAlternativeSelected && (
                      <div className="flex items-center space-x-1 text-sm text-orange-600">
                        <Shuffle className="w-3 h-3" />
                        <span>Alternative sélectionnée</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Boutons d'action */}
                <div className="flex items-center space-x-2">
                  {showAlternativesButton && (
                    <button
                      onClick={() => openAlternativesModal(step)}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
                    >
                      <Shuffle className="w-4 h-4" />
                      <span>Voir alternatives</span>
                    </button>
                  )}
                  
                  {isAlternativeSelected && (
                    <button
                      onClick={() => resetSelection(step.routineStepId)}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Réinitialiser</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Carte du produit sélectionné */}
              <ProductComparisonCard
                product={selectedProduct}
                isSelected={true}
                showRanking={true}
                showDetailedInfo={false}
              />

              {/* Indicateur de diversification */}
              {enableProductComparison && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <strong>Stratégie de sélection :</strong> {step.categoryRanking.diversificationStrategy}
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Footer avec résumé */}
      <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700">
                {selectionStats.totalSteps} produits sélectionnés
              </span>
            </div>
            {selectionStats.alternativesSelected > 0 && (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-700">
                  {selectionStats.alternativesSelected} alternative(s) choisie(s)
                </span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            Routine personnalisée à {Math.round(selectionStats.selectionRate * 100)}%
          </div>
        </div>
      </div>

      {/* Modal des alternatives */}
      <AlternativeProductModal
        isOpen={modalState.isOpen}
        currentProduct={modalState.currentProduct}
        alternatives={modalState.alternatives}
        isLoading={false}
        error={null}
        onSelect={(product) => handleAlternativeSelect(product, modalState.currentStep?.routineStepId || 0)}
        onClose={closeAlternativesModal}
      />
    </div>
  )
}