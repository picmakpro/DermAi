/**
 * Adaptateur pour intégrer la transformation V3 dans le système existant
 * 
 * Ce service fait le pont entre l'architecture V2 existante et la nouvelle UI V3
 * sans casser l'existant.
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import { 
  PureDiagnostic, 
  PersonalizedRoutine, 
  ProductSelection 
} from '@/schemas/v2';
import { AiRoutineOutput } from '@/types/aiRoutine';
import { toAiRoutineOutput } from '@/services/mappers/aiRoutine.mapper';

/**
 * Service d'adaptation pour l'Étape 4 optimisée V3
 */
export class AnalysisServiceV3Adapter {

  /**
   * Transformer les résultats V2 en format UI V3
   * 
   * Cette fonction est appelée après l'Étape 4 classique pour préparer
   * les données pour l'affichage UI V3.
   */
  static transformForUIV3(
    diagnostic: PureDiagnostic,
    routine: PersonalizedRoutine, 
    products: ProductSelection
  ): AiRoutineOutput {
    
    console.log('[analysis:v3-transform] Démarrage transformation UI V3');
    
    try {
      // 1. Préparer la structure pour le mapper
      const routineForMapping = this.prepareRoutineForMapping(routine, products);
      
      // 2. Utiliser le mapper V3
      const mappingResult = toAiRoutineOutput(routineForMapping);
      
      if (mappingResult.warnings.length > 0) {
        console.warn('[analysis:v3-transform] Warnings détectés:', mappingResult.warnings);
      }
      
      if (mappingResult.errors.length > 0) {
        console.error('[analysis:v3-transform] Erreurs détectées:', mappingResult.errors);
        throw new Error(`Transformation V3 échouée: ${mappingResult.errors.join(', ')}`);
      }
      
      // 3. Enrichissement avec données produits
      const enrichedRoutine = this.enrichWithProductData(mappingResult.routine, products);
      
      console.log('[analysis:v3-transform] Transformation réussie', {
        phases: enrichedRoutine.phases.length,
        totalItems: this.countTotalItems(enrichedRoutine)
      });
      
      return enrichedRoutine;
      
    } catch (error) {
      console.error('[analysis:v3-transform] Erreur transformation:', error);
      
      // Fallback : routine vide mais valide
      return this.createFallbackRoutine();
    }
  }

  /**
   * Préparer la routine V2 pour le mapper V3
   */
  private static prepareRoutineForMapping(
    routine: PersonalizedRoutine, 
    products: ProductSelection
  ): any {
    
    // Transformer structure phases V2 → array pour mapper
    const phasesArray = Object.entries(routine.phases).map(([phaseId, phase]) => ({
      id: phaseId,
      durationLabel: phase.duration,
      education: phase.education || this.getDefaultEducation(phaseId),
      steps: phase.steps.map(step => ({
        ...step,
        // Garantir champs requis V3
        applicationInstructions: step.applicationInstructions || this.generateDefaultInstructions(step.careType),
        restrictions: Array.isArray(step.restrictions) ? step.restrictions : [],
        targetZones: Array.isArray(step.targetZones) ? step.targetZones : ['visage entier'],
        alternatives: [] // Sera enrichi après
      }))
    }));
    
    return { phases: phasesArray };
  }

