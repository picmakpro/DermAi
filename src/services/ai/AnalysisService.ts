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
import { normalizeGPT5DiagnosticResponse, logNormalizationChanges } from '@/utils/gpt5Normalizer'

// ✅ PROMPT V3 (GPT-5 Thinking optimisé)
import { 
  ROUTINE_PERSONNALISEE_SYSTEM_PROMPT_V3, 
  buildRoutineUserPromptV3 
} from './core/prompts/routinePersonnaliseeV3'

// 🔄 PROMPT V2 (ROLLBACK disponible)
// import { ROUTINE_PERSONNALISEE_SYSTEM_PROMPT, buildRoutineUserPrompt } from './core/prompts/routinePersonnalisee'

import type { RoutineContext } from '@/types/questionnaire'
import { SELECTION_PRODUITS_SYSTEM_PROMPT, buildProductSelectionUserPrompt } from './core/prompts/selectionProduits'

// ✅ NOUVELLE CONFIGURATION GPT-5
import { 
  getOpenAIClient, 
  selectModel, 
  hashImages as hashImagesForSeed,
  getModelConfig,
  AI_MODELS 
} from '@/lib/openai-config'

// ✅ VALIDATION POST-GÉNÉRATION (Sprint 2)
import { validateRoutineCompliance, enrichAdviceWithCompromises } from './validators/routineValidator'

