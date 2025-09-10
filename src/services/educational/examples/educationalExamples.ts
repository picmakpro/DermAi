/**
 * DermAI Educational System — Concrete examples
 * Shows how personalized durations adapt to the user profile
 */

import { PhaseTimingCalculator } from '../phaseTimingCalculator'
import type { BeautyAssessment, UnifiedRoutineStep } from '@/types'

// EXAMPLE 1: Young user with mild issues
export const youngUserProfile: BeautyAssessment = {
  mainConcern: 'Mild T-zone blemishes',
  intensity: 'mild',
  concernedZones: ['forehead', 'nose'],
  skinType: 'combination',
  estimatedSkinAge: 24,
  visualFindings: [
    'A few comedones on the forehead',
    'Slight excess sebum on the T-zone',
    'Overall smooth texture'
  ],
  expectedImprovement: 'Quick improvement in 2–3 weeks',
  zoneSpecific: [
    {
      zone: 'forehead',
      problems: [{ name: 'Comedones', intensity: 'mild' }],
      description: 'A few punctual blackheads'
    }
  ]
}

export const youngUserRoutine: UnifiedRoutineStep[] = [
  {
    stepNumber: 1,
    title: 'Gentle daily cleanse',
    targetArea: 'global',
    zones: [],
    recommendedProducts: [],
    applicationAdvice: 'Morning and evening, gentle circular massage',
    treatmentType: 'cleansing',
    priority: 10,
    phase: 'immediate',
    frequency: 'daily',
    timeOfDay: 'morning_and_evening',
    category: 'cleansing'
  },
  {
    stepNumber: 2,
    title: 'Blemish treatment — Area: forehead',
    targetArea: 'specific',
    zones: ['forehead'],
    recommendedProducts: [],
    applicationAdvice: 'Evening, thin layer on concerned areas',
    treatmentType: 'treatment',
    priority: 8,
    phase: 'immediate',
    frequency: 'daily',
    timeOfDay: 'evening',
    category: 'treatment',
    applicationDuration: 'Until a noticeable reduction in comedones'
  }
]

// EXAMPLE 2: Mature user with complex concerns
export const matureUserProfile: BeautyAssessment = {
  mainConcern: 'Skin aging with dark spots',
  intensity: 'moderate',
  concernedZones: ['full_face', 'eye_contour'],
  skinType: 'dry',
  estimatedSkinAge: 58,
  visualFindings: [
    'Pronounced expression lines',
    'Dark spots on the cheekbones',
    'General loss of firmness',
    'Marked dryness'
  ],
  expectedImprovement: 'Gradual improvement over 3–4 months',
  zoneSpecific: [
    {
      zone: 'eye_contour',
      problems: [
        { name: 'Fine lines', intensity: 'moderate' },
        { name: 'Dark circles', intensity: 'mild' }
      ],
      description: 'Delicate area with fatigue signs'
    },
    {
      zone: 'cheeks',
      problems: [
        { name: 'Dark spots', intensity: 'severe' },
        { name: 'Loss of firmness', intensity: 'moderate' }
      ],
      description: 'Old sun-induced hyperpigmentation'
    }
  ]
}

export const matureUserRoutine: UnifiedRoutineStep[] = [
  {
    stepNumber: 1,
    title: 'Very gentle cleansing',
    targetArea: 'global',
    zones: [],
    recommendedProducts: [],
    applicationAdvice: 'Oil cleanser then cream cleanser',
    treatmentType: 'cleansing',
    priority: 10,
    phase: 'immediate',
    frequency: 'daily',
    timeOfDay: 'morning_and_evening',
    category: 'cleansing'
  },
  {
    stepNumber: 2,
    title: 'Barrier repair',
    targetArea: 'global',
    zones: [],
    recommendedProducts: [],
    applicationAdvice: 'Repairing serum, morning and evening',
    treatmentType: 'treatment',
    priority: 9,
    phase: 'immediate',
    frequency: 'daily',
    timeOfDay: 'morning_and_evening',
    category: 'treatment',
    applicationDuration: 'Until sensitivity is calmed'
  },
  {
    stepNumber: 3,
    title: 'Progressive retinol — Area: face',
    targetArea: 'global',
    zones: ['full_face'],
    recommendedProducts: [],
    applicationAdvice: 'Start once/week at night, then increase gradually',
    treatmentType: 'treatment',
    priority: 7,
    phase: 'adaptation',
    frequency: 'weekly', // start weekly; progression handled by guidance
    timeOfDay: 'evening',
    category: 'treatment'
  }
]

// EXAMPLE 3: Shaving-related issues
export const shavingIssuesProfile: BeautyAssessment = {
  mainConcern: 'Ingrown hairs and post-shave irritation',
  intensity: 'severe',
  concernedZones: ['chin', 'neck', 'lower_cheeks'],
  skinType: 'combination',
  estimatedSkinAge: 32,
  visualFindings: [
    'Multiple ingrown hairs',
    'Post-shave inflammation',
    'Post-inflammatory hyperpigmentation',
    'High skin sensitivity'
  ],
  expectedImprovement: 'Notable improvement in 6–8 weeks with proper technique',
  zoneSpecific: [
    {
      zone: 'chin',
      problems: [
        { name: 'Ingrown hairs', intensity: 'severe' },
        { name: 'Redness', intensity: 'severe' }
      ],
      description: 'Most problematic shaving area'
    },
    {
      zone: 'neck',
      problems: [
        { name: 'Ingrown hairs', intensity: 'moderate' },
        { name: 'Healing', intensity: 'moderate' }
      ],
      description: 'Recurrent inflammation'
    }
  ]
}

