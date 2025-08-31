import { createOpenAIClient, ANALYSIS_MODEL } from '@/lib/openai'
import type { SkinAnalysis, SkinScores, BeautyAssessment, ProductRecommendations } from '@/types'
import type { AnalyzeRequest } from '@/types/api'

export class AnalysisService {
  
  /**
   * Analyse complète des photos avec GPT-4o Vision - NOUVELLE LOGIQUE EN 2 ÉTAPES
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

      // Validation des images
      if (imageContents.length === 0) {
        throw new Error('Aucune image valide trouvée pour l\'analyse')
      }

      console.log('🔍 ÉTAPE 1: Analyse diagnostique pure (sans catalogue)')

      // ÉTAPE 1: Analyse diagnostique pure SANS catalogue
      const diagnosticResult = await this.performDiagnosticAnalysis(openai, imageContents, request)
      
      console.log('✅ Diagnostic établi:', {
        mainConcern: diagnosticResult.beautyAssessment?.mainConcern,
        overallScore: diagnosticResult.scores?.overall,
        concernedZones: diagnosticResult.beautyAssessment?.concernedZones
      })

      console.log('🛍️ ÉTAPE 2: Sélection produits basée sur le diagnostic')

      // ÉTAPE 2: Sélection des produits basée sur le diagnostic établi
      const productRecommendations = await this.selectProductsBasedOnDiagnosis(openai, diagnosticResult, request)

      console.log('✅ Produits sélectionnés:', productRecommendations)

      // Fusionner les résultats
      const finalAnalysis: SkinAnalysis = {
        id: this.generateId(),
        userId: 'temp-user',
        photos: request.photos,
        scores: diagnosticResult.scores,
        beautyAssessment: diagnosticResult.beautyAssessment,
        recommendations: productRecommendations,
        createdAt: new Date()
      }

      return finalAnalysis

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
   * ÉTAPE 1: Analyse diagnostique pure SANS catalogue
   */
  private static async performDiagnosticAnalysis(
    openai: any, 
    imageContents: string[], 
    request: AnalyzeRequest
  ): Promise<{ scores: SkinScores; beautyAssessment: BeautyAssessment }> {
    const systemPrompt = this.buildDiagnosticSystemPrompt()
    const userPrompt = this.buildUserPrompt(request)

    console.log('Envoi à OpenAI (Étape 1 - Diagnostic):', {
      imagesCount: imageContents.length,
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
        max_tokens: 3000,
        temperature: 0.3,
      }, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('Réponse OpenAI reçue (Diagnostic):', {
        usage: response.usage,
        model: response.model
      })

      const diagnosticResult = this.parseDiagnosticResponse(response.choices[0]?.message?.content)
      
      // Calcul du score global
      const scores = diagnosticResult.scores as any
      scores.overall = this.computeWeightedOverall(scores)

      return {
        scores: scores as SkinScores,
        beautyAssessment: diagnosticResult.beautyAssessment as BeautyAssessment
      }

    } catch (apiError) {
      clearTimeout(timeoutId)
      
      if (apiError instanceof Error && apiError.name === 'AbortError') {
        throw new Error('Timeout: L\'analyse diagnostique a pris trop de temps')
      }
      
      throw apiError
    }
  }

