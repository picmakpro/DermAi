'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MigrationService } from '@/services/migration/migrationService'
import Link from 'next/link'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [migrationStatus, setMigrationStatus] = useState('')
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    setMigrationStatus('')
    
    try {
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/dashboard' 
      })
      
      if (result?.ok) {
        setMigrationStatus('Connexion réussie ! Migration des données en cours...')
        
        // Récupérer la session pour obtenir l'ID utilisateur
        const session = await getSession()
        
        if (session?.user?.id) {
          // Migrer les analyses locales
          const migrationResult = await MigrationService.migrateLocalAnalyses(
            session.user.id
          )
          
          if (migrationResult.success && migrationResult.migratedCount > 0) {
            setMigrationStatus(`✅ ${migrationResult.migratedCount} analyses migrées avec succès !`)
            
            // Attendre 2 secondes pour que l'utilisateur voie le message
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
          } else {
            // Pas d'analyses à migrer ou migration échouée
            router.push('/dashboard')
          }
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(result?.error || 'Erreur de connexion')
      }
    } catch (err) {
      setError('Erreur de connexion')
      console.error('Erreur handleGoogleSignIn:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      })
      
      if (result?.ok) {
        router.push('/dashboard')
      } else {
        setError('Email ou mot de passe incorrect')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connectez-vous à DermAI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accédez à votre historique d'analyses et profitez de toutes les fonctionnalités
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Messages d'erreur et de statut */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {migrationStatus && (
            <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-md text-sm">
              {migrationStatus}
            </div>
          )}

          {/* Connexion Google */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </div>
              )}
            </button>
          </div>

          {/* Séparateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">ou</span>
            </div>
          </div>

          {/* Connexion Email/Password */}
          <form className="space-y-4" onSubmit={handleEmailSignIn}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm disabled:opacity-50"
                placeholder="votre@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm disabled:opacity-50"
                placeholder="Votre mot de passe"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Se connecter avec email
            </button>
          </form>

          {/* Liens */}
          <div className="text-center space-y-2">
            <div>
              <Link
                href="/auth/signup"
                className="text-purple-600 hover:text-purple-500 text-sm font-medium"
              >
                Pas encore de compte ? S'inscrire
              </Link>
            </div>
            
            <div>
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Continuer en mode invité
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            En vous connectant, vous acceptez nos{' '}
            <Link href="/terms" className="text-purple-600 hover:text-purple-500">
              conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="/privacy" className="text-purple-600 hover:text-purple-500">
              politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}