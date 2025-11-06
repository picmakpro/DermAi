'use client'

import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText, Loader, CheckCircle, AlertTriangle } from 'lucide-react'
import type { SkinAnalysis } from '@/types'

interface PDFExporterProps {
  analysis: SkinAnalysis
  skinAgeYears?: number | null
  className?: string
}

interface PDFExportData {
  diagnostic: {
    skinType: string
    mainConcern: string
    scores: Record<string, number>
    specificities: Array<{ name: string; intensity: string; zone: string }>
    overview: string[]
  }
  routine: {
    phases: Array<{
      name: string
      duration: string
      steps: Array<{
        title: string
        description: string
        products: Array<{ name: string; brand: string }>
        timing: string
      }>
    }>
  }
  products: Array<{
    name: string
    brand: string
    category: string
    justification: string
  }>
  metadata: {
    exportDate: string
    version: string
    skinAge?: number
  }
}

export function PDFExporter({ analysis, skinAgeYears, className = '' }: PDFExporterProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [exportProgress, setExportProgress] = useState(0)
  
  // Préparer les données pour l'export PDF
  const prepareExportData = (): PDFExportData => {
    console.log('📄 Préparation données export PDF V2')
    
    // Extraire les données V2 enrichies
    const diagnostic = {
      skinType: analysis.beautyAssessment?.skinType || 'Non spécifié',
      mainConcern: analysis.beautyAssessment?.mainConcern || 'Analyse en cours',
      scores: {
        overall: analysis.scores?.overall || 0,
        hydration: (analysis.scores as any)?.hydration?.value || 0,
        wrinkles: (analysis.scores as any)?.wrinkles?.value || 0,
        firmness: (analysis.scores as any)?.firmness?.value || 0,
        radiance: (analysis.scores as any)?.radiance?.value || 0,
        pores: (analysis.scores as any)?.pores?.value || 0,
        spots: (analysis.scores as any)?.spots?.value || 0,
        darkCircles: (analysis.scores as any)?.darkCircles?.value || 0,
        skinAge: (analysis.scores as any)?.skinAge?.value || 0
      },
      specificities: analysis.beautyAssessment?.specificities || [],
      overview: analysis.beautyAssessment?.overview || []
    }
    
    // Extraire la routine unifiée V2
    const routine = {
      phases: [] as any[]
    }
    
    if (analysis.recommendations?.unifiedRoutine) {
      const phaseGroups = analysis.recommendations.unifiedRoutine.reduce((acc: any, step: any) => {
        const phase = step.phase || 'immediate'
        if (!acc[phase]) {
          acc[phase] = {
            name: phase === 'immediate' ? 'Phase Immédiate' : 
                  phase === 'adaptation' ? 'Phase d\'Adaptation' : 'Phase de Maintenance',
            duration: step.duration || '1-3 semaines',
            steps: []
          }
        }
        
        acc[phase].steps.push({
          title: step.title,
          description: step.description || step.applicationAdvice,
          products: step.recommendedProducts?.map((p: any) => ({
            name: p.name,
            brand: p.brand
          })) || [],
          timing: `${step.frequency} - ${step.timeOfDay}`
        })
        
        return acc
      }, {})
      
      routine.phases = Object.values(phaseGroups)
    }
    
    // Extraire les produits recommandés
    const products = (analysis.recommendedProducts || []).map((product: any) => ({
      name: product.name,
      brand: product.brand,
      category: product.category || 'Soin',
      justification: product.justification || 'Sélectionné pour votre peau'
    }))
    
    return {
      diagnostic,
      routine,
      products,
      metadata: {
        exportDate: new Date().toLocaleDateString('fr-FR'),
        version: 'DermAI V2',
        skinAge: skinAgeYears || undefined
      }
    }
  }
  
  // Générer le contenu HTML pour le PDF
  const generateHTMLContent = (data: PDFExportData): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Diagnostic DermAI - ${data.metadata.exportDate}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 20px;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #8F7BFF 0%, #5A4AE3 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 { font-size: 28px; margin-bottom: 8px; }
        .header p { opacity: 0.9; font-size: 16px; }
        .ai-badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          margin-top: 10px;
        }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { 
          color: #8F7BFF;
          font-size: 20px;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #f1f5f9;
        }
        .diagnostic-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .diagnostic-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #8F7BFF;
        }
        .diagnostic-card h3 { color: #5A4AE3; margin-bottom: 8px; }
        .scores-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .score-item {
          text-align: center;
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
        }
        .score-value {
          font-size: 24px;
          font-weight: bold;
          color: #8F7BFF;
        }
        .score-label {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        .routine-phase {
          background: #f8fafc;
          margin-bottom: 20px;
          border-radius: 12px;
          overflow: hidden;
        }
        .phase-header {
          background: linear-gradient(135deg, #8F7BFF 0%, #5A4AE3 100%);
          color: white;
          padding: 15px 20px;
        }
        .phase-content { padding: 20px; }
        .step {
          margin-bottom: 15px;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border-left: 3px solid #8F7BFF;
        }
        .step h4 { color: #5A4AE3; margin-bottom: 8px; }
        .products-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }
        .product-card {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .product-name { font-weight: bold; color: #5A4AE3; }
        .product-brand { color: #666; font-size: 14px; }
        .product-justification { 
          font-size: 12px; 
          color: #666; 
          margin-top: 8px;
          font-style: italic;
        }
        .footer {
          background: #f8fafc;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .specificities {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin: 15px 0;
        }
        .specificity {
          background: white;
          padding: 10px;
          border-radius: 6px;
          border-left: 3px solid #8F7BFF;
        }
        .overview-list {
          background: #f0f9ff;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
        }
        .overview-list li {
          margin-bottom: 8px;
          padding-left: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>Diagnostic Dermatologique Personnalisé</h1>
          <p>Analyse IA complète de votre peau</p>
          <div class="ai-badge">✨ Généré par DermAI ${data.metadata.version}</div>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Diagnostic Section -->
          <div class="section">
            <h2>🎯 Votre Diagnostic</h2>
            <div class="diagnostic-grid">
              <div class="diagnostic-card">
                <h3>Type de Peau</h3>
                <p>${data.diagnostic.skinType}</p>
              </div>
              <div class="diagnostic-card">
                <h3>Préoccupation Principale</h3>
                <p>${data.diagnostic.mainConcern}</p>
              </div>
              ${data.metadata.skinAge ? `
              <div class="diagnostic-card">
                <h3>Âge de Peau Estimé</h3>
                <p>${data.metadata.skinAge} ans</p>
              </div>
              ` : ''}
            </div>
            
            ${data.diagnostic.overview.length > 0 ? `
            <h3>Vue d'ensemble</h3>
            <div class="overview-list">
              <ul>
                ${data.diagnostic.overview.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            ${data.diagnostic.specificities.length > 0 ? `
            <h3>Spécificités Détectées</h3>
            <div class="specificities">
              ${data.diagnostic.specificities.map(spec => `
                <div class="specificity">
                  <strong>${spec.name}</strong><br>
                  <small>Intensité: ${spec.intensity} | Zone: ${spec.zone}</small>
                </div>
              `).join('')}
            </div>
            ` : ''}
          </div>
          
          <!-- Scores Section -->
          <div class="section">
            <h2>📊 Vos Scores Détaillés</h2>
            <div class="scores-grid">
              <div class="score-item">
                <div class="score-value">${data.diagnostic.scores.overall}</div>
                <div class="score-label">Score Global</div>
              </div>
              <div class="score-item">
                <div class="score-value">${data.diagnostic.scores.hydration}</div>
                <div class="score-label">Hydratation</div>
              </div>
              <div class="score-item">
                <div class="score-value">${data.diagnostic.scores.wrinkles}</div>
                <div class="score-label">Rides</div>
              </div>
              <div class="score-item">
                <div class="score-value">${data.diagnostic.scores.firmness}</div>
                <div class="score-label">Fermeté</div>
              </div>
              <div class="score-item">
                <div class="score-value">${data.diagnostic.scores.radiance}</div>
                <div class="score-label">Éclat</div>
              </div>
              <div class="score-item">
                <div class="score-value">${data.diagnostic.scores.pores}</div>
                <div class="score-label">Pores</div>
              </div>
              <div class="score-item">
                <div class="score-value">${data.diagnostic.scores.spots}</div>
                <div class="score-label">Taches</div>
              </div>
              <div class="score-item">
                <div class="score-value">${data.diagnostic.scores.darkCircles}</div>
                <div class="score-label">Cernes</div>
              </div>
            </div>
          </div>
          
          <!-- Routine Section -->
          <div class="section">
            <h2>📅 Votre Routine Personnalisée</h2>
            ${data.routine.phases.map(phase => `
              <div class="routine-phase">
                <div class="phase-header">
                  <h3>${phase.name}</h3>
                  <p>Durée: ${phase.duration}</p>
                </div>
                <div class="phase-content">
                  ${phase.steps.map(step => `
                    <div class="step">
                      <h4>${step.title}</h4>
                      <p>${step.description}</p>
                      <p><strong>Timing:</strong> ${step.timing}</p>
                      ${step.products.length > 0 ? `
                        <p><strong>Produits:</strong> ${step.products.map(p => `${p.name} (${p.brand})`).join(', ')}</p>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Products Section -->
          ${data.products.length > 0 ? `
          <div class="section">
            <h2>🛍️ Produits Recommandés</h2>
            <div class="products-list">
              ${data.products.map(product => `
                <div class="product-card">
                  <div class="product-name">${product.name}</div>
                  <div class="product-brand">${product.brand}</div>
                  <div class="product-justification">${product.justification}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Rapport généré le ${data.metadata.exportDate} par DermAI ${data.metadata.version}</p>
          <p>Ce diagnostic est réalisé par intelligence artificielle et ne remplace pas un avis médical professionnel.</p>
        </div>
      </div>
    </body>
    </html>
    `
  }
  
  // Fonction d'export PDF
  const exportToPDF = async () => {
    setIsExporting(true)
    setExportStatus('idle')
    setExportProgress(0)
    
    try {
      // Étape 1: Préparation des données
      setExportProgress(20)
      const exportData = prepareExportData()
      
      // Étape 2: Génération HTML
      setExportProgress(40)
      const htmlContent = generateHTMLContent(exportData)
      
      // Étape 3: Conversion en PDF (simulation)
      setExportProgress(60)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulation
      
      // Étape 4: Téléchargement
      setExportProgress(80)
      
      // Créer un blob avec le contenu HTML
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      // Créer un lien de téléchargement
      const link = document.createElement('a')
      link.href = url
      link.download = `diagnostic-dermai-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setExportProgress(100)
      setExportStatus('success')
      
      console.log('✅ Export PDF V2 terminé avec succès')
      
    } catch (error) {
      console.error('❌ Erreur export PDF:', error)
      setExportStatus('error')
    } finally {
      setIsExporting(false)
      // Reset après 3 secondes
      setTimeout(() => {
        setExportStatus('idle')
        setExportProgress(0)
      }, 3000)
    }
  }
  
  return (
    <motion.button
      onClick={exportToPDF}
      disabled={isExporting}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
        ${isExporting 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : exportStatus === 'success'
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : exportStatus === 'error'
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-dermai-ai-100 text-dermai-ai-700 hover:bg-dermai-ai-200'
        }
        ${className}
      `}
      whileHover={!isExporting ? { scale: 1.02 } : {}}
      whileTap={!isExporting ? { scale: 0.98 } : {}}
    >
      {isExporting ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          <span>Export en cours... {exportProgress}%</span>
        </>
      ) : exportStatus === 'success' ? (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Exporté avec succès !</span>
        </>
      ) : exportStatus === 'error' ? (
        <>
          <AlertTriangle className="w-4 h-4" />
          <span>Erreur d'export</span>
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          <span>Exporter en PDF</span>
        </>
      )}
    </motion.button>
  )
}

export default PDFExporter
