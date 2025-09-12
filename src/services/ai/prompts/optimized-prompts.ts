/**
 * 🔥 PROMPTS OPTIMISÉS - SPRINT 3 OPTIMISATION
 * Prompts compacts et efficaces pour réduire les coûts OpenAI
 * Maintien de la qualité avec réduction significative des tokens
 */

import { costOptimizer } from '@/utils/CostOptimizer'

export class OptimizedPrompts {
  
  /**
   * Prompt système optimisé pour génération routine IA
   * Réduction ~40% tokens vs version originale
   */
  static buildOptimizedRoutineSystemPrompt(): string {
    return `Expert dermatologue - Routine 3 phases personnalisée.

LOGIQUE DERMATOLOGIQUE:
• Cycle cellulaire: 28j base (+7j/décennie >30ans)
• Phase Immédiate (1-3sem): Stabiliser + traiter urgent
• Phase Adaptation (3-8sem): Introduire actifs progressifs  
• Phase Maintenance (continu): Maintenir + prévention

PERSONNALISATION OBLIGATOIRE:
ÂGE: <25ans=tolérance élevée, 25-40=équilibre, 40-55=anti-âge, >55=douceur
PEAU: Sèche=hydratation+, Grasse=régulation sébum, Mixte=approche zonée, Sensible=progression lente
GRAVITÉ: Légère=prévention, Modérée=correction ciblée, Intense=traitement intensif

CONTENU UNIQUE:
• Titres spécifiques au diagnostic (pas "Nettoyage" mais "Nettoyage doux anti-imperfections zone T")
• Descriptions personnalisées selon profil
• Critères visuels vs durées fixes ("jusqu'à cicatrisation" vs "2 semaines")

JSON selon RoutinePersonnaliseeCompleteSchema.`
  }

  /**
   * Prompt système optimisé pour sélection produits IA
   * Réduction ~35% tokens vs version originale
   */
  static buildOptimizedProductSystemPrompt(): string {
    return `Expert sélection produits dermatologiques 15 ans expérience.

MISSION: Sélection optimale produits pour routine personnalisée.

CORRESPONDANCE EXACTE:
• Chaque étape routine = 1 produit précis catalogue
• Zones diagnostic = zones produit
• Intensité problème = potency produit
• Timing routine = timing produit

LOGIQUE DERMATOLOGIQUE:
COMPATIBILITÉ: Acides AHA/BHA alternance, Rétinol+Acides séparés, VitC+Niacinamide OK si pH équilibré
ORDRE: Nettoyant→Tonique→Sérums→Hydratant→SPF
PROGRESSION: Immédiate=doux, Adaptation=actifs test, Maintenance=établis

BUDGET STRICT:
• Total ≤ budget utilisateur
• Priorisation: SPF>Nettoyant>Actif>Hydratant
• Alternatives si dépassement

JUSTIFICATION OBLIGATOIRE:
• Pourquoi ce produit pour cette étape
• Réponse au diagnostic utilisateur
• Conseil usage personnalisé

JSON selon ProductSelectionCompleteSchema.`
  }

  /**
   * Construit un prompt utilisateur optimisé pour routine
   */
  static buildOptimizedRoutineUserPrompt(
    diagnostic: any,
    userProfile: any,
    skinConcerns: any,
    constraints?: any
  ): string {
    const age = userProfile.age
    const skinType = userProfile.skinType
    const mainConcern = diagnostic.mainConcern
    const intensity = diagnostic.intensity
    const zones = diagnostic.concernedZones?.join(', ') || 'Non spécifiées'
    
    return `PROFIL: ${age}ans, ${skinType}
DIAGNOSTIC: ${mainConcern} (${intensity}) - Zones: ${zones}
PRÉOCCUPATIONS: ${skinConcerns.primary?.join(', ') || 'Non spécifiées'}
CONTRAINTES: Budget ${constraints?.budget || 'libre'}, Temps ${constraints?.timeAvailable || 'standard'}

${diagnostic.zoneSpecific?.map((z: any) => 
  `${z.zone}: ${z.problems?.map((p: any) => `${p.name}(${p.intensity})`).join(',') || z.description}`
).join('\n') || ''}

Génère routine 3 phases UNIQUE pour ce profil. Respecte cycle cellulaire 28j.`
  }

  /**
   * Construit un prompt utilisateur optimisé pour sélection produits
   */
  static buildOptimizedProductUserPrompt(
    routine: any,
    catalogue: any,
    budget: any,
    preferences?: any
  ): string {
    // Résumé compact de la routine
    const routineSummary = `${routine.personalizationSummary}

PHASES:
Immédiate (${routine.personalizedTimings.immediateDuration}): ${routine.immediatePhase.steps.length} étapes
Adaptation (${routine.personalizedTimings.adaptationDuration}): ${routine.adaptationPhase.steps.length} étapes  
Maintenance (${routine.personalizedTimings.maintenanceDuration}): ${routine.maintenancePhase.steps.length} étapes`

    // Catalogue compact (top produits par catégorie)
    const catalogueCompact = this.buildCompactCatalogueDescription(catalogue)

    return `ROUTINE PERSONNALISÉE:
${routineSummary}

CATALOGUE (${catalogue.products.length} produits):
${catalogueCompact}

CONTRAINTES:
Budget max: ${budget.maxBudget}€
Préférences: ${preferences?.brandPreferences?.join(', ') || 'Aucune'}
Allergies: ${preferences?.avoidIngredients?.join(', ') || 'Aucune'}

MISSION: Sélection optimale respectant budget + logique dermatologique.`
  }