export const shavingRoutine: UnifiedRoutineStep[] = [
  {
    stepNumber: 1,
    title: 'Ingrown-hair treatment — Areas: chin, neck',
    targetArea: 'specific',
    zones: ['chin', 'neck'],
    recommendedProducts: [],
    applicationAdvice: 'Morning and evening, after gentle cleansing',
    treatmentType: 'treatment',
    priority: 10,
    phase: 'immediate',
    frequency: 'daily',
    timeOfDay: 'morning_and_evening',
    category: 'treatment',
    applicationDuration: 'Until inflammatory lesions have healed'
  },
  {
    stepNumber: 2,
    title: 'Gentle preventive exfoliation',
    targetArea: 'specific',
    zones: ['beard_area'],
    recommendedProducts: [],
    applicationAdvice: '1–2×/week, never on shaving day',
    treatmentType: 'treatment',
    priority: 6,
    phase: 'adaptation',
    frequency: 'weekly',
    timeOfDay: 'evening',
    category: 'exfoliation'
  }
]

// Demo function for calculations
export function demonstrateEducationalSystem() {
  console.log('=== DERMAI EDUCATIONAL SYSTEM — EXAMPLES ===\n')
  
  // Example 1: Young user
  const youngTimings = PhaseTimingCalculator.calculateCompleteTiming(
    youngUserProfile, 
    youngUserRoutine
  )
  
  console.log('👦 YOUNG USER (24 y/o, mild issues):')
  console.log(`   Immediate Phase: ${youngTimings.immediate.duration}`)
  console.log(`   Objective: ${youngTimings.immediate.objective.title}`)
  console.log(`   Adaptation Phase: ${youngTimings.adaptation.duration}`)
  console.log(`   Maintenance Phase: ${youngTimings.maintenance.duration}\n`)
  
  // Example 2: Mature user
  const matureTimings = PhaseTimingCalculator.calculateCompleteTiming(
    matureUserProfile,
    matureUserRoutine
  )
  
  console.log('👩 MATURE USER (58 y/o, complex concerns):')
  console.log(`   Immediate Phase: ${matureTimings.immediate.duration}`)
  console.log(`   Objective: ${matureTimings.immediate.objective.title}`)
  console.log(`   Adaptation Phase: ${matureTimings.adaptation.duration}`)
  console.log(`   Maintenance Phase: ${matureTimings.maintenance.duration}\n`)
  
  // Example 3: Shaving issues
  const shavingTimings = PhaseTimingCalculator.calculateCompleteTiming(
    shavingIssuesProfile,
    shavingRoutine
  )
  
  console.log('🪒 SHAVING ISSUES (32 y/o, high intensity):')
  console.log(`   Immediate Phase: ${shavingTimings.immediate.duration}`)
  console.log(`   Objective: ${shavingTimings.immediate.objective.title}`)
  console.log(`   Adaptation Phase: ${shavingTimings.adaptation.duration}`)
  console.log(`   Maintenance Phase: ${shavingTimings.maintenance.duration}\n`)
  
  // Timing badges demo
  console.log('🏷️ GENERATED TIMING BADGES:')
  youngUserRoutine.forEach(step => {
    const badge = PhaseTimingCalculator.generateTimingBadge(step)
    console.log(`   "${step.title}" → ${badge}`)
  })
  
  console.log()
  shavingRoutine.forEach(step => {
    const badge = PhaseTimingCalculator.generateTimingBadge(step)
    const criteria = PhaseTimingCalculator.getVisualCriteria(step)
    console.log(`   "${step.title}" → ${badge}`)
    if (criteria) {
      console.log(`      Visual criterion: ${criteria.observation}`)
    }
  })
}

// Before/After comparison
export const beforeAfterComparison = {
  before: {
    phaseLabels: [
      'Immediate Phase (5)',
      'Adaptation Phase (3)', 
      'Maintenance Phase (2)'
    ],
    timing: 'Fixed, arbitrary durations',
    education: 'No explanation of the “why”',
    badges: 'Simple: "Daily", "Weekly"',
    userAutonomy: 'Low — blindly follows'
  },
  
  after: {
    phaseLabels: [
      'Immediate Phase (1–2 weeks)',
      'Adaptation Phase (4–6 weeks)',
      'Maintenance Phase (Ongoing)'
    ],
    timing: 'Personalized durations based on diagnosis',
    education: 'Clear objectives + dermatology tooltips',
    badges: 'Enriched: "👁️ Until healed", "📈 Progressive"',
    userAutonomy: 'High — understands the logic'
  }
}

const educationalExamples = {
  youngUserProfile,
  youngUserRoutine,
  matureUserProfile, 
  matureUserRoutine,
  shavingIssuesProfile,
  shavingRoutine,
  demonstrateEducationalSystem,
  beforeAfterComparison
}

export default educationalExamples
