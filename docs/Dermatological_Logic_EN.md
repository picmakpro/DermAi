# 🔬 DermAI Dermatological Logic – 3‑Phase Routine

## Overview

This documentation details the dermatological logic underpinning DermAI V2’s 3‑phase routine system. The approach respects the skin’s physiological principles and its natural cellular cycle.

---

## 🧬 **SCIENTIFIC FOUNDATIONS**

### **Skin Cell Cycle (28 days)**

```
Day 0–7   : Skin barrier repair
Day 7–14  : Stabilization and preparation
Day 14–28 : Full cellular renewal
Day 28+   : Adaptation to new actives
```

### **Physiology of Adaptation**
- **Skin barrier:** 5–14 days for repair
- **Active tolerance:** Minimum 14–21 days of adaptation
- **Microbiome:** 21–28 days to rebalance
- **Visible results:** 4–6 weeks depending on the issue

---

## 📋 **INTELLIGENT TRANSITION ALGORITHM**

### **1. Identify Durable Base vs Temporary Treatments**

```typescript
function identifyProductTypes(immediatePhase: UnifiedRoutineStep[]) {
  const baseDurable = immediatePhase.filter(step => {
    return step.frequency === 'daily' &&
           step.canBeMaintainedMonths === true &&
           ['cleansing', 'hydration', 'protection'].includes(step.category) &&
           !step.isTemporaryTreatment
  })
  
  const temporaryTreatments = immediatePhase.filter(step => {
    return step.isTemporaryTreatment === true ||
           step.hasVisualCriteria === true ||
           ['spot-treatment', 'healing'].includes(step.category)
  })
  
  return { baseDurable, temporaryTreatments }
}
```

### **2. Phase‑by‑Phase Progression Logic**

#### **Immediate Phase (1–3 weeks)**
**Goal:** Stabilize + Treat urgent issues + Identify the base

```typescript
generateImmediatePhase() {
  return [
    ...generateBaseCare(),           // Cleansing, baseline hydration
    ...generateUrgentTreatments(),   // Targeted temporary treatments
    ...generateProtectionIfNeeded()  // Protection according to profile
  ]
}
```

**End criteria:** All temporary treatments reach their visual objectives

#### **Adaptation Phase (3–8 weeks)**  
**Goal:** Keep the base + Introduce actives progressively

```typescript
generateAdaptationPhase(immediatePhase) {
  const { baseDurable } = identifyProductTypes(immediatePhase)
  
  return [
    ...evolveBaseProducts(baseDurable),  // Evolve if necessary
    ...generateProgressiveActives(),     // New actives per diagnosis
    ...maintainEssentials(baseDurable)   // Continue unchanged base
  ]
}
```

**End criteria:** Skin is accustomed to new actives; tolerance established

#### **Maintenance Phase (Ongoing)**
**Goal:** Maintain gains + Prevent relapses

```typescript
generateMaintenancePhase(adaptationPhase) {
  const finalBase = optimizeBaseRoutine(adaptationPhase)
  
  return [
    ...finalBase,                    // Optimized daily base
    ...generatePreventiveCare(),     // Weekly/monthly care
    ...generateTargetedMaintenance() // Targeted care as needed
  ]
}
```

---

## ⚙️ **IMPLEMENTED TECHNICAL METHODS**

### **Personalized Duration Calculation**

```typescript
interface DurationCalculator {
  calculateImmediateDuration(assessment: BeautyAssessment): string {
    let baseDuration = 14 // 2 standard weeks
    
    // Age factor (slower healing)
    if (assessment.age > 50) baseDuration += 7
    if (assessment.age > 65) baseDuration += 7
    
    // Problem severity factor
    const severeProblemCount = assessment.zoneSpecific
      .filter(zone => zone.problems.some(p => p.intensity === 'intense')).length
    baseDuration += severeProblemCount * 3
    
    // Skin type factor
    if (assessment.skinType === 'sensitive') baseDuration += 5
    
    return this.formatDurationRange(baseDuration)
  }
  
  calculateAdaptationDuration(treatments: UnifiedRoutineStep[]): string {
    let baseDuration = 28 // 4 standard weeks
    
    // Treatment complexity factor
    const complexTreatments = treatments.filter(t => 
      ['retinol', 'aha', 'bha', 'vitamin-c'].includes(t.activeType)
    ).length
    baseDuration += complexTreatments * 7
    
    // Number of treated zones factor
    const totalZones = new Set(
      treatments.flatMap(t => t.zones || [])
    ).size
    baseDuration += totalZones * 2
    
    return this.formatDurationRange(baseDuration)
  }
}
```

### **Intelligent Product Evolution**

```typescript
function evolveBaseProducts(baseDurable: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
  return baseDurable.map(step => {
    switch(step.category) {
      case 'hydration':
        // Evolve to reinforced hydration for dry/mature skin
        if (needsReinforcedHydration(step.diagnostic)) {
          return {
            ...step,
            title: step.title.replace('global', 'reinforced'),
            recommendedProducts: getReinforcedHydrationProducts(),
            applicationAdvice: getReinforcedAdvice()
          }
        }
        return step
        
      case 'protection':
        // Evolve to higher SPF when on actives / high exposure
        if (hasProgressiveActives() || hasHighExposure()) {
          return {
            ...step,
            recommendedProducts: getHigherSPFProducts(),
            applicationAdvice: getReinforcedProtectionAdvice()
          }
        }
        return step
        
      default:
        return step
    }
  })
}
```

