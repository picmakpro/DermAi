'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SKIN_TYPES, GENDER_OPTIONS, BUDGET_RANGES } from '@/constants'
import type { UserProfile, SkinConcerns, CurrentRoutine } from '@/types'

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

export default function SkinQuestionnaire() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [showAiMessage, setShowAiMessage] = useState(false)
  const [photosCount, setPhotosCount] = useState(0)
  
  const [data, setData] = useState<QuestionnaireData>({
    userProfile: {
      age: 25,
      gender: 'Ne souhaite pas préciser',
      skinType: 'Je ne sais pas'
    },
    skinConcerns: {
      primary: [],
      severity: 5,
      duration: '1-6 mois',
      otherText: '' // Nouveau champ
    },
    currentRoutine: {
      morningProducts: [],
      eveningProducts: [],
      cleansingFrequency: 'Quotidien',
      monthlyBudget: '50-100€'
    },
    allergies: {
      ingredients: [],
      pastReactions: ''
    }
  })

  const totalSteps = 4

  useEffect(() => {
    // Récupérer le nombre de photos
    const photosData = sessionStorage.getItem('dermai_photos')
    if (photosData) {
      const photos = JSON.parse(photosData)
      setPhotosCount(photos.length)
    }
  }, [])

  const updateData = (section: keyof QuestionnaireData, updates: any) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
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
    // Étape 1: Profil (âge valide requis)
    const step1Valid = data.userProfile.age >= 13 && data.userProfile.age <= 100

    // Étape 2: Préoccupations (au moins une sélection requise)
    const step2Valid = data.skinConcerns.primary.length > 0

    // Étapes 3 et 4 sont optionnelles
    return step1Valid && step2Valid
  }

  // Validation de l'étape actuelle
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.userProfile.age >= 13 && data.userProfile.age <= 100
      case 2:
        return data.skinConcerns.primary.length > 0
      case 3:
        return true // Routine optionnelle
      case 4:
        return true // Allergies optionnelles
      default:
        return true
    }
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
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        Récapitulatif
      </h3>
      
      <div className="space-y-3">
        {/* Photos */}
        <div className="flex items-center text-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          <span className="text-gray-700">{photosCount} photo{photosCount > 1 ? 's' : ''} uploadée{photosCount > 1 ? 's' : ''}</span>
        </div>

        {/* Profil - toujours affiché avec valeurs actuelles */}
        <div className="flex items-center text-sm">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          <span className="text-gray-700">
            {data.userProfile.gender !== 'Ne souhaite pas préciser' && `${data.userProfile.gender}, `}
            {data.userProfile.age} ans
            {data.userProfile.skinType !== 'Je ne sais pas' && ` • Peau ${data.userProfile.skinType}`}
          </span>
        </div>

        {/* Préoccupations */}
        {data.skinConcerns.primary.length > 0 && (
          <div className="flex items-start text-sm">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 mt-1.5"></span>
            <div className="text-gray-700">
              {data.skinConcerns.primary.includes('Je ne sais pas') ? (
                <span className="italic text-blue-600">IA analysera automatiquement</span>
              ) : (
                <span>{getConcernsDisplay()}</span>
              )}
            </div>
          </div>
        )}

        {/* Routine - toujours afficher même si vide */}
        <div className="flex items-start text-sm">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 mt-1.5"></span>
          <span className="text-gray-700 text-xs">
            {getRoutineDisplay()}
          </span>
        </div>

        {/* Budget - toujours afficher */}
        <div className="flex items-center text-sm">
          <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
          <span className="text-gray-700">Budget {data.currentRoutine.monthlyBudget}</span>
        </div>

        {/* Allergies */}
        {data.allergies.ingredients.length > 0 && (
          <div className="flex items-start text-sm">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 mt-1.5"></span>
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
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 mt-1.5"></span>
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isFormComplete() ? '🚀 Lancer l\'analyse IA' : '⏳ Compléter le formulaire'}
        </button>
      </div>
    </div>
  )

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profil personnel</h2>
              <p className="text-gray-600">Informations de base pour personnaliser votre analyse</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Âge *</label>
                <input
                  type="number"
                  min="13"
                  max="100"
                  value={data.userProfile.age}
                  onChange={(e) => updateData('userProfile', { age: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                <select
                  value={data.userProfile.gender}
                  onChange={(e) => updateData('userProfile', { gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {GENDER_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de peau (si vous le connaissez)</label>
                <select
                  value={data.userProfile.skinType}
                  onChange={(e) => updateData('userProfile', { skinType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SKIN_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Préoccupations cutanées</h2>
              <p className="text-gray-600">Quels sont vos principaux soucis de peau ? (max 3) *</p>
            </div>

            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SKIN_CONCERNS.map(concern => (
                  <button
                    key={concern}
                    onClick={() => updateData('skinConcerns', { 
                      primary: toggleArrayItem(data.skinConcerns.primary, concern, 3) 
                    })}
                    className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                      data.skinConcerns.primary.includes(concern)
                        ? concern === 'Je ne sais pas'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {concern}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {data.skinConcerns.primary.length}/3 sélectionnés
              </p>
            </div>

            {/* Champ texte pour "Autres" */}
            {data.skinConcerns.primary.includes('Autres') && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-orange-700 mb-2">
                  Précisez vos autres préoccupations :
                </label>
                <input
                  type="text"
                  value={data.skinConcerns.otherText}
                  onChange={(e) => updateData('skinConcerns', { otherText: e.target.value })}
                  placeholder="Ex: Hyperpigmentation, pores dilatés, texture rugueuse..."
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
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
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Routine actuelle</h2>
              <p className="text-gray-600">Quels produits utilisez-vous ? (optionnel)</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Routine du matin</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {COMMON_PRODUCTS.map(product => (
                    <button
                      key={`morning-${product}`}
                      onClick={() => updateData('currentRoutine', { 
                        morningProducts: toggleArrayItem(data.currentRoutine.morningProducts, product) 
                      })}
                      className={`p-2 text-sm rounded-lg border transition-all ${
                        data.currentRoutine.morningProducts.includes(product)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {product}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Routine du soir</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {COMMON_PRODUCTS.map(product => (
                    <button
                      key={`evening-${product}`}
                      onClick={() => updateData('currentRoutine', { 
                        eveningProducts: toggleArrayItem(data.currentRoutine.eveningProducts, product) 
                      })}
                      className={`p-2 text-sm rounded-lg border transition-all ${
                        data.currentRoutine.eveningProducts.includes(product)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {product}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget mensuel souhaité</label>
                <select
                  value={data.currentRoutine.monthlyBudget}
                  onChange={(e) => updateData('currentRoutine', { monthlyBudget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {BUDGET_RANGES.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Allergies et sensibilités</h2>
              <p className="text-gray-600">Ingrédients à éviter dans vos recommandations (optionnel)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Allergies/Intolérances connues</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ALLERGENIC_INGREDIENTS.map(ingredient => (
                  <button
                    key={ingredient}
                    onClick={() => updateData('allergies', { 
                      ingredients: toggleArrayItem(data.allergies.ingredients, ingredient) 
                    })}
                    className={`p-2 text-sm rounded-lg border transition-all ${
                      data.allergies.ingredients.includes(ingredient)
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {ingredient}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Réactions passées (optionnel)
              </label>
              <textarea
                value={data.allergies.pastReactions}
                onChange={(e) => updateData('allergies', { pastReactions: e.target.value })}
                placeholder="Décrivez brièvement les réactions que vous avez déjà eues..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec progression */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Questionnaire personnalisé</h1>
              <p className="text-gray-600 mt-1">Étape 2 sur 3 • Analyse DermAI</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Étape {currentStep}/{totalSteps}</div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              {renderStep()}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Précédent
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStep === totalSteps ? (
                    isFormComplete() ? '🚀 Lancer l\'analyse' : '⏳ Compléter le formulaire'
                  ) : 'Suivant →'}
                </button>
              </div>
            </div>
          </div>

          {/* Panneau latéral récapitulatif - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              {renderSummary()}
              
              {/* Bouton d'analyse - Desktop */}
              <div className="mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!isFormComplete()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isFormComplete() ? '🚀 Lancer l\'analyse IA' : '⏳ Compléter le formulaire'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Récapitulatif mobile - bas de page */}
        <div className="lg:hidden mt-8">
          {renderSummary()}
        </div>
      </div>
    </div>
  )
}
