# V2 Pipeline Implementation

## Overview

The V2 Pipeline is a new 3-step AI orchestration system that provides more structured and reliable skin analysis results. It replaces the previous 2-step approach with a cleaner separation of concerns.

## Architecture

### 3-Step Pipeline

1. **Vision Analysis** (`visionPrompt.ts`)
   - Pure diagnostic analysis from photos only
   - No product recommendations
   - Focuses on visual assessment and scoring

2. **Routine Blueprint** (`routineBlueprintPrompt.ts`)
   - Creates 3-phase routine structure
   - Personalized timing and visual criteria
   - No product selection (catalog-agnostic)

3. **Product Selection** (`productSelectionPrompt.ts`)
   - Selects specific products from internal catalog
   - Budget-aware and allergy-conscious
   - Enforces noFallbacks=true (no generic products)

### Key Components

- **Schemas** (`schemas.ts`): Zod validation for all V2 outputs
- **Adapters** (`adapters.ts`): Transform V2 outputs to legacy UI format
- **Orchestrator** (`orchestrator.ts`): Coordinates the 3-step pipeline
- **API Route** (`route.ts`): Updated to support both legacy and V2 pipelines

## Configuration

### Environment Variables

```bash
# Pipeline Version
DERMAI_PIPELINE=legacy|v2

# A/B Testing Flags (V2 only)
DERMAI_AB_PRICE_EFFICIENCY=0.2  # 0.0-1.0, weight for budget-friendly products
DERMAI_AB_DURATION_MULT=1.0     # 0.5-2.0, multiplier for phase durations
```

### Pipeline Switching

The API automatically detects the pipeline version from `DERMAI_PIPELINE`:

- `legacy`: Uses existing 2-step pipeline
- `v2`: Uses new 3-step pipeline

## Usage

### API Endpoint

The same `/api/analyze` endpoint works for both pipelines:

```typescript
POST /api/analyze
Content-Type: application/json

{
  "photos": [...],
  "userProfile": {...},
  "skinConcerns": {...},
  "currentRoutine": {...},
  "allergies": {...}
}
```

### Response Format

The V2 pipeline returns the exact same JSON structure as the legacy pipeline, ensuring UI compatibility:

```typescript
{
  "success": true,
  "data": {
    "id": "analysis_v2_...",
    "userId": "temp-user",
    "photos": [...],
    "scores": {...},
    "beautyAssessment": {...},
    "recommendations": {
      "immediate": [...],
      "routine": {
        "immediate": [...],
        "adaptation": [...],
        "maintenance": [...]
      },
      "unifiedRoutine": [...],
      // ... other legacy fields
    },
    "metadata": {
      "analysis_version": "v2-prompts",
      "processing_time_ms": 15000,
      "ai_model_used": "gpt-4o-vision",
      "pipeline_version": "v2",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Key Features

### 1. Structured 3-Phase Routine

- **Immediate** (0-2 weeks): Address urgent issues, establish base
- **Adaptation** (2-6 weeks): Introduce progressive actives
- **Maintenance** (6+ weeks): Long-term optimization

### 2. Visual Criteria for Transitions

Each phase includes visual criteria for when to transition:

```typescript
{
  "visualCriteria": {
    "goal": "clean, non-irritated skin",
    "observation": "No redness or tightness after cleansing",
    "estimatedDays": "3-5 days",
    "nextStep": "Introduce targeted treatments"
  }
}
```

### 3. No Fallback Products

The V2 pipeline enforces `noFallbacks=true`, ensuring only real catalog products are recommended.

### 4. Budget Analysis

Includes comprehensive budget analysis:

```typescript
{
  "budgetAnalysis": {
    "totalCost": 45.97,
    "monthlyCost": 23.50,
    "costPerPhase": {
      "immediate": 15.99,
      "adaptation": 18.99,
      "maintenance": 11.99
    },
    "valueScore": 88
  }
}
```

## Testing

### Unit Tests

- **Schemas**: Validate V2 output formats
- **Adapters**: Ensure legacy compatibility
- **E2E**: Test complete API integration

### Running Tests

```bash
# Run all V2 pipeline tests
npm test src/services/ai/__tests__/

# Run specific test suites
npm test src/services/ai/__tests__/schemas.test.ts
npm test src/services/ai/__tests__/adapters.test.ts
npm test src/services/ai/__tests__/e2e.test.ts
```

## Migration Guide

### From Legacy to V2

1. **Set Environment Variable**:
   ```bash
   DERMAI_PIPELINE=v2
   ```

2. **No Code Changes Required**: The UI continues to work unchanged

3. **Monitor Performance**: Check `processing_time_ms` in response metadata

### Rollback Strategy

To rollback to legacy pipeline:

```bash
DERMAI_PIPELINE=legacy
```

## Performance Considerations

### Processing Time

- **Legacy**: ~10-15 seconds
- **V2**: ~15-20 seconds (3 API calls vs 2)

### Cost Implications

- **Legacy**: 2 OpenAI API calls
- **V2**: 3 OpenAI API calls (higher cost but better results)

### Optimization

The V2 pipeline includes several optimizations:

- Parallel processing where possible
- Efficient prompt engineering
- Structured output validation
- Graceful error handling

## Troubleshooting

### Common Issues

1. **Schema Validation Errors**
   - Check OpenAI response format
   - Verify prompt engineering
   - Review Zod schema definitions

2. **Adapter Failures**
   - Ensure V2 output matches expected format
   - Check legacy type compatibility
   - Verify field mappings

3. **Performance Issues**
   - Monitor API response times
   - Check OpenAI rate limits
   - Review prompt complexity

### Debug Mode

Enable detailed logging by setting:

```bash
NODE_ENV=development
```

This will show:
- Pipeline step progression
- OpenAI API calls and responses
- Adapter transformations
- Performance metrics

## Future Enhancements

### Planned Features

1. **A/B Testing Integration**
   - Dynamic flag management
   - User segmentation
   - Performance analytics

2. **Caching Layer**
   - Redis-based result caching
   - Similar analysis reuse
   - Performance optimization

3. **Advanced Analytics**
   - Pipeline performance metrics
   - User satisfaction tracking
   - Cost optimization insights

### Extension Points

The V2 pipeline is designed for easy extension:

- **New Pipeline Steps**: Add to orchestrator
- **Additional Schemas**: Extend Zod validation
- **Custom Adapters**: Transform to new formats
- **Enhanced Prompts**: Improve AI responses

## Support

For issues or questions about the V2 pipeline:

1. Check the test suite for expected behavior
2. Review the schema definitions
3. Examine the adapter transformations
4. Monitor the orchestrator logs

The V2 pipeline maintains full backward compatibility while providing enhanced structure and reliability.

