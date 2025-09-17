'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useHybridStorage } from '@/hooks/useHybridStorage'
import { useAnalysis } from '@/hooks/useAnalysis'
import AnalysisLimitBanner from '@/components/shared/AnalysisLimitBanner'
import Link from 'next/link'

export default function TestIntegrationPage() {
  const { user, isAuthenticated, signIn, signOut } = useAuth()
  const { 
    isCloudStorage, 
    getStorageStats, 
    migrateToCloud, 
    clearLocalStorage 
  } = useHybridStorage()
  const { 
    canAnalyze, 
    remainingAnalyses, 
    requiresAuth, 
    analyze, 
    isAnalyzing, 
    analysis, 
    error 
  } = useAnalysis()

  const [stats, setStats] = useState<any>(null)
  const [migrationResult, setMigrationResult] = useState<any>(null)

  const handleGetStats = async () => {
    const storageStats = await getStorageStats()
    setStats(storageStats)
  }

  const handleMigration = async () => {
    const result = await migrateToCloud()
    setMigrationResult(result)
  }

  const handleTestAnalysis = async () => {
    const mockRequest = {
      photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A'], // Image 1x1 pixel en base64
      questionnaire: {
        age: 25,
        gender: 'female',
        skinType: 'mixed',
        concerns: ['acne'],
        currentRoutine: [],
        allergies: [],
        budget: 'medium'
      }
    }

    try {
      await analyze(mockRequest)
    } catch (err) {
      console.error('Erreur test analyse:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Test d'Intégration - Jour 5
          </h1>

          {/* État d'authentification */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              État d'Authentification
            </h2>
            {isAuthenticated ? (
              <div className="space-y-2">
                <p className="text-blue-700">✅ Connecté en tant que: {user?.email}</p>
                <p className="text-blue-700">📊 Analyses effectuées: {user?.analyses_count || 0}</p>
                <p className="text-blue-700">☁️ Stockage: {isCloudStorage ? 'Cloud' : 'Local'}</p>
                <button
                  onClick={() => signOut()}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Se déconnecter
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-blue-700">❌ Non connecté (mode invité)</p>
                <p className="text-blue-700">💾 Stockage: Local uniquement</p>
                <button
                  onClick={() => signIn()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Se connecter avec Google
                </button>
              </div>
            )}
          </div>

          {/* Limites d'analyses */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Limites d'Analyses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-100 p-3 rounded">
                <div className="text-sm text-gray-600">Peut analyser</div>
                <div className="text-lg font-semibold">
                  {canAnalyze ? '✅ Oui' : '❌ Non'}
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <div className="text-sm text-gray-600">Analyses restantes</div>
                <div className="text-lg font-semibold">
                  {remainingAnalyses === Infinity ? '∞' : remainingAnalyses}
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <div className="text-sm text-gray-600">Inscription requise</div>
                <div className="text-lg font-semibold">
                  {requiresAuth ? '⚠️ Oui' : '✅ Non'}
                </div>
              </div>
            </div>

            <AnalysisLimitBanner
              remainingAnalyses={remainingAnalyses}
              canAnalyze={canAnalyze}
              requiresAuth={requiresAuth}
              className="mb-4"
            />
          </div>

          {/* Test d'analyse */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 mb-3">
              Test d'Analyse
            </h2>
            <button
              onClick={handleTestAnalysis}
              disabled={isAnalyzing || !canAnalyze}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analyse en cours...' : 'Lancer une analyse test'}
            </button>

            {error && (
              <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-red-700">
                Erreur: {error}
              </div>
            )}

            {analysis && (
              <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded text-green-700">
                ✅ Analyse terminée ! ID: {analysis.id}
              </div>
            )}
          </div>

          {/* Statistiques de stockage */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h2 className="text-lg font-semibold text-purple-900 mb-3">
              Statistiques de Stockage
            </h2>
            <button
              onClick={handleGetStats}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mb-3"
            >
              Récupérer les statistiques
            </button>

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">Analyses locales</div>
                  <div className="text-lg font-semibold">{stats.localCount}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">Analyses cloud</div>
                  <div className="text-lg font-semibold">{stats.cloudCount}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">Taille totale</div>
                  <div className="text-lg font-semibold">{Math.round(stats.totalSize / 1024)} KB</div>
                </div>
              </div>
            )}
          </div>

          {/* Migration */}
          {isAuthenticated && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-900 mb-3">
                Migration Cloud
              </h2>
              <div className="space-x-3">
                <button
                  onClick={handleMigration}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Migrer vers le cloud
                </button>
                <button
                  onClick={() => clearLocalStorage()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Nettoyer stockage local
                </button>
              </div>

              {migrationResult && (
                <div className="mt-3 p-3 bg-white border rounded">
                  <div className="text-sm">
                    <div>Succès: {migrationResult.success ? '✅' : '❌'}</div>
                    <div>Analyses migrées: {migrationResult.migratedCount}</div>
                    <div>Erreurs: {migrationResult.errors.length}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Liens de navigation */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Navigation
            </h2>
            <div className="space-x-4">
              <Link
                href="/auth/signin"
                className="text-blue-600 hover:text-blue-500"
              >
                Page de connexion
              </Link>
              <Link
                href="/auth/signup"
                className="text-blue-600 hover:text-blue-500"
              >
                Page d'inscription
              </Link>
              <Link
                href="/test-cloud-migration"
                className="text-blue-600 hover:text-blue-500"
              >
                Test cloud migration
              </Link>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-500"
              >
                Accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