  /**
   * Construit une description compacte du catalogue
   */
  private static buildCompactCatalogueDescription(catalogue: any): string {
    // Grouper par catégorie et prendre les meilleurs produits
    const categories = new Map<string, any[]>()
    
    catalogue.products.forEach((product: any) => {
      if (!categories.has(product.category)) {
        categories.set(product.category, [])
      }
      categories.get(product.category)!.push(product)
    })

    let description = ''
    
    for (const [category, products] of categories.entries()) {
      // Trier par score/prix et prendre les 3 meilleurs
      const topProducts = products
        .sort((a, b) => (b.reviewScore || 4) - (a.reviewScore || 4))
        .slice(0, 3)
      
      description += `\n${category.toUpperCase()}:\n`
      
      topProducts.forEach(product => {
        const ingredients = product.activeIngredients?.slice(0, 2).join(', ') || 'Standard'
        const skinTypes = product.skinTypes?.slice(0, 2).join(', ') || 'Tous'
        
        description += `${product.id}: ${product.name} (${product.brand}) ${product.price}€ - ${ingredients} - ${skinTypes}\n`
      })
    }

    return description
  }

  /**
   * Optimise un prompt existant pour réduire les tokens
   */
  static optimizeExistingPrompt(prompt: string, targetReduction: number = 0.3): string {
    return costOptimizer.optimizePrompt(prompt, targetReduction)
  }

  /**
   * Estime le nombre de tokens d'un prompt
   */
  static estimateTokens(text: string): number {
    // Estimation approximative : 1 token ≈ 4 caractères pour le français
    // Plus précis que la règle anglaise (1 token ≈ 3.5 chars)
    return Math.ceil(text.length / 4)
  }

  /**
   * Valide qu'un prompt respecte les limites de tokens
   */
  static validatePromptLength(
    systemPrompt: string, 
    userPrompt: string, 
    maxTokens: number = 4000
  ): {
    valid: boolean
    estimatedTokens: number
    suggestions?: string[]
  } {
    const totalText = systemPrompt + userPrompt
    const estimatedTokens = this.estimateTokens(totalText)
    
    if (estimatedTokens <= maxTokens) {
      return { valid: true, estimatedTokens }
    }

    const suggestions = []
    const excess = estimatedTokens - maxTokens
    const reductionNeeded = excess / estimatedTokens

    if (reductionNeeded > 0.5) {
      suggestions.push('Réduction majeure nécessaire (>50%)')
      suggestions.push('Considérer diviser en plusieurs requêtes')
    } else if (reductionNeeded > 0.3) {
      suggestions.push('Réduction importante nécessaire (30-50%)')
      suggestions.push('Simplifier les exemples et descriptions')
    } else {
      suggestions.push('Réduction mineure nécessaire (<30%)')
      suggestions.push('Supprimer les répétitions et espaces')
    }

    return {
      valid: false,
      estimatedTokens,
      suggestions
    }
  }

  /**
   * Génère des variantes de prompts pour A/B testing
   */
  static generatePromptVariants(basePrompt: string): {
    compact: string
    detailed: string
    balanced: string
  } {
    return {
      compact: this.optimizeExistingPrompt(basePrompt, 0.4), // -40% tokens
      detailed: basePrompt, // Version originale
      balanced: this.optimizeExistingPrompt(basePrompt, 0.2) // -20% tokens
    }
  }

  /**
   * Sélectionne le meilleur prompt selon les contraintes
   */
  static selectOptimalPrompt(
    variants: ReturnType<typeof OptimizedPrompts.generatePromptVariants>,
    budget: number,
    qualityRequirement: 'high' | 'medium' | 'low'
  ): { prompt: string, variant: string, reasoning: string } {
    const compactTokens = this.estimateTokens(variants.compact)
    const balancedTokens = this.estimateTokens(variants.balanced)
    const detailedTokens = this.estimateTokens(variants.detailed)

    // Estimation coût (approximative pour gpt-4o)
    const costPerToken = 0.00375 / 1000 // Prix prompt tokens
    const compactCost = compactTokens * costPerToken
    const balancedCost = balancedTokens * costPerToken
    const detailedCost = detailedTokens * costPerToken

    // Sélection selon budget et qualité
    if (budget < 0.5 || qualityRequirement === 'low') {
      return {
        prompt: variants.compact,
        variant: 'compact',
        reasoning: `Budget serré (${budget}€) ou qualité basse demandée. Coût: ${compactCost.toFixed(4)}€`
      }
    }

    if (budget > 1.0 && qualityRequirement === 'high') {
      return {
        prompt: variants.detailed,
        variant: 'detailed',
        reasoning: `Budget confortable (${budget}€) et qualité haute demandée. Coût: ${detailedCost.toFixed(4)}€`
      }
    }

    return {
      prompt: variants.balanced,
      variant: 'balanced',
      reasoning: `Équilibre optimal qualité/coût. Budget: ${budget}€, Coût: ${balancedCost.toFixed(4)}€`
    }
  }
}