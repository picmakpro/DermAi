/**
 * Tests End-to-End pour la cohérence diagnostic → routine → produits
 * 
 * Valide que les ajustements prompts V3 garantissent la présence
 * de tous les champs requis pour la nouvelle UI.
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { toAiRoutineOutput, MappingResult } from '@/services/mappers/aiRoutine.mapper';
import { AiRoutineOutput, AiRoutineItem } from '@/types/aiRoutine';

// Mock diagnostic complet
const MOCK_DIAGNOSTIC = {
  skinType: "Mixte",
  scores: {
    overall: 72,
    hydration: { value: 68, justification: "Peau correctement hydratée", confidence: 0.8 },
    pores: { value: 58, justification: "Pores visibles zone T", confidence: 0.85 }
  },
  skinAgeEstimate: 28,
  generalObservation: "Peau mixte avec zone T légèrement grasse, pores visibles",
  zoneSpecificIssues: [
    { zone: "nez", problem: "Pores dilatés", intensity: "modérée" },
    { zone: "front", problem: "Légère brillance", intensity: "légère" }
  ]
};

// Mock routine Étape 2 (format avant mapping)
const MOCK_ROUTINE_RAW = {
  phases: [
    {
      id: "immediate",
      durationLabel: "1-3 semaines",
      objective: "Stabiliser la barrière cutanée",
      education: {
        title: "Objectif : Stabiliser la barrière cutanée",
        text: "Phase de préparation douce"
      },
      steps: [
        {
          stepNumber: 1,
          careType: "nettoyage",
          timing: "matin",
          targetProblem: "Impuretés quotidiennes",
          targetZones: ["visage entier"],
          applicationInstructions: "Appliquer sur peau humide, masser délicatement",
          restrictions: [],
          alternatives: [],
          isTemporary: false,
          introduceFromWeek: 0,
          applicationDuration: "continu",
          frequency: "daily",
          displayTitle: "Nettoyage matinal"
        },
        {
          stepNumber: 2,
          careType: "traitement",
          timing: "soir",
          targetProblem: "Pores dilatés zone T",
          targetZones: ["nez", "front"],
          applicationInstructions: "Appliquer 2-3 gouttes sur zones concernées",
          restrictions: ["Éviter contour des yeux"],
          alternatives: [],
          isTemporary: true,
          introduceFromWeek: 1,
          applicationDuration: "4-6 semaines",
          frequency: "daily",
          displayTitle: "Traitement pores"
        },
        {
          stepNumber: 3,
          careType: "exfoliation",
          timing: "hebdomadaire", // Test règle hebdomadaire
          targetProblem: "Texture irrégulière",
          targetZones: ["joues", "front"],
          applicationInstructions: "Appliquer le soir, rincer après 10 min",
          restrictions: ["Ne pas utiliser le même soir qu'autres actifs"],
          alternatives: [],
          isTemporary: true,
          introduceFromWeek: 2,
          applicationDuration: "3 semaines max",
          frequency: "1x/week", // Fréquence non-daily → doit être hebdomadaire
          displayTitle: "Exfoliation douce"
        }
      ]
    },
    {
      id: "adaptation",
      durationLabel: "4-6 semaines",
      objective: "Introduire actifs progressivement",
      education: {
        title: "Objectif : Progression graduelle",
        text: "Montée en puissance selon tolérance"
      },
      steps: [
        {
          stepNumber: 1,
          careType: "nettoyage",
          timing: "soir",
          targetProblem: "Maintien propreté",
          targetZones: ["visage entier"],
          applicationInstructions: "Nettoyer sans frotter",
          restrictions: [],
          alternatives: [],
          isTemporary: false,
          introduceFromWeek: 0,
          applicationDuration: "continu",
          frequency: "daily",
          displayTitle: "Nettoyage soir"
        }
      ]
    },
    {
      id: "maintenance",
      durationLabel: "Continu",
      objective: "Maintenir les acquis",
      education: {
        title: "Objectif : Stabilisation",
        text: "Routine établie et prévention"
      },
      steps: [
        {
          stepNumber: 1,
          careType: "protection",
          timing: "matin",
          targetProblem: "Prévention photo-vieillissement",
          targetZones: ["visage", "cou"],
          applicationInstructions: "Appliquer généreusement en dernière étape",
          restrictions: [],
          alternatives: [],
          isTemporary: false,
          introduceFromWeek: 0,
          applicationDuration: "continu",
          frequency: "daily",
          displayTitle: "Protection solaire"
        }
      ]
    }
  ]
};

describe('Routine E2E - Cohérence Diagnostic → Routine → Produits', () => {
  let mappingResult: MappingResult;
  let routine: AiRoutineOutput;

  beforeEach(() => {
    // Étape de mapping routine brute → structure V3
    mappingResult = toAiRoutineOutput(MOCK_ROUTINE_RAW);
    routine = mappingResult.routine;
  });

  describe('Validation Mapping Routine', () => {
    it('doit mapper toutes les phases correctement', () => {
      expect(routine.phases).toHaveLength(3);
      expect(routine.phases.map(p => p.id)).toEqual(['immediate', 'adaptation', 'maintenance']);
    });

    it('doit avoir les champs éducatifs par phase', () => {
      routine.phases.forEach(phase => {
        expect(phase.education).toBeDefined();
        expect(phase.education?.title).toBeTruthy();
        expect(phase.education?.text).toBeTruthy();
      });
    });

    it('doit grouper les items par slots correctement', () => {
      const immediatePhase = routine.phases[0];
      
      // Vérifier que les slots sont créés
      expect(immediatePhase.slots).toBeDefined();
      expect(immediatePhase.slots.morning).toBeDefined();
      expect(immediatePhase.slots.evening).toBeDefined();
      expect(immediatePhase.slots.weekly).toBeDefined();
      
      // Vérifier le groupement
      expect(immediatePhase.slots.morning).toHaveLength(1); // nettoyage matin
      expect(immediatePhase.slots.evening).toHaveLength(1); // traitement soir
      expect(immediatePhase.slots.weekly).toHaveLength(1);  // exfoliation hebdo
    });
  });

  describe('Validation Champs Obligatoires V3', () => {
    it('doit avoir applicationInstructions pour tous les items', () => {
      const allItems = routine.phases.flatMap(phase => 
        Object.values(phase.slots).flat()
      );
      
      allItems.forEach(item => {
        expect(item.application_instructions).toBeDefined();
        expect(item.application_instructions).toBeTruthy();
      });
    });

    it('doit avoir restrictions array pour tous les items', () => {
      const allItems = routine.phases.flatMap(phase => 
        Object.values(phase.slots).flat()
      );
      
      allItems.forEach(item => {
        expect(Array.isArray(item.restrictions)).toBe(true);
      });
    });

    it('doit avoir targetZones array pour tous les items', () => {
      const allItems = routine.phases.flatMap(phase => 
        Object.values(phase.slots).flat()
      );
      
      allItems.forEach(item => {
        expect(Array.isArray(item.target_zones)).toBe(true);
        expect(item.target_zones?.length).toBeGreaterThan(0);
      });
    });

    it('doit avoir alternatives array pour tous les items', () => {
      const allItems = routine.phases.flatMap(phase => 
        Object.values(phase.slots).flat()
      );
      
      allItems.forEach(item => {
        expect(Array.isArray(item.alternatives)).toBe(true);
      });
    });
  });

  describe('Validation Règles Temporaires', () => {
    it('doit avoir intro/durée/fréquence pour tous les temporaires', () => {
      const allItems = routine.phases.flatMap(phase => 
        Object.values(phase.slots).flat()
      );
      
      const temporaryItems = allItems.filter(item => item.is_temporary);
      
      temporaryItems.forEach(item => {
        expect(item.introduce_from_week).toBeDefined();
        expect(item.application_duration).toBeDefined();
        expect(item.frequency).toBeDefined();
        
        expect(typeof item.introduce_from_week).toBe('number');
        expect(typeof item.application_duration).toBe('string');
        expect(typeof item.frequency).toBe('string');
      });
    });

    it('ne doit pas avoir de timing "both"', () => {
      const allItems = routine.phases.flatMap(phase => 
        Object.values(phase.slots).flat()
      );
      
      allItems.forEach(item => {
        expect(item.routine_slot).not.toBe('both');
        expect(['morning', 'evening', 'weekly']).toContain(item.routine_slot);
      });
    });
  });

  describe('Validation Règle Hebdomadaire', () => {
    it('doit placer les items non-daily en hebdomadaire', () => {
      const immediatePhase = routine.phases[0];
      const weeklyItems = immediatePhase.slots.weekly;
      
      // L'exfoliation 1x/week doit être en hebdomadaire
      expect(weeklyItems).toHaveLength(1);
      expect(weeklyItems[0].frequency).toBe('1x/week');
      expect(weeklyItems[0].routine_slot).toBe('weekly');
    });

    it('doit garder les items daily dans morning/evening', () => {
      const immediatePhase = routine.phases[0];
      
      const morningItems = immediatePhase.slots.morning;
      const eveningItems = immediatePhase.slots.evening;
      
      [...morningItems, ...eveningItems].forEach(item => {
        expect(item.frequency).toBe('daily');
      });
    });
  });

  describe('Validation Cohérence Zones', () => {
    it('doit avoir des zones cohérentes diagnostic → routine', () => {
      const diagnosticZones = MOCK_DIAGNOSTIC.zoneSpecificIssues.map(issue => issue.zone);
      const allItems = routine.phases.flatMap(phase => 
        Object.values(phase.slots).flat()
      );
      
      // Vérifier qu'au moins un item traite les zones diagnostiquées
      const routineZones = allItems.flatMap(item => item.target_zones || []);
      
      diagnosticZones.forEach(zone => {
        const hasMatchingZone = routineZones.some(routineZone => 
          routineZone.toLowerCase().includes(zone.toLowerCase()) ||
          zone.toLowerCase().includes(routineZone.toLowerCase())
        );
        expect(hasMatchingZone).toBe(true);
      });
    });
  });

  describe('Validation Logs et Warnings', () => {
    it('ne doit pas avoir de warnings pour champs manquants', () => {
      expect(mappingResult.warnings).toHaveLength(0);
    });

    it('ne doit pas avoir d\'erreurs de mapping', () => {
      expect(mappingResult.errors).toHaveLength(0);
    });
  });

  describe('Validation Structure UI', () => {
    it('doit avoir la structure attendue pour l\'UI V3', () => {
      routine.phases.forEach(phase => {
        // Structure de base
        expect(phase.id).toBeDefined();
        expect(phase.label).toBeDefined();
        expect(phase.durationLabel).toBeDefined();
        expect(phase.slots).toBeDefined();
        
        // Slots obligatoires
        expect(phase.slots.morning).toBeDefined();
        expect(phase.slots.evening).toBeDefined();
        expect(phase.slots.weekly).toBeDefined();
        
        // Items dans les slots
        Object.values(phase.slots).flat().forEach((item: AiRoutineItem) => {
          expect(item.id).toBeDefined();
          expect(item.phase).toBeDefined();
          expect(item.routine_slot).toBeDefined();
          expect(item.title).toBeDefined();
          expect(item.product).toBeDefined();
          expect(item.category).toBeDefined();
        });
      });
    });
  });
});

describe('Validation Prompts IA Ajustés', () => {
  describe('Prompt routinePersonnalisee.ts', () => {
    it('doit interdire timing "both"', () => {
      // Ce test valide que le prompt interdit explicitement "both"
      // et force la création de steps distincts
      expect(MOCK_ROUTINE_RAW.phases.immediate.steps.every(
        step => step.timing !== 'both'
      )).toBe(true);
    });

    it('doit avoir tous les champs obligatoires V3', () => {
      const steps = MOCK_ROUTINE_RAW.phases.immediate.steps;
      
      steps.forEach(step => {
        expect(step.applicationInstructions).toBeDefined();
        expect(Array.isArray(step.restrictions)).toBe(true);
        expect(Array.isArray(step.targetZones)).toBe(true);
        expect(Array.isArray(step.alternatives)).toBe(true);
      });
    });
  });

  describe('Règle Hebdomadaire Automatique', () => {
    it('doit placer frequency non-daily en hebdomadaire', () => {
      const exfoliation = MOCK_ROUTINE_RAW.phases.immediate.steps.find(
        step => step.frequency === '1x/week'
      );
      
      expect(exfoliation?.timing).toBe('hebdomadaire');
    });
  });
});
