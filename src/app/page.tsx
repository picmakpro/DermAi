'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Heart, 
  Star,
  Clock,
  Users,
  CheckCircle2
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-40">
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

            {/* Navigation links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#comment-ca-marche" className="text-gray-600 hover:text-purple-600 transition-colors">
                Comment ça marche
              </a>
              <a href="#avantages" className="text-gray-600 hover:text-purple-600 transition-colors">
                Avantages
              </a>
              <Link
                href="/upload"
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Commencer
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm border border-purple-200 rounded-full px-4 py-2 text-sm">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-700">Nouvelle technologie d'analyse dermatologique</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Votre peau analysée par
              <span className="block bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Intelligence Artificielle
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Obtenez un diagnostic précis de votre peau en quelques minutes. 
              <strong className="text-gray-800"> Recommandations personnalisées</strong> et 
              <strong className="text-gray-800"> routine sur-mesure</strong> grâce à l&apos;IA DermAI.
            </p>
          </motion.div>

          {/* CTA Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Link
              href="/upload"
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              <span>Commencer mon diagnostic</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>100% gratuit</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Résultats en 2 min</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <span>Données sécurisées</span>
              </div>
            </div>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/60 backdrop-blur-sm border border-purple-200 rounded-2xl p-6 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center space-x-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <p className="text-gray-700 mb-3">
              "DermAI m'a aidé à identifier mon type de peau et à trouver les bons produits. 
              Les recommandations sont très précises !"
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Rejoint par <strong>2,500+</strong> utilisateurs satisfaits</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un processus simple en 3 étapes pour obtenir votre diagnostic personnalisé
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
                          {[
                {
                  step: "01",
                  title: "Prenez vos photos",
                  description: "Capturez votre visage sous différents angles avec votre smartphone. Nos guides vous aident à prendre les meilleures photos.",
                  icon: <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">📸</div>
                },
                {
                  step: "02", 
                  title: "Répondez au questionnaire",
                  description: "Quelques questions simples sur votre routine actuelle, vos préoccupations et votre type de peau.",
                  icon: <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">📋</div>
                },
                {
                  step: "03",
                  title: "Recevez votre analyse",
                  description: "DermAI analyse vos photos et vous fournit un diagnostic précis avec des recommandations personnalisées.",
                  icon: <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">✨</div>
                }
              ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-3xl p-8 border border-purple-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div className="text-4xl font-bold text-purple-200">{item.step}</div>
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section id="avantages" className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir DermAI ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une technologie de pointe au service de votre peau
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {[
                {
                  icon: <Zap className="w-8 h-8 text-yellow-500" />,
                  title: "Analyse instantanée",
                  description: "Résultats précis en moins de 2 minutes grâce à l&apos;IA DermAI"
                },
                {
                  icon: <Shield className="w-8 h-8 text-green-500" />,
                  title: "Précision experte", 
                  description: "Diagnostic spécifique et personnalisé, pas de réponses génériques"
                },
                {
                  icon: <Heart className="w-8 h-8 text-red-500" />,
                  title: "Recommandations sur-mesure",
                  description: "Produits et routine adaptés à votre type de peau et budget"
                },
                {
                  icon: <Users className="w-8 h-8 text-blue-500" />,
                  title: "Accompagnement continu",
                  description: "Assistance DermAI pour toutes vos questions après le diagnostic"
                }
              ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 hover:shadow-lg transition-shadow text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gray-50 rounded-full">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à découvrir votre peau ?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Rejoignez des milliers d'utilisateurs qui ont déjà transformé leur routine skincare
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center space-x-3 bg-white text-purple-600 font-semibold py-4 px-8 rounded-2xl text-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <span>Commencer mon diagnostic gratuit</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
              <span className="font-semibold">DermAI</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 DermAI. Diagnostic dermatologique par IA.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}