// 💰 MONITORING COÛTS (Sprint 4)
import { CostMonitor } from '@/utils/CostMonitor'

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
  // ✅ CLIENT OPENAI LAZY-LOADED (via openai-config)
  private static get openai() {
    return getOpenAIClient()
  }

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
        // ✅ SEED DÉTERMINISTE (nouveau hash depuis openai-config)
        const seed = hashImagesForSeed(photos)
        
        // ✅ SÉLECTION MODÈLE GPT-5 ou fallback GPT-4o
        const modelName = selectModel('DIAGNOSTIC', requestId)
        const modelConfig = getModelConfig('DIAGNOSTIC', requestId)
        
        // 🎯 PROMPTS PROGRESSIFS : Adapter selon la tentative
        // 🎭 SÉLECTION PROMPT (même prompt pour tous les modèles)
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
        
        // ✅ LOGS ENRICHIS GPT-5
        this.logger.info('🤖 APPEL OPENAI ÉTAPE 1:', { 
          requestId,
          operation: 'openai_call',
          stage: 'diagnostic_analysis',
          metadata: {
            attempt,
            model: modelName,  // ✅ GPT-5 ou fallback
            fallbackUsed: modelConfig._meta.isFallback,
            temperature: 0.0,
            seed: seed,
            photosCount: photos.length
          }
        })
        
        const stepStartTime = performance.now()
        
        // ✅ APPEL OPENAI AVEC CONFIG GPT-5
        const isGPT5 = modelName.includes('gpt-5') || modelName.includes('o3')
        const response = await this.openai.chat.completions.create({
          model: modelName,  // ✅ gpt-5 ou gpt-4o
          // Paramètres conditionnels selon le modèle
          ...(isGPT5 
            ? { 
                max_completion_tokens: 4000   // ✅ AUGMENTÉ pour GPT-5
                // Pas de temperature, seed, ou response_format pour GPT-5
              }
            : { 
                max_tokens: 1400,             // ✅ GPT-4o reste à 1400
                temperature: 0.0,
                seed: seed,                   // ✅ Reproductibilité
                response_format: { type: "json_object" }
              }),
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

      const stepDuration = performance.now() - stepStartTime

      // 💰 CALCUL & TRACKING COÛTS
      const costEstimate = CostMonitor.calculateCost(modelName, {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0
      })
      
      const dailySummary = CostMonitor.trackCost(costEstimate)

      // ✅ LOGS ENRICHIS GPT-5 (tokens + durée + modèle + coût)
      this.logger.info('🤖 RÉPONSE OPENAI ÉTAPE 1:', { 
        requestId,
        operation: 'diagnostic_success',
        stage: 'response_received'
      }, {
        model: modelName,
        fallbackUsed: modelConfig._meta.isFallback,
        tokensUsed: response.usage?.total_tokens || 0,
        tokensPrompt: response.usage?.prompt_tokens || 0,
        tokensCompletion: response.usage?.completion_tokens || 0,
        duration_ms: Math.round(stepDuration),
        finishReason: response.choices[0]?.finish_reason,
        responseLength: response.choices[0]?.message?.content?.length || 0,
        // 💰 MÉTRIQUES COÛTS
        cost_usd: costEstimate.cost_usd,
        daily_cost_total_usd: dailySummary.total_usd,
        daily_budget_percentage: dailySummary.percentage_used
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

      // Parser JSON
      const parsedContent = JSON.parse(cleanContent)
      
      // 🔧 NORMALISER si GPT-5 (pour compatibilité Zod)
      const isGPT5Model = modelName.includes('gpt-5') || modelName.includes('o3')
      const contentToValidate = isGPT5Model 
        ? normalizeGPT5DiagnosticResponse(parsedContent)
        : parsedContent
      
      // Log changements si normalisation
      if (isGPT5Model) {
        logNormalizationChanges(parsedContent, contentToValidate, requestId)
      }
      
      // Valider avec Zod
      const validatedDiagnostic = PureDiagnosticSchema.parse(contentToValidate)

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
      // ✅ SÉLECTION MODÈLE GPT-5 THINKING ou fallback GPT-4o
      const modelName = selectModel('ROUTINE', requestId)
      const modelConfig = getModelConfig('ROUTINE', requestId)
      
      // ✅ LOGS DÉBUT ÉTAPE 2
      this.logger.info('🧬 ÉTAPE 2 - Routine personnalisée START:', { 
        requestId,
        operation: 'routine_generation',
        stage: 'start'
      }, {
        attempt,
        model: modelName,
        fallbackUsed: modelConfig._meta.isFallback,
        hasRoutineContext: !!routineContext,
        budgetTier: routineContext?.constraints.budgetTier,
        routineStyle: routineContext?.constraints.style,
        pregnancy: routineContext?.profile.pregnancy,
        uvRiskBand: routineContext?.environment.uvRiskBand
      })
      
      const stepStartTime = performance.now()
      
      // ✅ APPEL OPENAI AVEC GPT-5 THINKING
      const isGPT5 = modelName.includes('gpt-5') || modelName.includes('o3')
      const response = await this.openai.chat.completions.create({
        model: modelName,  // ✅ o3 ou gpt-4o
        // Paramètres conditionnels selon le modèle
        ...(isGPT5 
          ? { 
              max_completion_tokens: 4000      // ✅ GPT-5/o3
              // Pas de temperature ou response_format pour GPT-5
            }
          : { 
              max_tokens: 4000,                // ✅ GPT-4o
              temperature: 0.1,                // ✅ Créativité contrôlée
              response_format: { type: "json_object" }
            }),
        messages: [
          {
            role: 'system',
            content: ROUTINE_PERSONNALISEE_SYSTEM_PROMPT_V3  // ✅ V3: Prompt optimisé GPT-5 Thinking
          },
          {
            role: 'user',
            content: buildRoutineUserPromptV3(  // ✅ V3: Builder enrichi Budget/Style/UV
              diagnostic,
              request.userProfile,
              request.skinConcerns,
              request.constraints,
              routineContext  // ✅ V2: Contexte pregnancy, budget, style, UV
            )
          }
        ]
      })
      
      const stepDuration = performance.now() - stepStartTime
      
      // ✅ LOGS ENRICHIS GPT-5 THINKING (tokens + reasoning_tokens)
      const tokensReasoning = (response.usage as any)?.reasoning_tokens || 0
      
      // 💰 CALCUL & TRACKING COÛTS (avec reasoning_tokens pour GPT-5 Thinking)
      const costEstimate = CostMonitor.calculateCost(modelName, {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        reasoning: tokensReasoning,  // GPT-5 Thinking uniquement
        total: response.usage?.total_tokens || 0
      })
      
      const dailySummary = CostMonitor.trackCost(costEstimate)
      
      this.logger.info('🧬 ÉTAPE 2 - Routine personnalisée SUCCESS:', { 
        requestId,
        operation: 'routine_generation',
        stage: 'success'
      }, {
        model: modelName,
        fallbackUsed: modelConfig._meta.isFallback,
        tokensUsed: response.usage?.total_tokens || 0,
        tokensPrompt: response.usage?.prompt_tokens || 0,
        tokensCompletion: response.usage?.completion_tokens || 0,
        tokensReasoning,  // ✅ NOUVEAU (GPT-5 Thinking uniquement)
        duration_ms: Math.round(stepDuration),
        finishReason: response.choices[0]?.finish_reason,
        // 💰 MÉTRIQUES COÛTS
        cost_usd: costEstimate.cost_usd,
        cost_breakdown: costEstimate.breakdown,
        daily_cost_total_usd: dailySummary.total_usd,
        daily_budget_percentage: dailySummary.percentage_used
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
      let validatedRoutine = PersonalizedRoutineSchema.parse(parsedContent)

      // ✅ VALIDATION COMPLIANCE V2 (si routineContext fourni)
      if (routineContext) {
        const validation = validateRoutineCompliance(validatedRoutine, routineContext)
        
        this.logger.info('🔍 Validation compliance routine', { 
          requestId,
          operation: 'routine_validation',
          stage: 'post_processing'
        }, {
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          metrics: validation.metrics
        })
        
        // ❌ ERREURS CRITIQUES → BLOQUANT
        if (!validation.valid) {
          this.logger.error('❌ Routine non conforme Budget/Style/Sécurité', { requestId }, {
            errors: validation.errors,
            budgetTier: routineContext.constraints.budgetTier,
            routineStyle: routineContext.constraints.style,
            pregnancy: routineContext.profile.pregnancy
          })
          
          throw new Error(
            `Routine non conforme aux contraintes Budget/Style/Sécurité : ${validation.errors.join('; ')}`
          )
        }
        
        // ⚠️ WARNINGS → LOGS (non bloquant)
        if (validation.warnings.length > 0) {
          this.logger.warn('⚠️ Warnings validation (non bloquants)', {
            requestId,
            warnings: validation.warnings
          })
        }
        
        // ✅ ENRICHISSEMENT globalAdvice (si compromis Budget/Style)
        validatedRoutine = enrichAdviceWithCompromises(validatedRoutine, routineContext, validation)
      }

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
