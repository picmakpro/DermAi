import type { PersonalizedRoutine } from '@/schemas/v2'
import type { RoutineContext } from '@/types/questionnaire'
import { validateRoutineCompliance } from '../validators/routineValidator'

/**
 * 🧪 TESTS SNAPSHOTS - ROUTINES RÉFÉRENCE
 * 
 * Snapshots de routines types pour validation structure/conformité.
 * Ces routines servent de référence pour les outputs GPT-5 Thinking attendus.
 * 
 * Coverage :
 * - Budget : Essentiel, Confort, Expert
 * - Style : Express, Équilibrée, Complète
 * - Grossesse : Oui/Non
 * - Validation : Budget, Style, Sécurité, Base durable
 */

describe('Snapshots Routines Référence', () => {
  
  // ══════════════════════════════════════════════════════════════
  // 📋 ROUTINES RÉFÉRENCE (outputs attendus GPT-5 Thinking)
  // ══════════════════════════════════════════════════════════════
  
  const createBaseSteps = () => [
    {
      stepNumber: 1,
      stepId: 'imm-nettoyage-matin',
      careType: 'nettoyage' as const,
      timing: 'matin' as const,
      targetProblem: 'Préparation de la peau',
      targetZones: ['visage entier'],
      progressiveIntroduction: null,
      restrictions: [],
      applicationInstructions: 'Matin sur visage humide, masser délicatement, rincer',
      alternatives: [],
      isTemporary: false,
      introduceFromWeek: 0,
      applicationDuration: 'continu',
      frequency: 'quotidien' as const,
      displayTitle: 'Nettoyage doux matin',
      targetBenefit: 'Préparation optimale'
    },
    {
      stepNumber: 2,
      stepId: 'imm-nettoyage-soir',
      careType: 'nettoyage' as const,
      timing: 'soir' as const,
      targetProblem: 'Préparation de la peau',
      targetZones: ['visage entier'],
      progressiveIntroduction: null,
      restrictions: [],
      applicationInstructions: 'Soir, double nettoyage si maquillage',
      alternatives: [],
      isTemporary: false,
      introduceFromWeek: 0,
      applicationDuration: 'continu',
      frequency: 'quotidien' as const,
      displayTitle: 'Nettoyage doux soir',
      targetBenefit: 'Élimination impuretés'
    },
    {
      stepNumber: 3,
      stepId: 'imm-protection',
      careType: 'protection' as const,
      timing: 'matin' as const,
      targetProblem: 'Protection solaire',
      targetZones: ['visage entier'],
      progressiveIntroduction: null,
      restrictions: [],
      applicationInstructions: 'Appliquer SPF30-50 matin, renouveler si exposition prolongée',
      alternatives: [],
      isTemporary: false,
      introduceFromWeek: 0,
      applicationDuration: 'continu',
      frequency: 'quotidien' as const,
      displayTitle: 'Protection SPF',
      targetBenefit: 'Protection UV'
    },
    {
      stepNumber: 4,
      stepId: 'imm-hydratation-matin',
      careType: 'hydratation' as const,
      timing: 'matin' as const,
      targetProblem: 'Hydratation',
      targetZones: ['visage entier'],
      progressiveIntroduction: null,
      restrictions: [],
      applicationInstructions: 'Matin avant SPF',
      alternatives: [],
      isTemporary: false,
      introduceFromWeek: 0,
      applicationDuration: 'continu',
      frequency: 'quotidien' as const,
      displayTitle: 'Hydratation légère matin',
      targetBenefit: 'Hydratation jour'
    },
    {
      stepNumber: 5,
      stepId: 'imm-hydratation-soir',
      careType: 'hydratation' as const,
      timing: 'soir' as const,
      targetProblem: 'Hydratation',
      targetZones: ['visage entier'],
      progressiveIntroduction: null,
      restrictions: [],
      applicationInstructions: 'Soir après nettoyage',
      alternatives: [],
      isTemporary: false,
      introduceFromWeek: 0,
      applicationDuration: 'continu',
      frequency: 'quotidien' as const,
      displayTitle: 'Hydratation riche soir',
      targetBenefit: 'Hydratation nuit'
    }
  ]
  
  // ══════════════════════════════════════════════════════════════
  // ✅ SNAPSHOT 1 : Essentiel + Express (Minimal)
  // ══════════════════════════════════════════════════════════════
  
  test('Snapshot 1: Essentiel + Express → Routine minimale conforme', () => {
    const routine: PersonalizedRoutine = {
      phases: {
        immediate: {
          duration: '3 semaines',
          description: 'Phase de stabilisation - Mise en place base durable',
          steps: createBaseSteps()
        },
        adaptation: {
          duration: '4 semaines',
          description: 'Introduction traitement ciblé pores',
          steps: [
            {
              stepNumber: 1,
              stepId: 'adap-traitement-pores',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Pores dilatés',
              targetZones: ['front', 'nez'],
              progressiveIntroduction: null,
              restrictions: ['Soir uniquement', 'Éviter contour yeux'],
              applicationInstructions: 'Le soir uniquement. Appliquer zone T après nettoyage.',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Pores dilatés',
              targetBenefit: 'Affinement grain de peau'
            }
          ]
        },
        maintenance: {
          description: 'Maintien résultats long terme',
          steps: []
        }
      },
      globalAdvice: [
        'Routine calée sur budget Essentiel : 1 traitement ciblé, soins multifonctions privilégiés',
        'Style Express respecté : routine épurée matin (3 étapes) et soir (3 étapes)',
        'Protection solaire SPF30-50 indispensable UV Risk Moderate'
      ],
      dermatologicalRationale: 'Routine minimaliste ciblée peau mixte avec priorité pores zone T'
    }
    
    const context: RoutineContext = {
      profile: { age: 28, gender: 'Femme', pregnancy: false },
      constraints: { budgetTier: 'Essentiel', style: 'Express' },
      environment: { uvRiskBand: 'Moderate' }
    }
    
    // Validation compliance
    const validation = validateRoutineCompliance(routine, context)
    
    expect(validation.valid).toBe(true)
    expect(validation.metrics.treatmentsCount).toBe(1)  // Essentiel = max 1
    expect(validation.metrics.hebdosCount).toBe(0)      // Express = 0 hebdo
    expect(validation.errors).toHaveLength(0)
    
    // Snapshot structure
    expect(routine).toMatchSnapshot('essentiel-express-minimal')
  })
  
  // ══════════════════════════════════════════════════════════════
  // ✅ SNAPSHOT 2 : Confort + Équilibrée (Standard)
  // ══════════════════════════════════════════════════════════════
  
  test('Snapshot 2: Confort + Équilibrée → 2 traitements alternance', () => {
    const routine: PersonalizedRoutine = {
      phases: {
        immediate: {
          duration: '3 semaines',
          description: 'Base durable',
          steps: createBaseSteps()
        },
        adaptation: {
          duration: '6 semaines',
          description: 'Introduction 2 traitements alternés',
          steps: [
            {
              stepNumber: 1,
              stepId: 'adap-traitement-aha',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Éclat + Texture',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: [
                'Ne pas cumuler avec autre traitement le même soir',
                'Éviter contour yeux et lèvres',
                'SPF strict le lendemain'
              ],
              applicationInstructions: 'Le soir uniquement. Alterner avec "Traitement Rides" : ne pas cumuler le même soir. Commencer 2 soirs/semaine (Lun, Mer), augmenter à 3 après 2 semaines si toléré (+ Ven). Attendre ~10 min avant hydratation. Éviter contour yeux/lèvres.',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Éclat + Texture',
              targetBenefit: 'Renouvellement cellulaire',
              ui: {
                needsAlternation: true,
                pairWithStepId: 'adap-traitement-retinol',
                maxPerNight: 1,
                suggestedNights: ['Lun', 'Mer', 'Ven'],
                isPhotosensitizing: true,
                avoidEyeArea: true
              }
            },
            {
              stepNumber: 2,
              stepId: 'adap-traitement-retinol',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Rides',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: [
                'Interdit grossesse/allaitement',
                'Ne pas cumuler avec AHA le même soir',
                'Éviter contour yeux et lèvres',
                'Arrêter si brûlure >72h'
              ],
              applicationInstructions: 'Le soir uniquement. Alterner avec "Traitement Éclat + Texture" : ne pas cumuler le même soir. Commencer 2 soirs/semaine (Mar, Jeu), augmenter à 3 après 2 semaines si toléré (+ Sam). Attendre ~10 min avant hydratation. Éviter contour yeux/lèvres.',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 1,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Rides',
              targetBenefit: 'Renouvellement anti-âge',
              ui: {
                needsAlternation: true,
                pairWithStepId: 'adap-traitement-aha',
                maxPerNight: 1,
                suggestedNights: ['Mar', 'Jeu', 'Sam'],
                isIrritant: true,
                avoidEyeArea: true
              }
            }
          ]
        },
        maintenance: {
          description: 'Maintien long terme',
          steps: [
            {
              stepNumber: 1,
              stepId: 'maint-masque',
              careType: 'masque',
              timing: 'hebdomadaire',
              targetProblem: 'Hydratation + Apaisement',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: ['Temps de pose max 10-15 min', 'Jamais le même jour qu\'un traitement actif'],
              applicationInstructions: '1x/semaine, idéalement dimanche. Appliquer 10-15 min puis pause 1 semaine.',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: '3 semaines',
              frequency: '1x/semaine',
              displayTitle: 'Masque Hydratant',
              targetBenefit: 'Boost hydratation'
            }
          ]
        }
      },
      globalAdvice: [
        'Routine adaptée budget Confort : 2 traitements alternés + 1 masque hebdomadaire',
        'Style Équilibrée respecté : 3 étapes matin, 4 étapes soir',
        'Alternance AHA/Rétinol stricte pour éviter irritation cumulative',
        'Protection solaire SPF50+ indispensable (actifs photosensibilisants)'
      ],
      dermatologicalRationale: 'Routine complète peau mixte mature : affinement texture + anti-âge préventif avec alternance sécurisée'
    }
    
    const context: RoutineContext = {
      profile: { age: 35, gender: 'Femme', pregnancy: false },
      constraints: { budgetTier: 'Confort', style: 'Équilibrée' },
      environment: { uvRiskBand: 'High' }
    }
    
    const validation = validateRoutineCompliance(routine, context)
    
    expect(validation.valid).toBe(true)
    expect(validation.metrics.treatmentsCount).toBe(2)  // Confort = max 2
    expect(validation.metrics.hebdosCount).toBe(1)      // Équilibrée = max 1 hebdo
    expect(validation.errors).toHaveLength(0)
    
    // Snapshot
    expect(routine).toMatchSnapshot('confort-equilibree-alternance')
  })
  
  // ══════════════════════════════════════════════════════════════
  // ✅ SNAPSHOT 3 : Expert + Complète (Maximal)
  // ══════════════════════════════════════════════════════════════
  
  test('Snapshot 3: Expert + Complète → Routine maximale 2T + 2H', () => {
    const routine: PersonalizedRoutine = {
      phases: {
        immediate: {
          duration: '4 semaines',
          description: 'Stabilisation longue (peau mature)',
          steps: createBaseSteps()
        },
        adaptation: {
          duration: '8 semaines',
          description: 'Introduction progressive 2 traitements',
          steps: [
            {
              stepNumber: 1,
              stepId: 'adap-traitement-vitC',
              careType: 'traitement',
              timing: 'matin',
              targetProblem: 'Éclat + Taches',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: ['Matin uniquement', 'Éviter contour yeux'],
              applicationInstructions: 'Le matin uniquement, après nettoyage, avant hydratation. Introduction progressive.',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Éclat + Taches',
              targetBenefit: 'Antioxydant éclaircissant'
            },
            {
              stepNumber: 2,
              stepId: 'adap-traitement-retinol-advanced',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Rides + Fermeté',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: ['Interdit grossesse', 'Soir uniquement', 'Éviter contour yeux'],
              applicationInstructions: 'Le soir uniquement. Introduction très progressive (2x/sem → 3x/sem → quotidien sur 4 semaines).',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 2,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Rides + Fermeté',
              targetBenefit: 'Anti-âge global'
            }
          ]
        },
        maintenance: {
          description: 'Maintien haute performance',
          steps: [
            {
              stepNumber: 1,
              stepId: 'maint-exfoliation',
              careType: 'exfoliation',
              timing: 'hebdomadaire',
              targetProblem: 'Texture + Éclat',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: ['Max 10 min', 'Jamais le même jour qu\'un traitement'],
              applicationInstructions: '1x/semaine (samedi recommandé). Appliquer 10 min, puis pause 1 semaine.',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: '3 semaines',
              frequency: '1x/semaine',
              displayTitle: 'Exfoliation Douce',
              targetBenefit: 'Renouvellement cellulaire'
            },
            {
              stepNumber: 2,
              stepId: 'maint-masque-repulpant',
              careType: 'masque',
              timing: 'hebdomadaire',
              targetProblem: 'Hydratation + Fermeté',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: ['Max 15 min', 'Jamais le même jour qu\'exfoliation ou traitement'],
              applicationInstructions: '1x/semaine (dimanche recommandé), jamais le même jour que l\'exfoliation. Appliquer 15 min, puis pause 1 semaine.',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: '3 semaines',
              frequency: '1x/semaine',
              displayTitle: 'Masque Repulpant',
              targetBenefit: 'Boost fermeté'
            }
          ]
        }
      },
      globalAdvice: [
        'Routine Expert complète : 2 traitements quotidiens + 2 soins hebdomadaires',
        'Budget généreux 150-300€/mois : actifs haute performance optimisés',
        'Style Complète respecté : 4 étapes matin, 4 étapes soir + 2 hebdos',
        'Progression lente recommandée (peau mature sensible)',
        'Protection SPF50+ obligatoire (Vitamine C photosensibilisante)'
      ],
      dermatologicalRationale: 'Protocole anti-âge global peau mature : prévention rides + correction taches + maintien fermeté via actifs complémentaires'
    }
    
    const context: RoutineContext = {
      profile: { age: 52, gender: 'Femme', pregnancy: false },
      constraints: { budgetTier: 'Expert', style: 'Complète' },
      environment: { uvRiskBand: 'VeryHigh' }
    }
    
    const validation = validateRoutineCompliance(routine, context)
    
    expect(validation.valid).toBe(true)
    expect(validation.metrics.treatmentsCount).toBe(2)  // Expert = max 2
    expect(validation.metrics.hebdosCount).toBe(2)      // Complète + Expert = max 2
    expect(validation.errors).toHaveLength(0)
    
    expect(routine).toMatchSnapshot('expert-complete-maximal')
  })
  
  // ══════════════════════════════════════════════════════════════
  // 🚫 SNAPSHOT 4 : Grossesse + Confort (Restrictions sécurité)
  // ══════════════════════════════════════════════════════════════
  
  test('Snapshot 4: Grossesse + Confort → Aucun actif dangereux', () => {
    const routine: PersonalizedRoutine = {
      phases: {
        immediate: {
          duration: '3 semaines',
          description: 'Base durable safe grossesse',
          steps: createBaseSteps()
        },
        adaptation: {
          duration: '4 semaines',
          description: 'Traitements safe grossesse uniquement',
          steps: [
            {
              stepNumber: 1,
              stepId: 'adap-traitement-azelaic',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Taches + Éclat',
              targetZones: ['joues', 'front'],
              progressiveIntroduction: null,
              restrictions: [
                'Safe grossesse (<10% concentration)',
                'Soir uniquement',
                'Éviter contour yeux'
              ],
              applicationInstructions: 'Le soir uniquement. Acide azélaïque ≤10% safe pendant grossesse. Appliquer zones concernées.',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Taches + Éclat',
              targetBenefit: 'Éclaircissement safe'
            }
          ]
        },
        maintenance: {
          description: 'Maintien douceur',
          steps: [
            {
              stepNumber: 1,
              stepId: 'maint-masque-apaisant',
              careType: 'masque',
              timing: 'hebdomadaire',
              targetProblem: 'Hydratation + Apaisement',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: [
                'Formule safe grossesse',
                'Max 10 min',
                'Ingrédients doux uniquement'
              ],
              applicationInstructions: '1x/semaine. Formule douce safe grossesse (céramides, acide hyaluronique, peptides). 10 min puis pause 1 semaine.',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: '3 semaines',
              frequency: '1x/semaine',
              displayTitle: 'Masque Apaisant',
              targetBenefit: 'Confort cutané'
            }
          ]
        }
      },
      globalAdvice: [
        '⚠️ GROSSESSE : Routine 100% safe - Exclusion rétinol, acides forts, huiles essentielles',
        'Actifs privilégiés : Acide azélaïque ≤10%, niacinamide, peptides, céramides',
        'Budget Confort respecté : 1 traitement + 1 masque hebdo',
        'Protection SPF50+ indispensable (masque de grossesse prévention)',
        'Consultation dermatologue recommandée si doute sur tout produit'
      ],
      dermatologicalRationale: 'Routine sécurisée grossesse : priorité sécurité maximale, actifs validés safe, focus hydratation/apaisement'
    }
    
    const context: RoutineContext = {
      profile: { age: 33, gender: 'Femme', pregnancy: true },  // ✅ Grossesse
      constraints: { budgetTier: 'Confort', style: 'Équilibrée' },
      environment: { uvRiskBand: 'High' }
    }
    
    const validation = validateRoutineCompliance(routine, context)
    
    expect(validation.valid).toBe(true)
    expect(validation.metrics.treatmentsCount).toBe(1)
    expect(validation.errors).toHaveLength(0)  // ✅ Aucun actif dangereux détecté
    
    // Vérifier que les actifs dangereux sont absents dans les STEPS uniquement
    // (ils peuvent être mentionnés dans globalAdvice/rationale comme "exclusion X")
    const stepsText = JSON.stringify([
      ...routine.phases.immediate.steps,
      ...routine.phases.adaptation.steps,
      ...routine.phases.maintenance.steps
    ]).toLowerCase()
    
    expect(stepsText).not.toMatch(/rétinol|rétinoïde|retinol/)
    expect(stepsText).not.toMatch(/acide salicylique.*>.*2|salicylic.*>.*2/)
    expect(stepsText).not.toMatch(/huile essentielle|essential oil/)
    
    expect(routine).toMatchSnapshot('grossesse-confort-safe')
  })
})
