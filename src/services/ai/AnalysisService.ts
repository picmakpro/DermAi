import OpenAI from 'openai'
import crypto from 'crypto'
import { 
  PureDiagnostic, 
  PersonalizedRoutine, 
  ProductSelection, 
  CompleteAnalysisV2,
  PureDiagnosticSchema,
  PersonalizedRoutineSchema,
  ProductSelectionSchema,
  CompleteAnalysisV2Schema
} from '@/schemas/v2'
import { Logger } from '@/utils/Logger'
import { RetryStrategy } from '@/utils/RetryStrategy'
import { CacheManagerV2 } from '@/utils/v2/CacheManagerV2'
import { AssemblyAndValidationService } from './core/AssemblyAndValidationService'
import { AnalysisServiceV3Adapter } from './core/AnalysisServiceV3Adapter'
import { getPromptForAttempt } from './core/prompts/diagnosticPur'
import { ROUTINE_PERSONNALISEE_SYSTEM_PROMPT, buildRoutineUserPrompt } from './core/prompts/routinePersonnalisee'
import type { RoutineContext } from '@/types/questionnaire'
import { SELECTION_PRODUITS_SYSTEM_PROMPT, buildProductSelectionUserPrompt } from './core/prompts/selectionProduits'

// Types pour les requêtes
interface AnalyzeRequest {
  photos: Array<{
    url: string
    type?: string
  }>
  userProfile: {
    age: number
    gender: string
    skinType?: string
  }
  skinConcerns: {
    primary: string[]
    intensity?: string
  }
  constraints: {
    budget: number
    timeAvailable?: string
    allergies?: string[]
    currentRoutine?: string
  }
}

interface PartitionedCatalog {
  [category: string]: Array<{
    catalogId: string
    name: string
    brand: string
    category: string
    price: number
    targetSkinTypes: string[]
    benefits: string[]
    activeIngredients: string[]
    applicationTiming: string
    targetZones: string[]
    restrictions?: string[]
  }>
}

/**
 * Service principal pour l'analyse complète V2 - Architecture IA-First Pure
 * 
 * ARCHITECTURE 4 ÉTAPES :
 * 1. Diagnostic pur (IA OpenAI) - Photos → Diagnostic structuré
 * 2. Routine personnalisée (IA OpenAI) - Diagnostic + Profil → Routine 3 phases
 * 3. Sélection produits (IA OpenAI) - Routine + Catalogue → Produits adaptés
 * 4. Assemblage & validation (Algorithmique) - Cohérence finale
 */
export class AnalysisService {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  private static logger = Logger.getInstance('AnalysisServiceV2')
  private static cache = new CacheManagerV2()

