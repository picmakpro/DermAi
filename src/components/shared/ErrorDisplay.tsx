/**
 * 🚨 COMPOSANT D'AFFICHAGE D'ERREURS
 * 
 * Composant React pour l'affichage utilisateur-friendly des erreurs
 * avec actions de récupération et fallbacks visuels
 * 
 * Sprint 3 - Intégration, Tests & Optimisation
 * Version: 1.0
 * Date: 16 septembre 2025
 */

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  Clock, 
  Shield, 
  Info,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { ErrorContext, ErrorType, ErrorSeverity } from '@/utils/ErrorHandlingService'

interface ErrorDisplayProps {
  error: ErrorContext | null
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
  fallbackActive?: boolean
  onRetry?: () => void
  onDismiss?: () => void
  onUseFallback?: () => void
  className?: string
  compact?: boolean
  showDetails?: boolean
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  fallbackActive = false,
  onRetry,
  onDismiss,
  onUseFallback,
  className = '',
  compact = false,
  showDetails = false
}) => {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false)
  
  if (!error && !fallbackActive) return null
  
  // Configuration visuelle selon le type d'erreur
  const getErrorConfig = (errorType: ErrorType, severity: ErrorSeverity) => {
    const configs = {
      [ErrorType.NETWORK_ERROR]: {
        icon: <Wifi className="w-5 h-5" />,
        color: 'orange',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-500'
      },
      [ErrorType.TIMEOUT_ERROR]: {
        icon: <Clock className="w-5 h-5" />,
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-500'
      },
      [ErrorType.CATALOG_UNAVAILABLE]: {
        icon: <Shield className="w-5 h-5" />,
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-500'
      },
      [ErrorType.VALIDATION_ERROR]: {
        icon: <Info className="w-5 h-5" />,
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-500'
      },
      default: {
        icon: <AlertCircle className="w-5 h-5" />,
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-500'
      }
    }
    
    return configs[errorType] || configs.default
  }
  
  // Affichage du fallback actif
  if (fallbackActive && !error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-blue-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">
              Mode de secours activé
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Données de substitution utilisées pour assurer la continuité du service
            </p>
          </div>
        </div>
      </motion.div>
    )
  }
  
  if (!error) return null
  
  const config = getErrorConfig(error.type, error.severity)
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}
      >
        <div className="flex items-start space-x-3">
          {/* Icône d'erreur */}
          <div className={`${config.iconColor} mt-0.5`}>
            {config.icon}
          </div>
          
          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            {/* Message principal */}
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium ${config.textColor}`}>
                {error.userFriendlyMessage}
              </h3>
              
              {/* Bouton de fermeture */}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`${config.iconColor} hover:${config.textColor} transition-colors`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Actions suggérées */}
            {!compact && error.suggestedActions.length > 0 && (
              <ul className={`text-xs ${config.textColor} mt-2 space-y-1`}>
                {error.suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-center space-x-1">
                    <span className="w-1 h-1 bg-current rounded-full" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            )}
            
            {/* Barre de progression retry */}
            {isRetrying && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={config.textColor}>
                    Nouvelle tentative {retryCount}/{maxRetries}
                  </span>
                  <RefreshCw className={`w-3 h-3 ${config.iconColor} animate-spin`} />
                </div>
                <div className="w-full bg-white bg-opacity-50 rounded-full h-1.5">
                  <div 
                    className={`bg-current h-1.5 rounded-full transition-all duration-300 ${config.iconColor}`}
                    style={{ width: `${(retryCount / maxRetries) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center space-x-3 mt-3">
              {/* Bouton Retry */}
              {onRetry && !isRetrying && retryCount < maxRetries && (
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className={`
                    inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md
                    ${config.textColor} bg-white bg-opacity-80 hover:bg-opacity-100
                    border ${config.borderColor} transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Réessayer
                </button>
              )}
              
              {/* Bouton Fallback */}
              {onUseFallback && error.fallbackAvailable && !fallbackActive && (
                <button
                  onClick={onUseFallback}
                  className={`
                    inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md
                    ${config.textColor} bg-white bg-opacity-80 hover:bg-opacity-100
                    border ${config.borderColor} transition-all duration-200
                  `}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Mode de secours
                </button>
              )}
              
              {/* Bouton Détails */}
              {showDetails && (
                <button
                  onClick={() => setDetailsExpanded(!detailsExpanded)}
                  className={`
                    inline-flex items-center px-2 py-1 text-xs
                    ${config.textColor} hover:${config.iconColor} transition-colors
                  `}
                >
                  Détails
                  {detailsExpanded ? (
                    <ChevronUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </button>
              )}
            </div>
            
            {/* Détails techniques (développement) */}
            {showDetails && detailsExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-3 p-3 bg-white bg-opacity-50 rounded border ${config.borderColor}`}
              >
                <div className={`text-xs ${config.textColor} space-y-2`}>
                  <div>
                    <span className="font-medium">Type:</span> {error.type}
                  </div>
                  <div>
                    <span className="font-medium">Sévérité:</span> {error.severity}
                  </div>
                  <div>
                    <span className="font-medium">Timestamp:</span> {error.timestamp.toLocaleString()}
                  </div>
                  {error.context && Object.keys(error.context).length > 0 && (
                    <div>
                      <span className="font-medium">Contexte:</span>
                      <pre className="mt-1 text-xs bg-black bg-opacity-10 p-2 rounded overflow-x-auto">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Message technique:</span>
                    <code className="block mt-1 text-xs bg-black bg-opacity-10 p-2 rounded">
                      {error.message}
                    </code>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * 🎯 COMPOSANT SPÉCIALISÉ POUR LES ERREURS DE SYNCHRONISATION
 */
export const ProductSyncErrorDisplay: React.FC<{
  error: ErrorContext | null
  isRetrying?: boolean
  retryCount?: number
  onRetry?: () => void
  onUseFallback?: () => void
  className?: string
}> = (props) => {
  return (
    <ErrorDisplay
      {...props}
      maxRetries={3}
      compact={false}
      showDetails={process.env.NODE_ENV === 'development'}
    />
  )
}

/**
 * 🔍 COMPOSANT SPÉCIALISÉ POUR LES ERREURS D'ALTERNATIVES
 */
export const AlternativesErrorDisplay: React.FC<{
  error: ErrorContext | null
  isRetrying?: boolean
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}> = (props) => {
  return (
    <ErrorDisplay
      {...props}
      maxRetries={2}
      compact={true}
      showDetails={false}
    />
  )
}
