import { ShoppingCart, Info, Clock, RefreshCcw, Sparkles, Star } from 'lucide-react'

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
    <div className="bg-white rounded-2xl shadow-sm border border-dermai-ai-100 hover:shadow-lg transition-all duration-300 group overflow-hidden">
      {/* Product image */}
      <div className="w-full h-48 bg-gradient-to-br from-dermai-ai-50 to-dermai-nude-50 overflow-hidden relative">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Overlay avec badge IA */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md border border-dermai-ai-100">
            <Sparkles className="w-3 h-3 text-dermai-ai-500" />
            <span className="text-xs font-semibold text-dermai-ai-700">IA DermAI</span>
          </div>
        </div>
      </div>
      
      {/* Product info */}
      <div className="p-5 space-y-4">
        {/* Product name and brand */}
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">{name}</h3>
          <p className="text-dermai-neutral-600 text-sm font-medium">{brand}</p>
        </div>
        
        {/* Benefits */}
        <div className="flex flex-wrap gap-2">
          {benefits.slice(0, 3).map((benefit, index) => (
            <span key={index} className="text-xs bg-dermai-ai-50 text-dermai-ai-700 px-3 py-1.5 rounded-full font-medium border border-dermai-ai-100">
              {benefit}
            </span>
          ))}
        </div>
        
        {/* Pricing */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {originalPrice && (
              <span className="text-sm text-dermai-neutral-400 line-through">
                {originalPrice.toFixed(2)}€
              </span>
            )}
            <span className="text-xl font-bold text-gray-900">
              {price.toFixed(2)}€
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Why this product tooltip */}
            <div className="relative group/tooltip">
              <Info className="w-4 h-4 text-dermai-ai-500 cursor-help hover:text-dermai-ai-600 transition-colors" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                <div className="bg-white border border-dermai-ai-200 text-gray-800 text-xs rounded-xl p-4 w-72 shadow-xl">
                  <div className="font-bold mb-2 text-dermai-ai-700 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Pourquoi ce produit ?
                  </div>
                  <div className="text-sm leading-relaxed">{whyThisProduct}</div>
                </div>
              </div>
            </div>
            
            {/* Instructions tooltip */}
            <div className="relative group/tooltip">
              <Clock className="w-4 h-4 text-dermai-ai-500 cursor-help hover:text-dermai-ai-600 transition-colors" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50">
                <div className="bg-white border border-dermai-ai-200 text-gray-800 text-xs rounded-xl p-4 w-72 shadow-xl">
                  <div className="font-bold mb-2 text-dermai-ai-700 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Mode d'emploi
                  </div>
                  <div className="text-sm leading-relaxed mb-2">{instructions}</div>
                  <div className="flex items-center text-dermai-ai-600 font-medium">
                    <Clock className="w-3 h-3 mr-1" />
                    {frequency}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="space-y-3">
          <a
            href={affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:from-dermai-ai-600 hover:to-dermai-ai-700 transition-all shadow-sm hover:shadow-md"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Acheter maintenant</span>
          </a>

          <button
            type="button"
            onClick={() => onAlternativeClick && onAlternativeClick()}
            className="w-full bg-white text-dermai-ai-600 border-2 border-dermai-ai-200 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-dermai-ai-50 hover:border-dermai-ai-300 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Voir une alternative</span>
          </button>
        </div>
      </div>
    </div>
  )
}
