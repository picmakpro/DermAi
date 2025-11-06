'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import { formatDistanceToNow } from '@/lib/utils'
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'

interface Analysis {
  id: string
  created_at: string
  photos_metadata?: Array<{ url: string }>
  analysis_data: {
    globalScore: number
    scores: Record<string, number>
  }
}

export function LastAnalysis() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchLastAnalysis()
  }, [])
  
  const fetchLastAnalysis = async () => {
    try {
      console.log('🔄 [LastAnalysis] Début fetchLastAnalysis...')
      
      // 🔄 ÉTAPE 1: Utilisation de la vraie API
      const response = await fetch('/api/analyses/latest')
      console.log('📡 [LastAnalysis] Réponse API status:', response.status)
      
      // Si non autorisé (401), l'utilisateur n'est pas connecté
      if (response.status === 401) {
        console.log('ℹ️ [LastAnalysis] Utilisateur non connecté (401), pas d\'analyse à afficher')
        setAnalysis(null)
        return
      }
      
      if (!response.ok) {
        console.error('❌ [LastAnalysis] Erreur API response:', response.status, response.statusText)
        throw new Error(`Erreur API: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 [LastAnalysis] Réponse API complète:', JSON.stringify(data, null, 2))
      
      if (data.success && data.data) {
        console.log('✅ [LastAnalysis] Analyse trouvée depuis API', {
          analysisId: data.data.id,
          createdAt: data.data.created_at,
          hasScores: !!data.data.analysis_data?.scores,
          analysisDataKeys: Object.keys(data.data.analysis_data || {}),
          scoresKeys: Object.keys(data.data.analysis_data?.scores || {})
        })
        setAnalysis(data.data)
      } else {
        // Aucune analyse trouvée
        console.log('ℹ️ [LastAnalysis] Aucune analyse trouvée pour cet utilisateur')
        console.log('📊 [LastAnalysis] Détails réponse:', { success: data.success, hasData: !!data.data })
        setAnalysis(null)
      }
    } catch (error) {
      console.error('❌ Erreur chargement dernière analyse:', error)
      // Fallback vers données mock en cas d'erreur
      const mockAnalysis = {
        id: 'mock-1',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        photos_metadata: [
          { url: '/api/placeholder/300/300' }
        ],
        analysis_data: {
          globalScore: 78,
          scores: {
            hydration: 85,
            texture: 72,
            radiance: 80,
            wrinkles: 65,
            elasticity: 75,
            sebum: 70,
            sensitivity: 88,
            darkSpots: 60
          }
        }
      }
      
      setAnalysis(mockAnalysis)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <DashboardCard>
        <div className="flex gap-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-lg bg-gray-200 animate-pulse" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="space-y-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>
    )
  }
  
  if (!analysis) {
    return (
      <DashboardCard>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Aucune analyse encore réalisée
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Commencer votre première analyse
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </DashboardCard>
    )
  }
  
  // 🛡️ PROTECTION: Vérifier que la structure des données est valide
  const analysisData = analysis.analysis_data
  
  // Nouveau format V2 : routine avec phases
  const hasRoutine = analysisData?.routine?.phases
  // Ancien format : scores directs
  const hasScores = analysisData?.scores && Object.keys(analysisData.scores).length > 0
  
  console.log('🔍 [LastAnalysis] Structure analyse:', {
    hasRoutine: !!hasRoutine,
    hasScores: !!hasScores,
    analysisDataKeys: Object.keys(analysisData || {}),
    routineKeys: hasRoutine ? Object.keys(analysisData.routine) : [],
    phasesKeys: hasRoutine ? Object.keys(analysisData.routine.phases || {}) : []
  })
  
  // Si pas de données valides, afficher un message d'erreur gracieux
  if (!analysisData || (!hasRoutine && !hasScores)) {
    return (
      <DashboardCard>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Analyse incomplète ou corrompue
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Refaire une analyse
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </DashboardCard>
    )
  }
  
  // Adapter selon le format des données
  let topScores: [string, any][] = []
  let globalScore: string | number = 'N/A'
  
  if (hasScores) {
    // Ancien format avec scores
    topScores = Object.entries(analysisData.scores)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
    globalScore = analysisData.globalScore || 'N/A'
  } else if (hasRoutine) {
    // Nouveau format V2 avec routine - créer des "scores" factices pour l'affichage
    const phases = analysisData.routine.phases
    const immediateSteps = phases.immediate?.steps?.length || 0
    const adaptationSteps = phases.adaptation?.steps?.length || 0
    const maintenanceSteps = phases.maintenance?.steps?.length || 0
    
    topScores = [
      ['Phase Immédiate', `${immediateSteps} étapes`],
      ['Phase Adaptation', `${adaptationSteps} étapes`],
      ['Phase Maintenance', `${maintenanceSteps} étapes`]
    ]
    globalScore = 'Routine V2'
  }
  
  const scoreLabels: Record<string, string> = {
    hydration: 'Hydratation',
    texture: 'Texture',
    radiance: 'Éclat',
    wrinkles: 'Rides',
    elasticity: 'Élasticité',
    sebum: 'Sébum',
    sensitivity: 'Sensibilité',
    darkSpots: 'Taches'
  }
  
  return (
    <DashboardCard
      title="Dernière Analyse"
      action={
        <Link 
          href={`/dashboard/analyses/${analysis.id}`}
          className="text-sm text-violet-600 hover:text-violet-700"
        >
          Voir détails →
        </Link>
      }
    >
      <div className="flex gap-6">
        {/* Photo principale */}
        <div className="flex-shrink-0">
          {analysis.photos_metadata?.[0] ? (
            <img
              src={analysis.photos_metadata[0].url}
              alt="Dernière analyse"
              className="w-32 h-32 rounded-lg object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Pas d'image</span>
            </div>
          )}
        </div>
        
        {/* Infos analyse */}
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              {formatDistanceToNow(analysis.created_at)}
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {hasScores ? `Score global : ${globalScore}/100` : `Type : ${globalScore}`}
            </p>
          </div>
          
          {/* Top scores ou phases */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {hasScores ? 'Points forts' : 'Phases de routine'}
            </p>
            <div className="space-y-1">
              {topScores.map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">
                    {hasScores ? `${scoreLabels[key] || key}: ${value}/100` : `${key}: ${value}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/dashboard/analyses/compare"
              className="text-sm text-violet-600 hover:text-violet-700"
            >
              Comparer
            </Link>
            <Link
              href="/upload"
              className="text-sm text-violet-600 hover:text-violet-700"
            >
              Nouvelle analyse
            </Link>
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}

