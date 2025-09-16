/**
 * Validateur de cohérence pré-IA pour détecter et résoudre les incohérences utilisateur
 * 
 * OBJECTIF : Détecter les contradictions dans les inputs utilisateur et proposer des adaptations
 * avant de passer à l'IA pour éviter des résultats incohérents
 */

import type { AnalyzeRequest } from '@/types/api'

export interface CoherenceIssue {
  type: 'budget_routine' | 'age_concerns' | 'skin_concerns' | 'time_routine' | 'allergies'
  severity: 'warning' | 'critical'
  message: string
  suggestion: string
  autoFix?: {
    field: string
    newValue: any
    reason: string
  }
}

export interface CoherenceValidationResult {
  isCoherent: boolean
  issues: CoherenceIssue[]
  adaptedRequest?: AnalyzeRequest
  confidence: number
}

export class CoherencePreValidator {
  
  /**
   * Valide la cohérence globale d'une requête utilisateur
   */
  static validateCoherence(request: AnalyzeRequest): CoherenceValidationResult {
    const issues: CoherenceIssue[] = []
    let adaptedRequest = { ...request }
    
    // 1. Validation Budget vs Routine
    const budgetIssues = this.validateBudgetRoutineCoherence(request)
    issues.push(...budgetIssues)
    
    // 2. Validation Âge vs Préoccupations
    const ageIssues = this.validateAgeConcernsCoherence(request)
    issues.push(...ageIssues)
    
    // 3. Validation Type de peau vs Préoccupations
    const skinIssues = this.validateSkinTypeCoherence(request)
    issues.push(...skinIssues)
    
    // 4. Validation Temps vs Routine
    const timeIssues = this.validateTimeRoutineCoherence(request)
    issues.push(...timeIssues)
    
    // 5. Validation Allergies
    const allergyIssues = this.validateAllergiesCoherence(request)
    issues.push(...allergyIssues)
    
    // Application des corrections automatiques
    adaptedRequest = this.applyAutoFixes(request, issues)
    
    const criticalIssues = issues.filter(i => i.severity === 'critical')
    const confidence = Math.max(0.3, 1 - (criticalIssues.length * 0.2) - (issues.length * 0.1))
    
    return {
      isCoherent: criticalIssues.length === 0,
      issues,
      adaptedRequest,
      confidence
    }
  }
  
  /**
   * Valide la cohérence Budget vs Complexité de routine
   */
  private static validateBudgetRoutineCoherence(request: AnalyzeRequest): CoherenceIssue[] {
    const issues: CoherenceIssue[] = []
    
    const budget = request.constraints?.budget || 
                   this.extractBudgetFromString(request.currentRoutine?.monthlyBudget) || 100
    
    const routinePreference = request.constraints?.timeAvailable || 
                             request.currentRoutine?.routinePreference || 'Simple'
    
    // Budget faible + Routine complexe
    if (budget < 50 && (routinePreference === 'Complète' || routinePreference === 'Équilibrée')) {
      issues.push({
        type: 'budget_routine',
        severity: 'critical',
        message: `Budget de ${budget}€ insuffisant pour une routine ${routinePreference}`,
        suggestion: 'Adapter la routine au budget ou augmenter le budget',
        autoFix: {
          field: 'routinePreference',
          newValue: 'Simple',
          reason: `Budget limité (${budget}€) - routine adaptée automatiquement`
        }
      })
    }
    
    // Budget élevé + Routine minimaliste
    if (budget > 150 && routinePreference === 'Minimaliste') {
      issues.push({
        type: 'budget_routine',
        severity: 'warning',
        message: `Budget de ${budget}€ élevé pour une routine Minimaliste`,
        suggestion: 'Profiter du budget pour une routine plus complète',
        autoFix: {
          field: 'routinePreference',
          newValue: 'Équilibrée',
          reason: `Budget confortable (${budget}€) - routine optimisée automatiquement`
        }
      })
    }
    
    return issues
  }
  
  /**
   * Valide la cohérence Âge vs Préoccupations
   */
  private static validateAgeConcernsCoherence(request: AnalyzeRequest): CoherenceIssue[] {
    const issues: CoherenceIssue[] = []
    const age = request.userProfile.age
    const concerns = request.skinConcerns.primary
    
    // Jeune âge + préoccupations de vieillissement avancé
    if (age < 25 && concerns.some(c => 
      c.toLowerCase().includes('rides marquées') || 
      c.toLowerCase().includes('fermeté') ||
      c.toLowerCase().includes('relâchement')
    )) {
      issues.push({
        type: 'age_concerns',
        severity: 'warning',
        message: `À ${age} ans, les rides marquées sont rares`,
        suggestion: 'Orienter vers la prévention et l\'hydratation',
        autoFix: {
          field: 'skinConcerns.primary',
          newValue: concerns.map(c => 
            c.toLowerCase().includes('rides') ? 'Prévention anti-âge' : c
          ),
          reason: 'Adaptation des préoccupations à l\'âge'
        }
      })
    }
    
    // Âge avancé + préoccupations de jeunesse
    if (age > 50 && concerns.some(c => 
      c.toLowerCase().includes('acné') || 
      c.toLowerCase().includes('imperfections')
    )) {
      issues.push({
        type: 'age_concerns',
        severity: 'warning',
        message: `À ${age} ans, l'acné est moins fréquente`,
        suggestion: 'Vérifier si ce sont des imperfections liées à l\'âge',
        autoFix: {
          field: 'skinConcerns.primary',
          newValue: [...concerns, 'Taches pigmentaires'],
          reason: 'Ajout de préoccupations adaptées à l\'âge'
        }
      })
    }
    
    return issues
  }
  
