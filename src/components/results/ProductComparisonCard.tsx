'use client'

import React from 'react'
import { Crown, Star, DollarSign, CheckCircle, ArrowRight, Info } from 'lucide-react'
import { ProductDetail } from '@/schemas/v3/products'

interface ProductComparisonCardProps {
  product: ProductDetail
  isSelected?: boolean
  showRanking?: boolean
  showDetailedInfo?: boolean
  onSelect?: () => void
}

export function ProductComparisonCard({ 
  product, 
  isSelected = false, 
  showRanking = false,
  showDetailedInfo = false,
  onSelect 
}: ProductComparisonCardProps) {
  
  const rankingConfig = {
    1: { 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: Crown,
      label: 'Recommandé',
      bgGradient: 'from-green-50 to-green-100'
    },
    2: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Star,
      label: 'Alternative',
      bgGradient: 'from-blue-50 to-blue-100'
    },
    3: { 
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: DollarSign,
      label: 'Économique',
      bgGradient: 'from-orange-50 to-orange-100'
    }
  }
  
  const config = rankingConfig[product.ranking]
  const IconComponent = config.icon
  
  return (
    <div className={`
      relative border rounded-xl p-6 transition-all duration-200 hover:shadow-lg
      ${isSelected 
        ? 'border-dermai-primary ring-2 ring-dermai-primary/20 bg-gradient-to-br from-dermai-primary/5 to-dermai-primary/10' 
        : 'border-gray-200 hover:border-gray-300 bg-white'
      }
    `}>
      
      {/* Badge ranking */}
      {showRanking && (
        <div className={`
          absolute -top-3 left-4 px-3 py-1 rounded-full text-sm font-medium 
          flex items-center space-x-1 shadow-sm ${config.color}
        `}>
          <IconComponent className="w-4 h-4" />
          <span>#{product.ranking} {config.label}</span>
        </div>
      )}
      
      {/* En-tête produit */}
      <div className="flex justify-between items-start mb-4 mt-2">
        <div className="flex-1">
          <h4 className="font-semibold text-lg text-gray-900 mb-1">
            {product.brand} {product.productName}
          </h4>
          {product.strengthComparison && (
            <p className="text-sm text-gray-600 font-medium">
              {product.strengthComparison}
            </p>
          )}
        </div>
        
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-gray-900">{product.price}€</div>
          {product.priceComparison && (
            <div className="text-sm text-gray-500">{product.priceComparison}</div>
          )}
        </div>
      </div>
      
      {/* Justification */}
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">
        {product.justification}
      </p>
      
      {/* Différenciateurs */}
      {product.differentiators && product.differentiators.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {product.differentiators.map((diff, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
              >
                {diff}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Informations détaillées */}
      {showDetailedInfo && (
        <div className="space-y-3 mb-4">
          {/* Conseils d'application */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h5 className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Mode d'emploi
            </h5>
            <p className="text-sm text-gray-700">{product.applicationAdvice}</p>
          </div>
          
          {/* Timing et zones */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h5 className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">
                Quand
              </h5>
              <p className="text-sm text-blue-700 font-medium">{product.timing}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h5 className="text-xs font-semibold text-green-600 mb-1 uppercase tracking-wide">
                Où
              </h5>
              <p className="text-sm text-green-700 font-medium">
                {product.targetZones.join(', ')}
              </p>
            </div>
          </div>
          
          {/* Restrictions si présentes */}
          {product.restrictions && product.restrictions.length > 0 && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <h5 className="text-xs font-semibold text-yellow-600 mb-1 uppercase tracking-wide flex items-center">
                <Info className="w-3 h-3 mr-1" />
                Précautions
              </h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                {product.restrictions.map((restriction, index) => (
                  <li key={index}>• {restriction}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Bouton d'action */}
      {onSelect && !isSelected && (
        <button 
          onClick={onSelect}
          className="w-full mt-4 bg-gradient-to-r from-dermai-primary to-dermai-primary-dark text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center space-x-2 group"
        >
          <span>Choisir cette alternative</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
      
      {/* État sélectionné */}
      {isSelected && (
        <div className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg text-center font-medium flex items-center justify-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>Produit sélectionné</span>
        </div>
      )}
    </div>
  )
}