### **Visual Evolution Criteria**

```typescript
const visualCriteria = {
  'poils_incarnés': {
    goal: 'disappearance of inflammation',
    observation: 'Check absence of redness and swelling',
    estimatedDays: '7–14 days',
    nextStep: 'Continue shaving prevention'
  },
  
  'imperfections': {
    goal: 'visible reduction of lesions',
    observation: 'Count decrease in active pimples',
    estimatedDays: '14–21 days', 
    nextStep: 'Introduce relapse prevention'
  },
  
  'rougeurs': {
    goal: 'soothing and evening of tone',
    observation: 'More even complexion, less reactivity',
    estimatedDays: '7–14 days',
    nextStep: 'Reinforce skin barrier'
  },
  
  'cicatrisation': {
    goal: 'complete wound closure',
    observation: 'Smooth skin, normalized color',
    estimatedDays: '10–21 days',
    nextStep: 'Scar prevention'
  }
}
```

---

## 🎯 **CONCRETE APPLICATION EXAMPLES**

### **Case 1: Young User (25) – Mild Concerns**
```
Diagnosis: Mild T‑zone blemishes, combination skin

Immediate Phase (1–2 wks):
1. Gentle daily cleansing (durable base)
2. T‑zone blemish treatment (temporary – until visible reduction)
3. Light hydration (durable base)
4. SPF 30 protection (durable base)

Adaptation Phase (3–4 wks):
1. Gentle cleansing (base kept)
2. Light hydration (base kept)
3. Niacinamide 2–3×/week (new progressive)
4. SPF 30 protection (base kept)

Maintenance Phase (ongoing):
1. Optimized base routine
2. BHA exfoliation 1×/week
3. Maintain protection
```

### **Case 2: Mature User (55) – Complex Concerns**
```
Diagnosis: Wrinkles, spots, dryness, sensitivity

Immediate Phase (2–3 wks):
1. Very gentle cleansing (durable base)
2. Skin‑barrier repair (temporary – until soothed)
3. Intensive hydration (durable base)
4. SPF 50 protection (durable base)

Adaptation Phase (5–6 wks):
1. Very gentle cleansing (base kept)
2. Reinforced intensive hydration (base evolution)
3. Progressive retinol 1×/week (new)
4. Morning vitamin C (new)
5. SPF 50 protection (base kept)

Maintenance Phase (ongoing):
1. Complete anti‑aging routine
2. Optimized retinol 3×/week
3. Dedicated weekly care
4. Reinforced protection
```

---

## 🔍 **VALIDATION AND TESTING**

### **Technical Validation Criteria**
- [ ] Consistent numbering (1, 2, 3 per phase)
- [ ] Logical product transitions across phases
- [ ] Personalized durations per diagnosis
- [ ] Visual criteria defined for every treatment
- [ ] Durable base identified and preserved
- [ ] Generic product filtering operational

### **Dermatological Validation Criteria**
- [ ] Respect of 28‑day cell cycle
- [ ] Progression that respects skin physiology
- [ ] Avoid initial overload/irritation
- [ ] Progressive introduction of strong actives
- [ ] Maintain skin‑barrier balance
- [ ] Prevent rebound effects

### **Required User Tests**
- [ ] Understanding of the 3‑phase logic
- [ ] Clarity of criteria to move to next phase
- [ ] Autonomy in managing personal timing
- [ ] Satisfaction with personalized progression
- [ ] Effectiveness vs planned timing

---

## 📚 **SCIENTIFIC REFERENCES**

### **Cell Cycle**
- Epidermal renewal: 28 ± 4 days (normal skin)
- Age factor: +7 days per decade after 30
- Barrier recovery: up to 14 days (healthy skin)

### **Active Adaptation**
- Retinol: 2–4 weeks minimum adaptation
- AHA/BHA: 1–2 weeks recommended preparation
- Vitamin C: 7–10 days progressive introduction
- Niacinamide: Immediate tolerance, efficacy in 2–4 weeks

### **Individual Factors**
- **Age:** Major impact on healing and adaptation times
- **Skin type:** Sensitive requires +30–50% adaptation time
- **Severity:** Intense issues extend immediate phase
- **Environment:** Climate/pollution influence timing

---

## ✅ **APPLIED IMPROVEMENTS (January 2, 2025)**

### **🎯 Implemented Consistent Numbering**
- **Immediate Phase:** 1, 2, 3, 4, 5
- **Adaptation Phase:** 1, 2, 3, 4 (instead of 100, 101, 102)
- **Maintenance Phase:** 1, 2, 3 (instead of 200, 201, 202)

### **🔄 Intelligent Product Transitions**
- **Durable base identified:** daily cleansing, hydration, protection
- **Controlled evolution:** same product kept across phases if effective
- **Progressive introduction:** new actives per skin tolerance
- **Visual criteria:** phase change based on observation, not arbitrary timing

### **📊 Validated Transition Examples**
```
Young User (25):
Immediate (1–2 wks) → Adaptation (3–4 wks) → Maintenance (ongoing)

Mature User (55):
Immediate (2–3 wks) → Adaptation (5–6 wks) → Maintenance (ongoing)
```

### **🎓 Integrated Educational Interface**
- **Personalized durations** by age and issue severity
- **Phase goals:** Calm → Introduce → Maintain
- **Dermatology tooltips:** 28‑day cell cycle explained
- **Time badges:** visual observation vs fixed timing

---

*DermAI V2 Technical Documentation – Dermatological Logic*  
*Last updated: January 2, 2025*
