/**
 * V2 Pipeline Orchestrator
 * Orchestrates the 3-step AI pipeline: Vision -> Routine -> Products
 */

import { createOpenAIClient, ANALYSIS_MODEL } from '@/lib/openai'
import type { AnalyzeRequest } from '@/types/api'
import type {
  VisionOutputV2T,
  RoutineBlueprintV2T,
  ProductSelectionV2T,
  V2PipelineOutput
} from './schemas'
import {
  validateVisionOutputV2,
  validateRoutineBlueprintV2,
  validateProductSelectionV2
} from './schemas'
// Note: Prompt imports removed as we now use provider abstraction
import { adaptV2ToLegacySkinAnalysis } from './adapters'
import { getProvider, getProviderConfig } from './provider'
// import { normalizeRoutineForCatalog } from './normalize'
import type { SkinAnalysis } from '@/types'

export class V2PipelineOrchestrator {
  private openai: any
  private startTime: number
  private providerConfig: { global: string; stepProviders: { 1: string; 2: string; 3: string } }

  constructor() {
    this.openai = createOpenAIClient()
    this.startTime = Date.now()
    this.providerConfig = getProviderConfig()
  }

  /**
   * Main orchestration method: runs the complete 3-step pipeline
   */
  async runPipeline(request: AnalyzeRequest): Promise<SkinAnalysis> {
    console.log('🚀 Starting V2 Pipeline Orchestration')
    
    try {
      // STEP 1: Vision Analysis
      console.log('📸 STEP 1: Vision Analysis')
      const visionOutput = await this.performVisionAnalysis(request)
      console.log('✅ Vision analysis completed:', {
        photosAnalyzed: visionOutput.perPhoto.length,
        aggregatedScores: visionOutput.aggregated.scores,
        concernsCount: visionOutput.aggregated.concerns.length
      })

      // STEP 2: Routine Blueprint
      console.log('📋 STEP 2: Routine Blueprint Generation')
      const routineBlueprint = await this.generateRoutineBlueprint(visionOutput, request.userProfile)
      console.log('✅ Routine blueprint completed:', {
        immediateSteps: routineBlueprint.phaseImmediate.steps.length,
        adaptationSteps: routineBlueprint.phaseAdaptation.steps.length,
        maintenanceSteps: routineBlueprint.phaseMaintenance.steps.length
      })

      // STEP 3: Product Selection
      console.log('🛍️ STEP 3: Product Selection')
      const productSelection = await this.selectProducts(visionOutput, routineBlueprint, request)
      console.log('✅ Product selection completed:', {
        selectedProducts: productSelection.selections.length,
        noFallbacks: productSelection.metrics.noFallbacks,
        totalCost: productSelection.budget.total
      })

      // Create V2 pipeline output
      const v2Output: V2PipelineOutput = {
        vision: visionOutput,
        routine: routineBlueprint,
        products: productSelection,
        metadata: {
          processingTimeMs: Date.now() - this.startTime,
          aiModelUsed: this.providerConfig.global === 'openai' ? ANALYSIS_MODEL : 'mock',
          analysisVersion: 'v2-prompts',
          timestamp: new Date(),
          stepProviders: this.providerConfig.stepProviders
        }
      }

      // Adapt to legacy format for UI compatibility
      console.log('🔄 Adapting V2 output to legacy format')
      const legacyAnalysis = adaptV2ToLegacySkinAnalysis({
        vision: v2Output.vision,
        routine: v2Output.routine,
        products: v2Output.products,
        metadata: v2Output.metadata
      })
      console.log('✅ Legacy adaptation completed')

      return legacyAnalysis

    } catch (error) {
      console.error('❌ V2 Pipeline Orchestration failed:', error)
      throw new Error(`V2 Pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * STEP 1: Vision Analysis (Photo-only diagnostic)
   */
  private async performVisionAnalysis(request: AnalyzeRequest): Promise<VisionOutputV2T> {
    const stepStartTime = Date.now()
    const provider = getProvider(1)
    
    // Prepare input for provider
    const visionInput = {
      photos: request.photos.map((photo, index) => ({
        url: `mock://photo-${index}`,
        angle: 'front' as const
      })),
      lighting_info: null
    }

    console.log('🤖 Calling provider step1Vision:', {
      photosCount: visionInput.photos.length,
      provider: this.providerConfig.stepProviders[1]
    })

    try {
      const rawOutput = await provider.step1Vision(visionInput)
      const validatedOutput = validateVisionOutputV2(rawOutput)
      
      const stepTime = Date.now() - stepStartTime
      console.log(`✅ Vision analysis completed in ${stepTime}ms`)
      
      return validatedOutput
    } catch (error) {
      console.error('❌ Vision analysis failed:', error)
      throw error
    }
  }

  /**
   * STEP 2: Routine Blueprint Generation
   */
  private async generateRoutineBlueprint(
    visionOutput: VisionOutputV2T,
    userProfile: AnalyzeRequest['userProfile']
  ): Promise<RoutineBlueprintV2T> {
    const stepStartTime = Date.now()
    const provider = getProvider(2)
    
    // Prepare input for provider
    const routineInput = {
      visionOutput: visionOutput,
      questionnaire: userProfile
    }

    console.log('🤖 Calling provider step2Routine:', {
      provider: this.providerConfig.stepProviders[2]
    })

    try {
      const rawOutput = await provider.step2Routine(routineInput)
      const validatedOutput = validateRoutineBlueprintV2(rawOutput)
      
      // Normalize categories to canonical form for Step 3
      console.log('🔄 Normalizing routine blueprint categories...')
      // Temporarily disable normalization to test
      const normalizedOutput = validatedOutput // normalizeRoutineForCatalog(validatedOutput)
      
      const stepTime = Date.now() - stepStartTime
      console.log(`✅ Routine blueprint completed in ${stepTime}ms`)
      
      return normalizedOutput
    } catch (error) {
      console.error('❌ Routine blueprint generation failed:', error)
      throw error
    }
  }

  /**
   * STEP 3: Product Selection
   */
  private async selectProducts(
    visionOutput: VisionOutputV2T,
    routineBlueprint: RoutineBlueprintV2T,
    request: AnalyzeRequest
  ): Promise<ProductSelectionV2T> {
    const stepStartTime = Date.now()
    const provider = getProvider(3)
    
    // Load catalog for provider
    const catalog = await this.loadCatalogForProvider()
    
    // Prepare input for provider
    const productsInput = {
      routineBlueprint: routineBlueprint,
      catalog: catalog,
      user: request.userProfile
    }

    console.log('🤖 Calling provider step3Products:', {
      provider: this.providerConfig.stepProviders[3],
      catalogProductsCount: catalog.products?.length || 0
    })

    try {
      const rawOutput = await provider.step3Products(productsInput)
      const validatedOutput = validateProductSelectionV2(rawOutput)
      
      const stepTime = Date.now() - stepStartTime
      console.log(`✅ Product selection completed in ${stepTime}ms`)
      
      return validatedOutput
    } catch (error) {
      console.error('❌ Product selection failed:', error)
      throw error
    }
  }

  /**
   * Load catalog for provider (structured data)
   */
  private async loadCatalogForProvider(): Promise<any> {
    try {
      const fs = await import('fs').then((m) => m.promises)
      const path = await import('path')
      const catalogPath = path.join(process.cwd(), 'public', 'affiliateCatalog.json')
      const catalogData = await fs.readFile(catalogPath, 'utf-8')
      const catalog = JSON.parse(catalogData)
      
      console.log('📦 Catalog loaded for provider:', catalog.products?.length || 0, 'products')
      return catalog
    } catch (error) {
      console.error('❌ Error loading catalog for provider:', error)
      return { products: [] }
    }
  }

  /**
   * Load catalog for prompt injection (legacy method)
   */
  private async loadCatalogForPrompt(): Promise<string> {
    try {
      const fs = await import('fs').then((m) => m.promises)
      const path = await import('path')
      const catalogPath = path.join(process.cwd(), 'public', 'affiliateCatalog.json')
      const catalogData = await fs.readFile(catalogPath, 'utf-8')
      const catalog = JSON.parse(catalogData)
      const products = catalog.products || []

      const categorized = products.reduce((acc: any, p: any) => {
        if (!acc[p.category]) acc[p.category] = []
        acc[p.category].push(p)
        return acc
      }, {})

      const important = ['cleanser', 'serum', 'moisturizer', 'sunscreen', 'exfoliant', 'treatment', 'mist']
      const selected: any[] = []
      important.forEach((cat) => {
        if (categorized[cat]) {
          selected.push(...categorized[cat].slice(0, 4))
        }
      })

      const catalogText = selected
        .slice(0, 40)
        .map((p: any) => {
          const benefits = Array.isArray(p.benefits) ? p.benefits.slice(0, 2).join(', ') : 'Targeted care'
          return `- ${p.id} : ${p.name} (${p.brand}, ${p.category}) - ${benefits}`
        })
        .join('\n')

      console.log('📦 Catalog loaded for V2 Pipeline:', selected.length, 'products selected out of', products.length, 'total')
      return catalogText
    } catch (error) {
      console.error('❌ Error loading catalog for V2 Pipeline:', error)
      return `- B01MSSDEPK : CeraVe Hydrating Cleanser (CeraVe, cleanser) - cleanses while hydrating, barrier support
- B01MDTVZTZ : The Ordinary Niacinamide 10% + Zinc 1% (The Ordinary, serum) - sebum regulation, pore-minimizing
- B00949CTQQ : Paula's Choice SKIN PERFECTING 2% BHA (Paula's Choice, exfoliant) - unclogs pores, reduces blackheads
- B000O7PH34 : Avène Thermal Spring Water (Avène, mist) - soothes, refreshes
- B004W55086 : La Roche-Posay Anthelios Fluid SPF 50 (La Roche-Posay, sunscreen) - ultra-light, fast-absorbing
- B00BNUY3HE : La Roche-Posay Cicaplast Baume B5 (La Roche-Posay, balm) - repair, soothing`
    }
  }

  /**
   * Parse JSON response from OpenAI
   */
  private parseJsonResponse(content: string): any {
    try {
      const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      console.log('Parsing JSON response:', clean.substring(0, 200) + '...')
      return JSON.parse(clean)
    } catch (e) {
      console.error('JSON parsing error:', e)
      console.error('Raw content received:', content)
      throw new Error('Invalid JSON response format from AI')
    }
  }
}

/**
 * Factory function to create and run the V2 pipeline
 */
export async function runV2Pipeline(request: AnalyzeRequest): Promise<SkinAnalysis> {
  const orchestrator = new V2PipelineOrchestrator()
  return await orchestrator.runPipeline(request)
}
