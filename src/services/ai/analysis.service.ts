import { createOpenAIClient, ANALYSIS_MODEL } from '@/lib/openai'
import type { SkinAnalysis, SkinScores, BeautyAssessment, ProductRecommendations, UnifiedRoutineStep, RecommendedProduct, ZoneSpecificIssue } from '@/types'
import type { AnalyzeRequest } from '@/types/api'

export class AnalysisService {
  
  /**
   * Complete photo analysis with GPT-4o Vision - NEW 2-STEP LOGIC
   */
  static async analyzeSkin(request: AnalyzeRequest): Promise<SkinAnalysis> {
    try {
      console.log('🔧 Initializing OpenAI client...')
      
      // Check environment variables
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY missing in Vercel environment variables')
      }
      
      // Create OpenAI client server-side
      const openai = createOpenAIClient()
      console.log('✅ OpenAI client initialized successfully')

      // Images are already in base64 from client
      const imageContents = request.photos.map(photo => {
        // Extract base64 part if it contains data: prefix
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

      // Image validation
      if (imageContents.length === 0) {
        throw new Error('No valid images found for analysis')
      }

      console.log('🔍 STEP 1: Pure diagnostic analysis (without catalog)')

      // STEP 1: Pure diagnostic analysis WITHOUT catalog
      const diagnosticResult = await this.performDiagnosticAnalysis(openai, imageContents, request)
      
      console.log('✅ Diagnosis established:', {
        mainConcern: diagnosticResult.beautyAssessment?.mainConcern,
        overallScore: diagnosticResult.scores?.overall,
        concernedZones: diagnosticResult.beautyAssessment?.concernedZones
      })

      console.log('🛍️ STEP 2: Product selection based on diagnosis')

      // STEP 2: Product selection based on established diagnosis
      const productRecommendations = await this.selectProductsBasedOnDiagnosis(openai, diagnosticResult, request)

      console.log('✅ Products selected:', productRecommendations)

      // STEP 3: Unified routine generation
      console.log('🔄 STEP 3: Unified routine generation')
      const unifiedRoutine = this.generateUnifiedRoutine(diagnosticResult.beautyAssessment, productRecommendations)
      console.log('✅ Unified routine generated:', unifiedRoutine.length, 'steps')

      // Merge results with unified routine
      const finalAnalysis: SkinAnalysis = {
        id: this.generateId(),
        userId: 'temp-user',
        photos: request.photos,
        scores: diagnosticResult.scores,
        beautyAssessment: diagnosticResult.beautyAssessment,
        recommendations: {
          ...productRecommendations,
          unifiedRoutine // Add unified routine
        },
        createdAt: new Date()
      }

      return finalAnalysis

    } catch (error) {
      console.error('❌ Erreur analyse IA complète:', error)
      
      // Diagnostics spécifiques pour Vercel
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        
        if (errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
          throw new Error('Configuration OpenAI invalide - Vérifiez OPENAI_API_KEY dans Vercel')
        }
        
        if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
          throw new Error('Limite OpenAI atteinte - Réessayez dans quelques minutes')
        }
        
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          throw new Error('Problème de connexion réseau depuis Vercel vers OpenAI')
        }
        
        if (errorMessage.includes('timeout')) {
          throw new Error('Timeout de l\'analyse - Image trop volumineuse ou connexion lente')
        }
        
        if (errorMessage.includes('expected pattern') || errorMessage.includes('json')) {
          throw new Error('Erreur de parsing de la réponse OpenAI - Format inattendu')
        }
      }
      
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
      {
        "zone": "menton", 
        "problems": [
          {"name": "Poils incarnés", "intensity": "modérée"},
          {"name": "Rougeurs post-rasage", "intensity": "sévère"}
        ],
        "description": "Zone de rasage sensible avec problèmes multiples"
      },
      {
        "zone": "joues", 
        "problems": [
          {"name": "Pores dilatés", "intensity": "légère"},
          {"name": "Taches pigmentaires", "intensity": "modérée"}
        ],
        "description": "Texture irrégulière avec hyperpigmentation"
      }
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
${diagnostic.beautyAssessment.zoneSpecific?.map(zone => `- ${zone.zone}: ${zone.problems?.map(p => `${p.name} (${p.intensity})`).join(', ')}`).join('\n') || 'Aucune zone spécifique'}

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

  /**
   * ÉTAPE 3: Génération de la routine unifiée avec regroupement intelligent par produit
   * Supprime la section "Zones à surveiller" séparée + évite les étapes redondantes
   */
  private static generateUnifiedRoutine(
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep[] {
    console.log('🏗️ Génération routine unifiée avec 3 phases automatiques depuis:', {
      zoneSpecific: beautyAssessment.zoneSpecific?.length || 0,
      localizedRoutine: productRecommendations.localizedRoutine?.length || 0,
      routine: productRecommendations.routine ? 'présente' : 'absente'
    })

    // Générer les 3 phases complètes avec transition intelligente
    const immediateSteps = this.generateImmediatePhase(beautyAssessment, productRecommendations)
    const adaptationSteps = this.generateAdaptationPhase(beautyAssessment, productRecommendations, immediateSteps)
    const maintenanceSteps = this.generateMaintenancePhase(beautyAssessment, productRecommendations, adaptationSteps)
    
    // Combiner toutes les phases
    const allSteps = [...immediateSteps, ...adaptationSteps, ...maintenanceSteps]
    
    console.log('✅ Routine unifiée 3 phases créée:', {
      immediate: immediateSteps.length,
      adaptation: adaptationSteps.length, 
      maintenance: maintenanceSteps.length,
      total: allSteps.length
    })
    
    return allSteps
  }

  /**
   * Générer la phase immédiate (problèmes urgents, routine simple)
   */
  private static generateImmediatePhase(
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep[] {
    const steps: UnifiedRoutineStep[] = []
    let stepCounter = 1

    // 1. Nettoyage doux
    steps.push(this.createCleansingStep(stepCounter++, beautyAssessment))
    
    // 2. Traitements ciblés urgents
    const optimizedTreatments = this.groupTreatmentsByProduct(beautyAssessment)
    for (const treatment of optimizedTreatments) {
      steps.push(this.createOptimizedTreatmentStep(
        stepCounter++, 
        treatment,
        beautyAssessment,
        productRecommendations
      ))
    }
    
    // 3. Hydratation globale
    steps.push(this.createMoisturizingStep(stepCounter++, beautyAssessment, productRecommendations))
    
    // 4. Protection solaire
    if (this.includesSunProtection(beautyAssessment)) {
      steps.push(this.createSunProtectionStep(stepCounter++, beautyAssessment, productRecommendations))
    }
    
    // Filtrer les étapes vides, ajouter critères visuels et marquer comme phase immédiate
    return this.filterRedundantSteps(steps)
      .map(step => this.addVisualCriteria(step))
      .map(step => ({
        ...step,
        phase: 'immediate' as const
      }))
  }

  /**
   * Générer la phase d'adaptation (semaines 2-4, actifs plus puissants)
   */
  private static generateAdaptationPhase(
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations,
    immediatePhase: UnifiedRoutineStep[]
  ): UnifiedRoutineStep[] {
    const steps: UnifiedRoutineStep[] = []
    let stepCounter = 1 // CORRECTION: Numérotation 1,2,3 par phase

    // NOUVELLE LOGIQUE DERMATOLOGIQUE: Transition intelligente des produits
    
    // 1. Identifier la base durable de la phase immédiate
    const baseDurable = this.identifyLongTermBase(immediatePhase)
    console.log('📊 Base durable identifiée:', baseDurable.map(b => `${b.title} (${b.category})`).join(', '))
    
    // 2. Évoluer la base selon les besoins de l'IA
    const evolvedBase = this.evolveBaseProducts(baseDurable, beautyAssessment)
    
    // 3. Ajouter nouveaux actifs progressifs selon diagnostic IA
    const progressiveActives = this.generateProgressiveActives(beautyAssessment, evolvedBase.length + 1)
    
    // 4. Combiner et ordonner logiquement (nettoyage → traitements → hydratation → protection)
    const allSteps = [...evolvedBase, ...progressiveActives]
    const orderedSteps = this.orderStepsLogically(allSteps)
    
    // 5. Renuméroter correctement
    const finalSteps = orderedSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }))
    