  /**
   * Enrichir avec données produits de l'Étape 3
   */
  private static enrichWithProductData(
    routine: AiRoutineOutput, 
    products: ProductSelection
  ): AiRoutineOutput {
    
    console.log('[analysis:enrichment-start]', {
      totalProducts: products.selectedProducts.length,
      totalItems: this.countTotalItems(routine)
    });
    
    // Créer un index des produits par stepId pour matching plus efficace
    const productsByStepId = new Map();
    products.selectedProducts.forEach(product => {
      if (product.routineStepId) {
        productsByStepId.set(product.routineStepId, product);
      }
    });
    
    let stepCounter = 1; // Compteur global pour les étapes
    
    routine.phases.forEach(phase => {
      Object.values(phase.slots).flat().forEach(item => {
        
        // Méthode 1: Matching par routineStepId (le plus fiable)
        let matchingProduct = productsByStepId.get(stepCounter);
        
        // Méthode 2: Fallback par timing + catégorie
        if (!matchingProduct) {
          matchingProduct = products.selectedProducts.find(p => 
            this.matchesRoutineItem(p, item, phase.id)
          );
        }
        
        // Méthode 3: Fallback par nom de produit partiel
        if (!matchingProduct) {
          matchingProduct = products.selectedProducts.find(p => 
            this.matchesByProductName(p, item)
          );
        }
        
        if (matchingProduct) {
          console.log('[analysis:product-matched]', {
            stepCounter,
            itemTitle: item.title,
            productName: matchingProduct.productName
          });
          
          // Enrichir avec données produit
          if (matchingProduct.productName) {
            item.product = matchingProduct.productName;
          }
          
          if (matchingProduct.imageUrl) {
            item.image_url = matchingProduct.imageUrl;
          }
          
          // Mapper alternatives
          if (matchingProduct.alternatives?.length) {
            item.alternatives = matchingProduct.alternatives.map(alt => ({
              id: alt.catalogId || alt.id || `alt-${Date.now()}`,
              name: alt.name
            }));
          }
          
          // Enrichir instructions si manquantes
          if (!item.application_instructions && matchingProduct.applicationAdvice) {
            item.application_instructions = matchingProduct.applicationAdvice;
          }
          
          // Enrichir restrictions
          if (matchingProduct.restrictions?.length) {
            const existingRestrictions = item.restrictions || [];
            item.restrictions = [...existingRestrictions, ...matchingProduct.restrictions];
          }
        } else {
          console.warn('[analysis:product-not-found]', item.id, phase.id, `step-${stepCounter}`);
        }
        
        stepCounter++;
      });
    });
    
    return routine;
  }

  /**
   * Matcher produit avec item routine
   */
  private static matchesRoutineItem(product: any, item: AiRoutineItem, phaseId: string): boolean {
    // DEBUG: Logger les tentatives de matching
    console.log('[analysis:matching-attempt]', {
      productName: product.productName,
      productTiming: product.timing,
      productCategory: product.category,
      itemTitle: item.title,
      itemTiming: item.routine_slot,
      itemCategory: item.category,
      phase: phaseId
    });
    
    // Matching par timing + catégorie (approche robuste)
    const productTiming = product.timing || product.applicationTiming;
    const itemTiming = item.routine_slot;
    
    // Normaliser timing pour comparaison
    const normalizedProductTiming = this.normalizeTimingForComparison(productTiming);
    const normalizedItemTiming = this.normalizeTimingForComparison(itemTiming);
    
    const timingMatches = normalizedProductTiming === normalizedItemTiming;
    
    // Matching catégorie (flexibilité nécessaire)
    const productCategory = this.normalizeCategory(product.category || product.careType || '');
    const itemCategory = item.category;
    
    const categoryMatches = productCategory === itemCategory;
    
    // Matching par routineStepId si disponible (plus précis)
    const stepIdMatches = product.routineStepId && 
      (product.routineStepId.toString() === item.id.split('-')[0] || 
       product.routineStepId === this.extractStepNumber(item.title));
    
    console.log('[analysis:matching-result]', {
      timingMatches,
      categoryMatches,
      stepIdMatches,
      finalMatch: timingMatches && (categoryMatches || stepIdMatches)
    });
    
    // Match si timing + (catégorie OU stepId)
    return timingMatches && (categoryMatches || stepIdMatches);
  }

  /**
   * Normaliser timing pour comparaison robuste
   */
  private static normalizeTimingForComparison(timing: string): string {
    if (!timing) return 'morning';
    
    const t = timing.toLowerCase();
    if (t.includes('matin') || t === 'morning' || t === 'am') return 'morning';
    if (t.includes('soir') || t === 'evening' || t === 'pm') return 'evening';
    if (t.includes('hebdo') || t === 'weekly') return 'weekly';
    
    return 'morning';
  }

