import { createOpenAIClient, ANALYSIS_MODEL } from '@/lib/openai'
import type { AnalyzeRequest, SkinAnalysis } from '@/types'

export class AnalysisService {
  static async analyzeSkin(request: AnalyzeRequest): Promise<SkinAnalysis> {
    try {
      const openai = createOpenAIClient()

      const imageUrls = request.photos
        .map(photo => {
          if (typeof photo.file === 'string' && photo.file.startsWith('data:image/')) {
            return photo.file
          }
          if (typeof photo.file === 'string') {
            return `data:image/jpeg;base64,${photo.file}`
          }
          return ''
        })
        .filter(url => url.length > 0)

      const systemPrompt = this.buildSystemPrompt()
      const userPrompt = this.buildUserPrompt(request)

      if (imageUrls.length === 0) {
        throw new Error('Aucune image valide trouvée pour l\'analyse')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      try {
        const response = await openai.chat.completions.create({
          model: ANALYSIS_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                ...imageUrls.map(url => ({ type: 'image_url' as const, image_url: { url } }))
              ]
            }
          ],
          max_tokens: 1500,
          temperature: 0.3,
        }, { signal: controller.signal })

        clearTimeout(timeoutId)

        const raw = response.choices?.[0]?.message?.content ?? ''
        const parsed = this.parseAnalysisResponse(raw)

        // Garantir la présence des sections attendues
        const analysisResult = {
          scores: parsed?.scores ?? {},
          diagnostic: parsed?.diagnostic ?? {
            primaryCondition: 'Analyse DermAI',
            severity: 'Légère',
            affectedAreas: [],
            observations: [],
            prognosis: ''
          },
          recommendations: parsed?.recommendations ?? {
            immediate: [],
            routine: [],
            products: [],
            lifestyle: []
          }
        }

        // Calcul/ajout du score global
        ;(analysisResult as any).scores.overall = this.computeWeightedOverall((analysisResult as any).scores)

        return {
          id: this.generateId(),
          userId: 'temp-user',
          photos: request.photos,
          scores: (analysisResult as any).scores,
          diagnostic: (analysisResult as any).diagnostic,
          recommendations: (analysisResult as any).recommendations,
          createdAt: new Date()
        }
      } catch (apiError: any) {
        clearTimeout(timeoutId)
        const msg = String(apiError?.message || apiError)
        if (msg.toLowerCase().includes('too large') || msg.toLowerCase().includes('context length')) {
          throw new Error('Images ou prompt trop volumineux. Réduisez la taille/quantité des photos et réessayez.')
        }
        if (apiError instanceof Error && apiError.name === 'AbortError') {
          throw new Error('Timeout: L\'analyse a pris trop de temps')
        }
        throw apiError
      }
    } catch (error) {
      throw new Error(`Échec de l'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  private static extractJsonBlock(text: string): string | null {
    if (!text) return null
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null
    return text.slice(start, end + 1)
  }

  private static parseAnalysisResponse(content: string): any {
    if (!content) throw new Error('Réponse vide de l\'IA')

    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    try { return JSON.parse(cleaned) } catch {}

    const block = this.extractJsonBlock(cleaned)
    if (block) {
      try { return JSON.parse(block) } catch {}
    }

    const preview = cleaned.slice(0, 80)
    throw new Error(`Réponse IA non JSON (aperçu: ${preview}...)`)
  }

  private static computeWeightedOverall(scores: any): number {
    const weights: Record<string, number> = {
      hydration: 0.15,
      wrinkles: 0.20,
      firmness: 0.12,
      radiance: 0.12,
      pores: 0.15,
      spots: 0.08,
      darkCircles: 0.08,
      skinAge: 0.10,
    }
    let weightedSum = 0
    let usedWeightSum = 0
    for (const key of Object.keys(weights)) {
      const weight = weights[key]
      const detail = scores?.[key]
      const value: number | undefined = detail && typeof detail.value === 'number' ? detail.value : undefined
      if (typeof value === 'number' && !Number.isNaN(value)) {
        weightedSum += value * weight
        usedWeightSum += weight
      }
    }
    if (usedWeightSum === 0) return 0
    return Math.round(weightedSum / usedWeightSum)
  }

  private static buildSystemPrompt(): string {
    return `Tu es un expert dermatologue IA. Réponds uniquement en JSON valide, sans texte autour.`
  }

  private static buildUserPrompt(request: AnalyzeRequest): string {
    return `## CONTEXTE UTILISATEUR\nProfil: ${request.userProfile.gender}, ${request.userProfile.age} ans\nType: ${request.userProfile.skinType}\nPréoccupations: ${request.skinConcerns.primary.join(', ')}\nDurée: ${request.skinConcerns.duration}\nAllergies: ${request.allergies?.ingredients?.join(', ') || 'Aucune'}\nPHOTOS: ${request.photos.length}`
  }

  private static generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
