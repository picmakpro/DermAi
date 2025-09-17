'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'Configuration':
        return {
          title: 'Erreur de configuration',
          message: 'Il y a un problème avec la configuration de l\'authentification. Veuillez réessayer plus tard.',
          icon: '⚙️'
        }
      case 'AccessDenied':
        return {
          title: 'Accès refusé',
          message: 'Vous n\'avez pas l\'autorisation d\'accéder à cette ressource.',
          icon: '🚫'
        }
      case 'Verification':
        return {
          title: 'Erreur de vérification',
          message: 'Le lien de vérification a expiré ou n\'est pas valide.',
          icon: '📧'
        }
      case 'OAuthSignin':
        return {
          title: 'Erreur de connexion OAuth',
          message: 'Erreur lors de la connexion avec le fournisseur externe.',
          icon: '🔗'
        }
      case 'OAuthCallback':
        return {
          title: 'Erreur de callback OAuth',
          message: 'Erreur lors du retour de l\'authentification externe.',
          icon: '↩️'
        }
      case 'OAuthCreateAccount':
        return {
          title: 'Erreur de création de compte',
          message: 'Impossible de créer un compte avec ce fournisseur.',
          icon: '👤'
        }
      case 'EmailCreateAccount':
        return {
          title: 'Erreur de création de compte',
          message: 'Impossible de créer un compte avec cette adresse email.',
          icon: '📧'
        }
      case 'Callback':
        return {
          title: 'Erreur de callback',
          message: 'Erreur lors du processus d\'authentification.',
          icon: '🔄'
        }
      case 'OAuthAccountNotLinked':
        return {
          title: 'Compte non lié',
          message: 'Ce compte externe est déjà associé à un autre utilisateur.',
          icon: '🔗'
        }
      case 'EmailSignin':
        return {
          title: 'Erreur d\'envoi d\'email',
          message: 'Impossible d\'envoyer l\'email de connexion.',
          icon: '📧'
        }
      case 'CredentialsSignin':
        return {
          title: 'Identifiants incorrects',
          message: 'L\'email ou le mot de passe que vous avez saisi est incorrect.',
          icon: '🔐'
        }
      case 'SessionRequired':
        return {
          title: 'Session requise',
          message: 'Vous devez être connecté pour accéder à cette page.',
          icon: '🔒'
        }
      default:
        return {
          title: 'Erreur d\'authentification',
          message: 'Une erreur inattendue s\'est produite lors de l\'authentification.',
          icon: '❌'
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl">{errorInfo.icon}</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {errorInfo.message}
          </p>
        </div>

        {/* Error Details */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Code d'erreur
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <code className="bg-red-100 px-2 py-1 rounded text-xs">
                    {error}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-y-4">
          <Link
            href="/auth/signin"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
          >
            Réessayer la connexion
          </Link>

          <Link
            href="/auth/signup"
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
          >
            Créer un nouveau compte
          </Link>

          <Link
            href="/"
            className="group relative w-full flex justify-center py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            Retour à l'accueil
          </Link>
        </div>

        {/* Help */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Si le problème persiste, contactez notre{' '}
            <Link href="/support" className="text-purple-600 hover:text-purple-500">
              support technique
            </Link>
          </p>
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Informations de débogage
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Error: {error || 'Non spécifié'}</div>
              <div>URL: {window.location.href}</div>
              <div>Timestamp: {new Date().toISOString()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}