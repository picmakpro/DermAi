# 📊 PHASE 5 : DASHBOARD PHASE 2 (POST-VALIDATION)

> **Objectif :** Implémenter "Suivre cette routine" et Dashboard de suivi

**Durée totale :** 1-2 semaines  
**Priorité :** P2 (après validation V2.5)  
**Risque :** 🟡 Moyen (nouvelle fonctionnalité complète)

---

## ⚠️ **PRÉ-REQUIS OBLIGATOIRE**

**CETTE PHASE NE DÉMARRE QUE SI :**

✅ Phase 0 (Nettoyage) complétée  
✅ Phase 1 (Step 3) complétée  
✅ Phase 2 (UI) complétée  
✅ Phase 3 (Récap) complétée  
✅ **Phase 4 (Tests) VALIDÉE avec statut ✅**

**Si validation Phase 4 KO → NE PAS COMMENCER LE DASHBOARD**

---

## 📋 **VUE D'ENSEMBLE**

### **Objectif Global**

Permettre à l'utilisateur de :
1. Activer une routine analysée
2. Suivre sa progression quotidienne
3. Visualiser son historique
4. Gérer ses routines actives

### **Fonctionnalités Clés**

✅ Bouton "Suivre cette routine" (page résultats)  
✅ Persistence `ActiveRoutine` en DB  
✅ Dashboard avec routine tracker  
✅ Calendrier de suivi  
✅ Gestion phases (immediate → adaptation → maintenance)

---

## 🗂️ **ARCHITECTURE DATABASE**

### **Tables Nécessaires**

**Créer :** `docs/plan-execution-v2-5/DATABASE-SCHEMA-DASHBOARD.sql`

