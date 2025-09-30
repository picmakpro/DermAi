'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Camera, Save, Loader2 } from 'lucide-react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import { toast } from 'sonner'

interface ProfileFormData {
  name: string
  email: string
  skin_type: string
  birth_year: string
  concerns: string[]
}

export function ProfileSettings() {
  const { data: session, update } = useSession()
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    skin_type: '',
    birth_year: '',
    concerns: []
  })
  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        skin_type: (session.user as any).skin_type || '',
        birth_year: (session.user as any).birth_year || '',
        concerns: (session.user as any).concerns || []
      })
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        await update(updatedUser)
        toast.success('Profil mis à jour avec succès')
      } else {
        throw new Error('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error)
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB')
      return
    }

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide')
      return
    }

    setAvatarUploading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/settings/avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const { avatar_url } = await response.json()
        await update({ image: avatar_url })
        toast.success('Photo de profil mise à jour')
      } else {
        throw new Error('Erreur upload')
      }
    } catch (error) {
      console.error('Erreur upload avatar:', error)
      toast.error('Erreur lors de l\'upload de la photo')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleConcernToggle = (concern: string) => {
    setFormData(prev => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter(c => c !== concern)
        : [...prev.concerns, concern]
    }))
  }

  const skinTypes = [
    { value: '', label: 'Sélectionner' },
    { value: 'dry', label: 'Sèche' },
    { value: 'oily', label: 'Grasse' },
    { value: 'combination', label: 'Mixte' },
    { value: 'sensitive', label: 'Sensible' },
    { value: 'normal', label: 'Normale' }
  ]

  const concernOptions = [
    'Acné', 'Rides', 'Déshydratation', 
    'Taches', 'Sensibilité', 'Pores dilatés',
    'Rougeurs', 'Texture irrégulière'
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DashboardCard title="Informations Personnelles">
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 p-2 bg-violet-600 rounded-full cursor-pointer hover:bg-violet-700 transition-colors">
              {avatarUploading ? (
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              ) : (
                <Camera className="h-4 w-4 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={avatarUploading}
              />
            </label>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">Photo de profil</h3>
            <p className="text-sm text-gray-600">
              JPG, PNG ou GIF. Max 5MB.
            </p>
          </div>
        </div>
        
        {/* Champs formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="Votre nom complet"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              L'email ne peut pas être modifié
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de peau
            </label>
            <select
              value={formData.skin_type}
              onChange={(e) => setFormData(prev => ({ ...prev, skin_type: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              {skinTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de naissance
            </label>
            <input
              type="number"
              value={formData.birth_year}
              onChange={(e) => setFormData(prev => ({ ...prev, birth_year: e.target.value }))}
              min="1920"
              max={new Date().getFullYear()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="1990"
            />
          </div>
        </div>
        
        {/* Préoccupations */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Préoccupations principales
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {concernOptions.map(concern => (
              <label key={concern} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.concerns.includes(concern)}
                  onChange={() => handleConcernToggle(concern)}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700">{concern}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Bouton sauvegarder */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </DashboardCard>
    </form>
  )
}