  /**
   * Point d'entrée principal - Analyse complète 4 étapes
   */
  static async analyzeSkinComplete(
    request: AnalyzeRequest,
    routineContext?: RoutineContext  // ✅ NOUVEAU V2: Contexte enrichi optionnel
  ): Promise<CompleteAnalysisV2> {
    const requestId = this.generateRequestId()
    const startTime = performance.now()
    
    // LOG DE DEBUG TRÈS TÔT
    console.log('🚀 AnalysisServiceV2.analyzeSkinComplete APPELÉ!', {
      requestId,
      photosCount: request.photos?.length,
      hasUserProfile: !!request.userProfile,
      hasSkinConcerns: !!request.skinConcerns,
      hasConstraints: !!request.constraints,
      hasRoutineContext: !!routineContext  // ✅ V2
    })

    this.logger.info('🚀 Démarrage analyse complète V2', { 
      requestId
    })

    // ✅ LOG CONTEXTE V2 SI FOURNI
    if (routineContext) {
      this.logger.info('✨ Contexte routine V2 détecté', { 
        requestId,
        operation: 'routine_context_v2',
        stage: 'context_enrichment'
      }, {
        pregnancy: routineContext.profile.pregnancy,
        budgetTier: routineContext.constraints.budgetTier,
        routineStyle: routineContext.constraints.style,
        uvRiskBand: routineContext.environment.uvRiskBand
      })
    }

    try {
      // 🔍 ÉTAPE 1: Diagnostic pur IA
      this.logger.info('🔍 ÉTAPE 1: Diagnostic pur IA', { requestId })
      this.logger.info('📥 INPUT ÉTAPE 1:', { 
        requestId,
        photosCount: request.photos.length,
        photosInfo: request.photos.map(p => ({ url: p.url.substring(0, 50) + '...', type: p.type }))
      })
      
      const diagnostic = await this.performPureDiagnostic(request.photos, requestId)
      
      this.logger.info('📤 OUTPUT ÉTAPE 1 (Diagnostic):', { requestId })
      // console.log('📤 OUTPUT ÉTAPE 1 (Diagnostic) - CONTENU COMPLET:', JSON.stringify(diagnostic, null, 2))
      
      // 🧬 ÉTAPE 2: Routine personnalisée IA  
      this.logger.info('🧬 ÉTAPE 2: Routine personnalisée IA', { requestId })
      this.logger.info('📥 INPUT ÉTAPE 2:', { requestId })
      // console.log('📥 INPUT ÉTAPE 2 - CONTENU COMPLET:', JSON.stringify({
      //   diagnostic,
      //   userProfile: request.userProfile,
      //   skinConcerns: request.skinConcerns,
      //   constraints: request.constraints
      // }, null, 2))
      
      const routine = await this.generatePersonalizedRoutine(diagnostic, request, requestId, routineContext)
      
      this.logger.info('📤 OUTPUT ÉTAPE 2 (Routine):', { requestId })
      // console.log('📤 OUTPUT ÉTAPE 2 (Routine) - CONTENU COMPLET:', JSON.stringify(routine, null, 2))
      
      // 🛍️ ÉTAPE 3: Sélection produits IA
      this.logger.info('🛍️ ÉTAPE 3: Sélection produits IA', { requestId })
      this.logger.info('📥 INPUT ÉTAPE 3:', { requestId })
      // console.log('📥 INPUT ÉTAPE 3 - CONTENU COMPLET:', JSON.stringify({
      //   routine,
      //   constraints: request.constraints,
      //   catalogueInfo: 'Catalogue partitionné V2 chargé'
      // }, null, 2))
      
      const products = await this.selectOptimalProducts(routine, request, requestId)
      
      this.logger.info('📤 OUTPUT ÉTAPE 3 (Produits):', { requestId })
      // console.log('📤 OUTPUT ÉTAPE 3 (Produits) - CONTENU COMPLET:', JSON.stringify(products, null, 2))
      
      // 🎯 ÉTAPE 4: Assemblage et validation V3 OPTIMISÉE
      this.logger.info('🎯 ÉTAPE 4: Assemblage V3 optimisé', { requestId })
      this.logger.info('📥 INPUT ÉTAPE 4:', { requestId })
      
      // Assemblage classique V2
      const finalResult = await AssemblyAndValidationService.assembleCompleteAnalysis(
        diagnostic, 
        routine, 
        products
      )
      
      // Transformation UI V3 (sans casser V2)
      const uiRoutine = AnalysisServiceV3Adapter.transformForUIV3(diagnostic, routine, products)
      
      // Ajouter uiRoutine au résultat final pour compatibilité UI V3
      finalResult.uiRoutine = uiRoutine
      
      this.logger.info('📤 OUTPUT ÉTAPE 4 (Final):', { requestId })
      console.log('📤 OUTPUT ÉTAPE 4 (Final) - CONTENU COMPLET:', JSON.stringify(finalResult, null, 2))

      const totalTime = performance.now() - startTime
      this.logger.info('✅ Analyse complète V2 terminée', { 
        requestId, 
        totalTime: `${totalTime.toFixed(0)}ms`,
        coherenceScore: finalResult.coherenceValidation.overallScore,
        qualityScore: finalResult.qualityMetrics.overallQuality
      })

      return finalResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      this.logger.error('❌ Erreur analyse complète V2', { requestId, error: errorMessage })
      return await this.handleErrorWithFallback(error as Error, request, requestId)
    }
  }

  /**
   * ÉTAPE 1: Diagnostic pur basé uniquement sur les photos
   */
  static async performPureDiagnostic(
    photos: Array<{ url: string; type?: string }>, 
    requestId: string
  ): Promise<PureDiagnostic> {
    const cacheKey = this.cache.generateDiagnosticKey(photos)
    
    // Vérifier cache
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      this.logger.info('📋 Cache hit - Diagnostic', { requestId })
      return PureDiagnosticSchema.parse(cached)
    }

    // Retry logic avec validation
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Générer seed déterministe basé sur les images
        const imageHash = this.generateImageHash(photos)
        const seed = parseInt(imageHash.substring(0, 8), 16) % 2147483647
        
        // 🎯 PROMPTS PROGRESSIFS : Adapter selon la tentative
        const { systemPrompt, userPromptBuilder } = getPromptForAttempt(attempt)
        const userPrompt = userPromptBuilder(photos)
        
        // Logger les détails du prompt avec tentative
        this.logger.info('📝 PROMPT ÉTAPE 1:', { 
          requestId,
          operation: 'diagnostic_prompt',
          stage: 'prompt_generation',
          metadata: {
            attempt,
            promptType: `Tentative ${attempt}/3`,
            userPromptLength: userPrompt.length,
            systemPromptLength: systemPrompt.length
          }
        })
        
