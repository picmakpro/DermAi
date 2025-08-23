import { createOpenAIClient, ANALYSIS_MODEL } from '@/lib/openai'
import type { SkinAnalysis, SkinScores, BeautyAssessment, ProductRecommendations } from '@/types'
import type { AnalyzeRequest } from '@/types/api'

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
      const systemPrompt = await this.buildSystemPrompt()
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
        const scores = analysisResult.scores as any
        scores.overall = this.computeWeightedOverall(scores)

        return {
          id: this.generateId(),
          userId: 'temp-user',
          photos: request.photos,
          scores: scores as SkinScores,
          beautyAssessment: analysisResult.beautyAssessment as BeautyAssessment,
          recommendations: analysisResult.recommendations as ProductRecommendations,
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
   * Charger le catalogue pour l'injection dans le prompt
   */
  private static async loadCatalogForPrompt(): Promise<string> {
    try {
      // Charger le catalogue depuis le système de fichiers
      const fs = await import('fs').then(m => m.promises)
      const path = await import('path')
      
      const catalogPath = path.join(process.cwd(), 'public', 'affiliateCatalog.json')
      const catalogData = await fs.readFile(catalogPath, 'utf-8')
      const catalog = JSON.parse(catalogData)
      const products = catalog.products || []
      
      // Formater pour le prompt (sélection diversifiée par catégorie)
      const categorizedProducts = products.reduce((acc: any, product: any) => {
        if (!acc[product.category]) acc[product.category] = []
        acc[product.category].push(product)
        return acc
      }, {})
      
      // Prendre 3-5 produits par catégorie principale
      const importantCategories = ['cleanser', 'serum', 'moisturizer', 'sunscreen', 'exfoliant', 'treatment', 'mist']
      const selectedProducts: any[] = []
      
      importantCategories.forEach(category => {
        if (categorizedProducts[category]) {
          selectedProducts.push(...categorizedProducts[category].slice(0, 4))
        }
      })
      
      // Limiter au total pour éviter un prompt trop long
      const catalogText = selectedProducts
        .slice(0, 40)
        .map((product: any) => {
          const benefits = Array.isArray(product.benefits) ? product.benefits.slice(0, 2).join(', ') : 'Soin ciblé'
          return `- ${product.id} : ${product.name} (${product.brand}, ${product.category}) - ${benefits}`
        })
        .join('\n')
      
      console.log('📦 Catalogue chargé pour ChatGPT:', selectedProducts.length, 'produits sélectionnés sur', products.length, 'total')
      return catalogText
      
    } catch (error) {
      console.error('❌ Erreur chargement catalogue pour prompt:', error)
      // Fallback avec quelques produits de base du vrai catalogue
      return `- B01MSSDEPK : CeraVe Nettoyant Hydratant (CeraVe, cleanser) - nettoie tout en hydratant, restaure barrière cutanée
- B01MDTVZTZ : The Ordinary Niacinamide 10% + Zinc 1% (The Ordinary, serum) - régule sébum, resserre pores
- B00949CTQQ : Paula's Choice SKIN PERFECTING 2% BHA (Paula's Choice, exfoliant) - désobstrue pores, réduit points noirs
- B000O7PH34 : Avène Thermal Spring Water (Avène, mist) - apaise, rafraîchit
- B004W55086 : La Roche-Posay Anthelios Fluid SPF 50 (La Roche-Posay, sunscreen) - ultra-léger, absorption rapide
- B00BNUY3HE : La Roche-Posay Cicaplast Baume B5 (La Roche-Posay, balm) - réparation, apaise`
    }
  }

  /**
   * Calcule un score global pondéré à partir des sous-scores
   * Pondérations choisies pour être parlantes grand public (somme = 1)
   */
  private static computeWeightedOverall(scores: Record<string, { value: number }>): number {
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
   * Prompt système - Expert conseil beauté IA
   */
  private static async buildSystemPrompt(): Promise<string> {
    // Charger le catalogue réel
    const catalogText = await this.loadCatalogForPrompt()
    
    return `## RÔLE
Tu es BeautyAI, assistant conseil beauté spécialisé en soins cutanés personnalisés. Tu es un expert en cosmétiques et bien-être cutané.

## TÂCHE
Analyser les photos + questionnaire pour créer une routine beauté optimale et recommander les meilleurs produits cosmétiques du catalogue fourni.

## CONTEXTE
Application de conseil beauté dédiée aux recommandations cosmétiques personnalisées. Tu analyses visuellement la peau pour proposer des soins adaptés basés sur l'observation des caractéristiques cutanées.

## CATALOGUE COSMÉTIQUE DISPONIBLE
Tu as accès au catalogue suivant avec les références produits :

${catalogText}

IMPORTANT : Utilise UNIQUEMENT les références réelles du catalogue ci-dessus (exemple: B01MSSDEPK, B000O7PH34, etc.)

## RÈGLES BEAUTÉ ESSENTIELLES
1. RÉFÉRENCE OBLIGATOIRE : Chaque produit recommandé DOIT avoir une référence catalogId réelle
2. COSMÉTIQUES EXCLUSIVEMENT : Utilise uniquement les références existantes du catalogue
3. COHÉRENCE BEAUTÉ : La référence produit doit correspondre au besoin de soin identifié

## PILIERS DE LA ROUTINE BEAUTÉ
- Nettoyer (cleanser) 
- Préparer (tonic)
- Traiter (serum, treatment)
- Hydrater (moisturizer)
- Nourrir (face_oil, balm si besoin)
- Protéger (sunscreen)

## RAISONNEMENT
Pour chaque recommandation produit, explique pourquoi ce produit spécifique convient aux caractéristiques observées de la peau. Base tes conseils sur l'analyse visuelle des photos et les préoccupations beauté exprimées.

## RÉSULTAT - FORMAT JSON OBLIGATOIRE
Réponds UNIQUEMENT en JSON valide avec cette structure exacte :

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
  "beautyAssessment": {
    "mainConcern": "Sensibilités de rasage avec poils incarnés occasionnels",
    "intensity": "modérée", 
    "concernedZones": ["menton", "cou", "joues basses"],
    "visualFindings": [
      "Présence de poils incarnés sur la zone de rasage",
      "Rougeurs et petites imperfections post-rasage",
      "Texture de peau globalement saine en dehors des zones concernées",
      "Légères marques pigmentaires post-irritation"
    ],
    "overview": [
      "Hydratation insuffisante globale",
      "Pores visibles zone T",
      "Protection solaire insuffisante"
    ],
    "zoneSpecific": [
      {"zone": "front", "concerns": ["rides d'expression marquées"], "intensity": "modérée", "icon": "🟠", "description": "lignes horizontales accentuées à l'expression"},
      {"zone": "nez", "concerns": ["rougeurs/sensibilités localisées"], "intensity": "légère", "icon": "🟡", "description": "sensibilité ailes du nez"}
    ],
    "expectedImprovement": "Amélioration visible en 4-6 semaines avec routine beauté adaptée"
  },
  "recommendations": {
    "immediate": [
      "Espacer le rasage quotidien temporairement",
      "Appliquer une crème apaisante",
      "Éviter les produits avec alcool"
    ],
    "routine": {
      "immediate": [
        {
          "name": "Nettoyage doux",
          "frequency": "quotidien",
          "timing": "matin_et_soir",
          "catalogId": "B01MSSDEPK",
          "application": "Masser délicatement, rincer à l'eau tiède",
          "startDate": "maintenant"
        }
      ],
      "adaptation": [
        {
          "name": "Exfoliation douce",
          "frequency": "hebdomadaire",
          "timing": "soir",
          "catalogId": "B00949CTQQ",
          "application": "Commencer 1x/semaine, augmenter progressivement",
          "startDate": "après_2_semaines"
        }
      ],
      "maintenance": [
        {
          "name": "Protection solaire",
          "frequency": "quotidien",
          "timing": "matin",
          "catalogId": "B004W55086",
          "application": "Renouveler toutes les 2h si exposition",
          "startDate": "maintenant"
        }
      ]
    },
    "localizedRoutine": [
      {
        "zone": "menton",
        "priority": "haute",
        "steps": [
          {
            "name": "Soin apaisant",
            "frequency": "quotidien",
            "timing": "soir",
            "catalogId": "B00BNUY3HE",
            "application": "Couche fine sur les zones sensibles",
            "duration": "jusqu'à amélioration",
            "resume": "quand sensibilité disparue"
          }
        ]
      }
    ],
    "overview": "Routine progressive axée sur l'apaisement puis la prévention",
    "zoneSpecificCare": "Soins spécifiques des zones sensibles en priorité", 
    "restrictions": "Éviter exfoliants sur zones sensibilisées jusqu'à amélioration"
  }
}

## CONDITIONS
- Reste dans l'univers beauté/cosmétique, évite tout vocabulaire médical
- Chaque référence catalogId DOIT exister dans le catalogue cosmétique
- Adapte la sélection selon le type de peau et les préoccupations beauté
- La routine doit être progressive : immediate → adaptation → maintenance
- Les soins localisés traitent les préoccupations spécifiques par zone`
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
**Préférence de routine :** ${request.currentRoutine.routinePreference || 'Équilibrée'}

## ROUTINE ACTUELLE
**Matin :** ${request.currentRoutine.morningProducts.join(', ') || 'Aucune routine'}
**Soir :** ${request.currentRoutine.eveningProducts.join(', ') || 'Aucune routine'}
**Préférence routine (complexité) :** ${request.currentRoutine.routinePreference || 'Équilibrée'}
**Budget mensuel :** ${request.currentRoutine.monthlyBudget}

## ALLERGIES ET SENSIBILITÉS
**Ingrédients à éviter :** ${request.allergies?.ingredients?.join(', ') || 'Aucune allergie connue'}
**Réactions passées :** ${request.allergies?.pastReactions || 'Aucune réaction signalée'}

## CATALOGUE PRODUITS (STRUCTURÉ)
- Si un catalogue est fourni par l'application, il sera passé séparément et tu devras y piocher les produits. Sinon, ne cite pas de marques.

## PHOTOS FOURNIES
${request.photos.map((photo, index) => `Photo ${index + 1}: ${photo.type}`).join('\n')}

## MISSION BEAUTÉ
Analyser ces ${request.photos.length} photos avec expertise conseil beauté maximale.

**ATTENTION PARTICULIÈRE À :**
- Préoccupations beauté mentionnées : ${request.skinConcerns.primary.join(', ')}
// (Note: l'utilisateur a choisi une préférence de routine: ${request.currentRoutine.routinePreference || 'Équilibrée'})
- Sensibilités à considérer : ${request.allergies?.ingredients?.filter(i => i !== 'Aucune allergie connue').join(', ') || 'Aucune'}
- Budget disponible : ${request.currentRoutine.monthlyBudget}

**TU DOIS DÉTERMINER :**
- L'intensité réelle basée uniquement sur l'analyse visuelle (ignore toute auto-évaluation)
- Les préoccupations cutanées précises observées
- Les recommandations cosmétiques adaptées au budget et aux sensibilités
 - Une vue d'ensemble (max 3 points) + une vue localisée par zones (front, joues, nez, contour des yeux, barbe, lèvres...) avec préoccupations et intensité
 - Une routine organisée par piliers (Nettoyer, Préparer, Traiter, Hydrater, Nourrir, Protéger), adaptée à la préférence de complexité.

Fournir analyse personnalisée précise + scores justifiés + recommandations actionables.
RÉPONSE EN JSON UNIQUEMENT - PAS DE TEXTE LIBRE.`
  }

  /**
   * Parser la réponse JSON de GPT-4o
   */
  private static parseAnalysisResponse(content: string | null): Record<string, unknown> {
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
      if (!parsed.scores || !parsed.beautyAssessment || !parsed.recommendations) {
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
