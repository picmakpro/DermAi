/**
 * 🔄 MODAL D'ALTERNATIVES
 * 
 * Modal pour l'affichage et la comparaison des alternatives de produits
 * avec critères de comparaison et sélection interactive
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Leaf,
  Zap,
  DollarSign,
  Clock,
  AlertTriangle,
  Star,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import Image from 'next/image'
import { EnrichedProduct } from '@/types/productSync'
import { AlternativeProduct } from '@/types/alternatives'

interface AlternativeModalProps {
  isOpen: boolean
  currentProduct: EnrichedProduct | null
  alternatives: AlternativeProduct[]
  isLoading: boolean
  error: string | null
  onSelect: (alternative: AlternativeProduct) => void
  onClose: () => void
}

export const AlternativeModal: React.FC<AlternativeModalProps> = ({
  isOpen,
  currentProduct,
  alternatives,
  isLoading,
  error,
  onSelect,
  onClose
}) => {
  const [selectedAlternative, setSelectedAlternative] = useState<AlternativeProduct | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  
  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAlternative(null)
      setShowComparison(false)
    }
  }, [isOpen])
  
  /**
   * 🎯 SÉLECTION D'UNE ALTERNATIVE
   */
  const handleAlternativeSelect = (alternative: AlternativeProduct) => {
    setSelectedAlternative(alternative)
    setShowComparison(true)
  }
  
  /**
   * ✅ CONFIRMATION DE SÉLECTION
   */
  const handleConfirmSelection = () => {
    if (selectedAlternative) {
      console.log(`✅ Confirmation sélection: ${selectedAlternative.name}`)
      onSelect(selectedAlternative)
    }
  }
  
  /**
   * 💰 FORMATAGE PRIX
   */
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }
  
  /**
   * 📊 CALCUL DIFFÉRENCE PRIX
   */
  const calculatePriceDifference = (newPrice: number, originalPrice: number) => {
    const difference = newPrice - originalPrice
    const percentage = ((difference / originalPrice) * 100)
    
    return {
      amount: Math.abs(difference),
      percentage: Math.abs(percentage),
      isMore: difference > 0,
      isLess: difference < 0,
      isSimilar: Math.abs(percentage) < 10
    }
  }
  
  /**
   * 🏷️ RENDU TAG DE COMPARAISON
   */
  const renderComparisonTag = (tag: string) => {
    const tagConfig = {
      'Plus économique': { icon: TrendingDown, color: 'text-green-600 bg-green-50' },
      'Premium': { icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
      'Prix similaire': { icon: Minus, color: 'text-blue-600 bg-blue-50' },
      'Plus naturel': { icon: Leaf, color: 'text-green-600 bg-green-50' },
      'Peau sensible': { icon: Leaf, color: 'text-blue-600 bg-blue-50' },
      'Cliniquement prouvé': { icon: Star, color: 'text-purple-600 bg-purple-50' },
      'Action rapide': { icon: Zap, color: 'text-orange-600 bg-orange-50' }
    }
    
    const config = tagConfig[tag as keyof typeof tagConfig] || { 
      icon: Star, 
      color: 'text-gray-600 bg-gray-50' 
    }
    
    const IconComponent = config.icon
    
    return (
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        <span>{tag}</span>
      </div>
    )
  }
  
  /**
   * 🔄 RENDU CARTE ALTERNATIVE
   */
  const renderAlternativeCard = (alternative: AlternativeProduct, index: number) => {
    const priceDiff = currentProduct ? calculatePriceDifference(alternative.price, currentProduct.price) : null
    
    return (
      <motion.div
        key={alternative.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white border border-gray-200 rounded-xl p-4 hover:border-dermai-ai-300 hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => handleAlternativeSelect(alternative)}
      >
        <div className="flex space-x-4">
          {/* Image produit */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {alternative.imageUrl ? (
              <Image
                src={alternative.imageUrl}
                alt={alternative.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Star className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Informations produit */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">{alternative.name}</h4>
            <p className="text-sm text-gray-600 mb-2">{alternative.brand}</p>
            
            {/* Tags de comparaison */}
            <div className="flex flex-wrap gap-1 mb-2">
              {alternative.comparisonTags.slice(0, 2).map((tag, tagIndex) => (
                <div key={tagIndex}>
                  {renderComparisonTag(tag)}
                </div>
              ))}
            </div>
            
            {/* Prix et comparaison */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-dermai-ai-600">
                  {formatPrice(alternative.price)}
                </span>
                {priceDiff && (
                  <div className={`flex items-center space-x-1 text-xs ${
                    priceDiff.isLess ? 'text-green-600' : 
                    priceDiff.isMore ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {priceDiff.isLess && <TrendingDown className="w-3 h-3" />}
                    {priceDiff.isMore && <TrendingUp className="w-3 h-3" />}
                    {priceDiff.isSimilar && <Minus className="w-3 h-3" />}
                    <span>
                      {priceDiff.isLess && '-'}
                      {priceDiff.isMore && '+'}
                      {formatPrice(priceDiff.amount)}
                    </span>
                  </div>
                )}
              </div>
              
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </motion.div>
    )
  }
  
  /**
   * 📋 RENDU COMPARAISON DÉTAILLÉE
   */
  const renderDetailedComparison = () => {
    if (!selectedAlternative || !currentProduct) return null
    
    const priceDiff = calculatePriceDifference(selectedAlternative.price, currentProduct.price)
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gray-50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparaison détaillée</h3>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Produit actuel */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Produit actuel</h4>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                  {currentProduct.imageUrl && (
                    <Image
                      src={currentProduct.imageUrl}
                      alt={currentProduct.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{currentProduct.name}</div>
                  <div className="text-xs text-gray-600">{currentProduct.brand}</div>
                </div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(currentProduct.price)}
              </div>
            </div>
          </div>
          
          {/* Alternative sélectionnée */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Alternative choisie</h4>
            <div className="bg-white rounded-lg p-4 border-2 border-dermai-ai-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                  {selectedAlternative.imageUrl && (
                    <Image
                      src={selectedAlternative.imageUrl}
                      alt={selectedAlternative.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{selectedAlternative.name}</div>
                  <div className="text-xs text-gray-600">{selectedAlternative.brand}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-lg font-bold text-dermai-ai-600">
                  {formatPrice(selectedAlternative.price)}
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  priceDiff.isLess ? 'text-green-600' : 
                  priceDiff.isMore ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {priceDiff.isLess && <TrendingDown className="w-4 h-4" />}
                  {priceDiff.isMore && <TrendingUp className="w-4 h-4" />}
                  <span>
                    {priceDiff.isLess ? 'Économie de ' : priceDiff.isMore ? 'Surcoût de ' : ''}
                    {formatPrice(priceDiff.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Différences principales */}
        {selectedAlternative.differenceHighlights && selectedAlternative.differenceHighlights.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700 mb-3">Principales différences</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedAlternative.differenceHighlights.map((highlight, index) => (
                <div key={index} className="flex items-start space-x-2 bg-white rounded-lg p-3">
                  <Star className="w-4 h-4 text-dermai-ai-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Impact du changement */}
        {selectedAlternative.switchingImpact && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-700 mb-3">Impact du changement</h4>
            <div className="bg-white rounded-lg p-4">
              {selectedAlternative.switchingImpact.expectedResults && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Résultats attendus</div>
                  <div className="text-sm text-gray-600">{selectedAlternative.switchingImpact.expectedResults}</div>
                </div>
              )}
              
              {selectedAlternative.switchingImpact.precautions && selectedAlternative.switchingImpact.precautions.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-yellow-800 mb-1">Précautions</div>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {selectedAlternative.switchingImpact.precautions.map((precaution, index) => (
                          <li key={index}>• {precaution}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Boutons d'action */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleConfirmSelection}
            className="flex-1 bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 text-white px-6 py-3 rounded-xl font-medium hover:from-dermai-ai-600 hover:to-dermai-ai-700 transition-all duration-200"
          >
            Choisir cette alternative
          </button>
          <button
            onClick={() => setShowComparison(false)}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Retour
          </button>
        </div>
      </motion.div>
    )
  }
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {showComparison ? 'Comparaison détaillée' : 'Alternatives disponibles'}
              </h2>
              {currentProduct && !showComparison && (
                <p className="text-sm text-gray-600 mt-1">
                  Pour {currentProduct.name} • {alternatives.length} alternatives trouvées
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Contenu */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="w-6 h-6 text-dermai-ai-500 animate-spin" />
                  <span className="text-lg text-gray-600">Recherche d'alternatives...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-700 mb-2">Erreur de chargement</h3>
                <p className="text-red-600">{error}</p>
              </div>
            ) : showComparison ? (
              renderDetailedComparison()
            ) : alternatives.length > 0 ? (
              <div className="space-y-4">
                {alternatives.map((alternative, index) => renderAlternativeCard(alternative, index))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Aucune alternative trouvée</h3>
                <p className="text-gray-500">
                  Nous n'avons pas trouvé d'alternatives compatibles pour ce produit.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
