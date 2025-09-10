# 📊 French Canonicals Migration Report

## 🔍 File Analysis Results

| File | Count | Type | Sample Lines |
|------|-------|------|--------------|
| **src/app/results/page.tsx** | 89 | Mixed | `53: intensity: zone.intensity \|\| 'modérée'` `464: frequency: 'quotidien'` `465: timing: 'soir'` |
| **public/affiliateCatalog.json** | 67 | UI Labels | `278: "peeling intense"` `369: "éclat quotidien"` `1758: "éclat intense"` |
| **src/services/ai/analysis.service.ts** | 54 | Logic/Prompts | `518: frequency: "quotidien" \| "hebdomadaire" \| "ponctuel"` `1249: 'rougeurs': 'Traitement des rougeurs'` |
| **src/components/results/UnifiedRoutineSection.tsx** | 12 | UI Labels | `41: quotidien: 'Quotidien'` `187: step.frequency === 'quotidien'` |
| **src/components/forms/SkinQuestionnaire.tsx** | 11 | Enum Values | `52: 'Je ne sais pas'` `104: skinType: 'Je ne sais pas'` |
| **src/types/index.ts** | 10 | Type Definitions | `141: frequency: 'quotidien' \| 'hebdomadaire' \| 'ponctuel'` `142: timing: 'matin' \| 'soir'` |
| **src/lib/i18n/mappers.ts** | 10 | Mapping Logic | `6: 'légère': 'mild'` `232: 'quotidien': 'Quotidien'` |
| **src/components/routine/AdvancedRoutineDisplay.tsx** | 9 | Logic | `149: step.timing === 'matin' ? 'morning'` `151: step.frequency === 'quotidien'` |
| **src/lib/i18n/__tests__/mappers.test.ts** | 8 | Test Data | `19: expect(normalizeIntensity('légère')).toBe('mild')` `143: intensity: 'légère'` |
| **src/services/educational/examples/educationalExamples.ts** | 7 | Content | `38: applicationAdvice: 'Matin et soir'` `34: title: 'Nettoyage doux quotidien'` |
| **src/constants/index.ts** | 6 | Constants | `24: 'Homme'` `14: 'Sèche'` |
| **src/data/affiliateCatalog.json** | 3 | Data | `12: "skinTypes": ["Sèche", "Mixte", "Grasse"]` |
| **src/types/routine.ts** | 3 | Type Definitions | `4: \| 'quotidien'` `5: \| 'hebdomadaire'` |
| **src/components/forms/ImprovedSummary.tsx** | 2 | UI Logic | `171: data.userProfile.skinType === 'Je ne sais pas'` |
| **src/test/utils.test.ts** | 2 | Tests | `18: const intensities = ['légère', 'modérée', 'intense']` |
| **src/debug/testEducationalInterface.ts** | 2 | Debug/Test | `74: expectedImprovement: 'Amélioration en 4-6 semaines'` |
| **src/components/forms/SimilarConcernsProofScreen.tsx** | 1 | Logic | `26: if (userConcerns.includes('Je ne sais pas'))` |
| **src/services/educational/phaseTimingCalculator.ts** | 1 | Logic | `258: if (ad.includes('cicatrisation'))` |

## 📈 Summary Statistics

- **Total Files**: 18 files
- **Total Matches**: 327 French canonical literals
- **Files with Diacritics**: 26 files (774 occurrences)

## 🚨 High-Risk Locations (Critical Priority)

### 1. Type/Union Definitions
```typescript
// src/types/index.ts - Lines 141-142, 157-158, 175, 248
frequency: 'quotidien' | 'hebdomadaire' | 'ponctuel'
timing: 'matin' | 'soir' | 'matin_et_soir'

// src/types/routine.ts - Lines 4-6
| 'quotidien'    // Daily (from API)
| 'hebdomadaire' // Weekly (from API)  
| 'ponctuel'     // As needed (from API)
```

### 2. AI Service Prompts & Logic
```typescript
// src/services/ai/analysis.service.ts - Lines 518-519
- frequency: "quotidien" | "hebdomadaire" | "ponctuel"
- timing: "matin" | "soir" | "matin_et_soir"

// Lines 1249-1264 - Treatment mapping logic
'rougeurs': 'Traitement des rougeurs',
'poils incarnés': 'Traitement des poils incarnés',
'imperfections': 'Traitement des imperfections',
```

### 3. Component Logic & State Management
```typescript
// src/app/results/page.tsx - Lines 306, 548
['légère', 'modérée', 'intense'].includes(problem.intensity)
problems.some((p: any) => p.intensity === 'intense' || p.intensity === 'sévère')

// src/components/forms/SkinQuestionnaire.tsx - Lines 103-104
gender: 'Ne souhaite pas préciser',
skinType: 'Je ne sais pas'
```

### 4. Parsing/Mapping Functions
```typescript
// src/lib/i18n/mappers.ts - Critical translation maps
intensityMap, frequencyMap, timingMap, genderMap, skinTypeMap
// These maps are used throughout the app for data normalization
```

### 5. Test Fixtures & Mock Data
```typescript
// src/lib/i18n/__tests__/mappers.test.ts
expect(normalizeIntensity('légère')).toBe('mild')
intensity: 'légère', mainConcern: 'rougeurs'

// src/test/utils.test.ts  
const intensities = ['légère', 'modérée', 'intense'] as const
```

## 🎯 Proposed Change Plan

### Phase 1: Core Enum Migration (CRITICAL)
1. **Update Type Definitions**
   - Migrate `src/types/index.ts` enums to English
   - Update `src/types/routine.ts` frequency types
   - Bump interfaces to reflect new canonical values

2. **Update AI Service & Prompts**
   - Migrate all French literals in `analysis.service.ts`
   - Update GPT-4 prompts to request English responses
   - Update concern mapping dictionaries
   - Update treatment title generators

3. **Update Core Business Logic**
   - Fix intensity checks in `results/page.tsx`
   - Update frequency/timing logic in components
   - Migrate form validation logic

### Phase 2: Data Normalization (HIGH)
4. **Update Mapping Functions**
   - Reverse mapping logic in `lib/i18n/mappers.ts`
   - Ensure backward compatibility during transition
   - Update normalization functions

5. **Update Test Suites**
   - Migrate all test fixtures to English
   - Update expectation assertions
   - Ensure test coverage for new values

### Phase 3: Content Migration (MEDIUM)
6. **Update Catalogs & Content**
   - Sanitize `public/affiliateCatalog.json` descriptions
   - Update educational content examples
   - Review component labels and UI strings

### Phase 4: Database & Storage (MEDIUM)
7. **Storage Migration**
   - Bump IndexedDB version to force cache clear
   - Update localStorage key structures if needed
   - Ensure backward compatibility for existing user data

### Phase 5: Validation & Cleanup (LOW)
8. **Final Verification**
   - Run comprehensive search for missed French literals
   - Update documentation with new canonical values
   - Remove temporary migration code

## ⚠️ Migration Risks

1. **Breaking Changes**: Existing user sessions may have French values stored
2. **API Compatibility**: External systems expecting French responses
3. **Test Coverage**: Need comprehensive testing of enum value changes
4. **Gradual Migration**: Some components still expect mixed FR/EN values during transition

## 🔧 Recommended Implementation Strategy

1. **Start with types** - Update core type definitions first
2. **Update mappers** - Ensure translation layer handles transition
3. **Migrate AI service** - Update prompts and response processing  
4. **Fix components** - Update validation and display logic
5. **Clean catalogs** - Sanitize product descriptions
6. **Test thoroughly** - Comprehensive E2E testing with new values
