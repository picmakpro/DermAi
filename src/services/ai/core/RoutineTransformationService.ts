/**
 * Service de transformation V2 → V3 pour l'Étape 4 optimisée
 * 
 * Responsabilités :
 * - Transformer PersonalizedRoutine (V2) → AiRoutineOutput (V3)
 * - Valider compliance UI V3 (champs requis, règles timing)
 * - Enrichir avec données produits (alternatives, images)
 * - Garantir cohérence diagnostic → routine → produits → UI
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import { 
  PureDiagnostic, 
  PersonalizedRoutine, 
  ProductSelection 
} from '@/schemas/v2';
import { 
  AiRoutineOutput, 
  AiRoutinePhase, 
  AiRoutineItem, 
  PhaseId, 
  Slot,
  PHASE_LABELS 
} from '@/types/aiRoutine';
import { Logger } from '@/utils/Logger';

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
}

interface UIValidationResult extends ValidationResult {
  allFieldsPresent: boolean;
  missingFields: string[];
  slotsBalanced: boolean;
  educationComplete: boolean;
}

export class RoutineTransformationService {
  private static logger = Logger.getInstance('RoutineTransformationV3');

  /**
   * Point d'entrée principal : Transformation complète V2 → V3
   */
  static async transformToUIFormat(
    diagnostic: PureDiagnostic,
    routine: PersonalizedRoutine, 
    products: ProductSelection
  ): Promise<AiRoutineOutput> {
    
    this.logger.info('🔄 Démarrage transformation V2 → V3');
    
    try {
      // 1. Transformation structure V2 → V3
      const baseRoutine = this.transformV2ToV3(routine);
      
      // 2. Enrichissement avec données produits
      const enrichedRoutine = this.enrichWithProductData(baseRoutine, products);
      
      // 3. Validation finale UI V3
      const validation = this.validateUIV3Compliance(enrichedRoutine);
      
      if (!validation.isValid) {
        this.logger.warn('⚠️ Validation UI V3 échouée', { 
          issues: validation.issues,
          warnings: validation.warnings 
        });
        
        // Auto-correction si possible
        const correctedRoutine = this.autoCorrectUIIssues(enrichedRoutine, validation);
        return correctedRoutine;
      }
      
      this.logger.info('✅ Transformation V2 → V3 réussie', {
        phases: enrichedRoutine.phases.length,
        totalItems: this.countTotalItems(enrichedRoutine)
      });
      
      return enrichedRoutine;
      
    } catch (error) {
      this.logger.error('❌ Erreur transformation V2 → V3', { error });
      throw error;
    }
  }

  /**
   * Transformer PersonalizedRoutine (V2) vers AiRoutineOutput (V3)
   */
  private static transformV2ToV3(routineV2: PersonalizedRoutine): AiRoutineOutput {
    const phases: AiRoutinePhase[] = Object.entries(routineV2.phases).map(([phaseId, phase]) => ({
      id: phaseId as PhaseId,
      label: PHASE_LABELS[phaseId as PhaseId] || this.getPhaseLabel(phaseId),
      durationLabel: phase.duration || 'Durée non spécifiée',
      education: phase.education || this.getDefaultEducation(phaseId as PhaseId),
      slots: this.groupStepsBySlots(phase.steps, phaseId as PhaseId)
    }));

    return { phases };
  }

  /**
   * Grouper les steps par slots selon les règles V3
   */
  private static groupStepsBySlots(steps: any[], phase: PhaseId): Record<Slot, AiRoutineItem[]> {
    const slots: Record<Slot, AiRoutineItem[]> = {
      morning: [],
      evening: [],
      weekly: []
    };

    steps.forEach((step, index) => {
      const slot = this.determineSlot(step);
      const item = this.transformStepToItem(step, phase, slot, index + 1);
      slots[slot].push(item);
    });

    return slots;
  }

  /**
   * Déterminer le slot selon les règles V3
   */
  private static determineSlot(step: any): Slot {
    // Règle prioritaire : frequency !== "daily" → weekly
    if (step.frequency && step.frequency !== 'daily' && !/quotidien/i.test(step.frequency)) {
      return 'weekly';
    }
    
    // Règle timing explicite
    if (step.timing) {
      if (step.timing === 'matin' || step.timing === 'morning') return 'morning';
      if (step.timing === 'soir' || step.timing === 'evening') return 'evening';
      if (step.timing === 'hebdomadaire' || step.timing === 'weekly') return 'weekly';
      
      // INTERDICTION : timing "both" → forcer morning par défaut
      if (step.timing === 'both') {
        console.warn('[routine:timing-both-forbidden]', step.stepNumber, '→ fallback: morning');
        return 'morning';
      }
    }
    
    // Fallback par catégorie
    if (step.careType === 'protection') return 'morning'; // SPF le matin
    if (step.careType === 'exfoliation' || step.careType === 'masque') return 'weekly';
    
    return 'morning'; // Défaut sécurisé
  }

  /**
   * Transformer step V2 vers AiRoutineItem V3
   */
  private static transformStepToItem(step: any, phase: PhaseId, slot: Slot, stepNumber: number): AiRoutineItem {
    return {
      id: step.id || `${phase}-${slot}-${stepNumber}`,
      phase,
      routine_slot: slot,
      title: step.displayTitle || step.title || 'Soin non spécifié',
      product: step.product || 'Produit non spécifié',
      category: this.normalizeCareType(step.careType),
      
      // Flags temporaire/continu
      is_continuous: step.isTemporary === false || this.isContinuousCategory(step.careType),
      is_temporary: step.isTemporary === true,
      
      // Métadonnées temporaires
      introduce_from_week: step.introduceFromWeek,
      application_duration: step.applicationDuration,
      frequency: step.frequency,
      
      // Pédagogie
      application_instructions: step.applicationInstructions || this.generateDefaultInstructions(step.careType),
      restrictions: Array.isArray(step.restrictions) ? step.restrictions : [],
      target_zones: Array.isArray(step.targetZones) ? step.targetZones : ['visage entier'],
      notes: step.notes,
      
      // À enrichir par produits
      alternatives: [],
      image_url: undefined
    };
  }

  /**
   * Enrichir avec données produits de l'Étape 3
   */
  private static enrichWithProductData(
    routine: AiRoutineOutput, 
    products: ProductSelection
  ): AiRoutineOutput {
    
    routine.phases.forEach(phase => {
      Object.values(phase.slots).flat().forEach(item => {
        // Trouver le produit correspondant
        const matchingProduct = products.selectedProducts.find(p => 
          this.matchesRoutineItem(p, item, phase.id)
        );
        
        if (matchingProduct) {
          // Enrichir item avec données produit
          item.product = matchingProduct.productName;
          item.image_url = matchingProduct.imageUrl;
          
          // Mapper alternatives
          item.alternatives = matchingProduct.alternatives?.map(alt => ({
            id: alt.catalogId || alt.id,
            name: alt.name
          })) || [];
          
          // Enrichir instructions si nécessaire
          if (!item.application_instructions && matchingProduct.applicationAdvice) {
            item.application_instructions = matchingProduct.applicationAdvice;
          }
          
          // Enrichir restrictions
          if (matchingProduct.restrictions?.length) {
            item.restrictions = [...(item.restrictions || []), ...matchingProduct.restrictions];
          }
        } else {
          console.warn('[routine:product-not-found]', item.id, phase.id);
        }
      });
    });
    
    return routine;
  }

  /**
   * Validation complète UI V3
   */
  private static validateUIV3Compliance(routine: AiRoutineOutput): UIValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    
    // 1. Validation structure de base
    if (!routine.phases?.length) {
      issues.push('Aucune phase trouvée');
      return { isValid: false, issues, warnings, allFieldsPresent: false, missingFields, slotsBalanced: false, educationComplete: false };
    }
    
    // 2. Validation par phase
    let allFieldsPresent = true;
    let educationComplete = true;
    
    routine.phases.forEach(phase => {
      // Éducation par phase
      if (!phase.education?.title || !phase.education?.text) {
        educationComplete = false;
        warnings.push(`Phase ${phase.id} manque education complète`);
      }
      
      // Validation par item
      Object.values(phase.slots).flat().forEach(item => {
        // Champs obligatoires
        if (!item.application_instructions) {
          allFieldsPresent = false;
          missingFields.push(`${item.id}.application_instructions`);
        }
        
        if (!Array.isArray(item.restrictions)) {
          allFieldsPresent = false;
          missingFields.push(`${item.id}.restrictions`);
        }
        
        if (!Array.isArray(item.target_zones) || !item.target_zones.length) {
          allFieldsPresent = false;
          missingFields.push(`${item.id}.target_zones`);
        }
        
        // Validation temporaires
        if (item.is_temporary) {
          if (item.introduce_from_week === undefined) {
            issues.push(`Item temporaire ${item.id} manque introduce_from_week`);
          }
          if (!item.application_duration) {
            issues.push(`Item temporaire ${item.id} manque application_duration`);
          }
          if (!item.frequency) {
            issues.push(`Item temporaire ${item.id} manque frequency`);
          }
        }
      });
    });
    
    // 3. Validation règle hebdomadaire
    const weeklyValidation = this.validateWeeklyRule(routine);
    issues.push(...weeklyValidation.issues);
    
    // 4. Validation équilibrage slots
    const slotsBalanced = this.validateSlotsBalance(routine);
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      allFieldsPresent,
      missingFields,
      slotsBalanced,
      educationComplete
    };
  }

  /**
   * Auto-correction des problèmes mineurs
   */
  private static autoCorrectUIIssues(
    routine: AiRoutineOutput, 
    validation: UIValidationResult
  ): AiRoutineOutput {
    
    const corrected = JSON.parse(JSON.stringify(routine)); // Deep clone
    
    corrected.phases.forEach(phase => {
      // Corriger éducation manquante
      if (!phase.education) {
        phase.education = this.getDefaultEducation(phase.id);
      }
      
      Object.values(phase.slots).flat().forEach(item => {
        // Corriger champs manquants
        if (!item.application_instructions) {
          item.application_instructions = this.generateDefaultInstructions(item.category);
        }
        
        if (!Array.isArray(item.restrictions)) {
          item.restrictions = [];
        }
        
        if (!Array.isArray(item.target_zones) || !item.target_zones.length) {
          item.target_zones = ['visage entier'];
        }
        
        if (!Array.isArray(item.alternatives)) {
          item.alternatives = [];
        }
      });
    });
    
    return corrected;
  }

  // ===== MÉTHODES UTILITAIRES =====

  private static normalizeCareType(careType: string): AiRoutineItem['category'] {
    const map: Record<string, AiRoutineItem['category']> = {
      'nettoyage': 'cleanser',
      'hydratation': 'moisturizer',
      'protection': 'spf',
      'traitement': 'treatment',
      'exfoliation': 'treatment',
      'masque': 'treatment'
    };
    
    return map[careType.toLowerCase()] || 'treatment';
  }

  private static isContinuousCategory(careType: string): boolean {
    return ['nettoyage', 'hydratation', 'protection'].includes(careType.toLowerCase());
  }

  private static getPhaseLabel(phaseId: string): string {
    const labels: Record<string, string> = {
      'immediate': 'Phase Immédiate',
      'adaptation': 'Phase d\'Adaptation', 
      'maintenance': 'Phase de Maintenance'
    };
    return labels[phaseId] || phaseId;
  }

  private static getDefaultEducation(phaseId: PhaseId): { title: string; text: string } {
    const education = {
      immediate: {
        title: "Objectif : Stabiliser la barrière cutanée",
        text: "Cette phase prépare votre peau en douceur. Les traitements temporaires dictent la durée pour éviter la sur-stimulation."
      },
      adaptation: {
        title: "Objectif : Introduire progressivement des actifs",
        text: "Augmentation graduelle de la puissance selon votre tolérance. Éviter les changements multiples simultanés."
      },
      maintenance: {
        title: "Objectif : Maintenir les acquis",
        text: "Stabilisation de la routine et prévention des rechutes. Ajustements possibles selon les résultats."
      }
    };
    
    return education[phaseId];
  }

  private static generateDefaultInstructions(category: string): string {
    const defaults: Record<string, string> = {
      'cleanser': 'Appliquer sur peau humide, masser délicatement, rincer à l\'eau tiède',
      'moisturizer': 'Appliquer uniformément sur peau propre, masser jusqu\'à absorption',
      'spf': 'Appliquer généreusement en dernière étape, renouveler si exposition',
      'treatment': 'Appliquer selon les indications, respecter les zones ciblées'
    };
    
    return defaults[category] || 'Suivre les instructions du produit';
  }

  private static matchesRoutineItem(product: any, item: AiRoutineItem, phaseId: string): boolean {
    // Matching par UID si disponible
    if (product.routineStepUid) {
      const expectedUid = `${phaseId}:${item.routine_slot}:${item.category}`;
      return product.routineStepUid.startsWith(expectedUid);
    }
    
    // Fallback : matching par timing + catégorie
    const productTiming = product.timing || product.applicationTiming;
    const timingMatches = productTiming === item.routine_slot || 
                         (productTiming === 'matin' && item.routine_slot === 'morning') ||
                         (productTiming === 'soir' && item.routine_slot === 'evening');
    
    const categoryMatches = this.normalizeCareType(product.category || '') === item.category;
    
    return timingMatches && categoryMatches;
  }

  private static validateWeeklyRule(routine: AiRoutineOutput): ValidationResult {
    const issues: string[] = [];
    
    routine.phases.forEach(phase => {
      // Vérifier items daily dans morning/evening
      [...phase.slots.morning, ...phase.slots.evening].forEach(item => {
        if (item.frequency && item.frequency !== 'daily' && !/quotidien/i.test(item.frequency)) {
          issues.push(`Item ${item.id} avec frequency="${item.frequency}" devrait être en weekly`);
        }
      });
      
      // Vérifier items weekly
      phase.slots.weekly.forEach(item => {
        if (item.frequency === 'daily' || /quotidien/i.test(item.frequency || '')) {
          issues.push(`Item ${item.id} avec frequency="daily" ne devrait pas être en weekly`);
        }
      });
    });
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings: []
    };
  }

  private static validateSlotsBalance(routine: AiRoutineOutput): boolean {
    return routine.phases.every(phase => {
      const morningCount = phase.slots.morning.length;
      const eveningCount = phase.slots.evening.length;
      
      // Au minimum 1 item morning ou evening par phase
      return morningCount > 0 || eveningCount > 0;
    });
  }

  private static countTotalItems(routine: AiRoutineOutput): number {
    return routine.phases.reduce((total, phase) => 
      total + Object.values(phase.slots).flat().length, 0
    );
  }
}

