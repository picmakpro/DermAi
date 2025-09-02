'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('💥 ErrorBoundary capturé:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dermai-pure flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-dermai-neutral-900 mb-4">
              Erreur de chargement
            </h1>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-medium mb-2">
                Erreur technique :
              </p>
              <p className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded break-all">
                {this.state.error?.message || 'Erreur inconnue'}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  try {
                    sessionStorage.clear()
                    localStorage.clear()
                  } catch {}
                  window.location.reload()
                }}
                className="w-full bg-dermai-ai-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-dermai-ai-600 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recharger la page
              </button>
              
              <button
                onClick={() => {
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
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
