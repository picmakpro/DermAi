/**
 * 🎨 CARTE PRODUIT ENRICHIE
 * 
 * Composant de carte produit avec données enrichies du catalogue,
 * bulles d'informations et bouton d'alternatives
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, 
  Info, 
  Clock, 
  Target, 
  Star, 
  ExternalLink,
  Shuffle,
  Badge,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import Image from 'next/image'
import { EnrichedProduct } from '@/types/productSync'

interface EnrichedProductCardProps {
  product: EnrichedProduct
  onAlternativeClick: () => void
  onPurchaseClick?: () => void
  isLoading?: boolean
  showAlternativeBadge?: boolean
  className?: string
}

export const EnrichedProductCard: React.FC<EnrichedProductCardProps> = ({
  product,
  onAlternativeClick,
  onPurchaseClick,
  isLoading = false,
  showAlternativeBadge = false,
  className = ''
}) => {
  const [showUsageInfo, setShowUsageInfo] = useState(false)
  const [showJustificationInfo, setShowJustificationInfo] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  /**
   * 🛒 GESTION ACHAT
   */
  const handlePurchaseClick = () => {
    console.log(`🛒 Achat produit: ${product.name}`)
    
    // Ouvrir le lien d'affiliation
    if (product.affiliateLink) {
      window.open(product.affiliateLink, '_blank', 'noopener,noreferrer')
    }
    
    // Callback externe si fourni
    if (onPurchaseClick) {
      onPurchaseClick()
    }
    
    // Analytics (à implémenter)
    // trackEvent('product_purchase_click', { productId: product.id, productName: product.name })
  }
  
  /**
   * 🔄 GESTION ALTERNATIVES
   */
  const handleAlternativeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log(`🔄 Alternatives demandées pour: ${product.name}`)
    onAlternativeClick()
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
   * ⭐ AFFICHAGE RATING
   */
  const renderRating = (rating?: number) => {
    if (!rating) return null
    
    return (
      <div className="flex items-center space-x-1">
        <Star className="w-4 h-4 text-yellow-400 fill-current" />
        <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
      </div>
    )
  }
  
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Badge alternatif si applicable */}
      {(showAlternativeBadge || product.isAlternative) && (
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center space-x-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            <Shuffle className="w-3 h-3" />
            <span>Alternative</span>
          </div>
        </div>
      )}
      
      {/* Image produit */}
      <div className="relative h-48 bg-gray-50">
        {!imageError && product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <span className="text-sm text-gray-500">Image non disponible</span>
            </div>
          </div>
        )}
        
        {/* Overlay avec rating si disponible */}
        {product.rating && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
            {renderRating(product.rating)}
          </div>
        )}
      </div>
      
      {/* Contenu de la carte */}
      <div className="p-6">
        {/* En-tête produit */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                {product.brand}
              </p>
            </div>
            
            {/* Prix */}
            <div className="text-right ml-3">
              <div className="text-xl font-bold text-dermai-ai-600">
                {formatPrice(product.price)}
              </div>
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="text-sm text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </div>
              )}
            </div>
          </div>
          
          {/* Catégorie par problème */}
          {product.problemCategory && (
            <div className="flex items-center space-x-2 mb-3">
              <Badge className="w-3 h-3 text-dermai-ai-500" />
              <span className="text-sm font-medium text-dermai-ai-700 bg-dermai-ai-50 px-2 py-1 rounded-full">
                {product.problemCategory}
              </span>
            </div>
          )}
          
          {/* Description courte */}
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {product.description}
            </p>
          )}
          
          {/* Bénéfices clés */}
          {product.keywordBenefits && product.keywordBenefits.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {product.keywordBenefits.slice(0, 3).map((benefit, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {benefit}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Bulles d'informations compactes */}
        <div className="flex space-x-2 mb-4">
          {/* Bulle Mode d'emploi */}
          {product.usageInstructions && (
            <div className="relative">
              <button
                onMouseEnter={() => setShowUsageInfo(true)}
                onMouseLeave={() => setShowUsageInfo(false)}
                className="flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mode d'emploi</span>
              </button>
              
              <AnimatePresence>
                {showUsageInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20"
                  >
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 mb-1">Application</div>
                      <div className="text-gray-600 mb-2">{product.usageInstructions.application}</div>
                      
                      <div className="font-medium text-gray-900 mb-1">Fréquence</div>
                      <div className="text-gray-600 mb-2">{product.usageInstructions.frequency}</div>
                      
                      <div className="font-medium text-gray-900 mb-1">Moment</div>
                      <div className="text-gray-600">{product.usageInstructions.timing}</div>
                    </div>
                    
                    {/* Flèche */}
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          {/* Bulle Pourquoi ce produit */}
          {product.aiJustification && (
            <div className="relative">
              <button
                onMouseEnter={() => setShowJustificationInfo(true)}
                onMouseLeave={() => setShowJustificationInfo(false)}
                className="flex items-center space-x-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-purple-100 transition-colors"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Pourquoi ?</span>
              </button>
              
              <AnimatePresence>
                {showJustificationInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full right-0 mb-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20"
                  >
                    <div className="text-sm">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <div className="font-medium text-gray-900">Sélection IA</div>
                      </div>
                      
                      <div className="text-gray-600 mb-3">{product.aiJustification.whySelected}</div>
                      
                      {product.aiJustification.skinBenefits && product.aiJustification.skinBenefits.length > 0 && (
                        <>
                          <div className="font-medium text-gray-900 mb-1">Bénéfices pour votre peau</div>
                          <ul className="text-gray-600 text-xs space-y-1">
                            {product.aiJustification.skinBenefits.map((benefit, index) => (
                              <li key={index} className="flex items-start space-x-1">
                                <span className="text-green-500 mt-0.5">•</span>
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                    
                    {/* Flèche */}
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        
        {/* Boutons d'action */}
        <div className="flex space-x-3">
          {/* Bouton Acheter */}
          <button
            onClick={handlePurchaseClick}
            disabled={isLoading || !product.affiliateLink}
            className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 text-white px-4 py-3 rounded-xl font-medium hover:from-dermai-ai-600 hover:to-dermai-ai-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Acheter</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          
          {/* Bouton Alternatives */}
          <button
            onClick={handleAlternativeClick}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Alternative</span>
          </button>
        </div>
        
        {/* Informations contextuelles de routine */}
        {product.routineContext && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Info className="w-3 h-3" />
              <span>
                Étape {product.routineContext.stepNumber}: {product.routineContext.stepTitle}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
