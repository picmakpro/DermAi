'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugAuthPage() {
  const { data: session, status } = useSession()
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addTestResult = (test: string, result: any, success: boolean) => {
    setTestResults(prev => [...prev, {
      test,
      result: typeof result === 'object' ? JSON.stringify(result, null, 2) : result,
      success,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count')
      addTestResult('Connexion Supabase', { data, error }, !error)
    } catch (error) {
      addTestResult('Connexion Supabase', error, false)
    }
  }

  const testSupabaseAuth = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      addTestResult('Auth Supabase User', user, !!user.user)
    } catch (error) {
      addTestResult('Auth Supabase User', error, false)
    }
  }

  const testProfileAccess = async () => {
    if (!session?.user?.id) {
      addTestResult('Profile Access', 'Pas de session utilisateur', false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      addTestResult('Profile Access', { data, error }, !error && !!data)
    } catch (error) {
      addTestResult('Profile Access', error, false)
    }
  }

  const testEmailSignup = async () => {
    setIsLoading(true)
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          fullName: 'Test User'
        })
      })
      
      const data = await response.json()
      addTestResult('Email Signup API', { status: response.status, data }, response.ok)
      
      if (response.ok) {
        // Tester la connexion immédiatement après
        const signInResult = await signIn('credentials', {
          email: testEmail,
          password: testPassword,
          redirect: false
        })
        
        addTestResult('Email SignIn après Signup', signInResult, !!signInResult?.ok)
      }
    } catch (error) {
      addTestResult('Email Signup API', error, false)
    } finally {
      setIsLoading(false)
    }
  }

  const runAllTests = async () => {
    setTestResults([])
    await testSupabaseConnection()
    await testSupabaseAuth()
    if (session?.user?.id) {
      await testProfileAccess()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Debug Authentification DermAI
          </h1>

          {/* État de la session */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">État de la Session</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-sm ${
                status === 'authenticated' ? 'bg-green-100 text-green-800' :
                status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>{status}</span></p>
              
              {session?.user && (
                <>
                  <p><strong>User ID:</strong> {session.user.id}</p>
                  <p><strong>Email:</strong> {session.user.email}</p>
                  <p><strong>Name:</strong> {session.user.name}</p>
                  <p><strong>Image:</strong> {session.user.image}</p>
                </>
              )}
            </div>
          </div>

          {/* Actions d'authentification */}
          <div className="mb-8 space-y-4">
            <h2 className="text-lg font-semibold">Actions d'Authentification</h2>
            
            <div className="flex flex-wrap gap-3">
              {!session ? (
                <>
                  <button
                    onClick={() => signIn('google')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Se connecter avec Google
                  </button>
                  
                  <button
                    onClick={() => signIn('credentials', { 
                      email: 'test@example.com', 
                      password: 'password123' 
                    })}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Test Connexion Email
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Se déconnecter
                </button>
              )}
            </div>
          </div>

          {/* Tests */}
          <div className="mb-8 space-y-4">
            <h2 className="text-lg font-semibold">Tests Techniques</h2>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={runAllTests}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Lancer tous les tests
              </button>
              
              <button
                onClick={testSupabaseConnection}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Test Connexion Supabase
              </button>
              
              <button
                onClick={testSupabaseAuth}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Test Auth Supabase
              </button>
              
              <button
                onClick={testProfileAccess}
                disabled={!session?.user?.id}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Test Accès Profile
              </button>
              
              <button
                onClick={testEmailSignup}
                disabled={isLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {isLoading ? 'Test en cours...' : 'Test Inscription Email'}
              </button>
            </div>
          </div>

          {/* Résultats des tests */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Résultats des Tests</h2>
              
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">
                        {result.success ? '✅' : '❌'} {result.test}
                      </h3>
                      <span className="text-sm text-gray-500">{result.timestamp}</span>
                    </div>
                    
                    <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
                      {result.result}
                    </pre>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setTestResults([])}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Effacer les résultats
              </button>
            </div>
          )}

          {/* Variables d'environnement */}
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Configuration Environnement</h2>
            <div className="space-y-2 text-sm">
              <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || 'Non défini'}</p>
              <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Défini' : '❌ Non défini'}</p>
              <p><strong>Google Client ID:</strong> {process.env.GOOGLE_CLIENT_ID ? '✅ Défini' : '❌ Non défini'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
