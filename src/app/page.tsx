'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Star,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Eye,
  Brain,
  Menu,
  X,
  Camera,
  FileText,
  Bot,
  TrendingUp,
  MessageSquare,
  ShoppingBag
} from 'lucide-react'

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-dermai-pure">
      {/* Header Navigation - Responsive avec menu mobile */}
      <nav className="bg-dermai-pure/95 backdrop-blur-md border-b border-dermai-nude-200/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            {/* Logo - Responsive */}
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <a href="/" className="cursor-pointer transition-opacity hover:opacity-80">
                <img 
                  src="/DERMAI-logo.svg" 
                  alt="DermAI" 
                  className="h-8 sm:h-10 w-auto"
                />
              </a>
            </motion.div>

            {/* Navigation Desktop */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#fonctionnement" className="text-dermai-neutral-600 hover:text-dermai-ai-600 transition-all duration-300 font-medium tracking-wide">
                Fonctionnement
              </a>
              <a href="#temoignages" className="text-dermai-neutral-600 hover:text-dermai-ai-600 transition-all duration-300 font-medium tracking-wide">
                Témoignages
              </a>
              <Link
                href="/upload"
                className="group relative bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 text-white px-8 py-3.5 rounded-full font-semibold tracking-wide hover:shadow-glow-lg transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10">Analyser</span>
                <div className="absolute inset-0 bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>

            {/* Bouton Mobile Menu */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-dermai-neutral-600 hover:text-dermai-ai-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Menu Mobile */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden mt-4 pb-4"
              >
                <div className="space-y-4">
                  <a 
                    href="#fonctionnement" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 px-4 text-dermai-neutral-600 hover:text-dermai-ai-600 hover:bg-dermai-nude-50 rounded-2xl transition-all duration-300 font-medium"
                  >
                    Comment ça marche
                  </a>
                  <a 
                    href="#temoignages" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 px-4 text-dermai-neutral-600 hover:text-dermai-ai-600 hover:bg-dermai-nude-50 rounded-2xl transition-all duration-300 font-medium"
                  >
                    Témoignages
                  </a>
                  <Link
                    href="/upload"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-premium"
                  >
                    Commencer l'analyse
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section - Effet "clean lab" avec scan holographique */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background subtil avec particules animées */}
        <div className="absolute inset-0 bg-gradient-to-br from-dermai-pure via-dermai-light to-dermai-nude-50"></div>
        
        {/* Particules IA flottantes - Plus visibles et nombreuses */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { left: '15%', top: '20%', duration: 4, delay: 0, size: 'w-2 h-2', opacity: 'bg-dermai-ai-400/60' },
            { left: '85%', top: '30%', duration: 5, delay: 0.5, size: 'w-1.5 h-1.5', opacity: 'bg-dermai-ai-300/80' },
            { left: '25%', top: '70%', duration: 3.5, delay: 1, size: 'w-1 h-1', opacity: 'bg-dermai-ai-500/50' },
            { left: '75%', top: '15%', duration: 4.5, delay: 1.5, size: 'w-2.5 h-2.5', opacity: 'bg-dermai-ai-400/70' },
            { left: '45%', top: '85%', duration: 3, delay: 0.8, size: 'w-1.5 h-1.5', opacity: 'bg-dermai-ai-300/60' },
            { left: '65%', top: '45%', duration: 4.2, delay: 0.3, size: 'w-2 h-2', opacity: 'bg-dermai-ai-500/80' },
            { left: '10%', top: '60%', duration: 3.8, delay: 1.2, size: 'w-1 h-1', opacity: 'bg-dermai-ai-400/40' },
            { left: '90%', top: '75%', duration: 4.8, delay: 0.7, size: 'w-3 h-3', opacity: 'bg-dermai-ai-300/90' },
            { left: '35%', top: '25%', duration: 3.2, delay: 1.8, size: 'w-1.5 h-1.5', opacity: 'bg-dermai-ai-500/60' },
            { left: '55%', top: '90%', duration: 4.3, delay: 0.2, size: 'w-2 h-2', opacity: 'bg-dermai-ai-400/70' },
            { left: '80%', top: '50%', duration: 3.7, delay: 1.4, size: 'w-1 h-1', opacity: 'bg-dermai-ai-300/50' },
            { left: '20%', top: '40%', duration: 4.1, delay: 0.9, size: 'w-2.5 h-2.5', opacity: 'bg-dermai-ai-500/80' },
            { left: '70%', top: '80%', duration: 3.9, delay: 0.6, size: 'w-1.5 h-1.5', opacity: 'bg-dermai-ai-400/60' },
            { left: '40%', top: '10%', duration: 4.6, delay: 1.1, size: 'w-2 h-2', opacity: 'bg-dermai-ai-300/70' },
            { left: '60%', top: '65%', duration: 3.4, delay: 1.6, size: 'w-1 h-1', opacity: 'bg-dermai-ai-500/50' },
            // Nouvelles particules
            { left: '5%', top: '35%', duration: 3.6, delay: 0.4, size: 'w-1.5 h-1.5', opacity: 'bg-dermai-ai-400/65' },
            { left: '95%', top: '55%', duration: 4.4, delay: 1.3, size: 'w-2 h-2', opacity: 'bg-dermai-ai-300/75' },
            { left: '30%', top: '5%', duration: 3.3, delay: 0.1, size: 'w-1 h-1', opacity: 'bg-dermai-ai-500/45' },
            { left: '50%', top: '30%', duration: 4.7, delay: 1.7, size: 'w-2.5 h-2.5', opacity: 'bg-dermai-ai-400/85' },
            { left: '85%', top: '95%', duration: 3.1, delay: 0.6, size: 'w-1.5 h-1.5', opacity: 'bg-dermai-ai-300/55' },
            { left: '12%', top: '75%', duration: 4.9, delay: 1.9, size: 'w-2 h-2', opacity: 'bg-dermai-ai-500/70' },
            { left: '88%', top: '25%', duration: 3.8, delay: 0.8, size: 'w-1 h-1', opacity: 'bg-dermai-ai-400/40' },
            { left: '65%', top: '8%', duration: 4.2, delay: 1.5, size: 'w-3 h-3', opacity: 'bg-dermai-ai-300/90' },
            { left: '25%', top: '50%', duration: 3.5, delay: 0.2, size: 'w-1.5 h-1.5', opacity: 'bg-dermai-ai-500/65' },
            { left: '92%', top: '40%', duration: 4.1, delay: 1.1, size: 'w-2 h-2', opacity: 'bg-dermai-ai-400/75' },
          ].map((particle, i) => (
            <motion.div
              key={i}
              className={`absolute ${particle.size} ${particle.opacity} rounded-full shadow-glow`}
              style={{
                left: particle.left,
                top: particle.top,
              }}
              animate={{
                y: [-30, 30, -30],
                x: [-10, 10, -10],
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            
            {/* Contenu textuel - Typography moderne responsive */}
            <motion.div
              className="space-y-8 lg:space-y-10 text-center lg:text-left lg:order-1"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge "Nouvelle tech" */}
              <motion.div
                className="inline-flex items-center space-x-2 sm:space-x-3 bg-dermai-nude-100/50 backdrop-blur-sm border border-dermai-nude-200 rounded-full px-3 sm:px-5 py-2 sm:py-2.5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-dermai-ai-500" />
                <span className="text-xs sm:text-sm text-dermai-neutral-700 font-medium">Nouvelle génération d'analyse</span>
              </motion.div>
              
              {/* Titre principal - Typography display responsive */}
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight text-dermai-neutral-900">
                  Partenaire IA
                  <span className="block bg-gradient-to-r from-dermai-ai-600 via-dermai-ai-500 to-dermai-ai-400 bg-clip-text text-transparent">
                    Beauté Fondé en
                  </span>
                  <span className="block text-dermai-neutral-600 text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl">Science</span>
                </h1>
                
                <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-dermai-neutral-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
                  Diagnostic précis. Confiance en vous. <br className="hidden sm:block" />
                  <span className="text-dermai-neutral-800 font-medium">Approche scientifique personnalisée.</span>
                </p>
              </div>

              {/* CTA Premium avec glassmorphism - Mobile optimized */}
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link
                  href="/upload"
                  className="group inline-flex items-center justify-center space-x-3 sm:space-x-4 bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 text-white font-semibold py-4 sm:py-5 px-8 sm:px-10 rounded-full text-base sm:text-lg transition-all duration-500 transform hover:scale-105 shadow-premium hover:shadow-glow-lg relative overflow-hidden w-full sm:w-auto"
                >
                  <span className="relative z-10">Démarrer l'analyse</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                  
                  {/* Effet de glow animé */}
                  <div className="absolute inset-0 bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>
                
                {/* Indicateurs de confiance - Alignés horizontalement */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 lg:gap-8 text-sm">
                  <div className="flex items-center space-x-2 text-dermai-neutral-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Gratuit</span>
                  </div>
                  <div className="flex items-center space-x-2 text-dermai-neutral-500">
                    <Clock className="w-4 h-4 text-dermai-ai-500" />
                    <span>2 minutes</span>
                  </div>
                  <div className="flex items-center space-x-2 text-dermai-neutral-500">
                    <Shield className="w-4 h-4 text-dermai-nude-500" />
                    <span>Sécurisé</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Bloc d'analyse d'interface - Repositionné à droite sur desktop */}
            <motion.div
              className="relative w-full max-w-sm mx-auto lg:max-w-none lg:order-2"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative bg-gradient-to-br from-dermai-pure/95 to-dermai-nude-50/80 backdrop-blur-xl border border-dermai-nude-200/30 rounded-3xl p-4 lg:p-6 shadow-premium-lg">
                
                {/* Interface de scan avec vraie image de visage */}
                <div className="relative aspect-[4/5] bg-gradient-to-br from-dermai-nude-100 to-dermai-nude-200/50 rounded-2xl overflow-hidden">
                  
                  {/* Image de visage clean et professionnelle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="w-full h-full bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: `url("/images/face-model.png")`
                      }}
                    />
                    {/* Overlay subtil pour intégration avec l'UI */}
                    <div className="absolute inset-0 bg-dermai-nude-100/10"></div>
                  </div>
                  
                  {/* Effet scan animé - plus réaliste */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-dermai-ai-400/30 to-transparent z-10"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  
                  {/* Grille de scan holographique */}
                  <div className="absolute inset-0 opacity-15 z-10">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="absolute w-full h-px bg-dermai-ai-400" style={{ top: `${(i + 1) * 12.5}%` }}></div>
                    ))}
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="absolute h-full w-px bg-dermai-ai-400" style={{ left: `${(i + 1) * 16.66}%` }}></div>
                    ))}
                  </div>
                  
                  {/* Points d'analyse avec traits et encadrés fixes - Positionnés sur le vrai visage */}
                  <div className="absolute inset-0 z-20">
                    {/* Zone T - Sébum (Front/milieu du visage) */}
                    <div className="absolute top-[25%] left-[50%] -translate-x-1/2">
                      <motion.div 
                        className="w-2.5 h-2.5 bg-dermai-ai-500 rounded-full border border-white shadow-lg"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      {/* Trait en L vers le haut-gauche */}
                      <div className="absolute -top-10 left-1">
                        <div className="w-px h-8 bg-dermai-ai-400"></div>
                      </div>
                      <div className="absolute -top-10 -left-24">
                        <div className="h-px w-24 bg-dermai-ai-400"></div>
                      </div>
                      {/* Encadré avec transparence */}
                      <div className="absolute -top-16 -left-32 bg-dermai-ai-600/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap border border-dermai-ai-400/30">
                        <div className="font-semibold">Zone T</div>
                        <div className="text-dermai-ai-200">Sébum</div>
                      </div>
                    </div>

                    {/* Joue D - Hydratation (Joue droite) */}
                    <div className="absolute top-[45%] left-[65%]">
                      <motion.div 
                        className="w-2.5 h-2.5 bg-dermai-ai-500 rounded-full border border-white shadow-lg"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                      {/* Trait horizontal vers la droite puis vertical vers le bas */}
                      <div className="absolute top-1 left-2">
                        <div className="h-px w-6 bg-dermai-ai-400"></div>
                      </div>
                      <div className="absolute top-1 left-8">
                        <div className="w-px h-6 bg-dermai-ai-400"></div>
                      </div>
                      {/* Encadré avec transparence - bien à l'intérieur */}
                      <div className="absolute top-8 left-2 bg-dermai-ai-600/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap border border-dermai-ai-400/30 z-30">
                        <div className="font-semibold">Joue D</div>
                        <div className="text-dermai-ai-200">Hydratation</div>
                      </div>
                    </div>

                    {/* Menton - Texture (Bas du menton) */}
                    <div className="absolute top-[70%] left-[50%] -translate-x-1/2">
                      <motion.div 
                        className="w-2.5 h-2.5 bg-dermai-ai-500 rounded-full border border-white shadow-lg"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      />
                      {/* Trait vers le bas puis gauche */}
                      <div className="absolute top-2 left-1">
                        <div className="w-px h-8 bg-dermai-ai-400"></div>
                      </div>
                      <div className="absolute top-10 -left-20">
                        <div className="h-px w-20 bg-dermai-ai-400"></div>
                      </div>
                      {/* Encadré avec transparence */}
                      <div className="absolute top-12 -left-32 bg-dermai-ai-600/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap border border-dermai-ai-400/30">
                        <div className="font-semibold">Menton</div>
                        <div className="text-dermai-ai-200">Texture</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Indicateurs tech améliorés - Mobile responsive */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { icon: <Eye className="w-3 h-3" />, label: "Analysé", value: "98%", color: "bg-emerald-100 text-emerald-600" },
                    { icon: <Brain className="w-3 h-3" />, label: "IA", value: "Active", color: "bg-dermai-ai-100 text-dermai-ai-600" },
                    { icon: <Zap className="w-3 h-3" />, label: "Vitesse", value: "2min", color: "bg-amber-100 text-amber-600" },
                  ].map((stat, i) => (
                    <motion.div 
                      key={i} 
                      className="text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 ${stat.color} rounded-lg mx-auto mb-1 shadow-sm`}>
                        {stat.icon}
                      </div>
                      <div className="text-xs text-dermai-neutral-500 font-mono">{stat.label}</div>
                      <div className="text-xs font-semibold text-dermai-neutral-700">{stat.value}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Effet de glow autour du container */}
              <div className="absolute -inset-4 bg-gradient-to-r from-dermai-ai-400/20 via-transparent to-dermai-ai-400/20 rounded-3xl blur-xl -z-10"></div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Section Comment ça marche */}
      <section id="fonctionnement" className="py-16 sm:py-20 lg:py-24 bg-dermai-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-dermai-neutral-900 mb-6">
              Comment
              <span className="block bg-gradient-to-r from-dermai-ai-600 to-dermai-ai-400 bg-clip-text text-transparent">
                ça marche ?
              </span>
            </h2>
            <p className="text-xl text-dermai-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Un processus simple en 3 étapes pour transformer votre routine skincare
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Téléchargez vos photos",
                description: "Prenez simplement 2-3 photos de votre visage avec votre smartphone. Notre guide vous aide à capturer les meilleurs angles pour une analyse optimale.",
                icon: <Camera className="w-8 h-8 text-white" />,
                iconBg: "from-dermai-ai-500 to-dermai-ai-400",
                details: ["Éclairage naturel recommandé", "Visage dégagé", "Plusieurs angles"]
              },
              {
                step: "02", 
                title: "Questionnaire personnalisé",
                description: "Répondez à quelques questions sur votre type de peau, vos préoccupations actuelles et votre routine beauté pour affiner l'analyse.",
                icon: <FileText className="w-8 h-8 text-white" />,
                iconBg: "from-dermai-ai-500 to-dermai-ai-400",
                details: ["5 minutes maximum", "Questions ciblées", "Historique skincare"]
              },
              {
                step: "03",
                title: "Recevez votre diagnostic",
                description: "Notre IA analyse vos données et vous fournit un rapport détaillé avec scores, diagnostic précis et routine personnalisée.",
                icon: <Sparkles className="w-8 h-8 text-white" />,
                iconBg: "from-dermai-ai-500 to-dermai-ai-400",
                details: ["Résultats en 2 minutes", "8 paramètres analysés", "Recommandations produits"]
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="relative md:col-span-1 lg:col-span-1"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                {/* Ligne de connexion - Hidden on mobile */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-12 -right-6 w-12 h-px bg-gradient-to-r from-dermai-ai-300 to-transparent"></div>
                )}
                
                <div className="bg-dermai-pure rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-dermai-nude-200/50 hover:shadow-premium transition-all duration-500 group h-full">
                  <div className="flex items-center mb-4 lg:mb-6">
                    <div className="text-4xl lg:text-6xl font-display font-bold text-dermai-ai-200 mr-3 lg:mr-4">{step.step}</div>
                    <div className={`w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br ${step.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {step.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-xl lg:text-2xl font-display font-bold text-dermai-neutral-900 mb-3 lg:mb-4 group-hover:text-dermai-ai-600 transition-colors">
                    {step.title}
                  </h3>
                  
                  <p className="text-sm lg:text-base text-dermai-neutral-600 leading-relaxed mb-4 lg:mb-6">
                    {step.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-xs lg:text-sm text-dermai-neutral-500">
                        <CheckCircle2 className="w-3 h-3 lg:w-4 lg:h-4 text-dermai-ai-400 mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités avancées */}
      <section className="py-24 bg-dermai-pure">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-dermai-neutral-900 mb-6">
              Technologie
              <span className="block bg-gradient-to-r from-dermai-ai-600 to-dermai-ai-400 bg-clip-text text-transparent">
                de Pointe
              </span>
            </h2>
            <p className="text-xl text-dermai-neutral-600 max-w-3xl mx-auto leading-relaxed">
              L'intelligence artificielle au service de votre beauté
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <Brain className="w-8 h-8 text-dermai-ai-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-display font-semibold text-dermai-neutral-900 mb-2">
                      IA Dermatologique Avancée
                    </h3>
                    <p className="text-dermai-neutral-600 leading-relaxed">
                      Notre modèle d'IA analysé des milliers de profils cutanés pour identifier avec précision vos besoins spécifiques et recommander les meilleurs soins.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Shield className="w-8 h-8 text-dermai-ai-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-display font-semibold text-dermai-neutral-900 mb-2">
                      Analyse Multi-Paramètres
                    </h3>
                    <p className="text-dermai-neutral-600 leading-relaxed">
                      8 paramètres essentiels analysés : hydratation, sébum, texture, pores, rides, taches, sensibilité et éclat pour un diagnostic complet.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Zap className="w-8 h-8 text-dermai-ai-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-display font-semibold text-dermai-neutral-900 mb-2">
                      Recommandations Personnalisées
                    </h3>
                    <p className="text-dermai-neutral-600 leading-relaxed">
                      Routine skincare sur-mesure avec sélection de produits adaptés à votre budget et disponibles en ligne.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-dermai-nude-50 to-dermai-light rounded-3xl p-8 border border-dermai-nude-200/50">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: "Hydratation", value: "85%", color: "bg-blue-500" },
                    { label: "Sébum", value: "42%", color: "bg-yellow-500" },
                    { label: "Texture", value: "78%", color: "bg-green-500" },
                    { label: "Éclat", value: "91%", color: "bg-purple-500" },
                    { label: "Pores", value: "67%", color: "bg-orange-500" },
                    { label: "Sensibilité", value: "23%", color: "bg-red-500" },
                    { label: "Rides", value: "12%", color: "bg-indigo-500" },
                    { label: "Taches", value: "8%", color: "bg-pink-500" },
                  ].map((param, i) => (
                    <motion.div
                      key={i}
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="relative w-16 h-16 mx-auto mb-3">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-dermai-nude-200" />
                          <circle 
                            cx="32" 
                            cy="32" 
                            r="28" 
                            stroke="currentColor" 
                            strokeWidth="4" 
                            fill="none" 
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - parseInt(param.value) / 100)}`}
                            className={param.color.replace('bg-', 'text-')}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-dermai-neutral-800">{param.value}</span>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-dermai-neutral-600">{param.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section id="temoignages" className="py-16 sm:py-20 lg:py-24 bg-dermai-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-dermai-neutral-900 mb-6">
              Ils ont transformé
              <span className="block bg-gradient-to-r from-dermai-ai-600 to-dermai-ai-400 bg-clip-text text-transparent">
                leur routine
              </span>
            </h2>
          </motion.div>

          {/* Stats en chiffres */}
          <motion.div
            className="grid md:grid-cols-4 gap-8 mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {[
              { value: "95%", label: "Précision diagnostic", sublabel: "Validée cliniquement" },
              { value: "3.2K+", label: "Analyses réalisées", sublabel: "Chaque mois" },
              { value: "4.8/5", label: "Note utilisateurs", sublabel: "Satisfaction globale" },
              { value: "2min", label: "Temps d'analyse", sublabel: "Résultats instantanés" }
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                className="text-center bg-dermai-pure rounded-3xl p-8 border border-dermai-nude-200/30 hover:shadow-premium transition-all duration-300"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-4xl lg:text-5xl font-display font-bold bg-gradient-to-r from-dermai-ai-600 to-dermai-ai-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-dermai-neutral-800 mb-1">{stat.label}</div>
                <div className="text-sm text-dermai-neutral-500 font-mono">{stat.sublabel}</div>
              </motion.div>
            ))}
          </motion.div>

                    {/* Témoignages utilisateurs */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
                {
                  quote: "DermAI a révolutionné ma routine skincare. Les recommandations sont ultra-précises et les résultats visibles en quelques semaines seulement.",
                  author: "Sarah M.",
                  age: "26 ans",
                  location: "Paris",
                  avatar: <Users className="w-6 h-6 text-dermai-ai-600" />,
                  avatarBg: "bg-dermai-ai-100",
                  rating: 5,
                  improvement: "Hydratation +40%"
                },
                {
                  quote: "Enfin une analyse qui comprend vraiment ma peau sensible ! Les produits recommandés ont transformé mon quotidien beauté.",
                  author: "Emma L.",
                  age: "34 ans", 
                  location: "Lyon",
                  avatar: <Users className="w-6 h-6 text-dermai-ai-600" />,
                  avatarBg: "bg-dermai-ai-100",
                  rating: 5,
                  improvement: "Rougeurs -60%"
                },
                {
                  quote: "L'IA de DermAI a identifié des problèmes que je n'avais même pas remarqués. Ma routine est maintenant parfaitement adaptée.",
                  author: "Julie R.",
                  age: "29 ans",
                  location: "Marseille", 
                  avatar: <Users className="w-6 h-6 text-dermai-ai-600" />,
                  avatarBg: "bg-dermai-ai-100",
                  rating: 5,
                  improvement: "Texture +50%"
                }
              ].map((testimonial, i) => (
              <motion.div
                key={i}
                className="bg-dermai-pure rounded-3xl p-8 border border-dermai-nude-200/50 hover:shadow-premium transition-all duration-500"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                    {testimonial.improvement}
                  </div>
                </div>
                
                <blockquote className="text-dermai-neutral-700 leading-relaxed mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${testimonial.avatarBg} rounded-full flex items-center justify-center`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-dermai-neutral-800">{testimonial.author}</div>
                    <div className="text-sm text-dermai-neutral-500">{testimonial.age} • {testimonial.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités futures - Preview */}
      <section className="py-24 bg-dermai-pure">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-dermai-neutral-900 mb-6">
              L'avenir de votre
              <span className="block bg-gradient-to-r from-dermai-ai-600 to-dermai-ai-400 bg-clip-text text-transparent">
                routine beauté
              </span>
            </h2>
            <p className="text-xl text-dermai-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Découvrez les fonctionnalités qui arrivent bientôt sur DermAI
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {[
                {
                  title: "Suivi Évolution",
                  description: "Analysez l'évolution de votre peau dans le temps avec des photos comparatives et des rapports de progression personnalisés.",
                  icon: <TrendingUp className="w-8 h-8 text-dermai-ai-600" />,
                  iconBg: "bg-dermai-ai-100",
                  status: "Bientôt disponible"
                },
                {
                  title: "Coach IA Personnel",
                  description: "Un assistant IA disponible 24h/24 pour répondre à vos questions skincare et ajuster votre routine en temps réel.",
                  icon: <Bot className="w-8 h-8 text-dermai-ai-600" />,
                  iconBg: "bg-dermai-ai-100",
                  status: "En développement"
                },
                {
                  title: "Marketplace Intégrée",
                  description: "Commandez directement vos produits recommandés avec des partenariats exclusifs et des prix préférentiels.",
                  icon: <ShoppingBag className="w-8 h-8 text-dermai-ai-600" />,
                  iconBg: "bg-dermai-ai-100",
                  status: "Q2 2024"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className="flex items-start space-x-4 group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={`w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-display font-semibold text-dermai-neutral-900">
                        {feature.title}
                      </h3>
                      <span className="bg-dermai-ai-100 text-dermai-ai-700 text-xs font-medium px-2 py-1 rounded-full">
                        {feature.status}
                      </span>
                    </div>
                    <p className="text-dermai-neutral-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-dermai-nude-50 to-dermai-light rounded-3xl p-8 border border-dermai-nude-200/50 relative overflow-hidden">
                {/* Badge "Coming Soon" */}
                <div className="absolute top-4 right-4 bg-dermai-ai-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Coming Soon
                </div>
                
                {/* Mockup interface */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-dermai-ai-400 rounded-full flex items-center justify-center text-white font-bold">
                      AI
                    </div>
                    <div>
                      <div className="font-semibold text-dermai-neutral-800">Assistant DermAI</div>
                      <div className="text-sm text-dermai-neutral-500">En ligne maintenant</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-dermai-pure rounded-2xl p-4 border border-dermai-nude-200/30">
                      <div className="text-sm text-dermai-neutral-600">
                        "Comment puis-je améliorer l'hydratation de ma zone T ?"
                      </div>
                    </div>
                    
                    <div className="bg-dermai-ai-500 text-white rounded-2xl p-4">
                      <div className="text-sm">
                        "Basé sur votre dernière analyse, je recommande d'ajuster votre routine matin avec un sérum à l'acide hyaluronique..."
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress chart simulation */}
                  <div className="bg-dermai-pure rounded-2xl p-4 border border-dermai-nude-200/30">
                    <div className="text-sm font-semibold text-dermai-neutral-800 mb-3">Progression 30 jours</div>
                    <div className="space-y-2">
                      {[
                        { label: "Hydratation", progress: 75 },
                        { label: "Texture", progress: 60 },
                        { label: "Éclat", progress: 85 }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="text-xs text-dermai-neutral-600 w-20">{item.label}</div>
                          <div className="flex-1 h-2 bg-dermai-nude-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-dermai-ai-400 rounded-full transition-all duration-1000"
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs font-semibold text-dermai-neutral-700">{item.progress}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Final - Premium design */}
      <section className="py-24 bg-gradient-to-br from-dermai-ai-600 via-dermai-ai-500 to-dermai-ai-400 relative overflow-hidden">
        {/* Éléments décoratifs */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6">
              Votre Peau Mérite 
              <span className="block">une Expertise IA</span>
            </h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Découvrez votre profil cutané unique et recevez des recommandations scientifiquement fondées
            </p>
            <Link
              href="/upload"
              className="group inline-flex items-center space-x-4 bg-dermai-pure text-dermai-ai-600 font-semibold py-5 px-10 rounded-full text-lg hover:shadow-premium-lg transition-all duration-500 transform hover:scale-105"
            >
              <span>Commencer maintenant</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer - Minimal et élégant */}
      <footer className="bg-dermai-neutral-900 text-dermai-neutral-400 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a href="/" className="cursor-pointer transition-opacity hover:opacity-80">
                <img 
                  src="/DERMAI-logo.svg" 
                  alt="DermAI" 
                  className="h-8 w-auto brightness-0 invert"
                />
              </a>
            </div>
            <div className="text-sm font-mono">
              © 2024 DermAI • Fondé en Science
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}