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
      {/* Header Navigation - Responsive with mobile menu */}
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

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#how-it-works" className="text-dermai-neutral-600 hover:text-dermai-ai-600 transition-all duration-300 font-medium tracking-wide">
                How it works
              </a>
              <a href="#testimonials" className="text-dermai-neutral-600 hover:text-dermai-ai-600 transition-all duration-300 font-medium tracking-wide">
                Testimonials
              </a>
              <Link
                href="/upload"
                className="group relative bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 text-white px-8 py-3.5 rounded-full font-semibold tracking-wide hover:shadow-glow-lg transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10">Analyze</span>
                <div className="absolute inset-0 bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-dermai-neutral-600 hover:text-dermai-ai-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
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
                    href="#how-it-works" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 px-4 text-dermai-neutral-600 hover:text-dermai-ai-600 hover:bg-dermai-nude-50 rounded-2xl transition-all duration-300 font-medium"
                  >
                    How it works
                  </a>
                  <a 
                    href="#testimonials" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-3 px-4 text-dermai-neutral-600 hover:text-dermai-ai-600 hover:bg-dermai-nude-50 rounded-2xl transition-all duration-300 font-medium"
                  >
                    Testimonials
                  </a>
                  <Link
                    href="/upload"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-center bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-premium"
                  >
                    Start analysis
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section - “clean lab” effect with holographic scan */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Subtle background with animated particles */}
        <div className="absolute inset-0 bg-gradient-to-br from-dermai-pure via-dermai-light to-dermai-nude-50"></div>
        
        {/* Floating AI particles - more visible and numerous */}
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
            // New particles
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
            
            {/* Text content - Modern responsive typography */}
            <motion.div
              className="space-y-8 lg:space-y-10 text-center lg:text-left lg:order-1"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* “New tech” badge */}
              <motion.div
                className="inline-flex items-center space-x-2 sm:space-x-3 bg-dermai-nude-100/50 backdrop-blur-sm border border-dermai-nude-200 rounded-full px-3 sm:px-5 py-2 sm:py-2.5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-dermai-ai-500" />
                <span className="text-xs sm:text-sm text-dermai-neutral-700 font-medium">Next-generation analysis</span>
              </motion.div>
              
              {/* Main heading - Responsive display typography */}
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight text-dermai-neutral-900">
                  AI Partner
                  <span className="block bg-gradient-to-r from-dermai-ai-600 via-dermai-ai-500 to-dermai-ai-400 bg-clip-text text-transparent">
                    Beauty, grounded in
                  </span>
                  <span className="block text-dermai-neutral-600 text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl">Science</span>
                </h1>
                
                <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-dermai-neutral-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
                  Accurate assessment. Confidence in yourself. <br className="hidden sm:block" />
                  <span className="text-dermai-neutral-800 font-medium">A personalized, science-based approach.</span>
                </p>
              </div>

              {/* Premium CTA with glassmorphism - Mobile optimized */}
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
                  <span className="relative z-10">Start analysis</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                  
                  {/* Animated glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>
                
                {/* Trust indicators - Horizontally aligned */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 lg:gap-8 text-sm">
                  <div className="flex items-center space-x-2 text-dermai-neutral-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Free</span>
                  </div>
                  <div className="flex items-center space-x-2 text-dermai-neutral-500">
                    <Clock className="w-4 h-4 text-dermai-ai-500" />
                    <span>2 minutes</span>
                  </div>
                  <div className="flex items-center space-x-2 text-dermai-neutral-500">
                    <Shield className="w-4 h-4 text-dermai-nude-500" />
                    <span>Secure</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Analysis UI block - Positioned right on desktop */}
            <motion.div
              className="relative w-full max-w-sm mx-auto lg:max-w-none lg:order-2"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative bg-gradient-to-br from-dermai-pure/95 to-dermai-nude-50/80 backdrop-blur-xl border border-dermai-nude-200/30 rounded-3xl p-4 lg:p-6 shadow-premium-lg">
                
                {/* Scan interface with real face image */}
                <div className="relative aspect-[4/5] bg-gradient-to-br from-dermai-nude-100 to-dermai-nude-200/50 rounded-2xl overflow-hidden">
                  
                  {/* Clean, professional face image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="w-full h-full bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: `url("/images/face-model.png")`
                      }}
                    />
                    {/* Subtle overlay to blend with the UI */}
                    <div className="absolute inset-0 bg-dermai-nude-100/10"></div>
                  </div>
                  
                  {/* Animated scan effect – more realistic */}
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
                  
                  {/* Holographic scan grid */}
                  <div className="absolute inset-0 opacity-15 z-10">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="absolute w-full h-px bg-dermai-ai-400" style={{ top: `${(i + 1) * 12.5}%` }}></div>
                    ))}
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="absolute h-full w-px bg-dermai-ai-400" style={{ left: `${(i + 1) * 16.66}%` }}></div>
                    ))}
                  </div>
                  
                  {/* Analysis points with callouts – positioned on the face */}
                  <div className="absolute inset-0 z-20">
                    {/* T-zone – Sebum (forehead/mid-face) */}
                    <div className="absolute top-[25%] left-[50%] -translate-x-1/2">
                      <motion.div 
                        className="w-2.5 h-2.5 bg-dermai-ai-500 rounded-full border border-white shadow-lg"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      {/* L-shaped line up-left */}
                      <div className="absolute -top-10 left-1">
                        <div className="w-px h-8 bg-dermai-ai-400"></div>
                      </div>
                      <div className="absolute -top-10 -left-24">
                        <div className="h-px w-24 bg-dermai-ai-400"></div>
                      </div>
                      {/* Translucent callout */}
                      <div className="absolute -top-16 -left-32 bg-dermai-ai-600/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap border border-dermai-ai-400/30">
                        <div className="font-semibold">T-zone</div>
                        <div className="text-dermai-ai-200">Sebum</div>
                      </div>
                    </div>

                    {/* Right cheek – Hydration */}
                    <div className="absolute top-[45%] left-[65%]">
                      <motion.div 
                        className="w-2.5 h-2.5 bg-dermai-ai-500 rounded-full border border-white shadow-lg"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                      {/* Horizontal then vertical line */}
                      <div className="absolute top-1 left-2">
                        <div className="h-px w-6 bg-dermai-ai-400"></div>
                      </div>
                      <div className="absolute top-1 left-8">
                        <div className="w-px h-6 bg-dermai-ai-400"></div>
                      </div>
                      {/* Translucent callout – well inside */}
                      <div className="absolute top-8 left-2 bg-dermai-ai-600/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap border border-dermai-ai-400/30 z-30">
                        <div className="font-semibold">Right Cheek</div>
                        <div className="text-dermai-ai-200">Hydration</div>
                      </div>
                    </div>

                    {/* Chin – Texture */}
                    <div className="absolute top-[70%] left-[50%] -translate-x-1/2">
                      <motion.div 
                        className="w-2.5 h-2.5 bg-dermai-ai-500 rounded-full border border-white shadow-lg"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      />
                      {/* Line down then left */}
                      <div className="absolute top-2 left-1">
                        <div className="w-px h-8 bg-dermai-ai-400"></div>
                      </div>
                      <div className="absolute top-10 -left-20">
                        <div className="h-px w-20 bg-dermai-ai-400"></div>
                      </div>
                      {/* Translucent callout */}
                      <div className="absolute top-12 -left-32 bg-dermai-ai-600/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap border border-dermai-ai-400/30">
                        <div className="font-semibold">Chin</div>
                        <div className="text-dermai-ai-200">Texture</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Improved tech indicators – Mobile responsive */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { icon: <Eye className="w-3 h-3" />, label: "Analyzed", value: "98%", color: "bg-emerald-100 text-emerald-600" },
                    { icon: <Brain className="w-3 h-3" />, label: "AI", value: "Active", color: "bg-dermai-ai-100 text-dermai-ai-600" },
                    { icon: <Zap className="w-3 h-3" />, label: "Speed", value: "2min", color: "bg-amber-100 text-amber-600" },
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
              
              {/* Glow effect around container */}
              <div className="absolute -inset-4 bg-gradient-to-r from-dermai-ai-400/20 via-transparent to-dermai-ai-400/20 rounded-3xl blur-xl -z-10"></div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-dermai-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-dermai-neutral-900 mb-6">
              How
              <span className="block bg-gradient-to-r from-dermai-ai-600 to-dermai-ai-400 bg-clip-text text-transparent">
                it works
              </span>
            </h2>
            <p className="text-xl text-dermai-neutral-600 max-w-3xl mx-auto leading-relaxed">
              A simple 3-step process to transform your skincare routine
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Upload your photos",
                description: "Simply take 2–3 photos of your face with your smartphone. Our guide helps you capture the best angles for optimal analysis.",
                icon: <Camera className="w-8 h-8 text-white" />,
                iconBg: "from-dermai-ai-500 to-dermai-ai-400",
                details: ["Natural light recommended", "Face unobstructed", "Multiple angles"]
              },
              {
                step: "02", 
                title: "Personalized questionnaire",
                description: "Answer a few questions about your skin type, current concerns, and routine to refine the analysis.",
                icon: <FileText className="w-8 h-8 text-white" />,
                iconBg: "from-dermai-ai-500 to-dermai-ai-400",
                details: ["Max 5 minutes", "Targeted questions", "Skincare history"]
              },
              {
                step: "03",
                title: "Get your assessment",
                description: "Our AI analyzes your data and provides a detailed report with scores, precise assessment, and a personalized routine.",
                icon: <Sparkles className="w-8 h-8 text-white" />,
                iconBg: "from-dermai-ai-500 to-dermai-ai-400",
                details: ["Results in 2 minutes", "8 parameters analyzed", "Product recommendations"]
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
                {/* Connector line – hidden on mobile */}
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

      {/* Advanced features section */}
      <section className="py-24 bg-dermai-pure">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-dermai-neutral-900 mb-6">
              Cutting-edge
              <span className="block bg-gradient-to-r from-dermai-ai-600 to-dermai-ai-400 bg-clip-text text-transparent">
                Technology
              </span>
            </h2>
            <p className="text-xl text-dermai-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Artificial intelligence at the service of your beauty
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
                      Advanced Dermatology AI
                    </h3>
                    <p className="text-dermai-neutral-600 leading-relaxed">
                      Our AI model has analyzed thousands of skin profiles to precisely identify your specific needs and recommend the best care.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Shield className="w-8 h-8 text-dermai-ai-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-display font-semibold text-dermai-neutral-900 mb-2">
                      Multi-parameter Analysis
                    </h3>
                    <p className="text-dermai-neutral-600 leading-relaxed">
                      8 key parameters analyzed: hydration, sebum, texture, pores, wrinkles, dark spots, sensitivity, and radiance for a complete assessment.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Zap className="w-8 h-8 text-dermai-ai-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-display font-semibold text-dermai-neutral-900 mb-2">
                      Personalized Recommendations
                    </h3>
                    <p className="text-dermai-neutral-600 leading-relaxed">
                      A tailored skincare routine with products matched to your budget and available online.
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
                    { label: "Hydration", value: "85%", color: "bg-blue-500" },
                    { label: "Sebum", value: "42%", color: "bg-yellow-500" },
                    { label: "Texture", value: "78%", color: "bg-green-500" },
                    { label: "Radiance", value: "91%", color: "bg-purple-500" },
                    { label: "Pores", value: "67%", color: "bg-orange-500" },
                    { label: "Sensitivity", value: "23%", color: "bg-red-500" },
                    { label: "Wrinkles", value: "12%", color: "bg-indigo-500" },
                    { label: "Dark spots", value: "8%", color: "bg-pink-500" },
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

      {/* Testimonials section */}
      <section id="testimonials" className="py-16 sm:py-20 lg:py-24 bg-dermai-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-dermai-neutral-900 mb-6">
              They transformed
              <span className="block bg-gradient-to-r from-dermai-ai-600 to-dermai-ai-400 bg-clip-text text-transparent">
                their routine
              </span>
            </h2>
          </motion.div>

          {/* Number stats */}
          <motion.div
            className="grid md:grid-cols-4 gap-8 mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {[
              { value: "95%", label: "Assessment accuracy", sublabel: "Clinically validated" },
              { value: "3.2K+", label: "Analyses completed", sublabel: "Per month" },
              { value: "4.8/5", label: "User rating", sublabel: "Overall satisfaction" },
              { value: "2min", label: "Analysis time", sublabel: "Instant results" }
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

          {/* User testimonials */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
                {
                  quote: "DermAI revolutionized my skincare routine. The recommendations are ultra-precise and the results were visible within just a few weeks.",
                  author: "Sarah M.",
                  age: "26",
                  location: "Paris",
                  avatar: <Users className="w-6 h-6 text-dermai-ai-600" />,
                  avatarBg: "bg-dermai-ai-100",
                  rating: 5,
                  improvement: "Hydration +40%"
                },
                {
                  quote: "Finally, an analysis that really understands my sensitive skin! The recommended products transformed my daily routine.",
                  author: "Emma L.",
                  age: "34", 
                  location: "Lyon",
                  avatar: <Users className="w-6 h-6 text-dermai-ai-600" />,
                  avatarBg: "bg-dermai-ai-100",
                  rating: 5,
                  improvement: "Redness −60%"
                },
                {
                  quote: "DermAI’s AI identified issues I hadn’t even noticed. My routine is now perfectly tailored.",
                  author: "Julie R.",
                  age: "29",
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

      {/* Future features – preview */}
      <section className="py-24 bg-dermai-pure">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-dermai-neutral-900 mb-6">
              The future of your
              <span className="block bg-gradient-to-r from-dermai-ai-600 to-dermai-ai-400 bg-clip-text text-transparent">
                beauty routine
              </span>
            </h2>
            <p className="text-xl text-dermai-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Discover the features coming soon to DermAI
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
                  title: "Progress Tracking",
                  description: "Analyze how your skin evolves over time with side-by-side photos and personalized progress reports.",
                  icon: <TrendingUp className="w-8 h-8 text-dermai-ai-600" />,
                  iconBg: "bg-dermai-ai-100",
                  status: "Coming soon"
                },
                {
                  title: "Personal AI Coach",
                  description: "An AI assistant available 24/7 to answer skincare questions and adjust your routine in real time.",
                  icon: <Bot className="w-8 h-8 text-dermai-ai-600" />,
                  iconBg: "bg-dermai-ai-100",
                  status: "In development"
                },
                {
                  title: "Integrated Marketplace",
                  description: "Order your recommended products directly with exclusive partnerships and preferential pricing.",
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
                {/* “Coming Soon” badge */}
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
                      <div className="font-semibold text-dermai-neutral-800">DermAI Assistant</div>
                      <div className="text-sm text-dermai-neutral-500">Online now</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-dermai-pure rounded-2xl p-4 border border-dermai-nude-200/30">
                      <div className="text-sm text-dermai-neutral-600">
                        "How can I improve hydration in my T-zone?"
                      </div>
                    </div>
                    
                    <div className="bg-dermai-ai-500 text-white rounded-2xl p-4">
                      <div className="text-sm">
                        "Based on your latest analysis, I recommend adjusting your morning routine with a hyaluronic acid serum…"
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress chart simulation */}
                  <div className="bg-dermai-pure rounded-2xl p-4 border border-dermai-nude-200/30">
                    <div className="text-sm font-semibold text-dermai-neutral-800 mb-3">30-day Progress</div>
                    <div className="space-y-2">
                      {[
                        { label: "Hydration", progress: 75 },
                        { label: "Texture", progress: 60 },
                        { label: "Radiance", progress: 85 }
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

      {/* Final CTA – premium design */}
      <section className="py-24 bg-gradient-to-br from-dermai-ai-600 via-dermai-ai-500 to-dermai-ai-400 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6">
              Your Skin Deserves 
              <span className="block">AI Expertise</span>
            </h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Discover your unique skin profile and receive science-backed recommendations
            </p>
            <Link
              href="/upload"
              className="group inline-flex items-center space-x-4 bg-dermai-pure text-dermai-ai-600 font-semibold py-5 px-10 rounded-full text-lg hover:shadow-premium-lg transition-all duration-500 transform hover:scale-105"
            >
              <span>Start now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer – minimal and elegant */}
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
              © 2024 DermAI • Founded on Science
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