  /**
   * Matching par nom de produit (fallback)
   */
  private static matchesByProductName(product: any, item: AiRoutineItem): boolean {
    const productName = (product.productName || '').toLowerCase();
    const itemTitle = (item.title || '').toLowerCase();
    
    // Mots-clés pour matching approximatif
    const keywords = {
      nettoyage: ['bioderma', 'sensibio', 'micellaire', 'nettoy'],
      hydratation: ['cerave', 'crème', 'hydrat', 'lotion'],
      protection: ['roche-posay', 'anthelios', 'spf', 'solaire'],
      traitement: ['ordinary', 'niacinamide', 'alpha', 'arbutin', 'aha', 'bha']
    };
    
    for (const [category, words] of Object.entries(keywords)) {
      if (itemTitle.includes(category.substring(0, 6))) { // Match partiel catégorie
        return words.some(word => productName.includes(word));
      }
    }
    
    return false;
  }

  /**
   * Extraire numéro d'étape du titre
   */
  private static extractStepNumber(title: string): number {
    const match = title.match(/étape\s*(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Normaliser catégorie pour comparaison
   */
  private static normalizeCategory(category: string): AiRoutineItem['category'] {
    const c = category.toLowerCase();
    
    if (c.includes('nettoy') || c.includes('cleans')) return 'cleanser';
    if (c.includes('hydrat') || c.includes('moistur')) return 'moisturizer';
    if (c.includes('spf') || c.includes('solaire') || c.includes('protection')) return 'spf';
    if (c.includes('exfoli') || c.includes('peel')) return 'treatment';
    if (c.includes('masque') || c.includes('mask')) return 'treatment';
    if (c.includes('sérum') || c.includes('serum')) return 'treatment';
    
    return 'treatment';
  }

  /**
   * Générer instructions par défaut selon careType
   */
  private static generateDefaultInstructions(careType: string): string {
    const defaults: Record<string, string> = {
      'nettoyage': 'Appliquer sur peau humide, masser délicatement, rincer à l\'eau tiède',
      'hydratation': 'Appliquer uniformément sur peau propre, masser jusqu\'à absorption',
      'protection': 'Appliquer généreusement en dernière étape, renouveler si exposition',
      'traitement': 'Appliquer selon les indications, respecter les zones ciblées',
      'exfoliation': 'Appliquer sur peau sèche, éviter contour des yeux, rincer si nécessaire',
      'masque': 'Appliquer en couche uniforme, laisser poser selon indications, retirer l\'excédent'
    };
    
    return defaults[careType.toLowerCase()] || 'Suivre les instructions du produit';
  }

  /**
   * Éducation par défaut selon phase
   */
  private static getDefaultEducation(phaseId: string): { title: string; text: string } {
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
    
    return education[phaseId as keyof typeof education] || {
      title: "Phase de soins",
      text: "Suivre les recommandations pour cette phase."
    };
  }

  /**
   * Routine de fallback en cas d'erreur
   */
  private static createFallbackRoutine(): AiRoutineOutput {
    return {
      phases: [
        {
          id: 'immediate',
          label: 'Phase Immédiate',
          durationLabel: '1-2 semaines',
          education: {
            title: 'Routine de base',
            text: 'Routine simplifiée en cas de problème technique.'
          },
          slots: {
            morning: [
              {
                id: 'fallback-cleanse-am',
                phase: 'immediate',
                routine_slot: 'morning',
                title: 'Nettoyage matinal',
                product: 'Nettoyant doux',
                category: 'cleanser',
                is_continuous: true,
                application_instructions: 'Nettoyer délicatement le visage',
                restrictions: [],
                target_zones: ['visage entier'],
                alternatives: []
              }
            ],
            evening: [
              {
                id: 'fallback-cleanse-pm',
                phase: 'immediate',
                routine_slot: 'evening',
                title: 'Nettoyage nocturne',
                product: 'Nettoyant doux',
                category: 'cleanser',
                is_continuous: true,
                application_instructions: 'Nettoyer et démaquiller en douceur',
                restrictions: [],
                target_zones: ['visage entier'],
                alternatives: []
              }
            ],
            weekly: []
          }
        }
      ]
    };
  }

  /**
   * Compter le nombre total d'items
   */
  private static countTotalItems(routine: AiRoutineOutput): number {
    return routine.phases.reduce((total, phase) => 
      total + Object.values(phase.slots).flat().length, 0
    );
  }
}
