'use client'

import { useState, useEffect } from 'react'
import { checkBrowserCompatibility, detectBrowser, isMobileDevice } from '@/utils/browserCompatibility'
import { AlertTriangle, CheckCircle2, Info, Smartphone, Monitor } from 'lucide-react'

export default function DebugPage() {
  const [compatibility, setCompatibility] = useState<any>(null)
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [storageTest, setStorageTest] = useState<any>(null)

  useEffect(() => {
    // Test de compatibilité
    const compat = checkBrowserCompatibility()
    setCompatibility(compat)

    // Informations système
    const info = {
      browser: detectBrowser(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      isMobile: isMobileDevice(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      touchPoints: navigator.maxTouchPoints || 0
    }
    setSystemInfo(info)

    // Test de stockage
    const testStorage = async () => {
      const results: any = {}
      
      // SessionStorage
      try {
        sessionStorage.setItem('test', 'test')
        sessionStorage.removeItem('test')
        results.sessionStorage = '✅ Fonctionnel'
      } catch (e) {
        results.sessionStorage = `❌ Erreur: ${e}`
      }

      // LocalStorage
      try {
        localStorage.setItem('test', 'test')
        localStorage.removeItem('test')
        results.localStorage = '✅ Fonctionnel'
      } catch (e) {
        results.localStorage = `❌ Erreur: ${e}`
      }

      // IndexedDB
      try {
        const request = indexedDB.open('test', 1)
        request.onsuccess = () => {
          results.indexedDB = '✅ Fonctionnel'
          setStorageTest({...results})
          request.result.close()
        }
        request.onerror = () => {
          results.indexedDB = '❌ Erreur ouverture'
          setStorageTest({...results})
        }
      } catch (e) {
        results.indexedDB = `❌ Exception: ${e}`
        setStorageTest({...results})
      }

      // Canvas
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillText('test', 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5)
          results.canvas = dataUrl.length > 100 ? '✅ Fonctionnel' : '⚠️ Limité'
        } else {
          results.canvas = '❌ Contexte 2D indisponible'
        }
      } catch (e) {
        results.canvas = `❌ Erreur: ${e}`
      }

      setStorageTest({...results})
    }

    testStorage()
  }, [])

  return (
    <div className="min-h-screen bg-dermai-pure p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-dermai-neutral-900 mb-2">
            🔧 Diagnostic DermAI
          </h1>
          <p className="text-dermai-neutral-600">
            Informations de debug pour résoudre les problèmes client-side
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Compatibilité navigateur */}
          <div className="bg-white rounded-xl border border-dermai-nude-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold text-lg">Compatibilité Navigateur</h2>
            </div>
            
            {compatibility && (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  compatibility.isSupported ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {compatibility.isSupported ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {compatibility.isSupported ? 'Navigateur compatible' : 'Problèmes détectés'}
                  </span>
                </div>

                {compatibility.missingFeatures.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="font-medium text-red-800 mb-2">Fonctionnalités manquantes :</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {compatibility.missingFeatures.map((feature: string, i: number) => (
                        <li key={i}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {compatibility.warnings.length > 0 && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="font-medium text-yellow-800 mb-2">Avertissements :</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {compatibility.warnings.map((warning: string, i: number) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Informations système */}
          <div className="bg-white rounded-xl border border-dermai-nude-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              {systemInfo?.isMobile ? (
                <Smartphone className="w-5 h-5 text-blue-500" />
              ) : (
                <Monitor className="w-5 h-5 text-blue-500" />
              )}
              <h2 className="font-bold text-lg">Informations Système</h2>
            </div>
            
            {systemInfo && (
              <div className="space-y-2 text-sm">
                <div><strong>Navigateur:</strong> {systemInfo.browser}</div>
                <div><strong>Plateforme:</strong> {systemInfo.platform}</div>
                <div><strong>Langue:</strong> {systemInfo.language}</div>
                <div><strong>Type:</strong> {systemInfo.isMobile ? 'Mobile' : 'Desktop'}</div>
                <div><strong>Écran:</strong> {systemInfo.screenWidth}×{systemInfo.screenHeight}</div>
                <div><strong>Fenêtre:</strong> {systemInfo.windowWidth}×{systemInfo.windowHeight}</div>
                <div><strong>Pixel Ratio:</strong> {systemInfo.devicePixelRatio}</div>
                <div><strong>Points tactiles:</strong> {systemInfo.touchPoints}</div>
                <div><strong>En ligne:</strong> {systemInfo.onLine ? '✅' : '❌'}</div>
                <div><strong>Cookies:</strong> {systemInfo.cookieEnabled ? '✅' : '❌'}</div>
              </div>
            )}
          </div>

          {/* Test de stockage */}
          <div className="md:col-span-2 bg-white rounded-xl border border-dermai-nude-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-purple-500" />
              <h2 className="font-bold text-lg">Tests de Stockage</h2>
            </div>
            
            {storageTest && (
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-800 mb-1">SessionStorage</div>
                  <div className="text-sm">{storageTest.sessionStorage}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-800 mb-1">LocalStorage</div>
                  <div className="text-sm">{storageTest.localStorage}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-800 mb-1">IndexedDB</div>
                  <div className="text-sm">{storageTest.indexedDB}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-800 mb-1">Canvas</div>
                  <div className="text-sm">{storageTest.canvas}</div>
                </div>
              </div>
            )}
          </div>

          {/* User Agent détaillé */}
          {systemInfo && (
            <div className="md:col-span-2 bg-white rounded-xl border border-dermai-nude-200 p-6 shadow-sm">
              <h2 className="font-bold text-lg mb-4">User Agent</h2>
              <code className="text-xs bg-gray-100 p-3 rounded-lg block break-all">
                {systemInfo.userAgent}
              </code>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 text-center space-y-4">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-dermai-ai-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-dermai-ai-600 transition-colors"
          >
            Retour à l'accueil
          </button>
          
          <p className="text-sm text-dermai-neutral-500">
            Partagez ces informations avec le support technique si vous rencontrez des problèmes.
          </p>
        </div>
      </div>
    </div>
  )
}
