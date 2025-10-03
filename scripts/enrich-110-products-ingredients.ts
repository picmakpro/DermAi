/**
 * PHASE 3 SPRINT 3.2 : Enrichissement 110 Produits avec Ingrédients
 * 
 * Enrichit les 110 produits Supabase avec métadonnées ingrédients détaillées :
 * - ingredients (liste INCI complète)
 * - comedogenic (calculé depuis ingrédients)
 * - irritant (calculé depuis ingrédients)
 * - photosensitizing (calculé depuis ingrédients)
 * - pregnancy_safe (calculé depuis ingrédients)
 * 
 * Méthode : GPT-4o-mini pour analyse intelligente
 * Coût : ~$0.11 pour 110 produits
 * Durée : ~10 minutes
 */

import { config } from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { z } from 'zod'

// Charger .env.local
config({ path: path.join(process.cwd(), '.env.local') })

// ========== CONFIGURATION ==========

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!

if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

// ========== TYPES ==========

const EnrichedMetadataSchema = z.object({
  ingredients: z.array(z.string()).describe('Liste INCI complète des ingrédients (ex: ["Aqua", "Glycerin", "Niacinamide"])'),
  comedogenic: z.boolean().describe('true si contient ingrédients comédogènes (bouche pores)'),
  irritant: z.boolean().describe('true si contient ingrédients irritants (alcool, fragrance, actifs forts >10%)'),
  photosensitizing: z.boolean().describe('true si contient AHA, BHA, Retinol, ou autres photosensibilisants'),
  pregnancy_safe: z.boolean().describe('true si safe grossesse (pas de Retinol, Salicylic Acid, Essential Oils)')
})

type EnrichedMetadata = z.infer<typeof EnrichedMetadataSchema>

interface Product {
  catalog_id: string
  name: string
  brand: string
  category: string
  active_ingredients: string[]
}

// ========== PROMPT GPT-4O-MINI ==========

const ENRICHMENT_PROMPT = `Tu es un expert dermatologue spécialisé dans l'analyse des ingrédients cosmétiques.

Analyse ce produit et fournis les métadonnées suivantes :

**ingredients** : Liste INCI complète des ingrédients (format tableau de strings).
- Si tu connais la composition typique de ce type de produit, fournis la liste complète
- Sinon, fournis au minimum les active_ingredients déjà connus
- Format : ["Aqua", "Glycerin", "Niacinamide", "Tocopherol", ...]

**comedogenic** : true/false
- true si contient des ingrédients comédogènes connus : huiles lourdes (Coconut Oil, etc.), silicones lourds, beurres occlusifs
- false sinon

**irritant** : true/false
- true si contient : Alcohol Denat, SD Alcohol, Fragrance/Parfum, Essential Oils, ou actifs forts >10% (Niacinamide >10%, AHA >10%, BHA >2%)
- false sinon

**photosensitizing** : true/false
- true si contient : Retinol, Retinoids, AHA (Glycolic, Lactic, Mandelic), BHA (Salicylic), Kojic Acid
- false sinon

**pregnancy_safe** : true/false
- false si contient : Retinol, Retinoids, Salicylic Acid (>2%), Essential Oils, Hydroquinone
- true sinon

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaires.

Exemple réponse :
{
  "ingredients": ["Aqua", "Glycerin", "Niacinamide", "Panthenol", "Tocopherol"],
  "comedogenic": false,
  "irritant": false,
  "photosensitizing": false,
  "pregnancy_safe": true
}`

// ========== FONCTIONS ==========

/**
 * Enrichit un produit avec GPT-4o-mini
 */
async function enrichProductWithAI(product: Product): Promise<EnrichedMetadata | null> {
  try {
    const productDescription = `
Produit : ${product.name}
Marque : ${product.brand}
Catégorie : ${product.category}
Ingrédients actifs connus : ${product.active_ingredients.join(', ')}
`.trim()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ENRICHMENT_PROMPT },
        { role: 'user', content: productDescription }
      ],
      temperature: 0.0,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse et valide avec Zod
    const parsed = JSON.parse(responseText)
    const validated = EnrichedMetadataSchema.parse(parsed)

    return validated
  } catch (error: any) {
    console.error(`   ❌ Erreur enrichissement ${product.catalog_id}:`, error.message)
    return null
  }
}

/**
 * Met à jour un produit dans Supabase
 */
async function updateProductInSupabase(
  catalogId: string,
  metadata: EnrichedMetadata
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .update({
        ingredients: metadata.ingredients,
        comedogenic: metadata.comedogenic,
        irritant: metadata.irritant,
        photosensitizing: metadata.photosensitizing,
        pregnancy_safe: metadata.pregnancy_safe,
        last_updated: new Date().toISOString()
      })
      .eq('catalog_id', catalogId)

    if (error) {
      console.error(`   ❌ Erreur update Supabase ${catalogId}:`, error.message)
      return false
    }

    return true
  } catch (error: any) {
    console.error(`   ❌ Erreur update Supabase ${catalogId}:`, error.message)
    return false
  }
}

