'use client'

import { useState, useEffect } from 'react'
import { Monitor, Palette, Layout, Save, Loader2 } from 'lucide-react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import { toast } from 'sonner'

interface DashboardPreferences {
  widgets_order: string[]
  default_comparison_period: '7_days' | '30_days' | '90_days' | '6_months'
  routine_view: 'calendar' | 'list'
  theme: 'light' | 'dark' | 'auto'
  compact_mode: boolean
  show_tips: boolean
}

export function DashboardSettings() {
  const [preferences, setPreferences] = useState<DashboardPreferences>({
    widgets_order: ['last_analysis', 'routine_today', 'progress_chart', 'badges'],
    default_comparison_period: '30_days',
    routine_view: 'calendar',
    theme: 'light',
    compact_mode: false,
    show_tips: true
  })
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/settings/dashboard')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Erreur chargement préférences dashboard:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/settings/dashboard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })
      
      if (response.ok) {
        toast.success('Préférences du dashboard mises à jour')
        // Optionnel : recharger la page pour appliquer les changements
        // window.location.reload()
      } else {
        throw new Error('Erreur sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde dashboard:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: keyof DashboardPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const widgetOptions = [
    { id: 'last_analysis', name: 'Dernière Analyse', description: 'Résumé de votre analyse la plus récente' },
    { id: 'routine_today', name: 'Routine du Jour', description: 'Suivi de votre routine quotidienne' },
    { id: 'progress_chart', name: 'Graphique de Progression', description: 'Évolution de vos scores dans le temps' },
    { id: 'badges', name: 'Badges Récents', description: 'Vos derniers accomplissements' },
    { id: 'overview_stats', name: 'Statistiques Générales', description: 'Métriques globales de votre compte' }
  ]

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <DashboardCard title="Préférences Dashboard">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </DashboardCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardCard title="Apparence">
        <div className="space-y-6">
          {/* Thème */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Palette className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Thème</p>
                <p className="text-sm text-gray-600">Choisissez l'apparence de votre dashboard</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: 'Clair', icon: '☀️' },
                { value: 'dark', label: 'Sombre', icon: '🌙' },
                { value: 'auto', label: 'Automatique', icon: '🔄' }
              ].map(theme => (
                <label key={theme.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={theme.value}
                    checked={preferences.theme === theme.value}
                    onChange={(e) => handleChange('theme', e.target.value as any)}
                    className="sr-only peer"
                  />
                  <div className="p-4 border-2 border-gray-200 rounded-lg text-center peer-checked:border-violet-500 peer-checked:bg-violet-50 hover:border-gray-300 transition-colors">
                    <div className="text-2xl mb-2">{theme.icon}</div>
                    <div className="text-sm font-medium">{theme.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Mode compact */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Monitor className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Mode compact</p>
                <p className="text-sm text-gray-600">
                  Réduire l'espacement pour afficher plus d'informations
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.compact_mode}
                onChange={(e) => handleChange('compact_mode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Organisation">
        <div className="space-y-6">
          {/* Vue routine */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Layout className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Vue de la routine</p>
                <p className="text-sm text-gray-600">Format d'affichage préféré pour votre routine</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'calendar', label: 'Calendrier', description: 'Vue mensuelle avec indicateurs visuels' },
                { value: 'list', label: 'Liste', description: 'Liste chronologique détaillée' }
              ].map(view => (
                <label key={view.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="routine_view"
                    value={view.value}
                    checked={preferences.routine_view === view.value}
                    onChange={(e) => handleChange('routine_view', e.target.value as any)}
                    className="sr-only peer"
                  />
                  <div className="p-4 border-2 border-gray-200 rounded-lg peer-checked:border-violet-500 peer-checked:bg-violet-50 hover:border-gray-300 transition-colors">
                    <div className="font-medium text-gray-900 mb-1">{view.label}</div>
                    <div className="text-sm text-gray-600">{view.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Période de comparaison par défaut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période de comparaison par défaut
            </label>
            <select
              value={preferences.default_comparison_period}
              onChange={(e) => handleChange('default_comparison_period', e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="7_days">7 derniers jours</option>
              <option value="30_days">30 derniers jours</option>
              <option value="90_days">3 derniers mois</option>
              <option value="6_months">6 derniers mois</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Assistance">
        <div className="space-y-4">
          {/* Afficher les conseils */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Conseils et astuces</p>
              <p className="text-sm text-gray-600">
                Afficher des conseils d'utilisation dans l'interface
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.show_tips}
                onChange={(e) => handleChange('show_tips', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
        </div>
      </DashboardCard>
      
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? 'Enregistrement...' : 'Enregistrer les préférences'}
        </button>
      </div>
    </div>
  )
}