    steps.push(...finalSteps)
    
    console.log('✨ Phase adaptation générée:', {
      baseEvolved: evolvedBase.length,
      newActives: progressiveActives.length,
      total: steps.length
    })

    return steps
  }

  /**
   * Générer la phase de maintenance (routine optimisée + soins hebdomadaires)
   */
  private static generateMaintenancePhase(
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations,
    adaptationPhase: UnifiedRoutineStep[]
  ): UnifiedRoutineStep[] {
    const steps: UnifiedRoutineStep[] = []
    let stepCounter = 1 // CORRECTION: Numérotation 1,2,3 par phase

    // NOUVELLE LOGIQUE DERMATOLOGIQUE: Continuité base évoluée + soins préventifs
    
    // 1. Transférer et optimiser la base évoluée de la phase adaptation
    const finalBase = this.transferAndOptimizeBase(adaptationPhase)
    
    // 2. Ajouter soins préventifs/optimisation selon besoins
    const preventiveCare = this.generatePreventiveCare(beautyAssessment, finalBase.length + 1)
    
    // 3. Combiner et ordonner logiquement
    const allSteps = [...finalBase, ...preventiveCare]
    const orderedSteps = this.orderStepsLogically(allSteps)
    
    // 4. Renuméroter correctement
    const finalSteps = orderedSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }))
    
    steps.push(...finalSteps)
    
    console.log('🏥 Phase maintenance générée:', {
      finalBase: finalBase.length,
      preventiveCare: preventiveCare.length,
      total: steps.length
    })

    return steps
  }

  /**
   * Méthodes d'aide pour analyser les besoins
   */
  private static hasAgingConcerns(beautyAssessment: BeautyAssessment): boolean {
    const agingKeywords = ['rides', 'ridules', 'vieillissement', 'fermeté', 'élasticité']
    return agingKeywords.some(keyword => 
      beautyAssessment.mainConcern?.toLowerCase().includes(keyword) ||
      beautyAssessment.zoneSpecific?.some(zone => 
        zone.problems?.some(problem => problem.name.toLowerCase().includes(keyword))
      )
    )
  }

  private static hasAcneConcerns(beautyAssessment: BeautyAssessment): boolean {
    const acneKeywords = ['imperfections', 'boutons', 'acné', 'points noirs', 'comédons']
    return acneKeywords.some(keyword => 
      beautyAssessment.mainConcern?.toLowerCase().includes(keyword) ||
      beautyAssessment.zoneSpecific?.some(zone => 
        zone.problems?.some(problem => problem.name.toLowerCase().includes(keyword))
      )
    )
  }

  private static hasPigmentationConcerns(beautyAssessment: BeautyAssessment): boolean {
    const pigmentationKeywords = ['taches', 'pigment', 'hyperpigmentation', 'mélasma']
    return pigmentationKeywords.some(keyword => 
      beautyAssessment.mainConcern?.toLowerCase().includes(keyword) ||
      beautyAssessment.zoneSpecific?.some(zone => 
        zone.problems?.some(problem => problem.name.toLowerCase().includes(keyword))
      )
    )
  }

  private static needsExfoliation(beautyAssessment: BeautyAssessment): boolean {
    const exfoliationKeywords = ['pores', 'texture', 'rugosité', 'grain de peau', 'éclat']
    return exfoliationKeywords.some(keyword => 
      beautyAssessment.mainConcern?.toLowerCase().includes(keyword) ||
      beautyAssessment.zoneSpecific?.some(zone => 
        zone.problems?.some(problem => problem.name.toLowerCase().includes(keyword))
      )
    )
  }

  /**
   * Filtrer les étapes redondantes ou sans valeur ajoutée
   */
  private static filterRedundantSteps(steps: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    const filteredSteps = steps.filter((step, index) => {
      // Garder toujours les étapes essentielles (nettoyage, hydratation, protection)
      if (['cleansing', 'hydration', 'protection'].includes(step.category)) {
        return true
      }
      
      // Filtrer les étapes de traitement sans produits spécifiques
      if (step.treatmentType === 'treatment' && (!step.recommendedProducts || step.recommendedProducts.length === 0)) {
        console.log(`🚫 Étape filtrée (pas de produits spécifiques): ${step.title}`)
        return false
      }
      
      // Filtrer les étapes avec produits génériques/fallback
      if (step.treatmentType === "treatment" && step.recommendedProducts.length > 0) {
        const hasGenericProducts = step.recommendedProducts.some(product => {
          const isGeneric = product.name.includes("Soin ciblé adapté") || 
                           product.name.includes("Sélection DermAI") ||
                           product.brand === "Sélection DermAI" ||
                           !product.catalogId ||
                           product.catalogId === "fallback"
          return isGeneric
        })
        
        if (hasGenericProducts) {
          console.log(`🚫 Étape filtrée (produits génériques): ${step.title} - ${step.recommendedProducts.map(p => p.name).join(", ")}`)
          return false
        }
      }
      // Garder toutes les autres étapes avec produits
      return true
    })
    
    // Renuméroter les étapes après filtrage
    return filteredSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }))
  }

  /**
   * Regrouper les problèmes par type depuis zoneSpecific
   */
  private static groupIssuesByType(beautyAssessment: BeautyAssessment): Map<string, string[]> {
    const grouped = new Map<string, string[]>()
    
    if (!beautyAssessment.zoneSpecific || !Array.isArray(beautyAssessment.zoneSpecific)) {
      console.log('⚠️ Aucune zone spécifique trouvée, utilisation fallback')
      // Fallback basé sur mainConcern
      const mainConcern = beautyAssessment.mainConcern || 'hydratation'
      grouped.set(mainConcern.toLowerCase(), beautyAssessment.concernedZones || [])
      return grouped
    }

    for (const zone of beautyAssessment.zoneSpecific) {
      if (!zone.zone) continue

      // Gérer nouvelle structure avec problems array
      if (Array.isArray(zone.problems)) {
        for (const problem of zone.problems) {
          const issueType = problem.name?.toLowerCase() || 'soin général'
          if (!grouped.has(issueType)) {
            grouped.set(issueType, [])
          }
          grouped.get(issueType)!.push(zone.zone)
        }
      }
      // Fallback pour ancienne structure
      else if (Array.isArray((zone as any).concerns)) {
        for (const concern of (zone as any).concerns) {
          const issueType = concern.toLowerCase()
          if (!grouped.has(issueType)) {
            grouped.set(issueType, [])
          }
          grouped.get(issueType)!.push(zone.zone)
        }
      }
      // Dernier fallback
      else {
        const issueType = 'soin ciblé'
        if (!grouped.has(issueType)) {
          grouped.set(issueType, [])
        }
        grouped.get(issueType)!.push(zone.zone)
      }
    }
    
    console.log('📊 Problèmes regroupés:', Array.from(grouped.entries()).map(([type, zones]) => `${type}: ${zones.join(', ')}`))
    return grouped
  }

  /**
   * Créer l'étape de nettoyage (toujours première)
   */
  private static createCleansingStep(stepNumber: number, beautyAssessment: BeautyAssessment): UnifiedRoutineStep {
    return {
      stepNumber,
      title: "Nettoyage doux",
      targetArea: 'global',
      recommendedProducts: [
        {
          id: "B01MSSDEPK",
          name: "CeraVe Nettoyant Hydratant",
          brand: "CeraVe",
          category: "cleanser",
          catalogId: "B01MSSDEPK"
        }
      ],
      applicationAdvice: "Masser délicatement sur tout le visage humide, rincer à l'eau tiède. Éviter le contour des yeux.",
      treatmentType: 'cleansing',
      priority: 10,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'both',
      category: 'cleansing'
    }
  }

  /**
   * Créer une étape de traitement ciblé
   */
  private static createTargetedTreatmentStep(
    stepNumber: number,
    issueType: string,
    zones: string[],
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    
    // Sélection de produits ciblés selon le type de problème
    const products = this.selectProductsForIssue(issueType, zones, productRecommendations)
    
    // Génération du titre intelligent
    const title = this.generateStepTitle(issueType, zones)
    
    // Conseils d'application spécifiques
    const applicationAdvice = this.generateApplicationAdvice(issueType, zones, products)
    
    // Restrictions selon le problème
    const restrictions = this.generateRestrictions(issueType, beautyAssessment)

    return {
      stepNumber,
      title,
      targetArea: 'specific',
      zones: [...new Set(zones)], // Dédupliquer les zones
      recommendedProducts: products,
      applicationAdvice,
      restrictions,
      treatmentType: 'treatment',
      priority: this.calculatePriority(issueType),
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'evening',
      category: 'treatment'
    }
  }

  /**
   * Créer l'étape d'hydratation globale
   */
  private static createMoisturizingStep(
    stepNumber: number, 
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    return {
      stepNumber,
      title: "Hydratation globale",
      targetArea: 'global',
      recommendedProducts: [
        {
          id: "TOLERIANE_SENSITIVE",
          name: "Tolériane Sensitive",
          brand: "La Roche-Posay",
          category: "moisturizer",
          catalogId: "B00BNUY3HE"
        }
      ],
      applicationAdvice: "Appliquer sur l'ensemble du visage en évitant les zones déjà traitées. Masser jusqu'à absorption complète.",
      treatmentType: 'moisturizing',
      priority: 9,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'both',
      category: 'hydration'
    }
  }

  /**
   * Créer l'étape de protection solaire
   */
  private static createSunProtectionStep(
    stepNumber: number,
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    return {
      stepNumber,
      title: "Protection solaire quotidienne",
      targetArea: 'global',
      recommendedProducts: [
        {
          id: "B004W55086",
          name: "La Roche-Posay Anthelios Fluid SPF 50",
          brand: "La Roche-Posay",
          category: "sunscreen",
          catalogId: "B004W55086"
        }
      ],
      applicationAdvice: "Appliquer généreusement le matin, 20 minutes avant l'exposition. Renouveler toutes les 2h si exposition prolongée.",
      treatmentType: 'protection',
      priority: 10,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'morning',
      category: 'protection'
    }
  }

  /**
   * Générer le titre de l'étape selon le type de problème et les zones
   */
  private static generateStepTitle(issueType: string, zones: string[]): string {
    const issueLabels: Record<string, string> = {
      'rougeurs': 'Traitement des rougeurs',
      'poils incarnés': 'Traitement des poils incarnés',
      'imperfections': 'Traitement des imperfections', 
      'hyperpigmentation': 'Traitement des taches pigmentaires',
      'pores dilatés': 'Resserrement des pores',
      'déshydratation': 'Hydratation ciblée',
      'rides': 'Traitement anti-âge',
      'points noirs': 'Désobstruction des pores'
    }
    
    // Retourner seulement le nom du traitement, sans les zones (affichées séparément dans l'UI)
    return issueLabels[issueType.toLowerCase()] || `Traitement ${issueType}`
  }

  /**
   * Sélectionner les produits appropriés pour un type de problème
   */
  private static selectProductsForIssue(
    issueType: string, 
    zones: string[],
    productRecommendations: ProductRecommendations
  ): RecommendedProduct[] {
    
    // Mapping par type de problème vers catalogId
    const productMapping: Record<string, RecommendedProduct> = {
      'rougeurs': {
        id: "B000O7PH34",
        name: "Avène Thermal Spring Water",
        brand: "Avène",
        category: "treatment",
        catalogId: "B000O7PH34"
      },
      'poils incarnés': {
        id: "B00BNUY3HE",
        name: "La Roche-Posay Cicaplast Baume B5",
        brand: "La Roche-Posay",
        category: "treatment",
        catalogId: "B00BNUY3HE"
      },
      'imperfections': {
        id: "B01MDTVZTZ",
        name: "The Ordinary Niacinamide 10% + Zinc 1%",
        brand: "The Ordinary",
        category: "serum",
        catalogId: "B01MDTVZTZ"
      },
      'pores dilatés': {
        id: "B01MDTVZTZ",
        name: "The Ordinary Niacinamide 10% + Zinc 1%",
        brand: "The Ordinary", 
        category: "serum",
        catalogId: "B01MDTVZTZ"
      },
      'points noirs': {
        id: "B00949CTQQ",
        name: "Paula's Choice SKIN PERFECTING 2% BHA",
        brand: "Paula's Choice",
        category: "exfoliant",
        catalogId: "B00949CTQQ"
      }
    }

    const product = productMapping[issueType.toLowerCase()]
    return product ? [product] : [
      {
        id: "B01MSSDEPK",
        name: "Soin ciblé adapté",
        brand: "Sélection DermAI",
        category: "treatment",
        catalogId: "B01MSSDEPK"
      }
    ]
  }

  /**
   * Générer les conseils d'application selon le problème
   */
  private static generateApplicationAdvice(
    issueType: string, 
    zones: string[], 
    products: RecommendedProduct[]
  ): string {
    
    const zoneText = zones.length === 1 ? `sur le ${zones[0]}` : 
                     zones.length > 1 ? `sur les zones : ${zones.join(', ')}` : 
                     'sur les zones concernées'

    const adviceMapping: Record<string, string> = {
      'rougeurs': `Vaporiser délicatement ${zoneText}, tapoter sans frotter. Laisser sécher naturellement.`,
      'poils incarnés': `Appliquer en fine couche ${zoneText} après rasage. Éviter massage agressif.`,
      'imperfections': `Appliquer 2-3 gouttes ${zoneText} le soir uniquement. Commencer par une application tous les 2 jours.`,
      'pores dilatés': `Appliquer sur peau propre ${zoneText}. Utiliser le soir, commencer progressivement.`,
      'points noirs': `Appliquer avec un coton-tige ${zoneText}. 2-3 fois par semaine maximum.`
    }

    return adviceMapping[issueType.toLowerCase()] || 
           `Appliquer selon les instructions du produit ${zoneText}. Surveiller la tolérance cutanée.`
  }

  /**
   * Générer les restrictions selon le type de problème
   */
  private static generateRestrictions(issueType: string, beautyAssessment: BeautyAssessment): string[] | undefined {
    
    const restrictionsMapping: Record<string, string[]> = {
      'rougeurs': [
        "Éviter AHA/BHA et rétinoïdes jusqu'à amélioration",
        "Pas d'exfoliation mécanique sur zones irritées"
      ],
      'poils incarnés': [
        "Éviter rasage à sec",
        "Préférer tondeuse ou rasage avec mousse",
        "Pas d'exfoliation agressive"
      ],
      'imperfections': [
        "Commencer progressivement (tous les 2 jours)",
        "Utiliser protection solaire obligatoire",
        "Éviter association avec rétinoïdes au début"
      ]
    }

    return restrictionsMapping[issueType.toLowerCase()]
  }

  /**
   * Calculer la priorité selon le type de problème
   */
  private static calculatePriority(issueType: string): number {
    const priorityMapping: Record<string, number> = {
      'rougeurs': 8,
      'poils incarnés': 7,
      'imperfections': 6,
      'pores dilatés': 5,
      'points noirs': 4,
      'rides': 3
    }

    return priorityMapping[issueType.toLowerCase()] || 5
  }

  /**
   * Vérifier si la protection solaire doit être incluse
   */
  private static includesSunProtection(beautyAssessment: BeautyAssessment): boolean {
    // Toujours inclure la protection solaire sauf cas très spécifiques
    return true
  }

  /**
   * NOUVEAU : Regroupement intelligent par produit pour éviter étapes redondantes
   */
  private static groupTreatmentsByProduct(beautyAssessment: BeautyAssessment): OptimizedTreatment[] {
    if (!beautyAssessment.zoneSpecific || !Array.isArray(beautyAssessment.zoneSpecific)) {
      console.log('⚠️ Aucune zone spécifique, fallback traitement général')
      return [{
        issues: [beautyAssessment.mainConcern || 'hydratation'],
        zones: beautyAssessment.concernedZones || [],
        catalogId: 'B01MSSDEPK', // CeraVe par défaut
        priority: 5
      }]
    }

    // 1. Extraire tous les problèmes avec leurs zones
    const allProblems: { issue: string; zone: string; intensity: string }[] = []
    
    for (const zoneData of beautyAssessment.zoneSpecific) {
      if (!zoneData.zone) continue

      if (Array.isArray(zoneData.problems)) {
        for (const problem of zoneData.problems) {
          allProblems.push({
            issue: problem.name?.toLowerCase() || 'soin général',
            zone: zoneData.zone,
            intensity: problem.intensity || 'modérée'
          })
        }
      }
    }

    console.log('🔍 Problèmes extraits:', allProblems)

    // 2. Regrouper par produit recommandé (même catalogId)
    const productGroups = new Map<string, {
      issues: string[]
      zones: string[]
      priority: number
      intensity: string
    }>()

    for (const problem of allProblems) {
      const catalogId = this.getProductIdForIssue(problem.issue)
      
      if (!productGroups.has(catalogId)) {
        productGroups.set(catalogId, {
          issues: [],
          zones: [],
          priority: this.calculatePriority(problem.issue),
          intensity: problem.intensity
        })
      }

      const group = productGroups.get(catalogId)!
      if (!group.issues.includes(problem.issue)) {
        group.issues.push(problem.issue)
      }
      if (!group.zones.includes(problem.zone)) {
        group.zones.push(problem.zone)
      }
    }

    // 3. Convertir en OptimizedTreatment triés par priorité
    const treatments: OptimizedTreatment[] = Array.from(productGroups.entries())
      .map(([catalogId, data]) => ({
        issues: data.issues,
        zones: data.zones,
        catalogId,
        priority: data.priority
      }))
      .sort((a, b) => b.priority - a.priority) // Priorité décroissante

    console.log('✅ Traitements regroupés par produit:', treatments.map(t => 
      `${t.catalogId}: ${t.issues.join(' + ')} (zones: ${t.zones.join(', ')})`
    ))

    return treatments
  }

  /**
   * Obtenir le catalogId approprié pour un type de problème
   */
  private static getProductIdForIssue(issueType: string): string {
    const productMapping: Record<string, string> = {
      'rougeurs': 'B000O7PH34', // Avène Thermal Spring Water
      'poils incarnés': 'B00BNUY3HE', // Cicaplast Baume B5
      'imperfections': 'B01MDTVZTZ', // The Ordinary Niacinamide
      'taches pigmentaires': 'B01MDTVZTZ', // Même produit que imperfections
      'hyperpigmentation': 'B01MDTVZTZ', // Même produit
      'pores dilatés': 'B01MDTVZTZ', // Même produit
      'points noirs': 'B00949CTQQ', // Paula's Choice BHA
      'comédons': 'B00949CTQQ', // Même produit
      'rides': 'B01MSSDEPK', // CeraVe avec peptides
      'rides d\'expression': 'B01MSSDEPK', // Même produit
      'déshydratation': 'B01MSSDEPK', // CeraVe hydratant
    }

    return productMapping[issueType.toLowerCase()] || 'B01MSSDEPK' // Fallback CeraVe
  }

  /**
   * Créer une étape de traitement optimisée (regroupée)
   */
  private static createOptimizedTreatmentStep(
    stepNumber: number,
    treatment: OptimizedTreatment,
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    
    // Génération du titre intelligent pour traitement groupé
    const title = this.generateOptimizedStepTitle(treatment.issues, treatment.zones)
    
    // Sélection du produit basé sur catalogId
    const product = this.getProductByCatalogId(treatment.catalogId)
    
    // Conseils d'application pour traitement groupé
    const applicationAdvice = this.generateGroupedApplicationAdvice(treatment)
    
    // Restrictions pour traitement groupé
    const restrictions = this.generateGroupedRestrictions(treatment.issues, beautyAssessment)

    return {
      stepNumber,
      title,
      targetArea: 'specific',
      zones: [...new Set(treatment.zones)], // Dédupliquer
      recommendedProducts: [product],
      applicationAdvice,
      restrictions,
      treatmentType: 'treatment',
      priority: treatment.priority,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'evening', // La plupart des traitements le soir
      category: 'treatment'
    }
  }

  /**
   * Générer un titre intelligent pour traitement groupé
   */
  private static generateOptimizedStepTitle(issues: string[], zones: string[]): string {
    
    // Mapping des problèmes vers labels user-friendly
    const issueLabels: Record<string, string> = {
      'rougeurs': 'rougeurs',
      'poils incarnés': 'poils incarnés',
      'imperfections': 'imperfections',
      'taches pigmentaires': 'taches pigmentaires',
      'hyperpigmentation': 'taches pigmentaires',
      'pores dilatés': 'pores dilatés',
      'points noirs': 'points noirs',
      'comédons': 'points noirs',
      'rides': 'rides',
      'rides d\'expression': 'rides d\'expression'
    }

    // Convertir les problèmes en labels
    const friendlyIssues = issues.map(issue => 
      issueLabels[issue.toLowerCase()] || issue
    ).filter((value, index, self) => self.indexOf(value) === index) // Dédupliquer

    // Créer le label des problèmes
    let issuesText = ''
    if (friendlyIssues.length === 1) {
      issuesText = `Traitement des ${friendlyIssues[0]}`
    } else if (friendlyIssues.length === 2) {
      issuesText = `Traitement des ${friendlyIssues[0]} et ${friendlyIssues[1]}`
    } else {
      issuesText = `Traitement des ${friendlyIssues.slice(0, -1).join(', ')} et ${friendlyIssues[friendlyIssues.length - 1]}`
    }

    // Retourner seulement le nom du traitement, sans les zones (affichées séparément dans l'UI)
    return issuesText
  }

  /**
   * Obtenir le produit par catalogId
   */
  private static getProductByCatalogId(catalogId: string): RecommendedProduct {
    const productMapping: Record<string, RecommendedProduct> = {
      'B000O7PH34': {
        id: "B000O7PH34",
        name: "Avène Thermal Spring Water",
        brand: "Avène",
        category: "treatment",
        catalogId: "B000O7PH34"
      },
      'B00BNUY3HE': {
        id: "B00BNUY3HE",
        name: "La Roche-Posay Cicaplast Baume B5",
        brand: "La Roche-Posay",
        category: "treatment",
        catalogId: "B00BNUY3HE"
      },
      'B01MDTVZTZ': {
        id: "B01MDTVZTZ",
        name: "The Ordinary Niacinamide 10% + Zinc 1%",
        brand: "The Ordinary",
        category: "serum",
        catalogId: "B01MDTVZTZ"
      },
      'B00949CTQQ': {
        id: "B00949CTQQ",
        name: "Paula's Choice SKIN PERFECTING 2% BHA",
        brand: "Paula's Choice",
        category: "exfoliant",
        catalogId: "B00949CTQQ"
      }
    }

    return productMapping[catalogId] || {
      id: "B01MSSDEPK",
      name: "Soin ciblé adapté",
      brand: "Sélection DermAI",
      category: "treatment",
      catalogId: "B01MSSDEPK"
    }
  }

  /**
   * Générer conseils d'application pour traitement groupé
   */
  private static generateGroupedApplicationAdvice(treatment: OptimizedTreatment): string {
    const zoneText = treatment.zones.length === 1 ? 
      `sur le ${treatment.zones[0]}` : 
      `sur les zones concernées : ${treatment.zones.join(', ')}`

    // Logique spécifique selon le produit
    const catalogId = treatment.catalogId
    
    if (catalogId === 'B000O7PH34') { // Avène
      return `Vaporiser délicatement ${zoneText}, tapoter sans frotter. Laisser sécher naturellement.`
    }
    if (catalogId === 'B00BNUY3HE') { // Cicaplast
      return `Appliquer en fine couche ${zoneText}. Masser très délicatement jusqu'à absorption.`
    }
    if (catalogId === 'B01MDTVZTZ') { // Niacinamide
      return `Appliquer 2-3 gouttes ${zoneText} le soir uniquement. Commencer progressivement (tous les 2 jours).`
    }
    if (catalogId === 'B00949CTQQ') { // BHA
      return `Appliquer avec un coton ${zoneText}. 2-3 fois par semaine maximum, toujours le soir.`
    }

    return `Appliquer selon les instructions du produit ${zoneText}. Surveiller la tolérance cutanée.`
  }

  /**
   * Générer restrictions pour traitement groupé
   */
  private static generateGroupedRestrictions(issues: string[], beautyAssessment: BeautyAssessment): string[] | undefined {
    const restrictions = new Set<string>()
    
    // Restrictions selon les problèmes regroupés
    for (const issue of issues) {
      const issueType = issue.toLowerCase()
      
      if (issueType.includes('rougeur') || issueType.includes('irritat')) {
        restrictions.add("Éviter AHA/BHA et rétinoïdes jusqu'à amélioration")
        restrictions.add("Pas d'exfoliation mécanique sur zones irritées")
      }
      
      if (issueType.includes('poils incarnés')) {
        restrictions.add("Éviter rasage à sec")
        restrictions.add("Préférer tondeuse ou rasage avec mousse")
      }
      
      if (issueType.includes('imperfection') || issueType.includes('tache')) {
        restrictions.add("Utiliser protection solaire obligatoire")
        restrictions.add("Commencer progressivement (tous les 2 jours)")
      }
    }

    return restrictions.size > 0 ? Array.from(restrictions) : undefined
  }

  /**
   * NOUVELLE LOGIQUE: Identifier la base durable en phase immédiate
   */
  private static identifyLongTermBase(immediatePhase: UnifiedRoutineStep[]): LongTermBaseProduct[] {
    console.log('🔍 Analyse phase immédiate pour base durable:', immediatePhase.map(s => `${s.stepNumber}. ${s.title} (${s.category})`).join(', '))
    
    const longTermBase = immediatePhase
      .filter(step => {
        // Critères de base durable selon logique dermatologique
        const isDurable = step.frequency === 'daily' &&
               ['cleansing', 'hydration', 'protection'].includes(step.category) &&
               !this.isTemporaryTreatment(step)
               
        console.log(`  - ${step.title}: ${isDurable ? '✓ Base durable' : '✗ Temporaire'} (${step.category}, ${step.frequency})`)
        return isDurable
      })
      .map(step => ({
        stepNumber: step.stepNumber,
        title: step.title,
        catalogId: step.recommendedProducts[0]?.catalogId || step.recommendedProducts[0]?.id || '',
        productName: step.recommendedProducts[0]?.name || step.title,
        productBrand: step.recommendedProducts[0]?.brand || 'Sélection DermAI',
        canBeMaintainedMonths: true,
        isTemporaryTreatment: false,
        frequency: step.frequency,
        category: step.category,
        phase: step.phase
      }))
      
    console.log('📊 Base durable finale:', longTermBase.map(b => `${b.title} - ${b.productName} (${b.catalogId})`).join(', '))
    return longTermBase
  }

  /**
   * Déterminer si un traitement est temporaire
   */
  private static isTemporaryTreatment(step: UnifiedRoutineStep): boolean {
    const temporaryKeywords = [
      'poils incarnés', 'cicatrisation', 'réparation barriere',
      'inflammation', 'irritation aigu', 'urgence'
    ]
    
    return temporaryKeywords.some(keyword => 
      step.title.toLowerCase().includes(keyword) ||
      step.applicationAdvice.toLowerCase().includes(keyword)
    )
  }

  /**
   * Évoluer les produits de base selon les besoins de l'IA
   */
  private static evolveBaseProducts(
    baseDurable: LongTermBaseProduct[],
    beautyAssessment: BeautyAssessment
  ): UnifiedRoutineStep[] {
    // Créer un mapping des produits originaux pour récupérer les vrais noms
    const originalProductMapping: Record<string, RecommendedProduct> = {
      'B01MSSDEPK': {
        id: "B01MSSDEPK",
        name: "CeraVe Nettoyant Hydratant",
        brand: "CeraVe",
        category: "cleanser",
        catalogId: "B01MSSDEPK"
      },
      'B00BNUY3HE': {
        id: "B00BNUY3HE",
        name: "Tolériane Sensitive",
        brand: "La Roche-Posay",
        category: "moisturizer",
        catalogId: "B00BNUY3HE"
      },
      'B004W55086': {
        id: "B004W55086",
        name: "La Roche-Posay Anthelios Fluid SPF 50",
        brand: "La Roche-Posay",
        category: "sunscreen",
        catalogId: "B004W55086"
      }
    }
    
    return baseDurable.map((baseProduct, index) => {
      // CORRECTION: Renuméroter à partir de 1
      const newStepNumber = index + 1
      
      if (baseProduct.category === 'hydration') {
        // Évolution vers hydratation renforcée si peau sèche/mature
        if (this.needsReinforcedHydration(beautyAssessment)) {
                return {
        stepNumber: newStepNumber,
        title: baseProduct.title.replace('globale', 'renforcée'),
        targetArea: 'global' as const,
        recommendedProducts: this.getReinforcedHydrationProducts(),
        applicationAdvice: "Appliquer généreusement pour contrebalancer l'introduction des actifs plus forts.",
        treatmentType: 'moisturizing' as const,
        priority: 9,
        phase: 'adaptation' as const,
        frequency: 'daily' as const,
        timeOfDay: 'both' as const,
        category: 'hydration' as const,
        // NOUVEAUX CHAMPS
        applicationDuration: 'En continu',
        timingBadge: 'Quotidien ☀️🌙',
        timingDetails: 'Matin et soir'
      }
        }
      }
      
      if (baseProduct.category === 'protection') {
        // Évolution vers SPF plus élevé si exposition/actifs
        if (this.hasProgressiveActives(beautyAssessment) || this.hasHighExposure(beautyAssessment)) {
          return {
            stepNumber: newStepNumber,
            title: "Protection solaire renforcée",
            targetArea: 'global' as const,
            recommendedProducts: this.getHigherSPFProducts(),
            applicationAdvice: "Application quotidienne indispensable avec actifs. Renouveler toutes les 2h si exposition.",
            treatmentType: 'protection' as const,
            priority: 10,
            phase: 'adaptation' as const,
            frequency: 'daily' as const,
            timeOfDay: 'morning' as const,
            category: 'protection' as const,
            // NOUVEAUX CHAMPS
            applicationDuration: 'En continu',
            timingBadge: 'Quotidien ☀️',
            timingDetails: 'Matin uniquement'
          }
        }
      }
      
      // Base conservée par défaut - CORRECTION: utiliser le vrai produit de la base durable
      const originalProduct = originalProductMapping[baseProduct.catalogId] || {
        id: baseProduct.catalogId,
        name: baseProduct.productName, // Utiliser le vrai nom du produit
        brand: baseProduct.productBrand, // Utiliser la vraie marque
        category: baseProduct.category,
        catalogId: baseProduct.catalogId
      }
      
      return {
        stepNumber: newStepNumber,
        title: baseProduct.title,
        targetArea: 'global' as const,
        recommendedProducts: [originalProduct],
        applicationAdvice: "Routine maintenant établie. Continuer l'application selon les instructions précédentes.",
        treatmentType: this.mapCategoryToTreatmentType(baseProduct.category),
        priority: 9,
        phase: 'adaptation' as const,
        frequency: baseProduct.frequency as any,
        timeOfDay: 'both' as const,
        category: baseProduct.category as any,
        // NOUVEAUX CHAMPS
        applicationDuration: 'En continu',
        timingBadge: 'Quotidien ☀️🌙',
        timingDetails: 'Matin et soir'
      }
    })
  }

  /**
   * Générer actifs progressifs selon diagnostic
   */
  private static generateProgressiveActives(
    beautyAssessment: BeautyAssessment,
    stepCounter: number
  ): UnifiedRoutineStep[] {
    const actives: UnifiedRoutineStep[] = []
    
    // Analyser les besoins pour actifs progressifs
    const hasAging = this.hasAgingConcerns(beautyAssessment)
    const hasAcne = this.hasAcneConcerns(beautyAssessment)
    const hasPigmentation = this.hasPigmentationConcerns(beautyAssessment)
    
    if (hasAging) {
      actives.push({
        stepNumber: stepCounter++,
        title: "Sérum anti-âge progressif",
        targetArea: 'global',
        recommendedProducts: [{
          id: "B08KGXQY2R",
          name: "The Ordinary Retinol 0.2% in Squalane",
          brand: "The Ordinary",
          category: "serum",
          catalogId: "B08KGXQY2R"
        }],
        applicationAdvice: "Commencer 1 soir sur 3, puis augmenter selon tolérance. Appliquer sur peau sèche.",
        restrictions: ["Protection solaire obligatoire le lendemain", "Commencer très progressivement"],
        treatmentType: 'treatment',
        priority: 8,
        phase: 'adaptation',
        frequency: 'progressive',
        timeOfDay: 'evening',
        category: 'treatment',
        startAfterDays: 14,
        frequencyDetails: "1x tous les 3 soirs, puis augmenter",
        // NOUVEAUX CHAMPS UX
        applicationDuration: 'Introduction progressive selon tolérance',
        timingBadge: 'Progressif 📈',
        timingDetails: '1x tous les 3 soirs, puis augmenter'
      })
    }
    
    if (hasAcne || hasPigmentation) {
      actives.push({
        stepNumber: stepCounter++,
        title: "Traitement actif ciblé (Niacinamide)",
        targetArea: 'specific',
        zones: beautyAssessment.concernedZones || [],
        recommendedProducts: [{
          id: "B077RZ5LPG",
          name: "The Ordinary Niacinamide 10% + Zinc 1%",
          brand: "The Ordinary",
          category: "serum",
          catalogId: "B077RZ5LPG"
        }],
        applicationAdvice: "2-3 gouttes le soir uniquement sur zones concernées.",
        treatmentType: 'treatment',
        priority: 7,
        phase: 'adaptation',
        frequency: 'daily',
        timeOfDay: 'evening',
        category: 'treatment',
        startAfterDays: 14,
        // NOUVEAUX CHAMPS UX
        applicationDuration: 'En continu pour maintenir les résultats',
        timingBadge: 'Quotidien 🌙',
        timingDetails: 'Soir uniquement'
      })
    }
    
    return actives
  }

  /**
   * Ajouter critères visuels d'observation ET timing/durée séparés
   */
  private static addVisualCriteria(step: UnifiedRoutineStep): UnifiedRoutineStep {
    const visualCriteria = this.getVisualCriteriaForTreatment(step.title)
    const timingInfo = this.generateTimingBadge(step)
    
    // Séparer les informations au lieu de les mélanger dans applicationAdvice
    const enhancedStep = {
      ...step,
      // NOUVEAU: Durée d'application séparée
      applicationDuration: this.generateApplicationDuration(step, visualCriteria),
      // NOUVEAU: Badge timing avec icônes
      timingBadge: timingInfo.badge,
      timingDetails: timingInfo.details,
    }
    
    return enhancedStep
  }

  /**
   * Obtenir critères visuels selon type de traitement
   */
  private static getVisualCriteriaForTreatment(title: string): VisualCriteria | null {
    const criteriaMapping: Record<string, VisualCriteria> = {
      'poils incarnés': {
        goal: 'disparition des inflammations',
        observation: 'Vérifier absence de rougeurs et gonflements',
        estimatedDays: '1-2 semaines',
        nextStep: 'Continuer prévention rasage puis phase suivante'
      },
      'imperfections': {
        goal: 'réduction visible des lésions',
        observation: 'Compter diminution nombre boutons actifs',
        estimatedDays: '2-3 semaines',
        nextStep: 'Introduire prévention récidive'
      },
      'rougeurs': {
        goal: 'apaisement et uniformisation',
        observation: 'Teint plus homogène, moins de réactivité',
        estimatedDays: '1-2 semaines',
        nextStep: 'Renforcer barrière cutanée'
      },
      'cicatrisation': {
        goal: 'fermeture complète plaies',
        observation: 'Peau lisse, couleur normalisée',
        estimatedDays: '1-3 semaines',
        nextStep: 'Prévention cicatrices'
      }
    }
    
    const lowerTitle = title.toLowerCase()
    for (const [keyword, criteria] of Object.entries(criteriaMapping)) {
      if (lowerTitle.includes(keyword)) {
        return criteria
      }
    }
    
    return null
  }

  /**
   * Méthodes d'aide pour évaluer les besoins
   */
  private static needsReinforcedHydration(beautyAssessment: BeautyAssessment): boolean {
    return beautyAssessment.mainConcern?.toLowerCase().includes('sécheresse') ||
           beautyAssessment.mainConcern?.toLowerCase().includes('déshydratation') ||
           (beautyAssessment.zoneSpecific?.some(zone => 
             zone.problems?.some(p => p.name.toLowerCase().includes('sécheresse'))
           ) ?? false)
  }

  private static hasProgressiveActives(beautyAssessment: BeautyAssessment): boolean {
    return this.hasAgingConcerns(beautyAssessment) || this.hasAcneConcerns(beautyAssessment)
  }

  private static hasHighExposure(beautyAssessment: BeautyAssessment): boolean {
    // Suppose exposition élevée si taches pigmentaires ou photovieillissement
    return beautyAssessment.mainConcern?.toLowerCase().includes('tache') ||
           beautyAssessment.mainConcern?.toLowerCase().includes('photovieillissement')
  }

  private static getReinforcedHydrationProducts(): RecommendedProduct[] {
    return [{
      id: "3337875588378",
      name: "La Roche-Posay Toleriane Ultra Fluide",
      brand: "La Roche-Posay",
      category: "moisturizer",
      catalogId: "3337875588378"
    }]
  }

  private static getHigherSPFProducts(): RecommendedProduct[] {
    return [{
      id: "3337875588600",
      name: "La Roche-Posay Anthelios Ultra Fluide SPF 60",
      brand: "La Roche-Posay",
      category: "sunscreen",
      catalogId: "3337875588600"
    }]
  }

  private static mapCategoryToTreatmentType(category: string): 'cleansing' | 'treatment' | 'moisturizing' | 'protection' {
    const mapping: Record<string, any> = {
      'cleansing': 'cleansing',
      'hydration': 'moisturizing',
      'protection': 'protection',
      'treatment': 'treatment'
    }
    return mapping[category] || 'treatment'
  }

  /**
   * Ordonner les étapes selon la logique dermatologique
   */
  private static orderStepsLogically(steps: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    const categoryOrder = {
      'cleansing': 1,
      'treatment': 2,
      'hydration': 3,
      'protection': 4
    }
    
    return steps.sort((a, b) => {
      const orderA = categoryOrder[a.category as keyof typeof categoryOrder] || 5
      const orderB = categoryOrder[b.category as keyof typeof categoryOrder] || 5
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      // Si même catégorie, trier par priorité
      return b.priority - a.priority
    })
  }

  /**
   * Transférer et optimiser la base de la phase adaptation vers maintenance
   */
  private static transferAndOptimizeBase(adaptationPhase: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    console.log('🔄 Transfert base adaptation vers maintenance:', adaptationPhase.map(s => `${s.stepNumber}. ${s.title}`).join(', '))
    
    // Identifier la base établie en adaptation (produits quotidiens, base)
    const baseProducts = adaptationPhase.filter(step => 
      step.frequency === 'daily' &&
      ['cleansing', 'hydration', 'protection'].includes(step.category)
    )
    
    console.log('🏠 Base à transférer:', baseProducts.map(s => s.title).join(', '))
    
    // Optimiser pour maintenance (même efficacité, geste plus fluide) - SANS renuméroter ici
    return baseProducts.map(step => ({
      ...step,
      phase: 'maintenance' as const,
      title: step.title.includes('renforcé') ? step.title : `${step.title} optimisée`,
      applicationAdvice: `Routine établie et maîtrisée. ${step.applicationAdvice.replace('Routine maintenant établie. ', '')}`
    }))
  }

  /**
   * Générer soins préventifs selon besoins long terme
   */
  private static generatePreventiveCare(
    beautyAssessment: BeautyAssessment, 
    stepCounter: number
  ): UnifiedRoutineStep[] {
    const preventiveCare: UnifiedRoutineStep[] = []
    
    // Exfoliation préventive si nécessaire
    if (this.needsExfoliation(beautyAssessment)) {
      preventiveCare.push({
        stepNumber: stepCounter++,
        title: "Exfoliation préventive",
        targetArea: 'global',
        recommendedProducts: [{
          id: "B07XDQJV2P",
          name: "The Ordinary Lactic Acid 5% + HA",
          brand: "The Ordinary",
          category: "exfoliant",
          catalogId: "B07XDQJV2P"
        }],
        applicationAdvice: "Appliquer pour maintenir le renouvellement cellulaire et prévenir l'accumulation de cellules mortes.",
        restrictions: ["Ne pas combiner avec rétinol le même soir", "Protection solaire indispensable"],
        treatmentType: 'treatment',
        priority: 6,
        phase: 'maintenance',
        frequency: 'weekly',
        timeOfDay: 'evening',
        category: 'exfoliation',
        startAfterDays: 42, // Après adaptation complète
        frequencyDetails: "1x/semaine, soir sans rétinol",
        // NOUVEAUX CHAMPS UX
        applicationDuration: 'Entretien hebdomadaire',
        timingBadge: 'Hebdomadaire 🌙',
        timingDetails: '1x/semaine, soir sans rétinol'
      })
    }
    
    // Soin ciblé préventif selon préoccupation principale
    const mainConcern = beautyAssessment.mainConcern?.toLowerCase() || ''
    
    if (mainConcern.includes('tache') || mainConcern.includes('pigment')) {
      preventiveCare.push({
        stepNumber: stepCounter++,
        title: "Prévention taches pigmentaires",
        targetArea: 'specific',
        zones: beautyAssessment.concernedZones || [],
        recommendedProducts: [{
          id: "B077RZ5LPG",
          name: "The Ordinary Niacinamide 10% + Zinc 1%",
          brand: "The Ordinary",
          category: "serum",
          catalogId: "B077RZ5LPG"
        }],
        applicationAdvice: "Application continue pour maintenir l'uniformité du teint et prévenir nouvelles taches.",
        treatmentType: 'treatment',
        priority: 7,
        phase: 'maintenance',
        frequency: 'daily',
        timeOfDay: 'evening',
        category: 'treatment',
        // NOUVEAUX CHAMPS UX
        applicationDuration: 'En continu pour prévention',
        timingBadge: 'Quotidien 🌙',
        timingDetails: 'Soir uniquement'
      })
    }
    
    if (mainConcern.includes('ride') || mainConcern.includes('âge')) {
      preventiveCare.push({
        stepNumber: stepCounter++,
        title: "Prévention vieillissement",
        targetArea: 'global',
        recommendedProducts: [{
          id: "B08KGXQY2R",
          name: "The Ordinary Retinol 0.2% in Squalane",
          brand: "The Ordinary",
          category: "serum",
          catalogId: "B08KGXQY2R"
        }],
        applicationAdvice: "Maintenir 3-4 applications par semaine pour prévenir nouveaux signes de vieillissement.",
        restrictions: ["Protection solaire obligatoire"],
        treatmentType: 'treatment',
        priority: 8,
        phase: 'maintenance',
        frequency: 'weekly',
        timeOfDay: 'evening',
        category: 'treatment',
        frequencyDetails: "3-4x/semaine",
        // NOUVEAUX CHAMPS UX
        applicationDuration: 'En continu pour prévention',
        timingBadge: 'Varié ⚡',
        timingDetails: '3-4x/semaine'
      })
    }
    
    return preventiveCare
  }

  /**
   * Générer la durée d'application selon le type de traitement
   */
  private static generateApplicationDuration(
    step: UnifiedRoutineStep, 
    visualCriteria: VisualCriteria | null
  ): string {
    // Traitements temporaires avec critères visuels
    if (visualCriteria) {
      return `Jusqu'à ${visualCriteria.observation.toLowerCase()} (${visualCriteria.estimatedDays})`
    }
    
    // Traitements permanents selon la catégorie
    if (['cleansing', 'hydration', 'protection'].includes(step.category)) {
      return 'En continu'
    }
    
    // Exfoliation et soins hebdomadaires
    if (step.frequency === 'weekly') {
      return 'Entretien hebdomadaire'
    }
    
    // Traitements progressifs
    if (step.frequency === 'progressive') {
      return 'Introduction progressive selon tolérance'
    }
    
    // Par défaut
    return 'Selon besoin'
  }

  /**
   * Générer le badge timing avec icônes matin/soir
   */
  private static generateTimingBadge(step: UnifiedRoutineStep): TimingBadgeResult {
    const { frequency, timeOfDay, frequencyDetails } = step
    
    // Icônes pour timing
    const icons = {
      morning: '☀️',
      evening: '🌙',
      both: '☀️🌙'
    }
    
    // Badge principal selon fréquence
    if (frequency === 'daily') {
      const icon = icons[timeOfDay] || ''
      return {
        badge: `Quotidien ${icon}`,
        details: timeOfDay === 'evening' ? 'Soir uniquement' : 
                timeOfDay === 'morning' ? 'Matin uniquement' : 
                'Matin et soir'
      }
    }
    
    if (frequency === 'weekly') {
      const icon = icons[timeOfDay] || '🌙'
      let details = '1x/semaine'
      
      // Ajouter détails spéciaux pour certains produits
      if (step.title.toLowerCase().includes('exfoliation')) {
        details = '1x/semaine, soir sans rétinol'
      } else if (frequencyDetails) {
        details = frequencyDetails
      }
      
      return {
        badge: `Hebdomadaire ${icon}`,
        details
      }
    }
    
    if (frequency === 'progressive') {
      return {
        badge: 'Progressif 📈',
        details: frequencyDetails || 'Commencer 1x tous les 3 jours, puis augmenter'
      }
    }
    
    if (frequency === 'as-needed') {
      return {
        badge: 'Au besoin 🎯',
        details: 'Selon apparition des problèmes'
      }
    }
    
    // Par défaut
    return {
      badge: 'Varié ⚡',
      details: frequencyDetails || 'Fréquence variable'
    }
  }
}

// Interface pour traitement optimisé
interface OptimizedTreatment {
  issues: string[]
  zones: string[]
  catalogId: string
  priority: number
}

// Interface pour base durable
interface LongTermBaseProduct {
  stepNumber: number
  title: string
  catalogId: string
  productName: string
  productBrand: string
  canBeMaintainedMonths: boolean
  isTemporaryTreatment: boolean
  frequency: string
  category: string
  phase: 'immediate' | 'adaptation' | 'maintenance'
}

// Interface pour critères visuels
interface VisualCriteria {
  goal: string
  observation: string
  estimatedDays: string
  nextStep: string
}

// Interface locale pour timing badges
interface TimingBadgeResult {
  badge: string
  details?: string
}
