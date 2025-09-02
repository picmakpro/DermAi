'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SKIN_TYPES, GENDER_OPTIONS, BUDGET_RANGES } from '@/constants'
import IntroBeforeAfterScreen from './IntroBeforeAfterScreen'
import SimilarConcernsProofScreen from './SimilarConcernsProofScreen'
import SavingsProgressScreen from './SavingsProgressScreen'
import ImprovedSummary from './ImprovedSummary'

// Types simplifiés pour le questionnaire
interface UserProfile {
  age: number
  gender: string
  skinType: string
}

interface SkinConcerns {
  primary: string[]
}

interface CurrentRoutine {
  morningProducts: string[]
  eveningProducts: string[]
  monthlyBudget: string
  routinePreference?: string
}

interface QuestionnaireData {
  userProfile: UserProfile
  skinConcerns: SkinConcerns & {
    otherText: string // Nouveau champ pour "Autre"
  }
  currentRoutine: CurrentRoutine
  allergies: {
    ingredients: string[]
    pastReactions: string
  }
}

const SKIN_CONCERNS = [
  'Acné/Boutons',
  'Poils incarnés', 
  'Rides/Vieillissement',
  'Taches pigmentaires',
  'Rougeurs/Irritations',
  'Peau sèche',
  'Points noirs',
  'Cicatrices',
  'Sensibilité',
  'Je ne sais pas',
  'Autres'
]

const COMMON_PRODUCTS = [
  'Nettoyant visage',
  'Hydratant',
  'Crème solaire',
  'Sérum vitamine C',
  'Sérum acide hyaluronique',
  'Exfoliant (gommage)',
  'Masque visage',
  'Huile démaquillante',
  'Eau micellaire',
  'Rien/Aucun produit'
]

const ALLERGENIC_INGREDIENTS = [
  'Parfums/Fragrances',
  'Alcool',
  'Sulfates',
  'Parabens',
  'Huiles essentielles',
  'Lanoline',
  'Conservateurs MI/MCI',
  'Acide salicylique',
  'Rétinol',
  'Aucune allergie connue'
]

const AGE_RANGES = [
  { label: '13-17 ans', value: 15, range: '13-17' },
  { label: '18-24 ans', value: 21, range: '18-24' },
  { label: '25-34 ans', value: 29, range: '25-34' },
  { label: '35-44 ans', value: 39, range: '35-44' },
  { label: '45-54 ans', value: 49, range: '45-54' },
  { label: '55-64 ans', value: 59, range: '55-64' },
  { label: '65+ ans', value: 70, range: '65+' }
]

