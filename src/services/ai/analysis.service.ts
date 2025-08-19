import { createOpenAIClient, ANALYSIS_MODEL } from '@/lib/openai'
import type { AnalyzeRequest, SkinAnalysis } from '@/types'

export class AnalysisService {
  
  /**
   * Analyse complète des photos avec GPT-4o Vision
   */
  static async analyzeSkin(request: AnalyzeRequest): Promise<SkinAnalysis> {
    try {
      // Créer le client OpenAI côté serveur
      const openai = createOpenAIClient()

      // Les images sont déjà en base64 depuis le client
      const imageContents = request.photos.map(photo => {
        // Extraire la partie base64 si elle contient le prefix data:
        let base64Data = ''
        
        if (typeof photo.file === 'string') {
          if (photo.file.includes('base64,')) {
            base64Data = photo.file.split('base64,')[1]
          } else {
            base64Data = photo.file
          }
        }
        
        return base64Data
      }).filter(base64 => base64.length > 0)

      // Prompt principal optimisé
      const systemPrompt = this.buildSystemPrompt()
      const userPrompt = this.buildUserPrompt(request)

      // Validation des images
      if (imageContents.length === 0) {
        throw new Error('Aucune image valide trouvée pour l\'analyse')
      }

      console.log('Envoi à OpenAI:', {
        imagesCount: imageContents.length,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length
      })

      // Appel GPT-4o Vision avec timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes timeout

      try {
        const response = await openai.chat.completions.create({
          model: ANALYSIS_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                ...imageContents.map(image => ({
                  type: 'image_url' as const,
                  image_url: {
                    url: `data:image/jpeg;base64,${image}`,
                    detail: 'high' as const
                  }
                }))
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }, {
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        console.log('Réponse OpenAI reçue:', {
          usage: response.usage,
          model: response.model
        })

        // Parser la réponse en JSON structuré
        const analysisResult = this.parseAnalysisResponse(response.choices[0]?.message?.content)

        // Calcul du score global (moyenne pondérée) basé sur les 8 sous-scores
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

  /**
   * Calcule un score global pondéré à partir des sous-scores
   * Pondérations choisies pour être parlantes grand public (somme = 1)
   */
  private static computeWeightedOverall(scores: any): number {
    const weights: Record<string, number> = {
      hydration: 0.15,   // Hydratation
      wrinkles: 0.20,    // Rides
      firmness: 0.12,    // Fermeté
      radiance: 0.12,    // Éclat
      pores: 0.15,       // Pores
      spots: 0.08,       // Taches
      darkCircles: 0.08, // Cernes
      skinAge: 0.10,     // Âge de la peau
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

    if (usedWeightSum === 0) {
      return 0
    }

    return Math.round(weightedSum / usedWeightSum)
  }

  /**
   * Prompt système - Expert dermatologue IA
   */
  private static buildSystemPrompt(): string {
    return `Tu es un expert dermatologue IA de niveau mondial avec 20 ans d'expérience. 

## MISSION CRITIQUE
Analyser avec précision maximale les photos de peau fournies et donner un diagnostic dermatologique professionnel.

## PHILOSOPHIE D'ANALYSE
- PRÉCISION > Politesse : Diagnostic factuel et direct
- OBSERVATION > Supposition : Basé uniquement sur ce qui est visible
- SPÉCIFICITÉ > Généralité : Nommer les conditions précises (ex: "Pseudofolliculite de la barbe" vs "irritation")
- CONFIANCE MESURÉE : Indiquer le niveau de certitude (0-1)

## FORMAT RÉPONSE OBLIGATOIRE
Répondre UNIQUEMENT en JSON valide avec cette structure exacte :

{
  "scores": {
    "hydration": {"value": 72, "justification": "Peau bien hydratée", "confidence": 0.8, "basedOn": ["absence de desquamation", "reflets sains"]},
    "wrinkles": {"value": 64, "justification": "Rides fines principalement d'expression", "confidence": 0.75, "basedOn": ["plis dynamiques", "absence de sillons profonds"]},
    "firmness": {"value": 68, "justification": "Bonne tonicité globale", "confidence": 0.7, "basedOn": ["contours net", "peu d'affaissement"]},
    "radiance": {"value": 70, "justification": "Teint relativement lumineux", "confidence": 0.75, "basedOn": ["reflets homogènes", "peu de zones ternes"]},
    "pores": {"value": 58, "justification": "Pores visibles dans la zone T", "confidence": 0.8, "basedOn": ["texture irrégulière", "reflets localisés"]},
    "spots": {"value": 62, "justification": "Taches pigmentaires légères et localisées", "confidence": 0.75, "basedOn": ["macules discrètes", "différence de teint"]},
    "darkCircles": {"value": 55, "justification": "Cernes pigmentaires légers", "confidence": 0.7, "basedOn": ["teinte sous-orbitaire", "légère dépression"]},
    "skinAge": {"value": 78, "justification": "Âge cutané proche de l'âge réel", "confidence": 0.7, "basedOn": ["élasticité", "texture"]},
    "overall": 68
  },
  "diagnostic": {
    "primaryCondition": "Pseudofolliculite de la barbe avec irritation modérée",
    "severity": "Modérée", 
    "affectedAreas": ["menton", "cou", "joues basses"],
    "observations": [
      "Présence de poils incarnés inflammatoires sur la zone de rasage",
      "Rougeurs et petites papules post-rasage",
      "Texture de peau globalement saine en dehors des zones affectées",
      "Hyperpigmentation post-inflammatoire légère"
    ],
    "prognosis": "Amélioration possible en 4-6 semaines avec routine adaptée et technique de rasage modifiée"
  },
  "recommendations": {
    "immediate": [
      "Arrêter le rasage quotidien temporairement",
      "Appliquer une crème apaisante anti-inflammatoire",
      "Éviter les produits alcoolisés"
    ],
    "routine": [
      "Nettoyage doux matin et soir avec un gel sans savon",
      "Exfoliation chimique douce 2x/semaine (AHA/BHA)",
      "Hydratation quotidienne non-comédogène",
      "Protection solaire SPF 30+ quotidienne"
    ],
    "products": [
      "Nettoyant : CeraVe Gel Moussant",
      "Exfoliant : Paula's Choice BHA 2%", 
      "Hydratant : La Roche-Posay Toleriane Fluide",
      "Crème apaisante : Avène Cicalfate+"
    ],
    "lifestyle": [
      "Technique de rasage : sens du poil uniquement",
      "Utiliser une lame neuve à chaque rasage",
      "Préparer la peau avec une huile pré-rasage",
      "Consulter un dermatologue si pas d'amélioration en 6 semaines"
    ]
  }
}

## RÈGLES SCORING (0-100)
- 0-30: Problématique sévère nécessitant attention médicale
- 31-60: Amélioration possible avec routine adaptée  
- 61-85: État correct avec optimisations mineures
- 86-100: Excellent état, maintenir routine actuelle

## CONSIDÉRATIONS OBLIGATOIRES
✅ Respecter strictement les allergies mentionnées dans les recommandations
✅ Adapter les produits au budget indiqué
✅ Déterminer la sévérité UNIQUEMENT par observation visuelle
✅ Intégrer la durée du problème dans le pronostic

## INTERDICTIONS
❌ Diagnostic médical prescriptif
❌ Recommandations de médicaments sur ordonnance
❌ Produits contenant des ingrédients allergènes mentionnés
❌ Recommandations hors budget
❌ Promesses de guérison garantie
❌ Réponse en texte libre (UNIQUEMENT JSON valide)`
  }

  /**
   * Prompt utilisateur contextuel
   */
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

**ATTENTION PARTICULIÈRE À :**
- Préoccupations mentionnées : ${request.skinConcerns.primary.join(', ')}
- Durée des problèmes : ${request.skinConcerns.duration}
- Allergies à considérer : ${request.allergies?.ingredients?.filter(i => i !== 'Aucune allergie connue').join(', ') || 'Aucune'}
- Budget disponible : ${request.currentRoutine.monthlyBudget}

**TU DOIS DÉTERMINER :**
- La sévérité réelle basée uniquement sur l'analyse visuelle (ignore toute auto-évaluation)
- Les conditions dermatologiques précises observées
- Les recommandations adaptées au budget et aux allergies

Fournir diagnostic précis + scores justifiés + recommandations actionables.
RÉPONSE EN JSON UNIQUEMENT - PAS DE TEXTE LIBRE.`
  }

  /**
   * Parser la réponse JSON de GPT-4o
   */
  private static parseAnalysisResponse(content: string | null): any {
    if (!content) {
      throw new Error('Réponse vide de l\'IA')
    }

    try {
      // Nettoyer la réponse (enlever markdown si présent)
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      console.log('Contenu à parser:', cleanContent.substring(0, 200) + '...')

      const parsed = JSON.parse(cleanContent)
      
      // Validation basique de la structure
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

  /**
   * Générer ID unique
   */
  private static generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
