'use client'

import { useState } from 'react'
import { useAnalysis } from '@/hooks/useAnalysis'
import type { AnalyzeRequest, PhotoUpload } from '@/types'

export default function TestAIPage() {
  const { isAnalyzing, analysis, error, progress, analyze, reset } = useAnalysis()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files.slice(0, 5)) // Max 5 photos
  }

  const runTest = async () => {
    if (selectedFiles.length === 0) {
      alert('Sélectionnez au moins une photo')
      return
    }

    // Créer les objets PhotoUpload
    const photos: PhotoUpload[] = selectedFiles.map((file, index) => ({
      id: `test-${index}`,
      file,
      preview: URL.createObjectURL(file),
      type: 'face-frontal',
      quality: 'good'
    }))

    // Données de test
    const testRequest: AnalyzeRequest = {
      photos,
      userProfile: {
        age: 28,
        gender: 'Homme',
        skinType: 'Mixte'
      },
      skinConcerns: {
        primary: ['Poils incarnés', 'Boutons'],
        severity: 6,
        duration: '3-6 mois'
      },
      currentRoutine: {
        morningProducts: ['Nettoyant doux'],
        eveningProducts: ['Hydratant'],
        cleansingFrequency: 'Quotidien',
        monthlyBudget: '50-100€'
      }
    }

    await analyze(testRequest)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          🧪 Test GPT-4o Vision Analysis
        </h1>

        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Sélectionner des photos</h2>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFiles.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {selectedFiles.length} photo(s) sélectionnée(s)
            </p>
          )}
        </div>

        <div className="text-center mb-8">
          <button
            onClick={runTest}
            disabled={isAnalyzing || selectedFiles.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 text-lg"
          >
            {isAnalyzing ? `Analyse en cours... ${Math.round(progress)}%` : 'Lancer l\'analyse IA'}
          </button>
        </div>

        {isAnalyzing && (
          <div className="card mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center mt-2 text-sm text-gray-600">
              GPT-4o Vision analyse vos photos...
            </p>
          </div>
        )}

        {error && (
          <div className="card mb-8 border-red-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-700 mb-2">❌ Erreur</h3>
            <p className="text-red-600">{error}</p>
            <button onClick={reset} className="mt-4 btn-secondary">
              Réessayer
            </button>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">🎯 Diagnostic Principal</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-lg">{analysis.diagnostic.primaryCondition}</p>
                  <p className="text-gray-600">Sévérité: {analysis.diagnostic.severity}</p>
                </div>
                <div>
                  <p className="font-semibold">Score global: {analysis.scores.overall}/100</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${analysis.scores.overall}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-4">📊 Scores Détaillés</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(analysis.scores).map(([key, score]) => {
                  if (key === 'overall') return null
                  return (
                    <div key={key} className="text-center">
                      <p className="font-semibold capitalize">{key}</p>
                      <p className="text-2xl font-bold text-blue-600">{score.value}/100</p>
                      <p className="text-sm text-gray-500">Confiance: {Math.round(score.confidence * 100)}%</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-4">🔍 Observations</h3>
              <ul className="space-y-2">
                {analysis.diagnostic.observations.map((obs, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center">
              <button onClick={reset} className="btn-secondary">
                Nouveau test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
