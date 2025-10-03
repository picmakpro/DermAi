/**
 * PHASE 3 SPRINT 3.4 : Vérification Pregnancy Safe
 * 
 * Vérifie la cohérence des métadonnées pregnancy_safe dans Supabase
 * pour identifier si GPT-4o-mini a été trop conservateur
 */

import { config } from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Charger .env.local
config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface Product {
  catalog_id: string
  name: string
  brand: string
  care_type: string
  active_ingredients: string[]
  pregnancy_safe: boolean
  irritant: boolean
  photosensitizing: boolean
  comedogenic: boolean
}

async function verifyPregnancySafe() {
  console.log('\n🔬 VÉRIFICATION PREGNANCY SAFE\n')

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Charger tous les produits
    console.log('📥 Chargement produits depuis Supabase...')
    const { data: products, error } = await supabase
      .from('products')
      .select('catalog_id, name, brand, care_type, active_ingredients, pregnancy_safe, irritant, photosensitizing, comedogenic')
      .eq('status', 'active')
      .order('name')

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`)
    }

    if (!products || products.length === 0) {
      throw new Error('Aucun produit chargé')
    }

    console.log(`✅ ${products.length} produits chargés\n`)

    // ========== ANALYSE GLOBALE ==========
    
    console.log('📊 DISTRIBUTION GLOBALE\n')

    const pregnancySafeCount = products.filter(p => p.pregnancy_safe).length
    const pregnancyUnsafeCount = products.filter(p => !p.pregnancy_safe).length

    console.log(`   Pregnancy Safe : ${pregnancySafeCount}/${products.length} (${Math.round((pregnancySafeCount / products.length) * 100)}%)`)
    console.log(`   Pregnancy Unsafe : ${pregnancyUnsafeCount}/${products.length} (${Math.round((pregnancyUnsafeCount / products.length) * 100)}%)`)
    console.log(``)

    // ========== ANALYSE PAR CARE TYPE ==========
    
    console.log('📊 DISTRIBUTION PAR CARE TYPE\n')

    const careTypes = [...new Set(products.map(p => p.care_type))]
    
    for (const careType of careTypes.sort()) {
      const productsOfType = products.filter(p => p.care_type === careType)
      const safeCount = productsOfType.filter(p => p.pregnancy_safe).length
      const percentage = Math.round((safeCount / productsOfType.length) * 100)
      
      console.log(`   ${careType.padEnd(20)} : ${safeCount}/${productsOfType.length} safe (${percentage}%)`)
    }

    console.log(``)

    // ========== HYDRATANTS SIMPLES (ATTENDUS SAFE) ==========
    
    console.log('🔍 HYDRATANTS SIMPLES (attendus pregnancy_safe=true)\n')

    const hydratants = products.filter(p => p.care_type === 'hydratation')
    
    const expectedSafe = [
      'CeraVe',
      'Neutrogena Hydro Boost',
      'The Ordinary Hyaluronic Acid',
      'Hyaluronic Acid',
      'Glycerin'
    ]

    for (const keyword of expectedSafe) {
      const matching = hydratants.filter(p => p.name.includes(keyword))
      
      if (matching.length === 0) {
        console.log(`   ⚠️ Aucun produit trouvé avec "${keyword}"`)
        continue
      }

      for (const product of matching) {
        const status = product.pregnancy_safe ? '✅' : '❌'
        console.log(`   ${status} ${product.name}`)
        
        if (!product.pregnancy_safe) {
          console.log(`      → Ingrédients actifs : ${product.active_ingredients?.join(', ') || 'N/A'}`)
          console.log(`      → ⚠️ ATTENTION : Devrait être safe (hydratant simple)`)
        }
      }
    }

    console.log(``)

    // ========== PRODUITS PROBLÉMATIQUES ==========
    
    console.log('⚠️ PRODUITS PROBLÉMATIQUES (unsafe suspects)\n')

    const problematicIngredients = ['Retinol', 'Salicylic Acid', 'Essential Oil', 'Benzoyl Peroxide']
    
    const unsafeHydratants = hydratants.filter(p => !p.pregnancy_safe)
    
    console.log(`   ${unsafeHydratants.length} hydratants pregnancy_safe=false :\n`)

    for (const product of unsafeHydratants.slice(0, 10)) {
      const hasProblematicIngredient = product.active_ingredients?.some(ing =>
        problematicIngredients.some(prob => ing.includes(prob))
      )
      
      const verdict = hasProblematicIngredient ? '✅ Justifié' : '❌ Suspect'
      
      console.log(`   ${verdict} ${product.name}`)
      console.log(`      → Actifs : ${product.active_ingredients?.join(', ') || 'N/A'}`)
      
      if (!hasProblematicIngredient) {
        console.log(`      → ⚠️ PAS d'ingrédient problématique détecté → Potentiel false negative`)
      }
      console.log(``)
    }

    // ========== RECOMMANDATIONS ==========
    
    console.log('💡 RECOMMANDATIONS\n')

    const suspectHydratants = unsafeHydratants.filter(p => 
      !p.active_ingredients?.some(ing =>
        problematicIngredients.some(prob => ing.includes(prob))
      )
    )

    if (suspectHydratants.length > 0) {
      console.log(`   ⚠️ ${suspectHydratants.length} hydratants suspects (unsafe sans raison apparente)`)
      console.log(``)
      console.log(`   ACTION RECOMMANDÉE :`)
      console.log(`   → Re-run enrichissement GPT-4o-mini avec prompt ajusté`)
      console.log(`   → Prompt : "pregnancy_safe=true SAUF si contient Retinol, Salicylic Acid >2%, Essential Oils, Benzoyl Peroxide"`)
      console.log(``)
      console.log(`   Produits à corriger :`)
      for (const product of suspectHydratants.slice(0, 5)) {
        console.log(`   - ${product.name} (${product.catalog_id})`)
      }
    } else {
      console.log(`   ✅ Aucun hydratant suspect détecté`)
      console.log(`   → Métadonnées pregnancy_safe cohérentes`)
    }

    console.log(``)

    // ========== CONCLUSION ==========
    
    console.log('🎯 CONCLUSION\n')

    const globalSafeRate = Math.round((pregnancySafeCount / products.length) * 100)
    
    if (globalSafeRate < 40) {
      console.log(`   ⚠️ Taux global pregnancy_safe faible (${globalSafeRate}%)`)
      console.log(`   → GPT-4o-mini probablement trop conservateur`)
      console.log(`   → Re-enrichissement recommandé`)
    } else if (globalSafeRate > 70) {
      console.log(`   ✅ Taux global pregnancy_safe élevé (${globalSafeRate}%)`)
      console.log(`   → Métadonnées cohérentes`)
    } else {
      console.log(`   ✅ Taux global pregnancy_safe acceptable (${globalSafeRate}%)`)
      console.log(`   → Vérifier cas par cas les hydratants suspects`)
    }

    console.log(``)

  } catch (error: any) {
    console.error('\n❌ ERREUR FATALE\n')
    console.error('Message :', error.message)
    console.error('\nStack:', error.stack)
    process.exit(1)
  }
}

// ========== EXÉCUTION ==========

verifyPregnancySafe()
  .then(() => {
    console.log('✅ Vérification terminée\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

