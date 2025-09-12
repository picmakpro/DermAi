#!/usr/bin/env node

/**
 * SCRIPT DE DÉCOUPAGE CATALOGUE - DermAI V2
 * Découpe affiliateCatalog.json en fichiers par catégorie pour optimiser les performances
 */

const fs = require('fs')
const path = require('path')

// Mapping des catégories du catalogue vers nos catégories logiques
const CATEGORY_MAPPING = {
  // Nettoyants
  'cleanser': 'cleanser',
  
  // Traitements et sérums
  'serum': 'serum',
  'treatment': 'treatment',
  'exfoliant': 'exfoliant',
  
  // Hydratants
  'moisturizer': 'moisturizer',
  'face-oil': 'face-oil',
  
  // Protection
  'sunscreen': 'sunscreen',
  
  // Soins spécialisés
  'mask': 'mask',
  'eye-care': 'eye-care',
  'balm': 'balm',
  'lip-care': 'lip-care',
  
  // Autres
  'toner': 'toner',
  'primer': 'primer',
  'mist': 'mist'
}

// Mapping des problèmes de peau vers les catégories nécessaires
const PROBLEM_TO_CATEGORIES = {
  'acne': ['cleanser', 'serum', 'treatment', 'moisturizer'],
  'pores': ['cleanser', 'exfoliant', 'serum', 'moisturizer'],
  'hydration': ['cleanser', 'serum', 'moisturizer', 'face-oil'],
  'aging': ['serum', 'treatment', 'moisturizer', 'eye-care'],
  'sensitivity': ['cleanser', 'moisturizer', 'mist'],
  'spots': ['serum', 'treatment', 'moisturizer']
}

async function splitCatalog() {
  try {
    console.log('🔄 Démarrage découpage catalogue...')
    
    // 1. Charger le catalogue principal
    const catalogPath = path.join(process.cwd(), 'public/affiliateCatalog.json')
    const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
    
    console.log(`📦 Catalogue chargé: ${catalogData.products.length} produits`)
    
    // 2. Grouper par catégorie
    const categorizedProducts = {}
    
    catalogData.products.forEach(product => {
      const category = CATEGORY_MAPPING[product.category] || 'other'
      
      if (!categorizedProducts[category]) {
        categorizedProducts[category] = []
      }
      
      categorizedProducts[category].push(product)
    })
    
    // 3. Créer les fichiers par catégorie
    const catalogDir = path.join(process.cwd(), 'public/catalog')
    
    for (const [category, products] of Object.entries(categorizedProducts)) {
      const categoryFile = path.join(catalogDir, `${category}.json`)
      const categoryData = {
        category,
        count: products.length,
        products
      }
      
      fs.writeFileSync(categoryFile, JSON.stringify(categoryData, null, 2))
      console.log(`✅ ${category}.json créé: ${products.length} produits`)
    }
    
    // 4. Créer le fichier index avec métadonnées
    const indexData = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      totalProducts: catalogData.products.length,
      categories: Object.keys(categorizedProducts).map(cat => ({
        name: cat,
        count: categorizedProducts[cat].length,
        file: `${cat}.json`
      })),
      problemMapping: PROBLEM_TO_CATEGORIES
    }
    
    const indexFile = path.join(catalogDir, 'index.json')
    fs.writeFileSync(indexFile, JSON.stringify(indexData, null, 2))
    
    console.log('📋 index.json créé avec métadonnées')
    console.log(`🎉 Découpage terminé: ${Object.keys(categorizedProducts).length} catégories créées`)
    
    // 5. Afficher le résumé
    console.log('\n📊 RÉSUMÉ PAR CATÉGORIE:')
    Object.entries(categorizedProducts)
      .sort(([,a], [,b]) => b.length - a.length)
      .forEach(([cat, products]) => {
        console.log(`  ${cat.padEnd(12)} : ${products.length.toString().padStart(3)} produits`)
      })
    
  } catch (error) {
    console.error('❌ Erreur lors du découpage:', error)
    process.exit(1)
  }
}

// Exécuter le script
if (require.main === module) {
  splitCatalog()
}

module.exports = { splitCatalog, PROBLEM_TO_CATEGORIES }