```sql
-- Table Routines Actives
CREATE TABLE active_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_id UUID, -- Lien vers analyse source
  
  -- Données routine
  routine_json JSONB NOT NULL, -- AiRoutineOutput complet
  
  -- Métadonnées progression
  current_phase TEXT NOT NULL CHECK (current_phase IN ('immediate', 'adaptation', 'maintenance')),
  week_index INTEGER DEFAULT 0, -- Semaine actuelle dans la phase
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'analysis_v2', -- 'analysis_v2' | 'manual'
  
  -- Progression
  completion_rate DECIMAL(5,2) DEFAULT 0, -- Pourcentage global
  streak_days INTEGER DEFAULT 0, -- Jours consécutifs
  
  -- État
  is_active BOOLEAN DEFAULT TRUE,
  paused_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Completions Quotidiennes
CREATE TABLE routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_routine_id UUID REFERENCES active_routines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  completion_date DATE NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('morning', 'evening', 'weekly')),
  
  -- Détails
  completed BOOLEAN DEFAULT FALSE,
  products_used TEXT[], -- IDs des produits utilisés
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(active_routine_id, completion_date, phase)
);

-- Index performance
CREATE INDEX idx_active_routines_user ON active_routines(user_id, is_active);
CREATE INDEX idx_completions_user_date ON routine_completions(user_id, completion_date DESC);
CREATE INDEX idx_completions_streak ON routine_completions(active_routine_id, completed, completion_date);

-- Triggers mise à jour automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_active_routines_updated_at
  BEFORE UPDATE ON active_routines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routine_completions_updated_at
  BEFORE UPDATE ON routine_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 🎯 **SPRINT DASH-5A : Backend "Suivre Routine"** (2 jours)

### **Objectif**
Créer API pour activer et gérer routines

### **Tâches**

#### **5A.1 Créer tables Supabase**

**Exécuter SQL dans Supabase Dashboard :**

```bash
# 1. Copier contenu DATABASE-SCHEMA-DASHBOARD.sql
# 2. Aller dans Supabase → SQL Editor
# 3. Coller et exécuter
# 4. Vérifier tables créées : active_routines, routine_completions
```

#### **5A.2 Créer service ActiveRoutineService**

**Créer :** `src/services/dashboard/ActiveRoutineService.ts`

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface ActiveRoutine {
  id: string
  user_id: string
  analysis_id?: string
  routine_json: any // AiRoutineOutput
  current_phase: 'immediate' | 'adaptation' | 'maintenance'
  week_index: number
  started_at: string
  source: string
  completion_rate: number
  streak_days: number
  is_active: boolean
}

export class ActiveRoutineService {
  
  /**
   * Créer une nouvelle routine active
   */
  static async createActiveRoutine(
    userId: string,
    routineData: {
      routine_json: any
      analysis_id?: string
      source?: string
    }
  ): Promise<ActiveRoutine> {
    
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase
      .from('active_routines')
      .insert({
        user_id: userId,
        routine_json: routineData.routine_json,
        analysis_id: routineData.analysis_id,
        source: routineData.source || 'analysis_v2',
        current_phase: 'immediate',
        week_index: 0,
        is_active: true
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erreur création routine active:', error)
      throw new Error(`Impossible de créer la routine: ${error.message}`)
    }
    
    return data
  }
  
  /**
   * Récupérer routine active de l'utilisateur
   */
  static async getActiveRoutine(userId: string): Promise<ActiveRoutine | null> {
    
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase
      .from('active_routines')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Pas de routine
      console.error('Erreur récupération routine:', error)
      throw error
    }
    
    return data
  }
  
  /**
   * Mettre à jour progression routine
   */
  static async updateRoutineProgress(
    routineId: string,
    updates: {
      current_phase?: string
      week_index?: number
      completion_rate?: number
      streak_days?: number
    }
  ): Promise<void> {
    
    const supabase = createClientComponentClient()
    
    const { error } = await supabase
      .from('active_routines')
      .update(updates)
      .eq('id', routineId)
    
    if (error) {
      throw new Error(`Erreur mise à jour routine: ${error.message}`)
    }
  }
  
  /**
   * Marquer une routine comme complétée
   */
  static async completeRoutine(routineId: string): Promise<void> {
    
    const supabase = createClientComponentClient()
    
    const { error } = await supabase
      .from('active_routines')
      .update({
        is_active: false,
        completed_at: new Date().toISOString()
      })
      .eq('id', routineId)
    
    if (error) {
      throw new Error(`Erreur completion routine: ${error.message}`)
    }
  }
  
  /**
   * Marquer completion quotidienne
   */
  static async markDailyCompletion(
    activeRoutineId: string,
    userId: string,
    date: string, // YYYY-MM-DD
    phase: 'morning' | 'evening' | 'weekly',
    completed: boolean = true
  ): Promise<void> {
    
    const supabase = createClientComponentClient()
    
    const { error } = await supabase
      .from('routine_completions')
      .upsert({
        active_routine_id: activeRoutineId,
        user_id: userId,
        completion_date: date,
        phase,
        completed
      }, {
        onConflict: 'active_routine_id,completion_date,phase'
      })
    
    if (error) {
      throw new Error(`Erreur completion: ${error.message}`)
    }
  }
  
  /**
   * Calculer streak actuel
   */
  static async calculateStreak(
    activeRoutineId: string
  ): Promise<number> {
    
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase
      .from('routine_completions')
      .select('completion_date, completed')
      .eq('active_routine_id', activeRoutineId)
      .order('completion_date', { ascending: false })
      .limit(30)
    
    if (error || !data) return 0
    
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    
    for (let i = 0; i < data.length; i++) {
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)
      const expectedDateStr = expectedDate.toISOString().split('T')[0]
      
      const completion = data.find(d => d.completion_date === expectedDateStr)
      
      if (completion && completion.completed) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }
}
```

#### **5A.3 Créer API route**