/**
 * Version optimisée de l'AssemblyAndValidationService pour V3
 */
export class AssemblyAndValidationServiceV3 {
  private static logger = Logger.getInstance('AssemblyValidationV3');

  /**
   * Assemblage complet optimisé pour UI V3
   */
  static async assembleCompleteAnalysisV3(
    diagnostic: PureDiagnostic,
    routine: PersonalizedRoutine, 
    products: ProductSelection
  ): Promise<{ 
    analysis: any; // CompleteAnalysisV2 étendu
    uiRoutine: AiRoutineOutput; 
  }> {
    
    this.logger.info('🎯 Démarrage assemblage V3 optimisé');
    
    // 1. Assemblage classique V2
    const classicAnalysis = await AssemblyAndValidationService.assembleCompleteAnalysis(
      diagnostic, routine, products
    );
    
    // 2. Transformation UI V3
    const uiRoutine = await RoutineTransformationService.transformToUIFormat(
      diagnostic, routine, products
    );
    
    // 3. Validation croisée V2 ↔ V3
    const crossValidation = this.validateV2V3Consistency(classicAnalysis, uiRoutine);
    
    if (!crossValidation.isValid) {
      this.logger.warn('⚠️ Incohérence V2 ↔ V3', { issues: crossValidation.issues });
    }
    
    this.logger.info('✅ Assemblage V3 terminé', {
      v2Score: classicAnalysis.coherenceValidation.overallScore,
      v3Valid: crossValidation.isValid,
      totalItems: RoutineTransformationService['countTotalItems'](uiRoutine)
    });
    
    return {
      analysis: {
        ...classicAnalysis,
        uiValidation: crossValidation
      },
      uiRoutine
    };
  }

  /**
   * Validation cohérence V2 ↔ V3
   */
  private static validateV2V3Consistency(analysisV2: any, routineV3: AiRoutineOutput): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Vérifier nombre de phases
    const v2Phases = Object.keys(analysisV2.routine.phases).length;
    const v3Phases = routineV3.phases.length;
    
    if (v2Phases !== v3Phases) {
      issues.push(`Nombre de phases incohérent: V2=${v2Phases}, V3=${v3Phases}`);
    }
    
    // Vérifier nombre total d'items
    const v2Items = Object.values(analysisV2.routine.phases).reduce((total: number, phase: any) => 
      total + (phase.steps?.length || 0), 0
    );
    const v3Items = routineV3.phases.reduce((total, phase) => 
      total + Object.values(phase.slots).flat().length, 0
    );
    
    if (Math.abs(v2Items - v3Items) > 1) { // Tolérance de 1 (dédoublement possible)
      warnings.push(`Nombre d'items différent: V2=${v2Items}, V3=${v3Items}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }
}

// Import de l'ancien service pour compatibilité
import { AssemblyAndValidationService } from './AssemblyAndValidationService';