  /**
   * Valide la cohérence Type de peau vs Préoccupations
   */
  private static validateSkinTypeCoherence(request: AnalyzeRequest): CoherenceIssue[] {
    const issues: CoherenceIssue[] = []
    const skinType = request.userProfile.skinType
    const concerns = request.skinConcerns.primary
    
    // Peau sèche + préoccupations grasses
    if (skinType === 'Sèche' && concerns.some(c => 
      c.toLowerCase().includes('sébum') || 
      c.toLowerCase().includes('brillance') ||
      c.toLowerCase().includes('pores')
    )) {
      issues.push({
        type: 'skin_concerns',
        severity: 'critical',
        message: 'Peau sèche incompatible avec excès de sébum',
        suggestion: 'Vérifier le type de peau ou les préoccupations',
        autoFix: {
          field: 'userProfile.skinType',
          newValue: 'Mixte',
          reason: 'Type de peau adapté aux préoccupations déclarées'
        }
      })
    }
    
    // Peau grasse + préoccupations sèches
    if (skinType === 'Grasse' && concerns.some(c => 
      c.toLowerCase().includes('sécheresse') || 
      c.toLowerCase().includes('déshydratation')
    )) {
      issues.push({
        type: 'skin_concerns',
        severity: 'warning',
        message: 'Peau grasse avec déshydratation possible',
        suggestion: 'Distinguer déshydratation et sécheresse',
        autoFix: {
          field: 'skinConcerns.primary',
          newValue: concerns.map(c => 
            c.toLowerCase().includes('sécheresse') ? 'Déshydratation' : c
          ),
          reason: 'Précision terminologique pour peau grasse'
        }
      })
    }
    
    return issues
  }
  
  /**
   * Valide la cohérence Temps disponible vs Routine
   */
  private static validateTimeRoutineCoherence(request: AnalyzeRequest): CoherenceIssue[] {
    const issues: CoherenceIssue[] = []
    
    const timeAvailable = request.constraints?.timeAvailable || 
                         request.currentRoutine?.routinePreference
    
    // Peu de temps + Routine complexe
    if (timeAvailable?.includes('5 min') && 
        request.currentRoutine?.routinePreference === 'Complète') {
      issues.push({
        type: 'time_routine',
        severity: 'critical',
        message: 'Routine complète incompatible avec 5 min disponibles',
        suggestion: 'Adapter la routine au temps disponible',
        autoFix: {
          field: 'routinePreference',
          newValue: 'Minimaliste',
          reason: 'Temps limité - routine simplifiée automatiquement'
        }
      })
    }
    
    return issues
  }
  
  /**
   * Valide la cohérence des allergies
   */
  private static validateAllergiesCoherence(request: AnalyzeRequest): CoherenceIssue[] {
    const issues: CoherenceIssue[] = []
    
    const allergies = request.constraints?.allergies || 
                     request.allergies?.ingredients || []
    
    // Détection d'allergies contradictoires avec les préoccupations
    if (allergies.some(a => a.toLowerCase().includes('parfum')) &&
        request.skinConcerns.primary.some(c => c.toLowerCase().includes('sensible'))) {
      // Cohérent - pas d'issue
    } else if (allergies.length === 0 && 
               request.userProfile.skinType === 'Sensible') {
      issues.push({
        type: 'allergies',
        severity: 'warning',
        message: 'Peau sensible sans allergies déclarées',
        suggestion: 'Vérifier les ingrédients à éviter',
        autoFix: {
          field: 'constraints.allergies',
          newValue: ['Parfum', 'Alcool'],
          reason: 'Précautions standard pour peau sensible'
        }
      })
    }
    
    return issues
  }
  
  /**
   * Applique les corrections automatiques
   */
  private static applyAutoFixes(request: AnalyzeRequest, issues: CoherenceIssue[]): AnalyzeRequest {
    let adapted = { ...request }
    
    for (const issue of issues) {
      if (issue.autoFix && issue.severity === 'critical') {
        // Appliquer la correction automatique
        const { field, newValue } = issue.autoFix
        
        if (field.includes('.')) {
          const [parent, child] = field.split('.')
          ;(adapted as any)[parent] = {
            ...(adapted as any)[parent],
            [child]: newValue
          }
        } else {
          ;(adapted as any)[field] = newValue
        }
      }
    }
    
    return adapted
  }
  
  /**
   * Extrait le budget numérique d'une string
   */
  private static extractBudgetFromString(budgetString?: string): number | null {
    if (!budgetString) return null
    
    const budgetMap: Record<string, number> = {
      '< 50€': 40,
      '50-100€': 75,
      '100-200€': 150,
      '> 200€': 250,
      'Pas de limite': 500
    }
    
    return budgetMap[budgetString] || null
  }
}