**Créer :** `src/app/api/routine/activate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ActiveRoutineService } from '@/services/dashboard/ActiveRoutineService'

export async function POST(request: NextRequest) {
  try {
    // Vérifier authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { routineJson, analysisId } = body
    
    if (!routineJson) {
      return NextResponse.json(
        { success: false, error: 'Routine manquante' },
        { status: 400 }
      )
    }
    
    // Vérifier si routine active existe déjà
    const existing = await ActiveRoutineService.getActiveRoutine(session.user.id)
    
    if (existing) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Routine active existante',
          routineId: existing.id
        },
        { status: 409 }
      )
    }
    
    // Créer nouvelle routine active
    const activeRoutine = await ActiveRoutineService.createActiveRoutine(
      session.user.id,
      {
        routine_json: routineJson,
        analysis_id: analysisId,
        source: 'analysis_v2'
      }
    )
    
    return NextResponse.json({
      success: true,
      routine: activeRoutine
    })
    
  } catch (error) {
    console.error('Erreur activation routine:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }
    
    const activeRoutine = await ActiveRoutineService.getActiveRoutine(session.user.id)
    
    return NextResponse.json({
      success: true,
      routine: activeRoutine
    })
    
  } catch (error) {
    console.error('Erreur récupération routine:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
```

### **DoD Sprint DASH-5A**

- [ ] Tables DB créées (active_routines, routine_completions)
- [ ] ActiveRoutineService créé avec 7+ méthodes
- [ ] API route /api/routine/activate (POST + GET)
- [ ] Test API : POST → 201 OK, GET → routine
- [ ] Commit : "feat: add active routine backend service and API"

---

## 🎯 **SPRINT DASH-5B : UI "Suivre Routine"** (1 jour)

### **Objectif**
Ajouter bouton activation sur page résultats

### **Tâches**

#### **5B.1 Créer composant ActivateRoutineButton**

**Créer :** `src/components/results/ActivateRoutineButton.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PlayCircle, Check, AlertCircle } from 'lucide-react'

interface ActivateRoutineButtonProps {
  routine: any // AiRoutineOutput
  analysisId?: string
  className?: string
}

export function ActivateRoutineButton({ 
  routine, 
  analysisId,
  className = '' 
}: ActivateRoutineButtonProps) {
  
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activated, setActivated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleActivate = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/routine/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineJson: routine,
          analysisId
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur activation')
      }
      
      setActivated(true)
      
      // Redirection dashboard après 1.5s
      setTimeout(() => {
        router.push('/dashboard/routine')
      }, 1500)
      
    } catch (err: any) {
      console.error('Erreur activation:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  if (activated) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`
          flex items-center gap-3 px-6 py-4
          bg-green-50 border-2 border-green-200 rounded-xl
          ${className}
        `}
      >
        <Check className="w-6 h-6 text-green-600" />
        <div>
          <p className="font-semibold text-green-900">
            Routine activée avec succès !
          </p>
          <p className="text-sm text-green-700">
            Redirection vers votre dashboard...
          </p>
        </div>
      </motion.div>
    )
  }
  
  return (
    <div className={className}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleActivate}
        disabled={loading}
        className={`
          w-full flex items-center justify-center gap-3
          px-8 py-4 rounded-xl font-semibold text-lg
          transition-all shadow-lg hover:shadow-xl
          ${loading 
            ? 'bg-gray-300 cursor-wait' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
          }
        `}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Activation en cours...</span>
          </>
        ) : (
          <>
            <PlayCircle className="w-6 h-6" />
            <span>Suivre cette routine</span>
          </>
        )}
      </motion.button>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg"
        >
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </motion.div>
      )}
      
      <p className="mt-3 text-sm text-gray-500 text-center">
        Activez pour suivre votre progression quotidienne
      </p>
    </div>
  )
}
```

#### **5B.2 Intégrer dans page résultats**

**Modifier :** `src/app/results/page.tsx`

