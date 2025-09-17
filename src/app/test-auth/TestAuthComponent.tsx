'use client'

import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

export default function TestAuthComponent() {
  const { 
    user, 
    session, 
    isLoading, 
    isAuthenticated, 
    error,
    signIn, 
    signOut, 
    updateProfile,
    refreshProfile,
    incrementAnalysisCount,
    getUserStats 
  } = useAuth()

  const [stats, setStats] = useState<any>(null)
  const [testName, setTestName] = useState('')

  const handleGetStats = async () => {
    const userStats = await getUserStats()
    setStats(userStats)
  }

  const handleUpdateName = async () => {
    if (!testName.trim()) return
    try {
      await updateProfile({ full_name: testName })
      setTestName('')
      alert('Nom mis à jour avec succès !')
    } catch (err) {
      alert('Erreur mise à jour nom')
    }
  }

  const handleIncrementAnalysis = async () => {
    try {
      await incrementAnalysisCount()
      alert('Compteur incrémenté !')
    } catch (err) {
      alert('Erreur incrémentation')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 Test Authentification - Jour 3
          </h1>

          {/* Erreur globale */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
              <strong>Erreur:</strong> {error}
            </div>
          )}

          {/* État authentification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-900 mb-2">État Authentification</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Authentifié:</strong> {isAuthenticated ? '✅ Oui' : '❌ Non'}</p>
                <p><strong>Chargement:</strong> {isLoading ? '⏳ Oui' : '✅ Non'}</p>
                <p><strong>Session ID:</strong> {session?.user?.id || 'Aucune'}</p>
                <p><strong>Email session:</strong> {session?.user?.email || 'Aucun'}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-900 mb-2">Profil Utilisateur</h3>
              {user ? (
                <div className="space-y-2 text-sm">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Nom:</strong> {user.full_name || 'Non défini'}</p>
                  <p><strong>Statut:</strong> {user.subscription_status}</p>
                  <p><strong>Analyses:</strong> {user.analyses_count}</p>
                  <p><strong>Dernière analyse:</strong> {user.last_analysis_at ? new Date(user.last_analysis_at).toLocaleString() : 'Jamais'}</p>
                </div>
              ) : (
                <p className="text-gray-500">Aucun profil chargé</p>
              )}
            </div>
          </div>

          {/* Actions d'authentification */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Actions Authentification</h3>
            <div className="flex flex-wrap gap-4">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => signIn('google')}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Se connecter avec Google
                  </button>
                  <button
                    onClick={() => signIn('credentials')}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Se connecter avec Email
                  </button>
                </>
              ) : (
                <button
                  onClick={signOut}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Se déconnecter
                </button>
              )}
            </div>
          </div>

          {/* Actions profil (si connecté) */}
          {isAuthenticated && (
            <>
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Actions Profil</h3>
                <div className="space-y-4">
                  {/* Mise à jour nom */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="Nouveau nom"
                      className="border border-gray-300 px-3 py-2 rounded flex-1"
                    />
                    <button
                      onClick={handleUpdateName}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Mettre à jour nom
                    </button>
                  </div>

                  {/* Autres actions */}
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={refreshProfile}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Rafraîchir profil
                    </button>
                    <button
                      onClick={handleIncrementAnalysis}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Incrémenter analyses
                    </button>
                    <button
                      onClick={handleGetStats}
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                      Obtenir statistiques
                    </button>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              {stats && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Statistiques Utilisateur</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p><strong>Analyses:</strong> {stats.analysesCount}</p>
                      <p><strong>Statut:</strong> {stats.subscriptionStatus}</p>
                      <p><strong>Membre depuis:</strong> {new Date(stats.memberSince).toLocaleDateString()}</p>
                      <p><strong>Dernière analyse:</strong> {stats.lastAnalysisAt ? new Date(stats.lastAnalysisAt).toLocaleString() : 'Jamais'}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Debug info */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Debug Info</h3>
            <div className="bg-gray-100 p-4 rounded text-xs">
              <p><strong>Session complète:</strong></p>
              <pre className="mt-2 overflow-auto">{JSON.stringify(session, null, 2)}</pre>
              {user && (
                <>
                  <p className="mt-4"><strong>Profil complet:</strong></p>
                  <pre className="mt-2 overflow-auto">{JSON.stringify(user, null, 2)}</pre>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