export default function SkinQuestionnaire() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0) // Commencer à 0 pour l'écran intro
  const [showAiMessage, setShowAiMessage] = useState(false)
  const [photosCount, setPhotosCount] = useState(0)
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('')
  
  const [data, setData] = useState<QuestionnaireData>({
    userProfile: {
      age: 25,
      gender: 'Ne souhaite pas préciser',
      skinType: 'Je ne sais pas'
    },
    skinConcerns: {
      primary: [],
      otherText: '' // Nouveau champ
    },
    currentRoutine: {
      morningProducts: [],
      eveningProducts: [],
      // routinePreference sera choisie à la fin du formulaire
      monthlyBudget: '50-100€'
    },
    allergies: {
      ingredients: [],
      pastReactions: ''
    }
  })

  const totalSteps = 8 // 3 nouveaux écrans + 5 étapes questionnaire (0-7)

  useEffect(() => {
    // Récupérer le nombre de photos
    const photosData = sessionStorage.getItem('dermai_photos')
    if (photosData) {
      const photos = JSON.parse(photosData)
      setPhotosCount(photos.length)
    }
  }, [])

  const updateData = (section: keyof QuestionnaireData, updates: Partial<QuestionnaireData[keyof QuestionnaireData]>) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
  }

  const handleNext = () => {
    // Analytics pour les nouveaux écrans
    if (currentStep === 0) {
      // intro_before_after_cta_click
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'intro_before_after_cta_click');
      }
    } else if (currentStep === 3) {
      // similar_concerns_cta_click
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'similar_concerns_cta_click');
      }
    } else if (currentStep === 6) {
      // savings_progress_cta_click
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'savings_progress_cta_click');
      }
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
      // Scroll automatique vers le haut de la page
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    } else {
      // Dernière étape atteinte, soumettre le formulaire
      console.log('Tentative de soumission, étape:', currentStep, 'total:', totalSteps)
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    // Vérifier que le formulaire est complet avant soumission
    if (!isFormComplete()) {
      alert('Veuillez compléter toutes les étapes obligatoires du formulaire.')
      return
    }

    // Récupérer les photos du sessionStorage
    const photosData = sessionStorage.getItem('dermai_photos')
    if (!photosData) {
      alert('Erreur : photos non trouvées. Veuillez recommencer.')
      router.push('/upload')
      return
    }

    // Stocker toutes les données pour l'analyse
    const completeData = {
      photos: JSON.parse(photosData),
      userProfile: data.userProfile,
      skinConcerns: data.skinConcerns,
      currentRoutine: data.currentRoutine,
      allergies: data.allergies
    }

    sessionStorage.setItem('dermai_questionnaire', JSON.stringify(completeData))
    
    // Rediriger vers l'analyse
    router.push('/analyze')
  }

  const toggleArrayItem = (array: string[], item: string, max?: number) => {
    if (array.includes(item)) {
      // Si on désélectionne "Je ne sais pas", cacher le message
      if (item === 'Je ne sais pas') {
        setShowAiMessage(false)
      }
      // Si on désélectionne "Autres", vider le texte
      if (item === 'Autres') {
        updateData('skinConcerns', { otherText: '' })
      }
      return array.filter(i => i !== item)
    } else {
      // Si on sélectionne "Je ne sais pas", afficher le message et vider les autres
      if (item === 'Je ne sais pas') {
        setShowAiMessage(true)
        updateData('skinConcerns', { otherText: '' }) // Vider le texte "Autres"
        return [item]
      }
      // Si on sélectionne autre chose et "Je ne sais pas" était sélectionné, le retirer
      const filteredArray = array.filter(i => i !== 'Je ne sais pas')
      setShowAiMessage(false)
      
      if (max && filteredArray.length >= max) {
        return [...filteredArray.slice(1), item]
      }
      return [...filteredArray, item]
    }
  }

  // Validation complète du formulaire
  const isFormComplete = () => {
    // Étape 1: Profil (tranche d'âge sélectionnée)
    const step1Valid = selectedAgeRange !== ''

    // Étape 2: Préoccupations (au moins une sélection requise)
    const step2Valid = data.skinConcerns.primary.length > 0

    // Étape 7: Préférence de routine choisie (dernière étape)
    const step7Valid = !!data.currentRoutine.routinePreference

    console.log('Validation formulaire:', { step1Valid, step2Valid, step7Valid, currentStep })
    return step1Valid && step2Valid && step7Valid
  }

  // Validation de l'étape actuelle
  const canProceed = () => {
    switch (currentStep) {
      case 0: // IntroBeforeAfterScreen
        return true
      case 1: // Profil
        return selectedAgeRange !== ''
      case 2: // Préoccupations
        return data.skinConcerns.primary.length > 0
      case 3: // SimilarConcernsProofScreen
        return true
      case 4: // Routine actuelle
        return true // Routine optionnelle
      case 5: // Allergies
        return true // Allergies optionnelles
      case 6: // SavingsProgressScreen
        return true
      case 7: // Type de routine + Budget (dernière étape)
        return !!data.currentRoutine.routinePreference // Doit choisir un type de routine
      default:
        return true
    }
  }

  // Fonction pour sélectionner une tranche d'âge
  const handleAgeRangeSelect = (range: typeof AGE_RANGES[0]) => {
    setSelectedAgeRange(range.range)
    updateData('userProfile', { age: range.value })
  }

  // Vérifier si la routine a des produits
  const hasRoutineProducts = () => {
    return data.currentRoutine.morningProducts.length > 0 || data.currentRoutine.eveningProducts.length > 0
  }

  // Formatage de la routine pour l'affichage
  const getRoutineDisplay = () => {
    const morning = data.currentRoutine.morningProducts
    const evening = data.currentRoutine.eveningProducts
    
    if (morning.length === 0 && evening.length === 0) {
      return 'Aucune routine'
    }
    
    const parts = []
    if (morning.length > 0) {
      parts.push(`Matin: ${morning.join(', ')}`)
    }
    if (evening.length > 0) {
      parts.push(`Soir: ${evening.join(', ')}`)
    }
    
    return parts.join(' • ')
  }

  // Formatage des préoccupations pour l'affichage
  const getConcernsDisplay = () => {
    if (data.skinConcerns.primary.includes('Je ne sais pas')) {
      return 'IA analysera automatiquement'
    }
    
    let concerns = [...data.skinConcerns.primary]
    
    // Si "Autres" est sélectionné et qu'il y a du texte, remplacer par le texte
    if (concerns.includes('Autres') && data.skinConcerns.otherText.trim()) {
      concerns = concerns.filter(c => c !== 'Autres')
      concerns.push(data.skinConcerns.otherText.trim())
    } else if (concerns.includes('Autres')) {
      // Si "Autres" sans texte, le garder tel quel
    }
    
    return concerns.join(', ')
  }

  // Récapitulatif dynamique
  const renderSummary = () => (
    <div className="card bg-dermai-pure border border-dermai-nude-200 rounded-2xl p-5 shadow-premium">
      <h3 className="font-semibold font-display text-dermai-neutral-800 mb-4 flex items-center">
        <div className="w-8 h-8 bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 rounded-full flex items-center justify-center mr-3 shadow-glow">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        Récapitulatif
      </h3>
      
      <div className="space-y-2 text-sm text-gray-700">
        {/* Photos */}
        <div className="flex items-center">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-3"></span>
          <span className="text-gray-700">{photosCount} photo{photosCount > 1 ? 's' : ''} uploadée{photosCount > 1 ? 's' : ''}</span>
        </div>

        {/* Profil - toujours affiché avec valeurs actuelles */}
        <div className="flex items-center">
          <span className="w-2.5 h-2.5 bg-purple-500 rounded-full mr-3"></span>
          <span className="text-gray-700">
            {data.userProfile.gender !== 'Ne souhaite pas préciser' && `${data.userProfile.gender}, `}
            {selectedAgeRange || `${data.userProfile.age} ans`}
            {` • Peau ${data.userProfile.skinType === 'Je ne sais pas' ? 'à déterminer par l’IA' : data.userProfile.skinType}`}
          </span>
        </div>

        {/* Préoccupations */}
        {data.skinConcerns.primary.length > 0 && (
          <div className="flex items-start">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-full mr-3 mt-1"></span>
            <div className="text-gray-700">
              {data.skinConcerns.primary.includes('Je ne sais pas') || data.skinConcerns.primary.length === 0 ? 
                (
                  <span className="italic text-blue-600">À déterminer par l’IA</span>
                ) : (
                  <span>{getConcernsDisplay()}</span>
                )}
            </div>
          </div>
        )}

        {/* Routine - toujours afficher même si vide */}
        <div className="flex items-start">
          <span className="w-2.5 h-2.5 bg-purple-500 rounded-full mr-3 mt-1"></span>
          <span className="text-gray-700 text-xs">
            {getRoutineDisplay()} {data.currentRoutine.routinePreference ? `• Préférence: ${data.currentRoutine.routinePreference}` : ''}
          </span>
        </div>

        {/* Budget - toujours afficher */}
        <div className="flex items-center">
          <span className="w-2.5 h-2.5 bg-green-600 rounded-full mr-3"></span>
          <span className="text-gray-700">Budget {data.currentRoutine.monthlyBudget}</span>
        </div>

        {/* Allergies */}
        {data.allergies.ingredients.length > 0 && (
          <div className="flex items-start text-sm">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-3 mt-1"></span>
            <span className="text-gray-700 text-xs">
              {data.allergies.ingredients.includes('Aucune allergie connue') 
                ? 'Aucune allergie connue'
                : `Éviter: ${data.allergies.ingredients.join(', ')}`
              }
            </span>
          </div>
        )}

        {/* Réactions passées (si renseignées) */}
        {data.allergies.pastReactions.trim() && (
          <div className="flex items-start text-sm">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3 mt-1"></span>
            <div className="text-gray-700 text-xs">
              <span className="font-medium">Réactions passées:</span><br/>
              <span className="italic">"{data.allergies.pastReactions.trim()}"</span>
            </div>
          </div>
        )}

        {/* Statut de validation */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          {isFormComplete() ? (
            <div className="flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Formulaire complet
            </div>
          ) : (
            <div className="flex items-center text-sm text-orange-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Étapes manquantes
            </div>
          )}
        </div>
      </div>

      {/* Bouton d'analyse - Mobile */}
      <div className="mt-4 md:hidden">
        <button
          onClick={handleSubmit}
          disabled={!isFormComplete()}
          className="btn-primary w-full font-semibold py-3 px-6 rounded-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isFormComplete() ? '🚀 Lancer l\'analyse DermAI' : '⏳ Compléter le formulaire'}
        </button>
      </div>
    </div>
  )

  const renderStep = () => {
    // Analytics pour les nouveaux écrans
    useEffect(() => {
      if (currentStep === 0 && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'intro_before_after_view');
      } else if (currentStep === 3 && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'similar_concerns_view');
      } else if (currentStep === 6 && typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'savings_progress_view');
      }
    }, [currentStep]);

    switch (currentStep) {
      case 0:
        return (
          <IntroBeforeAfterScreen 
            onContinue={handleNext}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        )
        
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl font-bold font-display text-dermai-neutral-900 mb-2">Profil personnel</h2>
              <p className="text-dermai-neutral-600">Informations de base pour personnaliser votre analyse</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold font-display text-dermai-neutral-800 mb-3">Âge *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {AGE_RANGES.map((range) => (
                    <button
                      key={range.range}
                      type="button"
                      onClick={() => handleAgeRangeSelect(range)}
                      className={`p-3 text-sm font-medium rounded-xl border-2 transition-all hover-lift ${
                        selectedAgeRange === range.range
                          ? 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700 shadow-glow'
                          : 'border-dermai-nude-200 bg-dermai-pure text-dermai-neutral-700 hover:border-dermai-ai-300 hover:bg-dermai-ai-50'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold font-display text-dermai-neutral-800 mb-3">Genre</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {GENDER_OPTIONS.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateData('userProfile', { gender: option as any })}
                      className={`p-3 text-sm rounded-xl border-2 transition-all hover-lift ${
                        data.userProfile.gender === option
                          ? 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700 shadow-glow'
                          : 'border-dermai-nude-200 bg-dermai-pure text-dermai-neutral-700 hover:border-dermai-ai-300 hover:bg-dermai-ai-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold font-display text-dermai-neutral-800 mb-3">Type de peau (si vous le connaissez)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SKIN_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateData('userProfile', { skinType: type as any })}
                      className={`p-3 text-sm rounded-lg border-2 transition-all hover-lift ${
                        data.userProfile.skinType === type
                          ? 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700 shadow-glow'
                          : 'border-dermai-nude-200 bg-dermai-pure text-dermai-neutral-700 hover:border-dermai-ai-300 hover:bg-dermai-ai-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl font-bold font-display text-dermai-neutral-900 mb-2">Préoccupations cutanées</h2>
              <p className="text-dermai-neutral-600">Quels sont vos principaux soucis de peau ? (max 3) *</p>
            </div>

            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SKIN_CONCERNS.map(concern => (
                  <button
                    key={concern}
                    onClick={() => updateData('skinConcerns', { 
                      primary: toggleArrayItem(data.skinConcerns.primary, concern, 3) 
                    })}
                    className={`p-3 text-sm font-medium rounded-xl border-2 transition-all hover-lift ${
                      data.skinConcerns.primary.includes(concern)
                        ? concern === 'Je ne sais pas'
                          ? 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700 shadow-glow'
                          : 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700 shadow-glow'
                        : 'border-dermai-nude-200 bg-dermai-pure text-dermai-neutral-700 hover:border-dermai-ai-300 hover:bg-dermai-ai-50'
                    }`}
                  >
                    {concern}
                  </button>
                ))}
              </div>
              <p className="text-xs text-dermai-neutral-500 mt-2">
                {data.skinConcerns.primary.length}/3 sélectionnés
              </p>
            </div>

            {/* Champ texte pour "Autres" */}
            {data.skinConcerns.primary.includes('Autres') && (
              <div className="bg-dermai-ai-50 border border-dermai-ai-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-dermai-ai-700 mb-2">
                  Précisez vos autres préoccupations :
                </label>
                <input
                  type="text"
                  value={data.skinConcerns.otherText}
                  onChange={(e) => updateData('skinConcerns', { otherText: e.target.value })}
                  placeholder="Ex: Hyperpigmentation, pores dilatés, texture rugueuse..."
                  className="w-full px-3 py-2 border border-dermai-ai-300 rounded-lg focus:ring-2 focus:ring-dermai-ai-500 focus:border-transparent bg-white"
                />
                <p className="text-xs text-orange-600 mt-1">
                  Ces informations aideront l'IA à mieux cibler son analyse
                </p>
              </div>
            )}

            {/* Message IA rassurant */}
            {showAiMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-blue-900">Parfait !</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      L'IA analysera vos photos et estimera automatiquement les préoccupations prioritaires avec une grande précision.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <SimilarConcernsProofScreen 
            onContinue={handleNext}
            onBack={handlePrevious}
            userConcerns={data.skinConcerns.primary}
          />
        )
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl font-bold font-display text-dermai-neutral-900 mb-2">Routine actuelle</h2>
              <p className="text-dermai-neutral-600">Quels produits utilisez-vous ? (optionnel)</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold font-display text-dermai-neutral-800 mb-3">Routine du matin</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {COMMON_PRODUCTS.map(product => (
                    <button
                      key={`morning-${product}`}
                      onClick={() => updateData('currentRoutine', { 
                        morningProducts: toggleArrayItem(data.currentRoutine.morningProducts, product) 
                      })}
                      className={`p-3 text-sm rounded-xl border-2 transition-all hover-lift ${
                        data.currentRoutine.morningProducts.includes(product)
                          ? 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700 shadow-glow'
                          : 'border-dermai-nude-200 bg-dermai-pure text-dermai-neutral-700 hover:border-dermai-ai-300 hover:bg-dermai-ai-50'
                      }`}
                    >
                      {product}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold font-display text-dermai-neutral-800 mb-3">Routine du soir</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {COMMON_PRODUCTS.map(product => (
                    <button
                      key={`evening-${product}`}
                      onClick={() => updateData('currentRoutine', { 
                        eveningProducts: toggleArrayItem(data.currentRoutine.eveningProducts, product) 
                      })}
                      className={`p-3 text-sm rounded-xl border-2 transition-all hover-lift ${
                        data.currentRoutine.eveningProducts.includes(product)
                          ? 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700 shadow-glow'
                          : 'border-dermai-nude-200 bg-dermai-pure text-dermai-neutral-700 hover:border-dermai-ai-300 hover:bg-dermai-ai-50'
                      }`}
                    >
                      {product}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                {/* (Budget déplacé à l'étape 4 après le type de routine) */}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl font-bold font-display text-dermai-neutral-900 mb-2">Allergies et sensibilités</h2>
              <p className="text-dermai-neutral-600">Avez-vous des ingrédients à éviter ? (optionnel)</p>
            </div>

            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ALLERGENIC_INGREDIENTS.map(ingredient => (
                  <button
                    key={ingredient}
                    onClick={() => updateData('allergies', { 
                      ingredients: toggleArrayItem(data.allergies.ingredients, ingredient) 
                    })}
                    className={`p-3 text-sm rounded-xl border-2 transition-all hover-lift ${
                      data.allergies.ingredients.includes(ingredient)
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-dermai-nude-200 bg-dermai-pure text-dermai-neutral-700 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    {ingredient}
                  </button>
                ))}
              </div>
              <p className="text-xs text-dermai-neutral-500 mt-3">
                Ces informations nous aident à éviter les produits qui pourraient ne pas vous convenir.
              </p>
            </div>

            {data.allergies.ingredients.length > 0 && !data.allergies.ingredients.includes('Aucune allergie connue') && (
              <div>
                <label className="block text-sm font-semibold font-display text-dermai-neutral-800 mb-2">Réactions passées (optionnel)</label>
                <textarea
                  value={data.allergies.pastReactions}
                  onChange={(e) => updateData('allergies', { pastReactions: e.target.value })}
                  placeholder="Décrivez brièvement vos réactions passées..."
                  className="w-full p-3 border-2 border-dermai-nude-200 rounded-xl focus:border-dermai-ai-500 focus:outline-none transition-colors resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>
        )

      case 6:
        return (
          <SavingsProgressScreen 
            onContinue={handleNext}
            onBack={handlePrevious}
            currentProgress={95}
          />
        )
        
      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl font-bold font-display text-dermai-neutral-900 mb-2">Finalisation</h2>
              <p className="text-dermai-neutral-600">Dernières préférences pour personnaliser vos recommandations</p>
            </div>

            <div>
              <label className="block text-sm font-semibold font-display text-dermai-neutral-800 mb-3">Type de routine souhaitée *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Minimaliste', help: '2-3 étapes essentielles' },
                  { label: 'Simple', help: '3-4 étapes faciles' },
                  { label: 'Équilibrée', help: '4-5 étapes optimisées' },
                  { label: 'Complète', help: '5-7 étapes détaillées' }
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => updateData('currentRoutine', { routinePreference: opt.label as any })}
                    className={`p-3 text-left rounded-xl border-2 transition-all hover-lift ${
                      data.currentRoutine.routinePreference === opt.label
                        ? 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700 shadow-glow'
                        : 'border-dermai-nude-200 bg-dermai-pure text-dermai-neutral-700 hover:border-dermai-ai-300 hover:bg-dermai-ai-50'
                    }`}
                  >
                    <div className="font-semibold text-dermai-neutral-900">{opt.label}</div>
                    <div className="text-xs text-dermai-neutral-600 mt-1">{opt.help}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold font-display text-dermai-neutral-800 mb-3">Budget mensuel souhaité</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BUDGET_RANGES.map(range => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => updateData('currentRoutine', { monthlyBudget: range as any })}
                    className={`p-3 text-sm rounded-xl border-2 transition-all hover-lift ${
                      data.currentRoutine.monthlyBudget === range
                        ? 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700 shadow-glow'
                        : 'border-dermai-nude-200 bg-dermai-pure text-dermai-neutral-700 hover:border-dermai-ai-300 hover:bg-dermai-ai-50'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <p className="text-xs text-dermai-neutral-500 mt-2">
                Cela nous aide à recommander des produits adaptés à votre fourchette de prix.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Rendu direct pour les écrans plein écran
  if (currentStep === 0 || currentStep === 3 || currentStep === 6) {
    return renderStep()
  }

  return (
    <div className="min-h-screen bg-dermai-pure">
      {/* Header avec progression */}
      <div className="bg-dermai-pure/80 backdrop-blur-sm border-b border-dermai-nude-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="cursor-pointer transition-opacity hover:opacity-80">
                <img 
                  src="/DERMAI-logo.svg" 
                  alt="DermAI" 
                  className="h-8 md:h-10 w-auto"
                />
              </a>
            </div>

            {/* Progress dots - ajusté pour 7 étapes */}
            <div className="hidden md:flex items-center space-x-2">
              {[...Array(7)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i <= currentStep 
                      ? 'bg-dermai-ai-500 shadow-glow' 
                      : 'bg-dermai-neutral-300'
                  }`}
                />
              ))}
            </div>

            <div className="text-right">
              <div className="text-sm text-dermai-neutral-500">Question {Math.max(1, currentStep)}/{totalSteps}</div>
              <div className="w-32 bg-dermai-neutral-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 h-2 rounded-full transition-all duration-300 shadow-glow"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          
          {/* Contenu principal */}
          <div className="lg:col-span-2">
            <div className="card bg-dermai-pure rounded-3xl shadow-premium border border-dermai-nude-200 p-8 lg:p-10 hover:shadow-premium-lg transition-shadow">
              {renderStep()}

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-dermai-nude-200 gap-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2 text-dermai-neutral-600 hover:text-dermai-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-dermai"
                >
                  <span>←</span>
                  <span>Précédent</span>
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="btn-primary flex items-center space-x-3 font-semibold py-3 px-6 sm:px-8 rounded-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto justify-center"
                >
                  <span>
                    {currentStep === totalSteps - 1 ? (
                      isFormComplete() ? '🚀 Lancer l\'analyse DermAI' : '⏳ Compléter le formulaire'
                    ) : 'Suivant'}
                  </span>
                  {currentStep !== totalSteps - 1 && (
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xs">→</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Panneau latéral récapitulatif - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <ImprovedSummary
                photosCount={photosCount}
                selectedAgeRange={selectedAgeRange}
                data={data}
                getConcernsDisplay={getConcernsDisplay}
                hasRoutineProducts={hasRoutineProducts}
                getRoutineDisplay={getRoutineDisplay}
                isFormComplete={isFormComplete}
                handleSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>

        {/* Récapitulatif mobile - bas de page */}
        <div className="lg:hidden mt-8">
          <ImprovedSummary
            photosCount={photosCount}
            selectedAgeRange={selectedAgeRange}
            data={data}
            getConcernsDisplay={getConcernsDisplay}
            hasRoutineProducts={hasRoutineProducts}
            getRoutineDisplay={getRoutineDisplay}
            isFormComplete={isFormComplete}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}
