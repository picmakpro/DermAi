import { createOpenAIClient, ANALYSIS_MODEL } from '@/lib/openai'
import type { AnalyzeRequest, SkinAnalysis } from '@/types'

export class AnalysisService {
  
  /**
   * Analyse DermAI Vision 3.0 des photos
   */
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

      console.log('Envoi à moteur IA DermAI:', {
        imagesCount: imageUrls.length,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length
      })

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
                ...imageUrls.map(url => ({
                  type: 'image_url' as const,
                  image_url: { url }
                }))
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }, { signal: controller.signal })

        clearTimeout(timeoutId)

        console.log('Réponse IA reçue:', {
          usage: response.usage,
          model: response.model
        })

        const analysisResult = this.parseAnalysisResponse(response.choices[0]?.message?.content)
        analysisResult.scores.overall = this.computeWeightedOverall(analysisResult.scores)

        return {
          id: this.generateId(),
          userId: 'temp-user',
          photos: request.photos,
          scores: analysisResult.scores,
          diagnostic: analysisResult.diagnostic,
          recommendations: analysisResult.recommendations,
          createdAt: new Date()
        }
      } catch (apiError) {
        clearTimeout(timeoutId)
        if (apiError instanceof Error && apiError.name === 'AbortError') {
          throw new Error('Timeout: L\'analyse a pris trop de temps')
        }
        throw apiError
      }
    } catch (error) {
      console.error('Erreur analyse IA:', error)
      throw new Error(`Échec de l'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
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
    return `Tu es un expert dermatologue IA de niveau mondial avec 20 ans d'expérience. 

## MISSION CRITIQUE
Analyser avec précision maximale les photos de peau fournies et donner un diagnostic dermatologique professionnel.

## PHILOSOPHIE D'ANALYSE
- PRÉCISION > Politesse : Diagnostic factuel et direct
- OBSERVATION > Supposition : Basé uniquement sur ce qui est visible
- SPÉCIFICITÉ > Généralité : Nommer les conditions précises
- CONFIANCE MESURÉE : Indiquer le niveau de certitude (0-1)

## FORMAT RÉPONSE OBLIGATOIRE
Répondre UNIQUEMENT en JSON valide avec la structure demandée.`
  }

  private static buildUserPrompt(request: AnalyzeRequest): string {
    return `## CONTEXTE UTILISATEUR
**Profil :** ${request.userProfile.gender}, ${request.userProfile.age} ans
**Type de peau déclaré :** ${request.userProfile.skinType}

## PRÉOCCUPATIONS PRINCIPALES
${request.skinConcerns.primary.join(', ')}${request.skinConcerns.otherText ? ` (Autres: ${request.skinConcerns.otherText})` : ''}
**Durée du problème :** ${request.skinConcerns.duration}

## ROUTINE ACTUELLE
**Matin :** ${request.currentRoutine.morningProducts.join(', ') || 'Aucune routine'}
**Soir :** ${request.currentRoutine.eveningProducts.join(', ') || 'Aucune routine'}
**Fréquence nettoyage :** ${request.currentRoutine.cleansingFrequency}
**Budget mensuel :** ${request.currentRoutine.monthlyBudget}

## ALLERGIES ET SENSIBILITÉS
**Ingrédients à éviter :** ${request.allergies?.ingredients?.join(', ') || 'Aucune allergie connue'}
**Réactions passées :** ${request.allergies?.pastReactions || 'Aucune réaction signalée'}

## PHOTOS FOURNIES
${request.photos.map((photo, index) => `Photo ${index + 1}: ${photo.type}`).join('\n')}

## MISSION
Analyser ces ${request.photos.length} photos avec expertise dermatologique maximale.

Fournir diagnostic précis + scores justifiés + recommandations actionables.
RÉPONSE EN JSON UNIQUEMENT - PAS DE TEXTE LIBRE.`
  }

  private static parseAnalysisResponse(content: string | null): any {
    if (!content) throw new Error('Réponse vide de l\'IA')
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      console.log('Contenu à parser:', cleanContent.substring(0, 200) + '...')
      const parsed = JSON.parse(cleanContent)
      if (!parsed.scores || !parsed.diagnostic || !parsed.recommendations) {
        throw new Error('Structure de réponse invalide')
      }
      return parsed
    } catch (error) {
      console.error('Erreur parsing JSON:', error)
      console.error('Contenu reçu:', content)
      throw new Error('Format de réponse invalide de l\'IA')
    }
  }

  private static generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