```typescript
import { ActivateRoutineButton } from '@/components/results/ActivateRoutineButton'

// Dans le rendu, après la routine et avant le récap
<div className="max-w-4xl mx-auto px-4 py-8">
  <ActivateRoutineButton 
    routine={analysis.uiRoutine}
    analysisId={analysis.id}
  />
</div>
```

### **DoD Sprint DASH-5B**

- [ ] ActivateRoutineButton créé
- [ ] États loading/success/error gérés
- [ ] Redirection dashboard après activation
- [ ] Intégré page résultats
- [ ] Test : Clic → loading → success → redirect
- [ ] Commit : "feat: add activate routine button on results page"

---

## 🎯 **SPRINT DASH-5C : Dashboard Routine Tracker** (3 jours)

### **Objectif**
Créer page dashboard de suivi routine

### **Tâches**

**Cette partie est complexe et déjà documentée dans :**

📄 `docs/fiche-technique-phase2-dashboard.md`  
📄 `docs/planning-execution-phase2-dashboard.md`

**Suivre ces documents pour :**
- Architecture layout dashboard
- Routine tracker component
- Calendrier mensuel
- Calcul streaks
- Widgets temps réel

### **DoD Sprint DASH-5C**

- [ ] Page `/dashboard/routine` créée
- [ ] Routine active chargée
- [ ] Calendrier mensuel affiché
- [ ] Completion quotidienne fonctionne
- [ ] Streak calculé
- [ ] Commit : "feat: add dashboard routine tracker page"

---

## 📚 **DOCUMENTATION ASSOCIÉE**

**Déjà existante (à suivre) :**
- `docs/fiche-technique-phase2-dashboard.md` - Architecture complète
- `docs/planning-execution-phase2-dashboard.md` - Planning opérationnel
- `docs/architecture/database.md` - Schémas DB

**Nouveaux (Phase 5) :**
- `docs/plan-execution-v2-5/DATABASE-SCHEMA-DASHBOARD.sql` - Tables
- Sprints DASH-5A, 5B, 5C ci-dessus

---

## ✅ **CHECKLIST FINALE PHASE 5**

Avant de considérer Dashboard terminé :

### **Backend**
- [ ] Tables DB créées et testées
- [ ] ActiveRoutineService opérationnel
- [ ] API /activate fonctionne
- [ ] Tests API 100% OK

### **UI Activation**
- [ ] Bouton "Suivre routine" visible
- [ ] Activation fonctionne
- [ ] Redirection dashboard OK
- [ ] Gestion erreurs OK

### **Dashboard**
- [ ] Page /dashboard/routine créée
- [ ] Routine active affichée
- [ ] Tracker fonctionnel
- [ ] Calendrier interactif
- [ ] Streak calculé

### **Tests**
- [ ] Test E2E complet : results → activate → dashboard
- [ ] Test multi-utilisateurs
- [ ] Performance OK

---

## 🎯 **RÉSULTAT ATTENDU**

À la fin de cette phase :

✅ **Activation routine :** Bouton + API + persistence  
✅ **Dashboard opérationnel :** Tracker + calendrier + progression  
✅ **Suivi quotidien :** Completion matin/soir/hebdo  
✅ **Gamification :** Streak days visible  
✅ **UX complète :** Résultats → Dashboard → Suivi

---

## ⚠️ **IMPORTANT**

**Cette phase 5 est OPTIONNELLE dans le cadre V2.5**

**V2.5 est VALIDÉE si Phases 0-4 sont complètes.**

**Le Dashboard (Phase 5) peut être fait :**
- Maintenant (si temps disponible)
- Plus tard (itération future)
- Par étapes (activation d'abord, dashboard ensuite)

---

**📍 FIN DU PLAN V2.5**

**⏱️ DURÉE TOTALE PHASES 0-4 :** ~3-5 jours  
**⏱️ DURÉE TOTALE AVEC PHASE 5 :** ~3 semaines  
**🎯 VALIDATION :** Phase 4 rapport final ✅


