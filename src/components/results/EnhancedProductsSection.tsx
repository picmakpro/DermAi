/**
 * 🎨 SECTION PRODUITS ENRICHIE
 * 
 * Composant principal pour l'affichage de la section produits recommandés
 * avec synchronisation bidirectionnelle et système d'alternatives
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Sparkles, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react'
import { UnifiedRoutineStep } from '@/types'
import { EnrichedProduct } from '@/types/productSync'
import { AlternativeProduct } from '@/types/alternatives'
import { useProductSync } from '@/hooks/useProductSync'
import { useAlternatives } from '@/hooks/useAlternatives'
import { EnrichedProductCard } from './EnrichedProductCard'
import { AlternativeModal } from './AlternativeModal'
import { ProductReplacementWarning } from './ProductReplacementWarning'

interface EnhancedProductsSectionProps {
  routine: UnifiedRoutineStep[]
  onProductReplace?: (oldProduct: EnrichedProduct, newProduct: EnrichedProduct) => void
  className?: string
}

export const EnhancedProductsSection: React.FC<EnhancedProductsSectionProps> = ({
  routine,
  onProductReplace,
  className = ''
}) => {
  // Hooks de gestion d'état
  const {
    enrichedProducts,
    isLoading,
    error,
    syncStatus,
    syncFromRoutine,
    replaceProduct,
    clearError,
    syncMetrics
  } = useProductSync({ autoSync: true, cacheResults: true })
  
  const {
    alternatives,
    isLoadingAlternatives,
    alternativesError,
    selectedAlternative,
    loadAlternatives,
    selectAlternative,
    clearAlternatives,
    clearAlternativesError
  } = useAlternatives({ cacheResults: true, autoRetry: true })
  
  // État local pour les modals
  const [showAlternativeModal, setShowAlternativeModal] = useState(false)
  const [showReplacementWarning, setShowReplacementWarning] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<EnrichedProduct | null>(null)
  const [pendingReplacement, setPendingReplacement] = useState<{
    old: EnrichedProduct
    new: EnrichedProduct
  } | null>(null)
  
  // Synchronisation initiale
  useEffect(() => {
    if (routine && routine.length > 0) {
      console.log('🔄 Synchronisation initiale des produits depuis routine')
      syncFromRoutine(routine)
    }
  }, [routine, syncFromRoutine])
  
  /**
   * 🔍 GESTION OUVERTURE ALTERNATIVES
   */
  const handleAlternativeClick = async (product: EnrichedProduct) => {
    console.log(`🔍 Ouverture alternatives pour: ${product.name}`)
    setCurrentProduct(product)
    setShowAlternativeModal(true)
    clearAlternativesError()
    
    // Charger les alternatives avec critères par défaut
    await loadAlternatives(product, {
      priceRange: 'similar',
      naturalness: 'similar',
      potency: 'similar'
    })
  }
  
  /**
   * ✅ GESTION SÉLECTION ALTERNATIVE
   */
  const handleAlternativeSelect = (alternative: AlternativeProduct) => {
    if (!currentProduct) return
    
    console.log(`✅ Alternative sélectionnée: ${alternative.name}`)
    selectAlternative(alternative)
    
    // Préparer le remplacement
    setPendingReplacement({
      old: currentProduct,
      new: alternative
    })
    
    // Fermer modal alternatives et ouvrir prévention
    setShowAlternativeModal(false)
    setShowReplacementWarning(true)
  }
  
  /**
   * 🔄 GESTION CONFIRMATION REMPLACEMENT
   */
  const handleReplacementConfirm = async () => {
    if (!pendingReplacement) return
    
    try {
      console.log('🔄 Confirmation remplacement produit')
      
      // Effectuer le remplacement
      const syncResult = await replaceProduct(pendingReplacement.old, pendingReplacement.new)
      
      if (syncResult.success) {
        // Callback externe si fourni
        if (onProductReplace) {
          onProductReplace(pendingReplacement.old, pendingReplacement.new)
        }
        
        console.log('✅ Remplacement effectué avec succès')
      } else {
        console.error('❌ Échec du remplacement:', syncResult.errors)
      }
      
      // Nettoyage
      handleCancel()
      
    } catch (error) {
      console.error('❌ Erreur lors du remplacement:', error)
      // L'erreur sera affichée via le hook useProductSync
    }
  }
  
  /**
   * ❌ GESTION ANNULATION
   */
  const handleCancel = () => {
    setShowAlternativeModal(false)
    setShowReplacementWarning(false)
    setPendingReplacement(null)
    setCurrentProduct(null)
    clearAlternatives()
  }
  
  /**
   * 🏷️ CATÉGORISATION PAR PROBLÈME
   */
  const categorizeProductsByProblem = (products: EnrichedProduct[]) => {
    const categories = new Map<string, EnrichedProduct[]>()
    
    products.forEach(product => {
      const category = product.problemCategory || 'Autres soins'
      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push(product)
    })
    
    // Trier les catégories par ordre de priorité
    const sortedCategories = new Map([...categories.entries()].sort((a, b) => {
      const priorityOrder = [
        'Nettoyage',
        'Anti-acné', 
        'Hydratation',
        'Anti-rides',
        'Taches & Éclat',
        'Protection solaire',
        'Peaux sensibles',
        'Exfoliation',
        'Autres soins'
      ]
      return priorityOrder.indexOf(a[0]) - priorityOrder.indexOf(b[0])
    }))
    
    return sortedCategories
  }
  
  // Rendu conditionnel pour les états de chargement/erreur
  if (isLoading && enrichedProducts.length === 0) {
    return (
      <div className={`bg-white rounded-3xl shadow-xl p-8 border border-dermai-ai-100 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 text-dermai-ai-500 animate-spin" />
            <span className="text-lg text-gray-600">Synchronisation des produits...</span>
          </div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className={`bg-white rounded-3xl shadow-xl p-8 border border-red-200 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-red-700">Erreur de synchronisation</h2>
          </div>
          <button
            onClick={clearError}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Réessayer
          </button>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }
  
  // Catégorisation des produits
  const categorizedProducts = categorizeProductsByProblem(enrichedProducts)
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`bg-white rounded-3xl shadow-xl p-8 border border-dermai-ai-100 ${className}`}
      >
        {/* En-tête de section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-dermai-ai-100 to-dermai-ai-200 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-dermai-ai-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Produits recommandés
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Synchronisés avec votre routine personnalisée • {enrichedProducts.length} produits
              </p>
            </div>
          </div>
          
          {/* Indicateur de synchronisation */}
          <div className="flex items-center space-x-4">
            {syncStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Synchronisé</span>
              </div>
            )}
            
            {/* Métriques de performance */}
            {syncMetrics.totalSyncs > 0 && (
              <div className="text-xs text-gray-500">
                {syncMetrics.totalSyncs} sync • {Math.round(syncMetrics.averageSyncTime)}ms moy
              </div>
            )}
          </div>
        </div>
        
        {/* Produits par catégorie */}
        <div className="space-y-8">
          {Array.from(categorizedProducts.entries()).map(([category, products]) => (
            <motion.div 
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-dermai-ai-500" />
                {category}
                <span className="ml-2 px-2 py-1 text-xs bg-dermai-ai-100 text-dermai-ai-700 rounded-full">
                  {products.length}
                </span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
                  <motion.div
                    key={`${category}-${product.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <EnrichedProductCard
                      product={product}
                      onAlternativeClick={() => handleAlternativeClick(product)}
                      isLoading={isLoading}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Message si pas de produits */}
        {enrichedProducts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Aucun produit synchronisé
            </h3>
            <p className="text-gray-500">
              Les produits apparaîtront ici une fois la routine analysée
            </p>
          </div>
        )}
      </motion.div>
      
      {/* Modal d'alternatives */}
      <AlternativeModal
        isOpen={showAlternativeModal}
        currentProduct={currentProduct}
        alternatives={alternatives}
        isLoading={isLoadingAlternatives}
        error={alternativesError}
        onSelect={handleAlternativeSelect}
        onClose={handleCancel}
      />
      
      {/* Modal de prévention remplacement */}
      <ProductReplacementWarning
        isOpen={showReplacementWarning}
        oldProduct={pendingReplacement?.old}
        newProduct={pendingReplacement?.new}
        onConfirm={handleReplacementConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
