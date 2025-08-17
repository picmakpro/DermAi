import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900">
              Derm<span className="text-blue-600">AI</span> V2
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Diagnostic dermatologique révolutionnaire powered by <strong>GPT-4o Vision</strong>
            </p>
          </div>

          {/* CTA Principal */}
          <div className="space-y-4">
            <Link
              href="/upload"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🚀 Commencer l'analyse
            </Link>
            <p className="text-sm text-gray-500">
              Analyse gratuite • Résultats en 30 secondes • IA experte
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analyse instantanée</h3>
              <p className="text-gray-600 text-sm">
                Diagnostic précis en 30 secondes grâce à l'IA GPT-4o Vision
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Précision experte</h3>
              <p className="text-gray-600 text-sm">
                Diagnostic spécifique vs générique • Ex: "Pseudofolliculite de la barbe"
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Recommandations sur-mesure</h3>
              <p className="text-gray-600 text-sm">
                Produits et routine personnalisés selon votre diagnostic
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mt-12 p-4 bg-white rounded-lg shadow-sm border inline-block">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>✅ Next.js 15</span>
              <span>✅ GPT-4o Vision</span>
              <span>✅ TypeScript</span>
              <span>✅ IA fonctionnelle</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <Link href="/test-ai" className="text-blue-600 hover:underline">
                🧪 Accès développeur - Test IA direct
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
