import { ShoppingCart, Info, Clock, RefreshCcw } from 'lucide-react'

interface ProductCardProps {
  name: string
  brand: string
  price: number
  originalPrice?: number
  imageUrl: string
  discount?: number
  frequency: string
  benefits: string[]
  instructions: string
  whyThisProduct: string
  affiliateLink: string
  onAlternativeClick?: (criteria?: 'cheaper' | 'natural' | 'similar') => void
}

export default function ProductCard({
  name,
  brand,
  price,
  originalPrice,
  imageUrl,
  discount,
  frequency,
  benefits,
  instructions,
  whyThisProduct,
  affiliateLink,
  onAlternativeClick
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-w-[280px] snap-start relative group hover:shadow-md transition-shadow">
      {/* Discount badge supprimé (pas de marketing) */}
      
      {/* Product image */}
      <div className="w-full h-48 bg-gray-50 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      {/* Product info */}
      <div className="p-4 space-y-3">
        {/* Category badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 px-3 py-1.5 rounded-full font-semibold">
            ✨ Recommandé par l&apos;IA
          </span>
          <div className="flex items-center space-x-2">
            {/* Why this product tooltip */}
            <div className="relative group/tooltip">
              <Info className="w-4 h-4 text-blue-500 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg p-3 w-64 shadow-lg">
                  <div className="font-semibold mb-1">✨ Pourquoi ce produit ?</div>
                  <div>{whyThisProduct}</div>
                </div>
              </div>
            </div>
            
            {/* Instructions tooltip */}
            <div className="relative group/tooltip">
              <Clock className="w-4 h-4 text-green-500 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg p-3 w-64 shadow-lg">
                  <div className="font-semibold mb-1">📋 Mode d'emploi</div>
                  <div>{instructions}</div>
                  <div className="mt-2 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span className="font-medium">{frequency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product name and brand */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{name}</h3>
          <p className="text-gray-600 text-sm">{brand}</p>
        </div>
        
        {/* Benefits */}
        <div className="flex flex-wrap gap-1">
          {benefits.slice(0, 2).map((benefit, index) => (
            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {benefit}
            </span>
          ))}
        </div>
        
        {/* Pricing */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {originalPrice.toFixed(2)}€
              </span>
            )}
            <span className="text-lg font-bold text-gray-900">
              {price.toFixed(2)}€
            </span>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a
            href={affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Acheter</span>
          </a>

          <button
            type="button"
            onClick={() => onAlternativeClick && onAlternativeClick()}
            className="w-full bg-white text-purple-600 border border-purple-200 py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-purple-50 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Autre alternative</span>
          </button>
        </div>
        
        {/* Badge marketing supprimé */}
      </div>
    </div>
  )
}