  /**
   * ÉTAPE 2: Sélection des produits basée sur le diagnostic établi
   */
  private static async selectProductsBasedOnDiagnosis(
    openai: any,
    diagnostic: { scores: SkinScores; beautyAssessment: BeautyAssessment },
    request: AnalyzeRequest
  ): Promise<ProductRecommendations> {
    // Charger le catalogue complet
    const catalogText = await this.loadCatalogForPrompt()
    
    const systemPrompt = this.buildProductSelectionSystemPrompt(catalogText)
    const userPrompt = this.buildProductSelectionUserPrompt(diagnostic, request)

    console.log('Envoi à OpenAI (Étape 2 - Sélection produits):', {
      catalogProductsCount: catalogText.split('\n').length,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 90000)

    try {
      const response = await openai.chat.completions.create({
        model: ANALYSIS_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.2, // Plus déterministe pour la sélection
      }, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('Réponse OpenAI reçue (Sélection produits):', {
        usage: response.usage,
        model: response.model
      })

      return this.parseProductSelectionResponse(response.choices[0]?.message?.content)

    } catch (apiError) {
      clearTimeout(timeoutId)
      
      if (apiError instanceof Error && apiError.name === 'AbortError') {
        throw new Error('Timeout: La sélection des produits a pris trop de temps')
      }
      
      throw apiError
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
   * Prompt système pour l'analyse diagnostique pure (ÉTAPE 1)
   */
  private static buildDiagnosticSystemPrompt(): string {
    return `## RÔLE
Tu es BeautyAI, expert dermatologue IA spécialisé en analyse cutanée. Tu es un expert en diagnostic visuel de la peau.

## TÂCHE - ÉTAPE 1: DIAGNOSTIC PUR
Analyser UNIQUEMENT les photos pour établir un diagnostic précis de l'état de la peau. 
NE PAS recommander de produits à cette étape - focus 100% sur l'analyse diagnostique.

## CONTEXTE
Application d'analyse cutanée professionnelle. Tu analyses visuellement la peau pour établir un diagnostic objectif basé sur l'observation des caractéristiques cutanées.

## ANALYSE REQUISE
1. **SCORES DÉTAILLÉS** : Évaluer chaque critère sur 100
2. **DIAGNOSTIC PRINCIPAL** : Identifier la préoccupation majeure
3. **ZONES CONCERNÉES** : Localiser précisément les problèmes
4. **OBSERVATIONS VISUELLES** : Décrire ce que tu vois objectivement
5. **ESTIMATION D'AMÉLIORATION** : Calculer le temps réaliste pour atteindre 90/100 selon l'état actuel

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
    "skinAge": {"value": 78, "justification": "Âge cutané proche de l'âge réel", "confidence": 0.7, "basedOn": ["élasticité", "texture"]}
  },
  "beautyAssessment": {
    "skinType": "Peau mixte à tendance sensible",
    "mainConcern": "Sensibilités de rasage avec poils incarnés occasionnels",
    "intensity": "modérée", 
    "concernedZones": ["menton", "cou", "joues basses"],
    "specificities": [
      {"name": "Poils incarnés post-rasage", "intensity": "modérée", "zones": ["menton", "cou"]},
      {"name": "Rougeurs localisées", "intensity": "légère", "zones": ["ailes du nez", "joues"]},
      {"name": "Imperfections pigmentaires", "intensity": "légère", "zones": ["front", "joues"]}
    ],
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
    "expectedImprovement": "Amélioration visible en 4-6 semaines avec routine beauté adaptée",
    "improvementTimeEstimate": "3-4 mois"
  }
}

## CONDITIONS
- Focus 100% sur l'analyse diagnostique visuelle
- Sois précis et objectif dans tes observations
- Base-toi uniquement sur ce que tu vois dans les photos
- Évite tout vocabulaire médical, reste dans l'univers beauté/cosmétique

## LOGIQUE ESTIMATION D'AMÉLIORATION
Pour improvementTimeEstimate, calcule selon cette logique :
- Score global 80-100 : "4-6 semaines"
- Score global 60-79 : "2-3 mois" 
- Score global 40-59 : "3-4 mois"
- Score global 20-39 : "4-6 mois"
- Score global 0-19 : "6-8 mois"

Ajuste selon les préoccupations spécifiques :
- Hydratation/sécheresse : -2 semaines
- Rides profondes/vieillissement : +1-2 mois
- Acné active/inflammation : +2-4 semaines
- Taches pigmentaires : +1-2 mois
- Sensibilité/irritation : +2-6 semaines`
  }

  /**
   * Prompt système pour la sélection des produits (ÉTAPE 2)
   */
  private static buildProductSelectionSystemPrompt(catalogText: string): string {
    return `## RÔLE
Tu es BeautyAI, expert conseil beauté spécialisé en sélection de produits cosmétiques personnalisés.

## TÂCHE - ÉTAPE 2: SÉLECTION PRODUITS
Basé sur le diagnostic établi, sélectionner les meilleurs produits du catalogue pour créer une routine beauté optimale.

## CATALOGUE COSMÉTIQUE DISPONIBLE
Tu as accès au catalogue suivant avec les références produits :

${catalogText}

IMPORTANT : Utilise UNIQUEMENT les références réelles du catalogue ci-dessus (exemple: B01MSSDEPK, B000O7PH34, etc.)

## RÈGLES BEAUTÉ ESSENTIELLES
1. RÉFÉRENCE OBLIGATOIRE : Chaque produit recommandé DOIT avoir une référence catalogId réelle
2. COSMÉTIQUES EXCLUSIVEMENT : Utilise uniquement les références existantes du catalogue
3. COHÉRENCE BEAUTÉ : La référence produit doit correspondre au besoin de soin identifié
4. DIAGNOSTIC FIRST : Base tes choix sur le diagnostic fourni, pas sur des suppositions

## PILIERS DE LA ROUTINE BEAUTÉ
- Nettoyer (cleanser) 
- Préparer (tonic)
- Traiter (serum, treatment)
- Hydrater (moisturizer)
- Nourrir (face_oil, balm si besoin)
- Protéger (sunscreen)

## RÉSULTAT - FORMAT JSON OBLIGATOIRE
Réponds UNIQUEMENT en JSON valide avec cette structure exacte :

{
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

## CONDITIONS
- Chaque référence catalogId DOIT exister dans le catalogue cosmétique
- Adapte la sélection selon le diagnostic fourni
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
   * Prompt utilisateur pour la sélection des produits (ÉTAPE 2)
   */
  private static buildProductSelectionUserPrompt(
    diagnostic: { scores: SkinScores; beautyAssessment: BeautyAssessment },
    request: AnalyzeRequest
  ): string {
    return `## DIAGNOSTIC ÉTABLI
**Préoccupation principale :** ${diagnostic.beautyAssessment.mainConcern}
**Intensité :** ${diagnostic.beautyAssessment.intensity}
**Zones concernées :** ${diagnostic.beautyAssessment.concernedZones?.join(', ') || 'Non spécifiées'}

**Scores détaillés :**
- Hydratation: ${diagnostic.scores.hydration?.value || 'N/A'}/100
- Rides: ${diagnostic.scores.wrinkles?.value || 'N/A'}/100
- Fermeté: ${diagnostic.scores.firmness?.value || 'N/A'}/100
- Éclat: ${diagnostic.scores.radiance?.value || 'N/A'}/100
- Pores: ${diagnostic.scores.pores?.value || 'N/A'}/100
- Taches: ${diagnostic.scores.spots?.value || 'N/A'}/100
- Cernes: ${diagnostic.scores.darkCircles?.value || 'N/A'}/100
- Score global: ${diagnostic.scores.overall || 'N/A'}/100

**Observations visuelles :**
${diagnostic.beautyAssessment.visualFindings?.map(finding => `- ${finding}`).join('\n') || 'Aucune observation spécifique'}

**Vue d'ensemble :**
${diagnostic.beautyAssessment.overview?.map(item => `- ${item}`).join('\n') || 'Aucune vue d\'ensemble'}

**Zones spécifiques :**
${diagnostic.beautyAssessment.zoneSpecific?.map(zone => `- ${zone.zone}: ${zone.concerns?.join(', ')} (${zone.intensity})`).join('\n') || 'Aucune zone spécifique'}

## PROFIL UTILISATEUR
**Profil :** ${request.userProfile.gender}, ${request.userProfile.age} ans
**Type de peau déclaré :** ${request.userProfile.skinType}
**Budget mensuel :** ${request.currentRoutine.monthlyBudget}
**Préférence routine :** ${request.currentRoutine.routinePreference || 'Équilibrée'}

## ALLERGIES ET SENSIBILITÉS
**Ingrédients à éviter :** ${request.allergies?.ingredients?.join(', ') || 'Aucune allergie connue'}
**Réactions passées :** ${request.allergies?.pastReactions || 'Aucune réaction signalée'}

## MISSION
Basé sur ce diagnostic précis, sélectionne les produits les plus pertinents du catalogue pour :
1. Traiter la préoccupation principale (${diagnostic.beautyAssessment.mainConcern})
2. Améliorer les scores les plus faibles
3. Cibler les zones concernées (${diagnostic.beautyAssessment.concernedZones?.join(', ')})
4. Respecter le budget et les préférences

RÉPONSE EN JSON UNIQUEMENT - PAS DE TEXTE LIBRE.`
  }

  /**
   * Parser la réponse diagnostique (ÉTAPE 1)
   */
  private static parseDiagnosticResponse(content: string | null): Record<string, unknown> {
    if (!content) {
      throw new Error('Réponse diagnostique vide de l\'IA')
    }

    try {
      // Nettoyer la réponse (enlever markdown si présent)
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      console.log('Contenu diagnostic à parser:', cleanContent.substring(0, 200) + '...')

      const parsed = JSON.parse(cleanContent)
      
      // Validation basique de la structure diagnostique
      if (!parsed.scores || !parsed.beautyAssessment) {
        throw new Error('Structure de réponse diagnostique invalide')
      }

      return parsed
    } catch (error) {
      console.error('Erreur parsing JSON diagnostic:', error)
      console.error('Contenu reçu:', content)
      throw new Error('Format de réponse diagnostique invalide de l\'IA')
    }
  }

  /**
   * Parser la réponse de sélection des produits (ÉTAPE 2)
   */
  private static parseProductSelectionResponse(content: string | null): ProductRecommendations {
    if (!content) {
      throw new Error('Réponse sélection produits vide de l\'IA')
    }

    try {
      // Nettoyer la réponse (enlever markdown si présent)
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      console.log('Contenu sélection produits à parser:', cleanContent.substring(0, 200) + '...')

      const parsed = JSON.parse(cleanContent)
      
      // Validation basique de la structure des recommandations
      if (!parsed.routine) {
        throw new Error('Structure de réponse sélection produits invalide')
      }

      return parsed as ProductRecommendations
    } catch (error) {
      console.error('Erreur parsing JSON sélection produits:', error)
      console.error('Contenu reçu:', content)
      throw new Error('Format de réponse sélection produits invalide de l\'IA')
    }
  }

  /**
   * Générer ID unique
   */
  private static generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
