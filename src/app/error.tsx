'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log l'erreur pour debugging
    console.error('💥 Erreur client-side:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-dermai-pure flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icône d'erreur */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Message d'erreur */}
        <h1 className="text-2xl font-bold text-dermai-neutral-900 mb-4">
          Oups ! Une erreur s'est produite
        </h1>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 font-medium mb-2">
            Détails techniques :
          </p>
          <p className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded break-all">
            {error.message || 'Erreur inconnue'}
          </p>
        </div>

        <p className="text-dermai-neutral-600 mb-8">
          Cette erreur peut être causée par :
        </p>
        
        <div className="text-left bg-dermai-nude-50 rounded-lg p-4 mb-8">
          <ul className="text-sm text-dermai-neutral-700 space-y-2">
            <li>• Une connexion internet instable</li>
            <li>• Un navigateur non compatible</li>
            <li>• Des données corrompues en cache</li>
            <li>• Une surcharge temporaire du serveur</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => {
              // Nettoyer le cache et recharger
              try {
                sessionStorage.clear()
                localStorage.clear()
              } catch {}
              reset()
            }}
            className="w-full bg-dermai-ai-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-dermai-ai-600 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          
          <button
            onClick={() => {
              // Nettoyer et rediriger vers l'accueil
              try {
                sessionStorage.clear()
                localStorage.clear()
              } catch {}
              window.location.href = '/'
            }}
            className="w-full bg-dermai-nude-200 text-dermai-neutral-700 px-6 py-3 rounded-lg font-medium hover:bg-dermai-nude-300 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </button>
        </div>

        {/* Informations de debugging */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <details className="text-left">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              Informations techniques (pour support)
            </summary>
            <div className="mt-2 text-xs text-gray-600 font-mono space-y-1">
              <div>Navigateur: {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</div>
              <div>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
              <div>Timestamp: {new Date().toISOString()}</div>
              <div>Error: {error.name}</div>
              <div>Stack: {error.stack?.split('\n')[0] || 'N/A'}</div>
              {error.digest && <div>Digest: {error.digest}</div>}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