        this.logger.info('🤖 APPEL OPENAI ÉTAPE 1:', { 
          requestId,
          operation: 'openai_call',
          stage: 'diagnostic_analysis',
          metadata: {
            attempt,
            model: 'gpt-4o',
            temperature: 0.0,
            seed: seed,
            imageHash: imageHash,
            photosCount: photos.length
          }
        })
        
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          temperature: 0.0,
          max_tokens: 3000,
          seed: seed,
          response_format: { type: "json_object" },
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              ...photos.map(photo => ({
                type: 'image_url' as const,
                image_url: {
                  url: photo.url,
                  detail: 'high' as const
                }
              }))
            ]
          }
        ]
      })

      this.logger.info('🤖 RÉPONSE OPENAI ÉTAPE 1:', { 
        requestId,
        tokensUsed: response.usage?.total_tokens,
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        finishReason: response.choices[0]?.finish_reason,
        responseLength: response.choices[0]?.message?.content?.length
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('Pas de contenu dans la réponse OpenAI')
      }

      this.logger.info('📋 CONTENU BRUT ÉTAPE 1:', { 
        requestId,
        contentPreview: content.substring(0, 200) + '...',
        contentLength: content.length
      })

      // Nettoyer le contenu (supprimer les backticks markdown si présents)
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      this.logger.info('📋 CONTENU NETTOYÉ ÉTAPE 1:', { 
        requestId,
        cleanContentPreview: cleanContent.substring(0, 200) + '...',
        wasMarkdown: cleanContent !== content
      })

      // Parser et valider avec Zod
      const parsedContent = JSON.parse(cleanContent)
      const validatedDiagnostic = PureDiagnosticSchema.parse(parsedContent)

      // Mettre en cache
      await this.cache.set(cacheKey, validatedDiagnostic, 24 * 60 * 60 * 1000) // 24h

      this.logger.info('✅ Diagnostic pur généré', { 
        requestId, 
        skinType: validatedDiagnostic.skinType,
        overallScore: validatedDiagnostic.scores.overall,
        issuesCount: validatedDiagnostic.zoneSpecificIssues.length
      })

        return validatedDiagnostic
        
      } catch (error) {
        lastError = error as Error
        this.logger.warn(`❌ Tentative diagnostic ${attempt}/3 échouée`, { 
          requestId, 
          attempt,
          error: lastError.message,
          errorType: lastError.constructor.name
        })
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
        }
      }
    }
    
    throw lastError || new Error('Échec diagnostic après 3 tentatives')
  }

  /**
   * ÉTAPE 2: Génération routine personnalisée basée sur diagnostic + profil
   */
  static async generatePersonalizedRoutine(
    diagnostic: PureDiagnostic,
    request: AnalyzeRequest,
    requestId: string,
    routineContext?: RoutineContext  // ✅ NOUVEAU V2
  ): Promise<PersonalizedRoutine> {
    const cacheKey = this.cache.generateRoutineKey(diagnostic, request.userProfile)
    
    // Vérifier cache
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      this.logger.info('📋 Cache hit - Routine', { requestId })
      return PersonalizedRoutineSchema.parse(cached)
    }

    // Retry logic pour routine
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.1, // Légère créativité pour personnalisation
        max_tokens: 4000,
        messages: [
          {
            role: 'system',
            content: ROUTINE_PERSONNALISEE_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: buildRoutineUserPrompt(
              diagnostic,
              request.userProfile,
              request.skinConcerns,
              request.constraints,
              routineContext  // ✅ NOUVEAU V2: Passer contexte enrichi
            )
          }
        ]
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('Pas de contenu dans la réponse OpenAI')
      }

      // 🧹 NETTOYER LE CONTENU (même logique que l'étape 1)
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^```/gm, '')
        .replace(/```$/gm, '')
        .trim()

      this.logger.info('📋 CONTENU NETTOYÉ ÉTAPE 2:', { 
        requestId,
        operation: 'routine_cleaning',
        stage: 'json_cleanup',
        metadata: {
          attempt,
          cleanContentPreview: cleanContent.substring(0, 200) + '...',
          wasMarkdown: cleanContent !== content
        }
      })

      // Parser et valider avec Zod
      const parsedContent = JSON.parse(cleanContent)
      const validatedRoutine = PersonalizedRoutineSchema.parse(parsedContent)

      // Mettre en cache
      await this.cache.set(cacheKey, validatedRoutine, 12 * 60 * 60 * 1000) // 12h

      this.logger.info('✅ Routine personnalisée générée', { 
        requestId,
        immediateSteps: validatedRoutine.phases.immediate.steps.length,
        adaptationSteps: validatedRoutine.phases.adaptation.steps.length,
        maintenanceSteps: validatedRoutine.phases.maintenance.steps.length
      })

        return validatedRoutine
        
      } catch (error) {
        lastError = error as Error
        this.logger.warn(`Tentative routine ${attempt}/3 échouée`, { requestId, error: lastError.message })
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1500 * attempt))
        }
      }
    }
    
    throw lastError || new Error('Échec génération routine après 3 tentatives')
  }

  /**
   * ÉTAPE 3: Sélection produits optimale basée sur routine + catalogue
   */
  static async selectOptimalProducts(
    routine: PersonalizedRoutine,
    request: AnalyzeRequest,
    requestId: string
  ): Promise<ProductSelection> {
    // Charger le catalogue partitionné (à implémenter)
    const catalog = await this.loadPartitionedCatalog()
    
    const cacheKey = this.cache.generateProductsKey(routine, request.constraints.budget)
    
    // Vérifier cache
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      this.logger.info('📋 Cache hit - Produits', { requestId })
      return ProductSelectionSchema.parse(cached)
    }

    // Retry logic pour produits
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.0, // Précision maximale pour sélection
        max_tokens: 3500,
        messages: [
          {
            role: 'system',
            content: SELECTION_PRODUITS_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: buildProductSelectionUserPrompt(
              routine,
              catalog,
              { maxBudget: request.constraints.budget },
              request.constraints.allergies || []
            )
          }
        ]
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('Pas de contenu dans la réponse OpenAI')
      }

      // 🧹 NETTOYER LE CONTENU (même logique que les autres étapes)
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^```/gm, '')
        .replace(/```$/gm, '')
        .trim()

      this.logger.info('📋 CONTENU NETTOYÉ ÉTAPE 3:', { 
        requestId,
        operation: 'products_cleaning',
        stage: 'json_cleanup',
        metadata: {
          attempt,
          cleanContentPreview: cleanContent.substring(0, 200) + '...',
          wasMarkdown: cleanContent !== content
        }
      })

      // Parser et valider avec Zod
      const parsedContent = JSON.parse(cleanContent)
      const validatedProducts = ProductSelectionSchema.parse(parsedContent)

      // Mettre en cache
      await this.cache.set(cacheKey, validatedProducts, 6 * 60 * 60 * 1000) // 6h

      this.logger.info('✅ Produits sélectionnés', { 
        requestId,
        productsCount: validatedProducts.selectedProducts.length,
        totalCost: validatedProducts.budgetBreakdown.totalCost,
        budgetRespected: validatedProducts.budgetBreakdown.budgetRespected
      })

        return validatedProducts
        
      } catch (error) {
        lastError = error as Error
        this.logger.warn(`Tentative produits ${attempt}/2 échouée`, { requestId, error: lastError.message })
        
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }
    
    throw lastError || new Error('Échec sélection produits après 2 tentatives')
  }

  /**
   * Gestion d'erreur avec fallback intelligent
   */
  private static async handleErrorWithFallback(
    error: Error,
    request: AnalyzeRequest,
    requestId: string
  ): Promise<CompleteAnalysisV2> {
    this.logger.error('🚨 Activation fallback V2', { requestId, error: error.message })
    
    // TODO: Implémenter fallback statistique basé sur profil utilisateur
    throw new Error(`Analyse V2 échouée: ${error.message}`)
  }

  /**
   * Charger le catalogue partitionné par catégories
   */
  private static async loadPartitionedCatalog(): Promise<PartitionedCatalog> {
    const { CatalogLoaderV2 } = await import('@/services/catalog/CatalogLoaderV2')
    return await CatalogLoaderV2.loadPartitionedCatalog()
  }

  /**
   * Générer un ID unique pour la requête
   */
  private static generateRequestId(): string {
    return `v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Générer un hash déterministe des images pour le seed
   */
  private static generateImageHash(photos: Array<{ url: string }>): string {
    try {
      const photoUrls = photos.map(p => p.url).sort().join('|')
      return crypto.createHash('md5').update(photoUrls).digest('hex').substring(0, 8)
    } catch (error) {
      this.logger.warn('Erreur génération hash images, utilisation fallback', error as Error)
      return `fallback_${Date.now().toString(36)}`
    }
  }

  /**
   * Logger les détails d'un prompt OpenAI
   */
  private static logPromptDetails(stage: string, requestId: string, systemPrompt: string, userPrompt: string) {
    this.logger.info(`📝 PROMPT ${stage}:`, {
      requestId,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      systemPromptPreview: systemPrompt.substring(0, 150) + '...',
      userPromptPreview: userPrompt.substring(0, 150) + '...'
    })
  }
}