/**
 * Pause pour rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ========== SCRIPT PRINCIPAL ==========

async function enrichAllProducts() {
  console.log('\n🚀 PHASE 3 SPRINT 3.2 : Enrichissement 110 Produits\n')

  try {
    // ========== 1. CHARGER PRODUITS ==========
    
    console.log('📥 Chargement produits depuis Supabase...')
    
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('catalog_id, name, brand, category, active_ingredients')
      .eq('status', 'active')
      .order('catalog_id', { ascending: true })

    if (fetchError) {
      throw new Error(`Erreur chargement Supabase: ${fetchError.message}`)
    }

    if (!products || products.length === 0) {
      throw new Error('Aucun produit trouvé dans Supabase')
    }

    console.log(`✅ ${products.length} produits chargés\n`)

    // ========== 2. ENRICHISSEMENT ==========
    
    console.log('🔄 Enrichissement en cours...\n')
    
    let successCount = 0
    let failCount = 0
    let skippedCount = 0
    const totalProducts = products.length

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const progress = i + 1

      console.log(`[${progress}/${totalProducts}] ${product.name}`)

      // Enrichir avec GPT-4o-mini
      const metadata = await enrichProductWithAI(product)

      if (!metadata) {
        console.log(`   ⚠️ Échec enrichissement, skip`)
        failCount++
        continue
      }

      // Log résultat
      console.log(`   ✓ Enrichi :`)
      console.log(`     - Ingrédients : ${metadata.ingredients.length} trouvés`)
      console.log(`     - Comédogène : ${metadata.comedogenic}`)
      console.log(`     - Irritant : ${metadata.irritant}`)
      console.log(`     - Photosensibilisant : ${metadata.photosensitizing}`)
      console.log(`     - Pregnancy safe : ${metadata.pregnancy_safe}`)

      // Update Supabase
      const updated = await updateProductInSupabase(product.catalog_id, metadata)

      if (updated) {
        successCount++
        console.log(`   ✅ Mis à jour dans Supabase`)
      } else {
        failCount++
        console.log(`   ❌ Échec mise à jour Supabase`)
      }

      // Progress indicator
      if ((progress % 10) === 0) {
        const percent = Math.round((progress / totalProducts) * 100)
        console.log(`\n📊 Progression : ${progress}/${totalProducts} (${percent}%)`)
        console.log(`   ✅ Succès : ${successCount}`)
        console.log(`   ❌ Échecs : ${failCount}\n`)
      }

      // Rate limiting (éviter 429 OpenAI)
      await sleep(500)  // 500ms entre chaque requête
    }

    // ========== 3. STATISTIQUES FINALES ==========
    
    console.log('\n' + '='.repeat(70))
    console.log('\n✅ ENRICHISSEMENT TERMINÉ\n')
    console.log('📊 STATISTIQUES :')
    console.log(`   - Succès : ${successCount} (${Math.round((successCount / totalProducts) * 100)}%)`)
    console.log(`   - Échecs : ${failCount} (${Math.round((failCount / totalProducts) * 100)}%)`)
    console.log(`   - TOTAL : ${totalProducts} produits`)

    // ========== 4. VÉRIFICATION ==========
    
    console.log('\n🔍 Vérification finale...')
    
    const { data: enrichedProducts, error: verifyError } = await supabase
      .from('products')
      .select('catalog_id, ingredients, comedogenic, irritant, photosensitizing, pregnancy_safe')
      .eq('status', 'active')

    if (verifyError) {
      console.error('❌ Erreur vérification:', verifyError.message)
    } else {
      const withIngredients = enrichedProducts?.filter(p => p.ingredients && p.ingredients.length > 0).length || 0
      const pregnancySafe = enrichedProducts?.filter(p => p.pregnancy_safe === true).length || 0
      const photosensitizing = enrichedProducts?.filter(p => p.photosensitizing === true).length || 0
      const irritant = enrichedProducts?.filter(p => p.irritant === true).length || 0
      const comedogenic = enrichedProducts?.filter(p => p.comedogenic === true).length || 0

      console.log(`✅ ${withIngredients}/${totalProducts} produits avec ingrédients`)
      console.log(`\n📈 DISTRIBUTION :`)
      console.log(`   - Pregnancy safe : ${pregnancySafe}/${totalProducts} (${Math.round((pregnancySafe / totalProducts) * 100)}%)`)
      console.log(`   - Photosensibilisant : ${photosensitizing}/${totalProducts} (${Math.round((photosensitizing / totalProducts) * 100)}%)`)
      console.log(`   - Irritant : ${irritant}/${totalProducts} (${Math.round((irritant / totalProducts) * 100)}%)`)
      console.log(`   - Comédogène : ${comedogenic}/${totalProducts} (${Math.round((comedogenic / totalProducts) * 100)}%)`)
    }

    console.log('\n🎯 PROCHAINES ÉTAPES :')
    console.log('   1. Vérifier sur Supabase Table Editor')
    console.log('   2. Implémenter ProductMatcherV2 (scoring 5 critères)')
    console.log('   3. Tests A/B scoring V1 vs V2')
    console.log('')

    if (successCount === totalProducts) {
      console.log('✅ 100% DE RÉUSSITE - SPRINT 3.2 TERMINÉ\n')
      return true
    } else {
      console.log(`⚠️ ${failCount} échecs - Review manuel requis\n`)
      return false
    }

  } catch (error: any) {
    console.error('\n❌ ERREUR FATALE\n')
    console.error('Message :', error.message)
    console.error('\nStack:', error.stack)
    return false
  }
}

// ========== EXÉCUTION ==========

enrichAllProducts()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

