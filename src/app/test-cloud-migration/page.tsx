'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface TestResult {
  success: boolean
  data?: any
  error?: string
}

export default function TestCloudMigrationPage() {
  const { user, isAuthenticated, signIn } = useAuth()
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})

  const runTest = async (testName: string, url: string, options?: RequestInit) => {
    setIsLoading(prev => ({ ...prev, [testName]: true }))
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })
      
      const data = await response.json()
      
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: response.ok,
          data: response.ok ? data : undefined,
          error: response.ok ? undefined : data.error || 'Erreur inconnue'
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur réseau'
        }
      }))
    } finally {
      setIsLoading(prev => ({ ...prev, [testName]: false }))
    }
  }

  const TestButton = ({ 
    testName, 
    label, 
    onClick, 
    variant = 'primary' 
  }: { 
    testName: string
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
  }) => {
    const loading = isLoading[testName]
    const result = results[testName]
    
    const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-600 text-white hover:bg-gray-700",
      danger: "bg-red-600 text-white hover:bg-red-700"
    }
    
    return (
      <div className="space-y-2">
        <button
          onClick={onClick}
          disabled={loading}
          className={`${baseClasses} ${variantClasses[variant]}`}
        >
          {loading ? 'Test en cours...' : label}
        </button>
        
        {result && (
          <div className={`p-3 rounded text-sm ${
            result.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {result.success ? (
              <div>
                <div className="font-medium">✅ Succès</div>
                {result.data && (
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <div>
                <div className="font-medium">❌ Erreur</div>
                <div>{result.error}</div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Test Cloud & Migration
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Vous devez être connecté pour tester les fonctionnalités cloud
            </p>
          </div>
          
          <button
            onClick={() => signIn()}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Se connecter avec Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Test Cloud Storage & Migration
          </h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">Utilisateur connecté</h3>
            <p className="text-blue-700">ID: {user?.id}</p>
            <p className="text-blue-700">Email: {user?.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tests Cloud Storage */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Tests Cloud Storage
              </h2>
              
              <TestButton
                testName="cloud-get"
                label="Récupérer analyses cloud"
                onClick={() => runTest('cloud-get', '/api/test-cloud-storage')}
              />
              
              <TestButton
                testName="cloud-save"
                label="Sauvegarder analyse test"
                onClick={() => runTest('cloud-save', '/api/test-cloud-storage', {
                  method: 'POST',
                  body: JSON.stringify({})
                })}
              />
            </div>

            {/* Tests Migration */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Tests Migration
              </h2>
              
              <TestButton
                testName="migration-status"
                label="Vérifier statut migration"
                onClick={() => runTest('migration-status', '/api/test-migration')}
              />
              
              <TestButton
                testName="create-local"
                label="Créer analyse locale test"
                onClick={() => runTest('create-local', '/api/test-migration', {
                  method: 'POST',
                  body: JSON.stringify({ action: 'create_local' })
                })}
                variant="secondary"
              />
              
              <TestButton
                testName="migrate"
                label="Migrer analyses locales"
                onClick={() => runTest('migrate', '/api/test-migration', {
                  method: 'POST',
                  body: JSON.stringify({ action: 'migrate' })
                })}
              />
              
              <TestButton
                testName="clear-local"
                label="Nettoyer analyses locales"
                onClick={() => runTest('clear-local', '/api/test-migration', {
                  method: 'POST',
                  body: JSON.stringify({ action: 'clear_local' })
                })}
                variant="danger"
              />
            </div>
          </div>

          {/* Scénario de test complet */}
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">
              Scénario de test complet
            </h3>
            <ol className="text-yellow-800 text-sm space-y-1">
              <li>1. Vérifier le statut initial de migration</li>
              <li>2. Créer une analyse locale de test</li>
              <li>3. Vérifier que l'analyse locale est détectée</li>
              <li>4. Effectuer la migration vers le cloud</li>
              <li>5. Vérifier que l'analyse est maintenant en cloud</li>
              <li>6. Nettoyer les analyses locales</li>
              <li>7. Sauvegarder une nouvelle analyse directement en cloud</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
