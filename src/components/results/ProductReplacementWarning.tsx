/**
 * ⚠️ MODAL DE PRÉVENTION REMPLACEMENT
 * 
 * Modal d'avertissement et de confirmation pour le remplacement de produits
 * avec analyse d'impact et prévention utilisateur
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle, 
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Zap,
  Shield,
  Info,
  ExternalLink
} from 'lucide-react'
import Image from 'next/image'
import { EnrichedProduct } from '@/types/productSync'
import { AlternativeProduct } from '@/types/alternatives'

interface ProductReplacementWarningProps {
  isOpen: boolean
  oldProduct: EnrichedProduct | null
  newProduct: AlternativeProduct | null
  onConfirm: () => void
  onCancel: () => void
}

interface ImpactAnalysis {
  priceImpact: {
    type: 'increase' | 'decrease' | 'similar'
    amount: number
    percentage: number
  }
  routineImpact: {
    hasChanges: boolean
    changes: string[]
  }
  skinImpact: {
    expectedResults: string
    timeframe: string
    precautions: string[]
  }
  compatibilityWarnings: string[]
}

export const ProductReplacementWarning: React.FC<ProductReplacementWarningProps> = ({
  isOpen,
  oldProduct,
  newProduct,
  onConfirm,
  onCancel
}) => {
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null)
  const [userConfirmations, setUserConfirmations] = useState({
    understoodPriceChange: false,
    understoodRoutineChange: false,
    understoodSkinChange: false
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  /**
   * 📊 ANALYSE D'IMPACT
   */
  useEffect(() => {
    if (isOpen && oldProduct && newProduct) {
      setIsAnalyzing(true)
      
      // Simuler une analyse d'impact
      setTimeout(() => {
        const analysis = analyzeReplacementImpact(oldProduct, newProduct)
        setImpactAnalysis(analysis)
        setIsAnalyzing(false)
      }, 1000)
    } else {
      setImpactAnalysis(null)
      setUserConfirmations({
        understoodPriceChange: false,
        understoodRoutineChange: false,
        understoodSkinChange: false
      })
    }
  }, [isOpen, oldProduct, newProduct])
  
  /**
   * 🔍 ANALYSE DE L'IMPACT DU REMPLACEMENT
   */
  const analyzeReplacementImpact = (old: EnrichedProduct, replacement: AlternativeProduct): ImpactAnalysis => {
    const priceDifference = replacement.price - old.price
    const pricePercentage = (priceDifference / old.price) * 100
    
    return {
      priceImpact: {
        type: Math.abs(pricePercentage) < 10 ? 'similar' : 
              priceDifference > 0 ? 'increase' : 'decrease',
        amount: Math.abs(priceDifference),
        percentage: Math.abs(pricePercentage)
      },
      routineImpact: {
        hasChanges: replacement.switchingImpact?.routineChanges ? 
                   replacement.switchingImpact.routineChanges.length > 0 : false,
        changes: replacement.switchingImpact?.routineChanges || []
      },
      skinImpact: {
        expectedResults: replacement.switchingImpact?.expectedResults || 
                        'Résultats similaires attendus avec cette alternative',
        timeframe: '2-4 semaines pour voir les premiers effets',
        precautions: replacement.switchingImpact?.precautions || []
      },
      compatibilityWarnings: replacement.switchingImpact?.compatibilityWarnings || []
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
   * ✅ GESTION CONFIRMATIONS
   */
  const handleConfirmationChange = (type: keyof typeof userConfirmations) => {
    setUserConfirmations(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }
  
  /**
   * 🔄 VALIDATION FINALE
   */
  const canConfirm = () => {
    if (!impactAnalysis) return false
    
    const requiredConfirmations = []
    
    // Confirmation prix si changement significatif
    if (impactAnalysis.priceImpact.type !== 'similar') {
      requiredConfirmations.push(userConfirmations.understoodPriceChange)
    }
    
    // Confirmation routine si changements
    if (impactAnalysis.routineImpact.hasChanges) {
      requiredConfirmations.push(userConfirmations.understoodRoutineChange)
    }
    
    // Confirmation peau si précautions
    if (impactAnalysis.skinImpact.precautions.length > 0 || 
        impactAnalysis.compatibilityWarnings.length > 0) {
      requiredConfirmations.push(userConfirmations.understoodSkinChange)
    }
    
    return requiredConfirmations.length === 0 || requiredConfirmations.every(Boolean)
  }
  
  /**
   * 🎨 RENDU IMPACT PRIX
   */
  const renderPriceImpact = () => {
    if (!impactAnalysis || !oldProduct || !newProduct) return null
    
    const { priceImpact } = impactAnalysis
    
    if (priceImpact.type === 'similar') return null
    
    const isIncrease = priceImpact.type === 'increase'
    
    return (
      <div className={`p-4 rounded-lg border-2 ${
        isIncrease ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg ${
            isIncrease ? 'bg-red-100' : 'bg-green-100'
          }`}>
            {isIncrease ? (
              <TrendingUp className="w-5 h-5 text-red-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-green-600" />
            )}
          </div>
          
          <div className="flex-1">
            <h4 className={`font-semibold ${
              isIncrease ? 'text-red-800' : 'text-green-800'
            }`}>
              {isIncrease ? 'Augmentation de prix' : 'Économie réalisée'}
            </h4>
            
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Produit actuel</span>
                <span className="font-medium">{formatPrice(oldProduct.price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Nouvelle alternative</span>
                <span className="font-medium">{formatPrice(newProduct.price)}</span>
              </div>
              <div className="border-t pt-2">
                <div className={`flex items-center justify-between font-semibold ${
                  isIncrease ? 'text-red-700' : 'text-green-700'
                }`}>
                  <span>
                    {isIncrease ? 'Surcoût' : 'Économie'}
                  </span>
                  <span>
                    {isIncrease ? '+' : '-'}{formatPrice(priceImpact.amount)}
                    <span className="text-sm ml-1">
                      ({priceImpact.percentage.toFixed(1)}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>
            
            <label className="flex items-start space-x-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={userConfirmations.understoodPriceChange}
                onChange={() => handleConfirmationChange('understoodPriceChange')}
                className="mt-1 w-4 h-4 text-dermai-ai-600 rounded focus:ring-dermai-ai-500"
              />
              <span className="text-sm text-gray-700">
                J'ai compris l'impact sur le prix et je souhaite continuer
              </span>
            </label>
          </div>
        </div>
      </div>
    )
  }
  
  /**
   * 🔄 RENDU IMPACT ROUTINE
   */
  const renderRoutineImpact = () => {
    if (!impactAnalysis || !impactAnalysis.routineImpact.hasChanges) return null
    
    return (
      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-blue-800">Modifications de routine</h4>
            <p className="text-sm text-blue-700 mt-1">
              Ce changement nécessite des ajustements dans votre routine
            </p>
            
            <ul className="mt-3 space-y-1">
              {impactAnalysis.routineImpact.changes.map((change, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-blue-700">
                  <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
            
            <label className="flex items-start space-x-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={userConfirmations.understoodRoutineChange}
                onChange={() => handleConfirmationChange('understoodRoutineChange')}
                className="mt-1 w-4 h-4 text-dermai-ai-600 rounded focus:ring-dermai-ai-500"
              />
              <span className="text-sm text-gray-700">
                J'accepte de modifier ma routine selon ces recommandations
              </span>
            </label>
          </div>
        </div>
      </div>
    )
  }
  
  /**
   * 🧴 RENDU IMPACT PEAU
   */
  const renderSkinImpact = () => {
    if (!impactAnalysis) return null
    
    const hasPrecautions = impactAnalysis.skinImpact.precautions.length > 0 ||
                          impactAnalysis.compatibilityWarnings.length > 0
    
    if (!hasPrecautions) return null
    
    return (
      <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Shield className="w-5 h-5 text-yellow-600" />
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-800">Précautions importantes</h4>
            
            {impactAnalysis.skinImpact.precautions.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-yellow-800 mb-2">À surveiller :</h5>
                <ul className="space-y-1">
                  {impactAnalysis.skinImpact.precautions.map((precaution, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-yellow-700">
                      <AlertTriangle className="w-3 h-3 mt-1 flex-shrink-0" />
                      <span>{precaution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {impactAnalysis.compatibilityWarnings.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-yellow-800 mb-2">Avertissements :</h5>
                <ul className="space-y-1">
                  {impactAnalysis.compatibilityWarnings.map((warning, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-yellow-700">
                      <Info className="w-3 h-3 mt-1 flex-shrink-0" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <label className="flex items-start space-x-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={userConfirmations.understoodSkinChange}
                onChange={() => handleConfirmationChange('understoodSkinChange')}
                className="mt-1 w-4 h-4 text-dermai-ai-600 rounded focus:ring-dermai-ai-500"
              />
              <span className="text-sm text-gray-700">
                J'ai lu et compris ces précautions importantes
              </span>
            </label>
          </div>
        </div>
      </div>
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
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Confirmer le remplacement</h2>
                <p className="text-sm text-gray-600">Vérifiez l'impact avant de continuer</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Contenu */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-6 h-6 text-dermai-ai-500" />
                  </motion.div>
                  <span className="text-lg text-gray-600">Analyse de l'impact...</span>
                </div>
              </div>
            ) : oldProduct && newProduct ? (
              <div className="space-y-6">
                {/* Résumé du changement */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Remplacer</div>
                    <div className="font-medium text-gray-900">{oldProduct.name}</div>
                    <div className="text-sm text-gray-600">{oldProduct.brand}</div>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                  
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Par</div>
                    <div className="font-medium text-dermai-ai-700">{newProduct.name}</div>
                    <div className="text-sm text-gray-600">{newProduct.brand}</div>
                  </div>
                </div>
                
                {/* Analyses d'impact */}
                <div className="space-y-4">
                  {renderPriceImpact()}
                  {renderRoutineImpact()}
                  {renderSkinImpact()}
                </div>
                
                {/* Résultats attendus */}
                {impactAnalysis && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-800">Résultats attendus</h4>
                        <p className="text-sm text-green-700 mt-1">
                          {impactAnalysis.skinImpact.expectedResults}
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          Délai : {impactAnalysis.skinImpact.timeframe}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
          
          {/* Actions */}
          <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={!canConfirm() || isAnalyzing}
              className="flex-1 bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 text-white px-6 py-3 rounded-xl font-medium hover:from-dermai-ai-600 hover:to-dermai-ai-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analyse...' : 'Confirmer le remplacement'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
