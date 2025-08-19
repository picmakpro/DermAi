'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SkinQuestionnaire from '@/components/forms/SkinQuestionnaire'

export default function QuestionnairePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Vérifier que les photos sont disponibles
    const photosData = sessionStorage.getItem('dermai_photos')
    if (!photosData) {
      // Rediriger vers l'upload si pas de photos
      router.push('/upload')
      return
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Chargement...</p>
        </div>
      </div>
    )
  }

  return <SkinQuestionnaire />
}
