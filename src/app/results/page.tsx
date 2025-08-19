'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  Clock,
  Heart,
  Shield,
  Droplets,
  Sun,
  Eye,
  RotateCcw,
  Award,
  TrendingUp,
  Sparkles,
  MessageCircle,
  ChevronRight,
  Calendar
} from 'lucide-react'
import type { SkinAnalysis, SkinScores, ScoreDetail, RecommendedProductCard } from '@/types'
import { getAnalysis } from '@/utils/storage/analysisStore'
import ChatWidget from './ChatWidget'
import ScoreCircle from './components/ScoreCircle'
import ProductCard from './components/ProductCard'

const scoreIcons = {
  hydration: <Droplets className="w-6 h-6" />,
  wrinkles: <Clock className="w-6 h-6" />,
  firmness: <Shield className="w-6 h-6" />,
  radiance: <Sun className="w-6 h-6" />,
  pores: <Eye className="w-6 h-6" />,
  spots: <AlertTriangle className="w-6 h-6" />,
  darkCircles: <Heart className="w-6 h-6" />,
  skinAge: <Star className="w-6 h-6" />,
}

const scoreLabels: Record<keyof Omit<SkinScores, 'overall'>, string> = {
  hydration: 'Hydratation',
  wrinkles: 'Rides',
  firmness: 'Fermeté',
  radiance: 'Éclat',
  pores: 'Pores',
  spots: 'Taches',
  darkCircles: 'Cernes',
  skinAge: 'Âge de la peau',
}

// Mock products data - remplacer par des vraies données
const mockProducts = [
  {
    name: "Gel Nettoyant Moussant",
    brand: "CeraVe",
    price: 12.99,
    originalPrice: 15.99,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    discount: 19,
    frequency: "Matin et soir",
    benefits: ["Élimine l'excès de sébum", "Respecte la barrière cutanée"],
    instructions: "Masser 30 secondes sur peau humide. Rincer à l'eau tiède, jamais chaude",
    whyThisProduct: "Élimine l'excès de sébum sans dessécher",
    affiliateLink: "https://example.com/cerave-gel"
  },
  {
    name: "Sérum Niacinamide 10%",
    brand: "The Ordinary",
    price: 7.20,
    originalPrice: 8.90,
    imageUrl: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&h=400&fit=crop",
    discount: 19,
    frequency: "Soir uniquement", 
    benefits: ["Régule le sébum", "Minimise les pores"],
    instructions: "Appliquer 2-3 gouttes sur peau propre le soir",
    whyThisProduct: "Régule efficacement la production de sébum",
    affiliateLink: "https://example.com/ordinary-niacinamide"
  }
]

