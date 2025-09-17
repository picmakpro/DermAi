'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Star, DollarSign, Shuffle, Info } from 'lucide-react'
import { ProductDetail } from '@/schemas/v3/products'
import { ProductComparisonCard } from './ProductComparisonCard'

interface AlternativeProductModalProps {
  isOpen: boolean
  currentProduct: ProductDetail | null
  alternatives: ProductDetail[]
  isLoading: boolean
  error: string | null
  onSelect: (product: ProductDetail) => void
  onClose: () => void
}

export function AlternativeProductModal({ 
  isOpen, 
  currentProduct, 
  alternatives, 
  isLoading,
  error,
  onSelect, 
  onClose 
}: AlternativeProductModalProps) {
  if (!isOpen || !currentProduct) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* En-tête */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Alternatives pour {currentProduct.productName}
                </h2>
                <p className="text-gray-600">
                  Comparez les options et choisissez celle qui vous convient le mieux
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Produit principal */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                Produit recommandé (#1)
              </h3>
              <ProductComparisonCard 
                product={currentProduct}
                isSelected={true}
                showRanking={true}
                showDetailedInfo={true}
              />
            </div>
            
            {/* Alternatives */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <Shuffle className="w-5 h-5 mr-2 text-blue-500" />
                Alternatives disponibles
              </h3>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dermai-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg p-4">
                  <Info className="w-6 h-6 mx-auto mb-2" />
                  Erreur lors du chargement des alternatives: {error}
                </div>
              ) : alternatives.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shuffle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune alternative disponible pour ce produit</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {alternatives.map((alternative, index) => (
                    <motion.div
                      key={alternative.catalogId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ProductComparisonCard
                        product={alternative}
                        showRanking={true}
                        showDetailedInfo={true}
                        onSelect={() => onSelect(alternative)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer avec informations */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Comment choisir ?</p>
                  <ul className="space-y-1 text-blue-600">
                    <li>• <strong>Produit #1</strong> : Le plus adapté à votre diagnostic</li>
                    <li>• <strong>Produit #2</strong> : Alternative de qualité équivalente</li>
                    <li>• <strong>Produit #3</strong> : Option économique ou spécialisée</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
