'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface AnalysisLimitBannerProps {
  remainingAnalyses: number
  canAnalyze: boolean
  requiresAuth: boolean
  className?: string
}

export default function AnalysisLimitBanner({
  remainingAnalyses,
  canAnalyze,
  requiresAuth,
  className = ''
}: AnalysisLimitBannerProps) {
  const { isAuthenticated } = useAuth()

  // Ne pas afficher si l'utilisateur est connecté
  if (isAuthenticated) {
    return null
  }

  // Mode invité avec analyses restantes
  if (canAnalyze && remainingAnalyses > 0) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Mode invité - {remainingAnalyses} analyse{remainingAnalyses > 1 ? 's' : ''} restante{remainingAnalyses > 1 ? 's' : ''}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Vous utilisez DermAI en mode invité. Créez un compte pour :
              </p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Analyses illimitées</li>
                <li>Historique de vos diagnostics</li>
                <li>Suivi de l'évolution de votre peau</li>
                <li>Sauvegarde cloud sécurisée</li>
              </ul>
            </div>
            <div className="mt-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Créer un compte gratuit
              </Link>
              <Link
                href="/auth/signin"
                className="ml-3 inline-flex items-center px-3 py-2 border border-blue-300 text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Limite atteinte - inscription requise
  if (requiresAuth || !canAnalyze) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-amber-800">
              Limite d'analyses atteinte
            </h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>
                Vous avez utilisé votre analyse gratuite en mode invité. 
                Créez un compte pour continuer à analyser votre peau !
              </p>
            </div>
            <div className="mt-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Créer un compte gratuit
              </Link>
              <Link
                href="/auth/signin"
                className="ml-3 inline-flex items-center px-3 py-2 border border-amber-300 text-sm leading-4 font-medium rounded-md text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200"
              >
                J'ai déjà un compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