export default function ResultsPage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null)
  const [userAge, setUserAge] = useState<number | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const analysisId = sessionStorage.getItem('dermai_analysis_id')
      const questionnaireData = sessionStorage.getItem('dermai_questionnaire')
      if (!analysisId) {
        router.push('/upload')
        return
      }
      try {
        const stored = await getAnalysis(analysisId)
        if (!stored) {
          router.push('/upload')
          return
        }
        setAnalysis(stored)
        if (questionnaireData) {
          const q = JSON.parse(questionnaireData)
          if (q?.userProfile?.age) setUserAge(q.userProfile.age)
        }
      } catch (e) {
        console.error('Erreur chargement results:', e)
        router.push('/upload')
      }
    }
    load()
  }, [router])

  const skinAgeYears = useMemo(() => {
    if (!analysis || userAge == null) return null
    const score = (analysis.scores as any)?.skinAge as ScoreDetail | undefined
    if (!score || typeof score.value !== 'number') return null
    
    const ageDelta = (75 - score.value) / 10
    const computed = Math.round(userAge + ageDelta)
    return Math.max(15, Math.min(80, computed))
  }, [analysis, userAge])

  const handleNewAnalysis = () => {
    sessionStorage.removeItem('dermai_photos')
    sessionStorage.removeItem('dermai_questionnaire')
    sessionStorage.removeItem('dermai_analysis_id')
    router.push('/upload')
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  const scoreOrder: Array<keyof Omit<SkinScores, 'overall'>> = [
    'hydration', 'wrinkles', 'firmness', 'radiance', 'pores'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
                         <div className="flex items-center space-x-3">
               <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                 <span className="text-white font-bold text-lg">D</span>
               </div>
               <div>
                 <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                   DermAI
                 </h1>
                 <p className="text-sm text-gray-600">Diagnostic personnalisé par IA</p>
               </div>
             </div>

            {/* Progress dots */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
            </div>

            {/* New analysis button */}
            <button
              onClick={handleNewAnalysis}
              className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle analyse</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                 {/* Hero Section - Diagnostic */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden"
         >
           <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10 animate-pulse"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-10 -translate-x-10 animate-pulse delay-1000"></div>
           <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
          
          <div className="relative z-10">
                       <div className="flex items-center space-x-3 mb-6">
             <div className="p-2 bg-white/20 rounded-full">
               <Award className="w-8 h-8" />
             </div>
             <div>
               <h2 className="text-2xl font-bold">Diagnostic Personnalisé</h2>
               <p className="text-purple-100 text-sm">Analyse complétée avec succès</p>
             </div>
           </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Skin type */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Sparkles className="w-6 h-6" />
                  <span className="font-semibold">Type de Peau Identifié</span>
                </div>
                <div className="text-xl font-bold mb-2">
                  {analysis.diagnostic.primaryCondition}
                </div>
                <div className="text-sm opacity-90">
                  Sévérité: {analysis.diagnostic.severity}
                </div>
              </div>

              {/* Skin age */}
              {skinAgeYears && userAge && (
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <TrendingUp className="w-6 h-6" />
                    <span className="font-semibold">Estimation Âge de Peau</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm opacity-90">Âge réel</div>
                      <div className="text-lg font-bold">{userAge} ans</div>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                    <div className="text-center">
                      <div className="text-sm opacity-90">Âge de peau</div>
                      <div className="text-2xl font-bold text-purple-200">{skinAgeYears} ans</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Overall score */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                <div className="text-sm opacity-90 mb-2">Score Global</div>
                <div className="text-4xl font-bold mb-2">{analysis.scores.overall}</div>
                <div className="text-sm opacity-90">Analyse sur 8 critères</div>
              </div>
            </div>
          </div>
        </motion.div>

                 {/* Scores Section */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
         >
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-pink-100 rounded-full">
                 <Award className="w-6 h-6 text-pink-500" />
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-gray-900">Vos Scores Peau</h2>
                 <p className="text-gray-600">Analyse sur 5 piliers essentiels</p>
               </div>
             </div>
             <div className="text-right">
               <div className="text-sm text-gray-500">Score global</div>
               <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                 {analysis.scores.overall}/100
               </div>
             </div>
           </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {scoreOrder.map((key) => {
              const score = (analysis.scores as any)[key] as ScoreDetail
              if (!score || typeof score.value !== 'number') return null
              
              return (
                <ScoreCircle
                  key={key}
                  score={Math.round(score.value)}
                  label={scoreLabels[key]}
                  icon={scoreIcons[key]}
                />
              )
            })}
          </div>
        </motion.div>

                 {/* Key Observations */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white rounded-3xl shadow-xl p-8"
         >
           <div className="flex items-center space-x-3 mb-6">
             <Star className="w-6 h-6 text-blue-500" />
             <h2 className="text-2xl font-bold text-gray-900">Observations Détaillées</h2>
           </div>

           <div className="grid md:grid-cols-3 gap-4">
             {analysis.diagnostic.observations.slice(0, 3).map((observation, index) => (
               <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
                 <div className="flex items-start space-x-3">
                   <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                     {index + 1}
                   </div>
                   <p className="text-gray-800 text-sm">{observation}</p>
                 </div>
               </div>
             ))}
           </div>
         </motion.div>

         {/* Routine Section */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="bg-white rounded-3xl shadow-xl p-8"
         >
           <div className="flex items-center space-x-3 mb-6">
             <Calendar className="w-6 h-6 text-purple-500" />
             <h2 className="text-2xl font-bold text-gray-900">Routine Personnalisée</h2>
           </div>
           
           <div className="grid md:grid-cols-2 gap-6">
             {/* Morning routine */}
             <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
               <div className="flex items-center space-x-3 mb-4">
                 <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                   <span className="text-white text-sm">☀️</span>
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">ROUTINE MATIN</h3>
               </div>
               
               <div className="space-y-3">
                 {analysis.recommendations.routine.slice(0, 3).map((step, index) => (
                   <div key={index} className="flex items-start space-x-3">
                     <div className="w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-sm font-bold">
                       {index + 1}
                     </div>
                     <p className="text-gray-800 text-sm">{step}</p>
                   </div>
                 ))}
               </div>
             </div>

             {/* Evening routine */}
             <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
               <div className="flex items-center space-x-3 mb-4">
                 <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                   <span className="text-white text-sm">🌙</span>
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">ROUTINE SOIR</h3>
               </div>
               
               <div className="space-y-3">
                 {analysis.recommendations.routine.slice(3, 6).map((step, index) => (
                   <div key={index} className="flex items-start space-x-3">
                     <div className="w-6 h-6 bg-indigo-200 text-indigo-800 rounded-full flex items-center justify-center text-sm font-bold">
                       {index + 1}
                     </div>
                     <p className="text-gray-800 text-sm">{step}</p>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         </motion.div>

         {/* Products Section */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-xl p-8 border border-purple-100"
         >
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center space-x-3">
               <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                 <span className="text-white text-xl">🛍️</span>
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-gray-900">Produits Recommandés</h2>
                 <p className="text-gray-600">
                   Sélectionnés par l'IA • <span className="text-green-600 font-semibold">Livraison gratuite dès 49€</span>
                 </p>
               </div>
             </div>
             <div className="text-right hidden md:block">
               <div className="text-sm text-gray-500">Offre spéciale</div>
               <div className="text-lg font-bold text-green-600">-19% vs pharmacie</div>
             </div>
           </div>

           <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-2xl p-4 mb-6">
             <div className="flex items-center justify-center space-x-2 text-green-800">
               <span className="text-lg">💡</span>
               <span className="font-semibold">Ces produits correspondent parfaitement à votre type de peau</span>
             </div>
           </div>

           <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
             {mockProducts.map((product, index) => (
               <ProductCard key={index} {...product} />
             ))}
           </div>
         </motion.div>

        {/* Chat CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl p-8 text-white text-center"
        >
          <div className="max-w-2xl mx-auto">
            <MessageCircle className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Discussion avec votre conseiller IA</h2>
            <p className="text-lg opacity-90 mb-6">
              Posez vos questions sur votre analyse !
            </p>
            <p className="text-sm opacity-75 mb-4">
              Ex: "Comment appliquer ces produits ?" ou "Puis-je utiliser du rétinol ?"
            </p>
            <button
              onClick={() => setIsChatOpen(true)}
              className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors"
            >
              Commencer la discussion
            </button>
          </div>
        </motion.div>

        {/* Legal notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Avertissement médical</h4>
              <p className="text-yellow-800 text-sm">
                Cette analyse est réalisée par intelligence artificielle et ne remplace pas un diagnostic médical professionnel. 
                En cas de problème dermatologique persistant ou sévère, consultez un dermatologue qualifié.
              </p>
            </div>
          </div>
        </div>
      </div>

             {/* Floating Chat Bubble */}
       {!isChatOpen && (
         <motion.button
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           transition={{ delay: 1.5, type: "spring" }}
           onClick={() => setIsChatOpen(true)}
           className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50 flex items-center justify-center group"
         >
           <MessageCircle className="w-7 h-7" />
           <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-pulse flex items-center justify-center">
             <span className="text-white text-xs font-bold">!</span>
           </span>
           {/* Tooltip */}
           <div className="absolute bottom-full right-0 mb-3 hidden group-hover:block">
             <div className="bg-gray-900 text-white text-sm rounded-lg px-4 py-3 whitespace-nowrap shadow-xl">
               <div className="font-semibold">💬 Besoin d'aide ?</div>
               <div className="text-xs text-gray-300 mt-1">Posez vos questions à votre conseiller IA</div>
               <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
             </div>
           </div>
         </motion.button>
       )}
 
        {/* Chat Widget */}
       {isChatOpen && (
         <ChatWidget analysis={analysis} onClose={() => setIsChatOpen(false)} />
       )}
     </div>
   )
 }
