/**
 * PHASE 3 SPRINT 3.4 : Analyse Filtre Grossesse
 * 
 * Comprendre POURQUOI 20 hydratants sont filtrés pour la grossesse
 */

import { config } from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Charger .env.local
config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function analyzePregnancyFilter() {
  console.log('\n🔬 ANALYSE FILTRE GROSSESSE (Hydratants)\n')

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Simuler le scénario exact : Grossesse + Hydratation + skinType normal
    console.log('📋 SCÉNARIO : Grossesse + Hydratation + skinType normal\n')

    // 1. Charger tous les hydratants
    const { data: allHydratants, error } = await supabase
      .from('products')
      .select('catalog_id, name, brand, target_skin_types, price, pregnancy_safe, irritant, photosensitizing, comedogenic, active_ingredients')
      .eq('status', 'active')
      .eq('care_type', 'hydratation')

    if (error) throw new Error(`Erreur Supabase: ${error.message}`)

    console.log(`   📦 Candidats initiaux : ${allHydratants.length} hydratants\n`)

    // 2. Filtre skinType (normal)
    const afterSkinType = allHydratants.filter(p => 
      p.target_skin_types.includes('normal')
    )
    console.log(`   ✅ Après filtre skinType (normal) : ${afterSkinType.length}`)

    // 3. Filtre budget (simulate budget 200/10 = 20€ per step, +50% margin = 30€)
    const maxPrice = 30
    const afterBudget = afterSkinType.filter(p => p.price <= maxPrice)
    console.log(`   ✅ Après filtre budget (<= ${maxPrice}€) : ${afterBudget.length}`)

    // 4. Zones (pas de restriction pour hydratation visage entier)
    console.log(`   ✅ Après filtre zones : ${afterBudget.length} (aucune restriction)`)

    // 5. Filtre sécurité grossesse (pregnancy_safe)
    const afterSecurity = afterBudget.filter(p => p.pregnancy_safe)
    console.log(`   ✅ Après filtre sécurité (pregnancy_safe) : ${afterSecurity.length}\n`)

    // ========== ANALYSE DES EXCLUS ==========
    
    const excluded = afterBudget.filter(p => !p.pregnancy_safe)
    
    console.log(`⚠️ PRODUITS EXCLUS : ${excluded.length}\n`)

    if (excluded.length > 0) {
      console.log('   Analyse des raisons :\n')

      for (const product of excluded) {
        console.log(`   ❌ ${product.name}`)
        console.log(`      → Prix : ${product.price}€`)
        console.log(`      → Pregnancy safe : ${product.pregnancy_safe}`)
        console.log(`      → Actifs : ${product.active_ingredients?.join(', ') || 'N/A'}`)
        
        // Identifier si l'exclusion est justifiée
        const dangerousIngredients = ['Retinol', 'Salicylic Acid', 'Essential Oil', 'Benzoyl Peroxide']
        const hasDangerousIngredient = product.active_ingredients?.some(ing =>
          dangerousIngredients.some(danger => ing.includes(danger))
        )
        
        if (hasDangerousIngredient) {
          console.log(`      → ✅ JUSTIFIÉ : Contient ingrédient dangereux grossesse`)
        } else {
          console.log(`      → ⚠️ SUSPECT : Aucun ingrédient dangereux détecté`)
        }
        console.log(``)
      }
    }

    // ========== PRODUITS VALIDES ==========
    
    console.log(`✅ PRODUITS VALIDES : ${afterSecurity.length}\n`)

    if (afterSecurity.length > 0) {
      console.log('   Produits qui PASSENT le filtre :\n')
      for (const product of afterSecurity) {
        console.log(`   ✅ ${product.name}`)
        console.log(`      → Prix : ${product.price}€`)
        console.log(`      → Actifs : ${product.active_ingredients?.join(', ') || 'N/A'}`)
        console.log(``)
      }
    } else {
      console.log('   ⚠️ AUCUN produit ne passe le filtre\n')
    }

    // ========== CONCLUSION ==========
    
    console.log('🎯 CONCLUSION\n')

    const justifiedExclusions = excluded.filter(p => 
      p.active_ingredients?.some(ing =>
        ['Retinol', 'Salicylic Acid', 'Essential Oil', 'Benzoyl Peroxide'].some(danger => ing.includes(danger))
      )
    ).length

    const suspectExclusions = excluded.length - justifiedExclusions

    console.log(`   Total exclus : ${excluded.length}`)
    console.log(`   Justifiés (ingrédients dangereux) : ${justifiedExclusions} (${Math.round((justifiedExclusions / excluded.length) * 100)}%)`)
    console.log(`   Suspects (aucun ingrédient dangereux) : ${suspectExclusions} (${Math.round((suspectExclusions / excluded.length) * 100)}%)`)
    console.log(``)

    if (afterSecurity.length === 0) {
      if (justifiedExclusions === excluded.length) {
        console.log(`   ✅ FILTRE JUSTIFIÉ : Tous les produits exclus contiennent des ingrédients dangereux`)
        console.log(`   → C'est une LIMITATION de l'échantillon (110 produits)`)
        console.log(`   → Avec 2000+ produits, il y aura des hydratants safe grossesse`)
      } else {
        console.log(`   ⚠️ FILTRE TROP STRICT : ${suspectExclusions} produits suspects sans raison`)
        console.log(`   → GPT-4o-mini potentiellement trop conservateur`)
      }
    } else {
      console.log(`   ✅ FILTRE OK : ${afterSecurity.length} produit(s) valide(s) trouvé(s)`)
    }

    console.log(``)

  } catch (error: any) {
    console.error('\n❌ ERREUR FATALE\n')
    console.error('Message :', error.message)
    process.exit(1)
  }
}

// ========== EXÉCUTION ==========

analyzePregnancyFilter()
  .then(() => {
    console.log('✅ Analyse terminée\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

