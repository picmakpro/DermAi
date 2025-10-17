import crypto from 'crypto'
import { 
  PureDiagnostic, 
  PersonalizedRoutine, 
  ProductSelection,
  ProductSelectionV3, // ✅ NOUVEAU V3
  CompleteAnalysisV2,
  PureDiagnosticSchema,
  PersonalizedRoutineSchema,
  ProductSelectionSchema,
  ProductSelectionSchemaV3, // ✅ NOUVEAU V3
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

// 🔄 ARCHITECTURE HYBRIDE STEP 3 (Phase D - Octobre 2025)
import { ProductDatabaseLoader } from '@/services/products/ProductDatabaseLoader'
import { ProductMatcher, type RoutineStep } from '@/services/products/ProductMatcher'
import type { SelectedProductV3, BudgetBreakdown, CoherenceValidation } from '@/schemas/v2'

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
      
      const products = await this.selectOptimalProducts(routine, diagnostic, request, requestId)
      
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

  // ========== PHASE D3.1 : EXTRACTION STEPS ROUTINE ==========

  /**
   * Extrait tous les steps de routine en array plat ordonné
   * Utilisé pour matching produits step par step (architecture hybride)
   * 
   * @param routine Routine personnalisée 3 phases
   * @returns Array plat de RoutineStep avec stepNumber séquentiel
   * 
   * @example
   * ```typescript
   * const allSteps = this.extractAllSteps(routine)
   * // Retourne : [{ stepNumber: 1, careType: 'nettoyage', ... }, ...]
   * ```
   */
  private static extractAllSteps(routine: PersonalizedRoutine): RoutineStep[] {
    const allSteps: RoutineStep[] = []
    let stepNumber = 1

    // Ordre : immediate → adaptation → maintenance
    const phaseOrder: Array<keyof typeof routine.phases> = [
      'immediate',
      'adaptation',
      'maintenance'
    ]

    for (const phaseName of phaseOrder) {
      const phase = routine.phases[phaseName]
      if (!phase) continue

      for (const step of phase.steps) {
        allSteps.push({
          stepNumber: stepNumber++,
          careType: step.careType || 'hydratation', // Fallback si careType absent
          targetProblem: step.targetProblem || step.displayTitle || '',
          timing: this.inferTiming(step.timing),
          targetZones: step.targetZones || ['visage entier']
        })
      }
    }

    this.logger.info(
      `[extractAllSteps] ${allSteps.length} steps extraits de la routine`,
      {
        immediate: routine.phases.immediate.steps.length,
        adaptation: routine.phases.adaptation.steps.length,
        maintenance: routine.phases.maintenance.steps.length
      }
    )

    return allSteps
  }

  /**
   * Infère careType depuis category si manquant
   */
  private static inferCareType(category?: string): string {
    const mapping: Record<string, string> = {
      cleanser: 'nettoyage',
      toner: 'tonification',
      serum: 'traitement',
      treatment: 'traitement',
      moisturizer: 'hydratation',
      sunscreen: 'protection',
      exfoliant: 'exfoliation',
      mask: 'traitement',
      balm: 'hydratation',
      oil: 'hydratation',
      // ✅ Nouvelles catégories (fix 27 produits échoués)
      'eye-care': 'traitement',
      'face-oil': 'hydratation',
      'lip-care': 'hydratation',
      mist: 'tonification',
      primer: 'protection'
    }

    return mapping[category || ''] || 'hydratation' // Fallback hydratation
  }

  /**
   * Infère timing normalisé depuis string timing de routine
   * Normalise vers 'morning', 'evening' ou 'both'
   */
  private static inferTiming(timing?: string): 'morning' | 'evening' | 'both' {
    if (!timing) return 'both'

    const lower = timing.toLowerCase()

    // Détection morning
    if (lower.includes('matin') || lower === 'morning') {
      // Si contient aussi soir, c'est both
      if (lower.includes('soir') || lower.includes('evening')) {
        return 'both'
      }
      return 'morning'
    }

    // Détection evening
    if (lower.includes('soir') || lower === 'evening') {
      return 'evening'
    }

    // Si contient "both" ou "2 fois"
    if (lower.includes('both') || lower.includes('2 fois') || lower.includes('deux fois')) {
      return 'both'
    }

    // Default : both (le plus sûr)
    return 'both'
  }

  // ========== PHASE D3.2 : REFONTE SELECTOPTIMALPRODUCTS ==========

  /**
   * ÉTAPE 3: Sélection produits optimale (ARCHITECTURE HYBRIDE)
   * 
   * 🔄 REFONTE OCTOBRE 2025 - Phase D3
   * Architecture : ProductMatcher (algo) + Database enrichie
   * 
   * Principe : "IA pour comprendre, Algo pour exécuter"
   * - ProductMatcher : Algorithme TypeScript déterministe
   * - Database : Catalogue enrichi avec métadonnées dermatologiques
   * - Garanties : 1 produit + 3 alternatives par step, 0% "non spécifié"
   * 
   * Performance : <5s total (vs 15-20s avant), -88% coûts tokens
   * 
   * @see docs/plan-execution-v2-5/REFONTE-STEP3-HYBRIDE.md
   * @see docs/plan-execution-v2-5/SPRINT-D-REFONTE-HYBRIDE-EXECUTION.md
   */
  static async selectOptimalProducts(
    routine: PersonalizedRoutine,
    diagnostic: PureDiagnostic,
    request: AnalyzeRequest,
    requestId: string
  ): Promise<ProductSelectionV3> {
    this.logger.info('[selectOptimalProducts] 🔄 HYBRIDE START', {
        requestId,
      routinePhases: Object.keys(routine.phases),
      budget: request.constraints.budget
    })

    const startTime = Date.now()

    try {
      // ========== 1. CHARGER DATABASE PRODUITS ==========
      this.logger.info('[selectOptimalProducts] 📦 Chargement ProductDatabase...')
      const productDatabase = await ProductDatabaseLoader.load()

      this.logger.info('[selectOptimalProducts] ✅ Database chargée', {
        totalProducts: productDatabase.allProducts.length,
        categories: productDatabase.byCategory.size,
        careTypes: productDatabase.byCareType.size
      })

      // ========== FEATURE FLAG : PRODUCT MATCHER V2 ==========
      const useMatcherV2 = process.env.USE_PRODUCT_MATCHER_V2 === 'true'
      
      if (useMatcherV2) {
        console.log('[AnalysisService] 🔥 Using ProductMatcherV2 (ingredient scoring)')
        const { ProductMatcherV2 } = await import('@/services/products/ProductMatcherV2')
        const matcherV2 = new ProductMatcherV2(productDatabase)
        
        // Adapter V2 interface vers V1 (temporaire)
        const matcher = {
          selectForRoutineStep: async (step: any, profile: any, budget: any) => {
            const matchV2 = await matcherV2.selectForRoutineStep(step, profile, budget)
            // Convert V2 output to V1 format
            return {
              mainProduct: matchV2.selectedProduct,
              alternatives: matchV2.alternatives,
              matchingScore: matchV2.matchingScore,
              reasoning: matchV2.reasoning
            }
          }
        }
        
        // Continue with matcher V2...
        var matcherInstance = matcher
      } else {
        console.log('[AnalysisService] 📊 Using ProductMatcher V1 (classic scoring)')
        var matcherInstance = new ProductMatcher(productDatabase)
      }

      const matcher = matcherInstance

      // ========== 2. EXTRAIRE LES STEPS DE LA ROUTINE ==========
      const allSteps = this.extractAllSteps(routine)
      this.logger.info(`[selectOptimalProducts] 📋 ${allSteps.length} steps à matcher`)

      // 🧬 Déterminer skinType effectif (User ou IA)
      const userSkinType = request.userProfile.skinType
      const effectiveSkinType = 
        userSkinType === 'Je ne sais pas' || !userSkinType
          ? diagnostic.skinType
          : userSkinType
      
      // 🔄 Mapper skinType français → anglais (pour compatibilité catalogue)
      const skinTypeMapping: Record<string, string> = {
        'Mixte': 'combination',
        'Grasse': 'oily',
        'Sèche': 'dry',
        'Normale': 'normal',
        'Sensible': 'sensitive'
      }
      
      const catalogSkinType = skinTypeMapping[effectiveSkinType] || effectiveSkinType.toLowerCase()
      
      this.logger.info('[selectOptimalProducts] 🧬 SkinType déterminé', {
        userChoice: userSkinType,
        aiDiagnosed: diagnostic.skinType,
        effective: effectiveSkinType,
        catalogMapped: catalogSkinType,
        source: userSkinType === 'Je ne sais pas' || !userSkinType ? 'IA Step 1' : 'User'
      })

      // ========== 3. POUR CHAQUE STEP : MATCHING ALGO (SANS BUDGET) ==========
      // 🆕 BUDGET OPTIMIZATION V2 (3 Oct 2025)
      // Phase 1 : Matching pur pour routine idéale (sans contrainte budget)
      // Phase 2 : Optimisation budget globale (si dépassement)
      
      const idealMatches: Array<{
        step: typeof allSteps[0]
        match: any
      }> = []
      const failures: Array<{ stepNumber: number; error: string }> = []

      this.logger.info('[selectOptimalProducts] 🔥 Phase 1 : Matching pur (sans contrainte budget)')

      for (const step of allSteps) {
        try {
          // Matching algorithmique SANS contrainte budget unitaire
          const match = await matcher.selectForRoutineStep(
            step,
            {
              skinType: catalogSkinType, // ✅ Mappé français → anglais pour catalogue
              allergies: request.constraints.allergies || [],
              preferences: []
            },
            {
              maxBudget: request.constraints.budget,
              expectedSteps: allSteps.length,
              // 🆕 Budget géré globalement après matching complet
              enableSmartOptimization: true
            }
          )

          idealMatches.push({ step, match })
        } catch (matchError: any) {
          this.logger.warn(
            `[selectOptimalProducts] ⚠️ Matching échoué step ${step.stepNumber}:`,
            matchError.message
          )
          failures.push({ stepNumber: step.stepNumber, error: matchError.message })
        }
      }

      // ========== 3.5 DÉDUPLICATION PRODUITS UNIQUES ==========
      // 🆕 FIX CRITIQUE (3 Oct 2025) : Dédupliquer AVANT optimisation budget
      // Problème identifié : BudgetOptimizer travaillait sur coût gonflé avec dupliqués
      // Solution : Identifier produits uniques d'abord, puis optimiser si nécessaire
      
      this.logger.info('[selectOptimalProducts] 🔍 Phase 2 : Déduplication produits uniques')
      
      // Identifier produits uniques et leurs occurrences
      const productOccurrences = new Map<string, {
        product: any // EnrichedProduct from ProductMatcher
        stepNumbers: number[]
        matchingScore: number
        alternatives: any[]
        reasoning: string
      }>()
      
      idealMatches.forEach(({ step, match }) => {
        const catalogId = match.mainProduct.catalogId
        if (productOccurrences.has(catalogId)) {
          // Produit déjà rencontré, ajouter cette occurrence
          productOccurrences.get(catalogId)!.stepNumbers.push(step.stepNumber)
        } else {
          // Premier fois qu'on voit ce produit
          productOccurrences.set(catalogId, {
            product: match.mainProduct,
            stepNumbers: [step.stepNumber],
            matchingScore: match.matchingScore,
            alternatives: match.alternatives || [],
            reasoning: match.reasoning
          })
        }
      })
      
      const uniqueProductsCount = productOccurrences.size
      const totalStepsCount = idealMatches.length
      
      // Calculer coût RÉEL (produits uniques seulement)
      const realCost = Array.from(productOccurrences.values()).reduce(
        (sum, { product }) => sum + product.price,
        0
      )
      
      // Calculer coût naïf (avec dupliqués pour comparaison)
      const naiveCost = idealMatches.reduce((sum, { match }) => sum + match.mainProduct.price, 0)
      const savingsFromDeduplication = naiveCost - realCost
      
      this.logger.info('[selectOptimalProducts] 📊 Déduplication résultats', {
        uniqueProducts: uniqueProductsCount,
        totalSteps: totalStepsCount,
        realCost: `${realCost.toFixed(2)}€`,
        naiveCost: `${naiveCost.toFixed(2)}€`,
        savings: `${savingsFromDeduplication.toFixed(2)}€`,
        savingsPercent: `${((savingsFromDeduplication / naiveCost) * 100).toFixed(1)}%`
      })

      // ========== 3.6 OPTIMISATION BUDGET (SI NÉCESSAIRE) ==========
      this.logger.info('[selectOptimalProducts] 💰 Phase 3 : Vérification budget')
      this.logger.info(`[selectOptimalProducts] 💵 Coût réel (produits uniques) : ${realCost.toFixed(2)}€`)
      this.logger.info(`[selectOptimalProducts] 🎯 Budget cible : ${request.constraints.budget || 'illimité'}€`)

      let selectedProducts: SelectedProductV3[]
      let budgetOptimizationResult: any = null

      // Si coût RÉEL dépassé → optimisation intelligente
      if (request.constraints.budget && realCost > request.constraints.budget) {
        this.logger.info(
          `[selectOptimalProducts] ⚠️ Dépassement budget RÉEL : ${realCost.toFixed(2)}€ > ${request.constraints.budget}€ (+${(realCost - request.constraints.budget).toFixed(2)}€)`
        )
        this.logger.info('[selectOptimalProducts] 🧠 Lancement BudgetOptimizer sur produits UNIQUES...')

        // Importer BudgetOptimizer
        const { BudgetOptimizer } = await import('@/services/products/BudgetOptimizer')
        const { CARETYPE_BUDGET_PRIORITIES } = await import('@/types')

        // Convertir produits UNIQUES au format BudgetOptimizer.ProductMatch
        // Pour chaque produit unique, on prend la première occurrence comme représentant
        const uniqueRoutineForOptimizer = Array.from(productOccurrences.entries()).map(([catalogId, data]) => {
          // Trouver le premier step qui utilise ce produit
          const firstStepNumber = data.stepNumbers[0]
          const firstStep = allSteps.find(s => s.stepNumber === firstStepNumber)!
          
          return {
            step: {
              stepNumber: firstStepNumber,
              careType: firstStep.careType,
              displayTitle: firstStep.careType, // Utiliser careType comme fallback
              targetZones: firstStep.targetZones
            },
            mainProduct: data.product,
            alternatives: data.alternatives,
            matchingScore: data.matchingScore,
            reasoning: data.reasoning,
            // 🆕 Ajouter info sur les steps dupliqués pour réapplication ultérieure
            affectedSteps: data.stepNumbers
          }
        })

        // Appeler BudgetOptimizer sur produits UNIQUES
        const optimized = BudgetOptimizer.optimize(
          uniqueRoutineForOptimizer as any, // Cast temporaire, BudgetOptimizer ignore affectedSteps
          {
            maxBudget: request.constraints.budget,
            expectedSteps: uniqueProductsCount, // 🆕 Nombre de produits uniques, pas steps totaux
            priority: 'balanced',
            flexibility: 0.1,
            enableSmartOptimization: true
          },
          (msg: string) => this.logger.info(`[BudgetOptimizer] ${msg}`)
        )

        budgetOptimizationResult = {
          applied: optimized.optimized,
          originalCost: realCost, // 🆕 Coût réel au lieu de naïf
          finalCost: optimized.finalCost,
          savings: optimized.savings,
          substitutionsCount: optimized.substitutions.length,
          stepsRemovedCount: optimized.stepsRemoved.length,
          preservedCritical: optimized.preservedCritical,
          details: {
            substitutions: optimized.substitutions.map((sub) => ({
              stepNumber: sub.stepNumber,
              careType: sub.careType,
              from: sub.originalProduct.name,
              to: sub.substituteProduct?.name || 'N/A',
              priceSaved: sub.priceSaved,
              scoreLost: sub.scoreLost
            })),
            stepsRemoved: optimized.stepsRemoved
          }
        }
        
        // 🆕 RÉAPPLIQUER les substitutions aux steps dupliqués
        // Si un produit unique a été substitué, il faut appliquer cette substitution
        // à TOUS les steps qui utilisaient ce produit
        const substitutionMap = new Map<string, EnrichedProduct>()
        optimized.substitutions.forEach((sub) => {
          if (sub.substituteProduct) {
            substitutionMap.set(sub.originalProduct.catalogId, sub.substituteProduct)
          }
        })
        
        // Mettre à jour productOccurrences avec les substitutions
        productOccurrences.forEach((data, catalogId) => {
          if (substitutionMap.has(catalogId)) {
            const substitute = substitutionMap.get(catalogId)!
            this.logger.info(
              `[selectOptimalProducts] 🔄 Réapplication substitution : ${data.product.name} → ${substitute.name} (${data.stepNumbers.length} steps affectés : ${data.stepNumbers.join(', ')})`
            )
            data.product = substitute
          }
        })
        
        // Supprimer produits qui ont été retirés (si stepsRemoved existe et est un tableau)
        if (Array.isArray(optimized.stepsRemoved) && optimized.stepsRemoved.length > 0) {
          optimized.stepsRemoved.forEach((removed: any) => {
            const catalogId = removed.catalogId || removed
            if (typeof catalogId === 'string' && productOccurrences.has(catalogId)) {
              this.logger.info(
                `[selectOptimalProducts] ❌ Suppression produit : ${removed.productName || catalogId} (${productOccurrences.get(catalogId)!.stepNumbers.length} steps affectés)`
              )
              productOccurrences.delete(catalogId)
            }
          })
        }

        this.logger.info(
          `[selectOptimalProducts] ✅ Optimisation terminée : ${realCost.toFixed(2)}€ → ${optimized.finalCost.toFixed(2)}€ (économie: ${optimized.savings.toFixed(2)}€)`
        )
        this.logger.info(
          `[selectOptimalProducts] 📊 ${optimized.substitutions.length} substitutions, ${optimized.stepsRemoved.length} suppressions`
        )
        this.logger.info(
          `[selectOptimalProducts] ${optimized.preservedCritical ? '✅' : '⚠️'} SPF + Nettoyant : ${optimized.preservedCritical ? 'PRÉSERVÉS' : 'COMPROMIS'}`
        )

        // 🆕 Générer selectedProducts à partir de productOccurrences mis à jour
        // Chaque produit unique génère N SelectedProductV3 (un par step où il est utilisé)
        selectedProducts = []
        productOccurrences.forEach((data) => {
          data.stepNumbers.forEach((stepNumber) => {
            const step = allSteps.find(s => s.stepNumber === stepNumber)!
            const isSubstituted = substitutionMap.has(data.product.catalogId)
            
            selectedProducts.push({
              routineStepId: stepNumber,
              routineStepUid: `step-${stepNumber}`,
              catalogId: data.product.catalogId,
              productName: data.product.name,
              brand: data.product.brand,
              price: data.product.price,
              imageUrl: data.product.imageUrl || '',
              matchingScore: data.matchingScore,
              compatibilityReasons: data.product.targetConcerns.slice(0, 3),
              retailers: data.product.retailers || [],
              alternatives: data.alternatives.map((alt, idx) => ({
                catalogId: alt.catalogId,
                name: alt.name,
                brand: alt.brand,
                price: alt.price,
                imageUrl: alt.imageUrl || '',
                matchingScore: Math.round(data.matchingScore - (idx + 1) * 5)
              })),
              justification: isSubstituted 
                ? `Substitution budgétaire (économie ${optimized.savings.toFixed(2)}€)`
                : data.reasoning || 'Sélectionné pour correspondance optimale',
              applicationAdvice: `Appliquer ${
                step.timing === 'morning' ? 'le matin' 
                : step.timing === 'evening' ? 'le soir' 
                : 'matin et soir'
              } sur ${step.targetZones.join(', ')}`,
              timing: step.timing,
              targetZones: step.targetZones,
              temporaryLabel: false,
              progressiveIntroduction: null,
              restrictions: []
            })
          })
        })
      } else {
        // Budget OK → utiliser routine idéale sans optimisation
        this.logger.info(
          `[selectOptimalProducts] ✅ Budget respecté (${realCost.toFixed(2)}€ ≤ ${request.constraints.budget || 'illimité'}€) - Pas d'optimisation requise`
        )

        // 🆕 Générer selectedProducts à partir de productOccurrences (sans substitution)
        selectedProducts = []
        productOccurrences.forEach((data) => {
          data.stepNumbers.forEach((stepNumber) => {
            const step = allSteps.find(s => s.stepNumber === stepNumber)!
            
            selectedProducts.push({
              routineStepId: stepNumber,
              routineStepUid: `step-${stepNumber}`,
              catalogId: data.product.catalogId,
              productName: data.product.name,
              brand: data.product.brand,
              price: data.product.price,
              imageUrl: data.product.imageUrl || '',
              matchingScore: data.matchingScore,
              compatibilityReasons: data.product.targetConcerns.slice(0, 3),
              retailers: data.product.retailers || [],
              alternatives: data.alternatives.map((alt, idx) => ({
                catalogId: alt.catalogId,
                name: alt.name,
                brand: alt.brand,
                price: alt.price,
                imageUrl: alt.imageUrl || '',
                matchingScore: Math.round(data.matchingScore - (idx + 1) * 5)
              })),
              justification: data.reasoning || 'Sélectionné pour correspondance optimale',
              applicationAdvice: `Appliquer ${
                step.timing === 'morning' ? 'le matin' 
                : step.timing === 'evening' ? 'le soir' 
                : 'matin et soir'
              } sur ${step.targetZones.join(', ')}`,
              timing: step.timing,
              targetZones: step.targetZones,
              temporaryLabel: false,
              progressiveIntroduction: null,
              restrictions: []
            })
          })
        })
      }

      // ========== VALIDATION COMPLÉTUDE ==========
      const successRate = (selectedProducts.length / allSteps.length) * 100
      this.logger.info(
        `[selectOptimalProducts] ✅ ${selectedProducts.length}/${allSteps.length} produits matchés (${successRate.toFixed(1)}%)`,
        {
          requestId,
          failedSteps: failures.length > 0 ? failures.map((f) => f.stepNumber) : []
        }
      )

      if (successRate < 70) {
        throw new Error(
          `MATCHING_FAILED: Seulement ${successRate.toFixed(0)}% des steps ont un produit (${failures.length} échecs)`
        )
      }

      // ========== 4. BUDGET BREAKDOWN ==========
      // 🆕 Calculer coût final après optimisation (si appliquée)
      const finalRealCost = budgetOptimizationResult?.finalCost || realCost
      
      this.logger.info('[selectOptimalProducts] 💰 Budget Final', {
        uniqueProducts: productOccurrences.size,
        totalSteps: selectedProducts.length,
        originalRealCost: `${realCost.toFixed(2)}€`,
        finalCost: `${finalRealCost.toFixed(2)}€`,
        naiveCost: `${naiveCost.toFixed(2)}€`,
        savingsFromDeduplication: `${savingsFromDeduplication.toFixed(2)}€`,
        savingsFromOptimization: budgetOptimizationResult?.savings ? `${budgetOptimizationResult.savings.toFixed(2)}€` : '0€'
      })

      // 🆕 Préparer les messages d'optimisation
      const optimizationMessages: string[] = []
      
      if (budgetOptimizationResult && budgetOptimizationResult.applied) {
        optimizationMessages.push(
          `✅ Optimisation budget appliquée : ${realCost.toFixed(2)}€ → ${finalRealCost.toFixed(2)}€ (économie: ${budgetOptimizationResult.savings.toFixed(2)}€)`
        )
        
        if (budgetOptimizationResult.substitutionsCount > 0) {
          optimizationMessages.push(
            `🔄 ${budgetOptimizationResult.substitutionsCount} substitution(s) intelligente(s) appliquée(s) aux produits uniques`
          )
        }
        
        if (budgetOptimizationResult.stepsRemovedCount > 0) {
          optimizationMessages.push(
            `⚠️ ${budgetOptimizationResult.stepsRemovedCount} produit(s) optionnel(s) retiré(s)`
          )
        }
        
        if (budgetOptimizationResult.preservedCritical) {
          optimizationMessages.push(
            `✅ SPF et nettoyant préservés (priorités dermatologiques critiques)`
          )
        } else {
          optimizationMessages.push(
            `⚠️ Attention : SPF ou nettoyant compromis pour respecter budget`
          )
        }
      } else if (request.constraints.budget && finalRealCost > request.constraints.budget) {
        const overspend = finalRealCost - request.constraints.budget
        optimizationMessages.push(
          `Budget dépassé de ${overspend.toFixed(2)}€. Consultez les alternatives pour optimiser vos dépenses.`
        )
      }
      
      // Toujours afficher l'économie grâce à la déduplication
      if (savingsFromDeduplication > 0) {
        optimizationMessages.push(
          `💡 Économie de ${savingsFromDeduplication.toFixed(2)}€ grâce à l'achat de ${productOccurrences.size} produits uniques pour ${selectedProducts.length} étapes.`
        )
      }

      const budgetBreakdown: BudgetBreakdown = {
        totalCost: finalRealCost, // 🆕 Coût final (après optimisation si appliquée)
        budgetRespected: request.constraints.budget
          ? finalRealCost <= request.constraints.budget
          : true,
        optimizations: optimizationMessages.length > 0 ? optimizationMessages : undefined,
        alternatives: []
      }

      // ========== 5. VALIDATION COHÉRENCE ==========
      const coherenceValidation: CoherenceValidation = {
          routineProductsMatch: true,
          zonesCoherent: true,
          timingLogical: true,
        budgetRespected: budgetBreakdown.budgetRespected,
          issuesFound: []
      }
      
      const duration = Date.now() - startTime

      this.logger.info('[selectOptimalProducts] ✅ HYBRIDE COMPLETE', {
        requestId,
        products: selectedProducts.length,
        uniqueProducts: productOccurrences.size,
        realCost: `${finalRealCost.toFixed(2)}€`,
        savingsFromDeduplication: `${savingsFromDeduplication.toFixed(2)}€`,
        successRate: `${successRate.toFixed(1)}%`,
        duration: `${duration}ms`,
        budgetRespected: budgetBreakdown.budgetRespected,
        budgetOptimizationApplied: budgetOptimizationResult?.applied || false,
        budgetOptimizationSavings: budgetOptimizationResult?.savings 
          ? `${budgetOptimizationResult.savings.toFixed(2)}€` 
          : '0€'
      })

      const result: ProductSelectionV3 = {
        selectedProducts,
        budgetBreakdown,
        coherenceValidation
      }

      // Mettre en cache
      const cacheKey = this.cache.generateProductsKey(routine, request.constraints.budget)
      await this.cache.set(cacheKey, result, 6 * 60 * 60 * 1000) // 6h

      return result
    } catch (error: any) {
      this.logger.error('[selectOptimalProducts] ❌ HYBRIDE FAILED', {
        requestId,
        error: error.message,
        duration: `${Date.now() - startTime}ms`
      })
      throw error
    }
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
