# 🔄 Archive Prompt V2 - Procédure Rollback

**Date Sauvegarde:** 30 septembre 2025  
**Version Sauvegardée:** Prompt Routine V2 (pre-GPT5)  
**Raison:** Migration vers Prompt V3 + GPT-5 Thinking

---

## 📁 **CONTENU ARCHIVE**

- `routinePersonnalisee-pre-v3.ts` : Prompt original fonctionnel avec GPT-4o

---

## 🚨 **PROCÉDURE ROLLBACK D'URGENCE**

### **Si incident critique avec Prompt V3 ou GPT-5 :**

#### **1. Restaurer Prompt V2 (<2 min)**

```bash
cd /Users/mak/dermai-v2

# Restaurer prompt original
cp archive/prompts-backup-20250930/routinePersonnalisee-pre-v3.ts \
   src/services/ai/core/prompts/routinePersonnalisee.ts

# Vérifier restauration
git diff src/services/ai/core/prompts/routinePersonnalisee.ts
```

#### **2. Désactiver GPT-5 (<1 min)**

```bash
# Éditer .env.production
USE_GPT5_DIAGNOSTIC=false
USE_GPT5_ROUTINE=false

# OU via Vercel CLI
vercel env add USE_GPT5_ROUTINE false production
```

#### **3. Revenir aux imports V2**

**Fichier:** `src/services/ai/AnalysisService.ts`

```typescript
// AVANT (V3)
import { 
  ROUTINE_PERSONNALISEE_SYSTEM_PROMPT_V3,
  buildRoutineUserPromptV3 
} from '@/services/ai/core/prompts/routinePersonnaliseeV3'

// APRÈS (V2 - rollback)
import { 
  ROUTINE_PERSONNALISEE_SYSTEM_PROMPT,
  buildRoutineUserPrompt 
} from '@/services/ai/core/prompts/routinePersonnalisee'
```

**Changement ligne ~381 :**

```typescript
// V2 (rollback)
content: buildRoutineUserPrompt(
  diagnostic,
  request.userProfile,
  request.skinConcerns,
  request.constraints,
  routineContext
)
```

#### **4. Rebuild + Deploy (<5 min)**

```bash
npm run build
vercel deploy --prod

# Vérifier logs
vercel logs --prod | grep "gpt-4o"
# Devrait afficher "gpt-4o" au lieu de "gpt-5-thinking"
```

---

## ✅ **VALIDATION ROLLBACK**

Après rollback, vérifier :

- [ ] Logs montrent `model: "gpt-4o"` (pas gpt-5)
- [ ] Aucune erreur validation Zod
- [ ] Latency P95 <30s (retour normale)
- [ ] Coûts retour ~$0.15/analyse (vs $0.25 GPT-5)

---

## 📊 **DIFFÉRENCES V2 vs V3**

| Aspect | V2 (Actuel/Rollback) | V3 (Migration) |
|--------|----------------------|----------------|
| **Modèle** | GPT-4o | GPT-5 Thinking |
| **Prompt** | routinePersonnalisee.ts (513 lignes) | routinePersonnaliseeV3.ts (281 lignes compactes) |
| **Budget/Style** | Sections texte simples | Arbitrage formalisé + validation |
| **Température** | 0.1 | 0.1 (identique) |
| **Reasoning** | Non | Oui (reasoning_effort: medium) |

---

## 🔗 **DOCUMENTATION ASSOCIÉE**

- Plan implémentation : `docs/plan-implementation-routine-v2-gpt5.md`
- Audit Sprint 0 : `docs/sprint0-audit-results.md`
- Prompt V3 source : `docs/Prompt-RoutineV3`

---

**Archive créée : 30 septembre 2025**  
**Validité rollback : Illimitée (tant que GPT-4o disponible)**

