# 🛒 PHASE 4 : Guide Complet Amazon Product Advertising API

**Date** : 3 Octobre 2025  
**Objectif** : Importer 2000+ produits Amazon avec liens d'affiliation automatiques

---

## 🎯 VUE D'ENSEMBLE

### Comment ça fonctionne ?

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  1. TOI → Recherche "crème hydratante" via API                    │
│     ↓                                                               │
│  2. AMAZON → Retourne 10 produits avec :                          │
│              • ASIN (ID produit unique)                            │
│              • Titre, Prix, Image                                  │
│              • Description, Brand                                  │
│     ↓                                                               │
│  3. TOI → Génère lien affiliation :                               │
│           https://amazon.fr/dp/{ASIN}/?tag=TON_TAG_PARTENAIRE     │
│     ↓                                                               │
│  4. UTILISATEUR clique → ACHAT → TU GAGNES COMMISSION ✅          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Clé** : L'API te donne l'**ASIN** (Amazon Standard Identification Number), tu construis le lien avec **ton tag partenaire**.

---

## 📋 ÉTAPE 1 : S'inscrire au Programme Partenaires Amazon

### 1.1 Créer Compte Partenaire

1. Aller sur : https://partenaires.amazon.fr/
2. Cliquer "S'inscrire maintenant"
3. Remplir formulaire :
   - Site web : `dermai.com` (ou ton domaine)
   - Description : "Application diagnostic dermatologique IA"
   - Catégorie : Beauté & Santé

**Délai** : Approbation immédiate (généralement)

### 1.2 Obtenir Tag Partenaire

Une fois inscrit, tu reçois ton **Tag Partenaire** :

```
Exemple : dermai-21
```

Ce tag sera ajouté à **tous** tes liens pour tracker les commissions.

---

## 📋 ÉTAPE 2 : Demander Accès à l'API Product Advertising

### 2.1 Conditions d'Accès

**IMPORTANT** : Amazon exige :
- ✅ Compte Partenaire actif
- ✅ Au moins **3 ventes qualifiées** dans les 180 derniers jours
- ⚠️ **OU** : Demande anticipée (peut être approuvée sans ventes)

**Solution pour démarrer** :
- Créer quelques liens manuels (10-20 produits)
- Les partager sur réseaux sociaux / amis
- Obtenir 3 ventes
- **OU** : Demander accès directement (explique projet sérieux)

### 2.2 Demander Accès API

1. Dashboard Partenaires → "Outils" → "Product Advertising API"
2. Cliquer "Demander accès"
3. Expliquer projet :
   ```
   Application DermAI : Diagnostic dermatologique IA
   Besoin API pour recommander produits cosmétiques personnalisés
   2000+ produits beauté/santé à intégrer
   ```

**Délai** : 24-48h généralement

---

## 📋 ÉTAPE 3 : Générer Clés d'Accès API

### 3.1 Obtenir Credentials

Une fois accès API approuvé :

1. Console AWS : https://console.aws.amazon.com/iam/
2. "Utilisateurs" → "Créer utilisateur"
3. Nom : `dermai-api-user`
4. Permissions : Cocher "Accès programmatique"
5. Télécharger **credentials.csv** :
   ```
   Access Key ID: AKIAIOSFODNN7EXAMPLE
   Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   ```

**⚠️ CRITIQUE** : Ces clés sont **secrètes** ! Ne jamais commit sur Git.

### 3.2 Configurer .env.local

```bash
# .env.local
AMAZON_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AMAZON_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AMAZON_PARTNER_TAG=dermai-21
AMAZON_REGION=eu-west-1
AMAZON_MARKETPLACE=www.amazon.fr
```

---

## 📋 ÉTAPE 4 : Installer SDK Amazon (Node.js)

### 4.1 Installation NPM

```bash
npm install aws4 axios
```

**Note** : Amazon n'a pas de SDK officiel Node.js pour PA-API 5.0, on utilise des librairies pour signer les requêtes.

### 4.2 Alternative : Librairie Communautaire

```bash
npm install amazon-paapi
```

Plus simple, wrapper tout prêt pour PA-API 5.0.

---

## 📋 ÉTAPE 5 : Faire une Première Requête (Test)

### 5.1 Script de Test Simple

```typescript
// scripts/test-amazon-api.ts
import axios from 'axios'
import crypto from 'crypto'
import { config } from 'dotenv'
import * as path from 'path'

config({ path: path.join(process.cwd(), '.env.local') })

const ACCESS_KEY = process.env.AMAZON_ACCESS_KEY_ID!
const SECRET_KEY = process.env.AMAZON_SECRET_ACCESS_KEY!
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG!
const HOST = 'webservices.amazon.fr'
const REGION = 'eu-west-1'

async function searchProducts(keyword: string) {
  const endpoint = `https://${HOST}/paapi5/searchitems`
  
  const payload = {
    Keywords: keyword,
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.Features',
      'Offers.Listings.Price'
    ],
    PartnerTag: PARTNER_TAG,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.fr'
  }

  // Signature AWS (nécessaire pour authentification)
  const timestamp = new Date().toISOString()
  const authorization = signRequest(endpoint, payload, timestamp)

  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Amz-Date': timestamp,
        'Authorization': authorization,
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
        'Content-Encoding': 'amz-1.0'
      }
    })

    console.log('✅ Requête réussie !')
    console.log(`📦 ${response.data.SearchResult.TotalResultCount} produits trouvés\n`)

    // Afficher premiers résultats
    const items = response.data.SearchResult.Items || []
    items.slice(0, 3).forEach((item: any) => {
      console.log(`📦 ${item.ItemInfo.Title.DisplayValue}`)
      console.log(`   ASIN : ${item.ASIN}`)
      console.log(`   Prix : ${item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'N/A'}`)
      console.log(`   Lien affiliation : https://amazon.fr/dp/${item.ASIN}/?tag=${PARTNER_TAG}`)
      console.log('')
    })
  } catch (error: any) {
    console.error('❌ Erreur API :', error.response?.data || error.message)
  }
}

function signRequest(endpoint: string, payload: any, timestamp: string): string {
  // AWS Signature Version 4 (simplifié)
  // Voir : https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html
  
  const payloadStr = JSON.stringify(payload)
  const payloadHash = crypto.createHash('sha256').update(payloadStr).digest('hex')
  
  // ... (signature complète AWS v4)
  // Pour simplifier, utilise librairie amazon-paapi (voir 5.2)
  
  return `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}...` // Simplifié
}

// Test
searchProducts('crème hydratante CeraVe')
```

### 5.2 Script de Test avec Librairie (Plus Simple)

```typescript
// scripts/test-amazon-api-simple.ts
import { config } from 'dotenv'
import * as path from 'path'

config({ path: path.join(process.cwd(), '.env.local') })

// Utilise librairie amazon-paapi
const amazonPaapi = require('amazon-paapi')

const commonParameters = {
  AccessKey: process.env.AMAZON_ACCESS_KEY_ID!,
  SecretKey: process.env.AMAZON_SECRET_ACCESS_KEY!,
  PartnerTag: process.env.AMAZON_PARTNER_TAG!,
  PartnerType: 'Associates',
  Marketplace: 'www.amazon.fr'
}

async function searchProducts(keyword: string) {
  console.log(`🔍 Recherche : "${keyword}"\n`)

  try {
    const response = await amazonPaapi.SearchItems(commonParameters, {
      Keywords: keyword,
      SearchIndex: 'Beauty',
      ItemCount: 10,
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ByLineInfo',
        'Offers.Listings.Price'
      ]
    })

    const items = response.SearchResult.Items || []
    console.log(`✅ ${items.length} produits trouvés\n`)

    items.slice(0, 5).forEach((item: any) => {
      console.log(`📦 ${item.ItemInfo.Title.DisplayValue}`)
      console.log(`   Marque : ${item.ItemInfo.ByLineInfo?.Brand?.DisplayValue || 'N/A'}`)
      console.log(`   ASIN : ${item.ASIN}`)
      console.log(`   Prix : ${item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'N/A'}`)
      console.log(`   🔗 Lien affiliation : https://amazon.fr/dp/${item.ASIN}/?tag=${commonParameters.PartnerTag}`)
      console.log('')
    })
  } catch (error: any) {
    console.error('❌ Erreur API :', error.message)
  }
}

// Tests
searchProducts('crème hydratante CeraVe')
  .then(() => searchProducts('sérum niacinamide'))
  .then(() => searchProducts('crème solaire SPF 50'))
```

### 5.3 Lancer Test

```bash
npm install amazon-paapi
npx tsx scripts/test-amazon-api-simple.ts
```

**Résultat attendu** :
```
🔍 Recherche : "crème hydratante CeraVe"

✅ 10 produits trouvés

📦 CeraVe Crème Hydratante Quotidienne
   Marque : CeraVe
   ASIN : B000IEPZTC
   Prix : 11.26€
   🔗 Lien affiliation : https://amazon.fr/dp/B000IEPZTC/?tag=dermai-21

📦 CeraVe PM Lotion Hydratante Nuit
   Marque : CeraVe
   ASIN : B000IEPZS8
   Prix : 14.97€
   🔗 Lien affiliation : https://amazon.fr/dp/B000IEPZS8/?tag=dermai-21
```

**✅ Si tu vois ça → API fonctionne !**

---

## 📋 ÉTAPE 6 : Comprendre Structure Réponse API

### 6.1 Format Réponse JSON

```json
{
  "SearchResult": {
    "TotalResultCount": 1000,
    "SearchURL": "https://www.amazon.fr/...",
    "Items": [
      {
        "ASIN": "B000IEPZTC",
        "DetailPageURL": "https://www.amazon.fr/dp/B000IEPZTC/?tag=dermai-21",
        "ItemInfo": {
          "Title": {
            "DisplayValue": "CeraVe Crème Hydratante Quotidienne"
          },
          "ByLineInfo": {
            "Brand": {
              "DisplayValue": "CeraVe"
            }
          },
          "Features": {
            "DisplayValues": [
              "Avec céramides et acide hyaluronique",
              "Convient aux peaux sèches et sensibles"
            ]
          }
        },
        "Offers": {
          "Listings": [
            {
              "Price": {
                "Amount": 11.26,
                "Currency": "EUR",
                "DisplayAmount": "11,26 €"
              }
            }
          ]
        },
        "Images": {
          "Primary": {
            "Large": {
              "URL": "https://m.media-amazon.com/images/I/41abc123.jpg"
            }
          }
        }
      }
    ]
  }
}
```

### 6.2 Mapping vers EnrichedProduct

```typescript
function mapAmazonToProduct(item: any): Partial<EnrichedProduct> {
  return {
    catalogId: `amazon-${item.ASIN}`,
    name: item.ItemInfo.Title.DisplayValue,
    brand: item.ItemInfo.ByLineInfo?.Brand?.DisplayValue || 'Unknown',
    price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
    imageUrl: item.Images?.Primary?.Large?.URL,
    
    // 🔗 Lien affiliation automatique
    retailers: [
      {
        name: 'Amazon',
        url: `https://amazon.fr/dp/${item.ASIN}/?tag=${PARTNER_TAG}`,
        price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
        availability: 'in_stock'
      }
    ],
    
    // Métadonnées à enrichir avec GPT-4o-mini
    category: 'unknown', // À déterminer
    careType: 'unknown', // À enrichir
    targetSkinTypes: [], // À enrichir
    targetConcerns: [], // À enrichir
    activeIngredients: [], // À extraire description
    
    source: 'amazon',
    status: 'pending' // Sera 'active' après enrichissement
  }
}
```

---

## 📋 ÉTAPE 7 : Stratégie Import 2000 Produits

### 7.1 Recherches Ciblées (Mots-Clés)

**Objectif** : Couvrir tous les careTypes avec mots-clés pertinents.

```typescript
const SEARCH_QUERIES = [
  // NETTOYAGE (10%)
  { keyword: 'nettoyant visage doux', count: 50 },
  { keyword: 'gel nettoyant peau sensible', count: 30 },
  { keyword: 'huile démaquillante', count: 20 },
  
  // HYDRATATION (20%)
  { keyword: 'crème hydratante visage', count: 100 },
  { keyword: 'crème hydratante peau sèche', count: 50 },
  { keyword: 'gel hydratant peau grasse', count: 50 },
  { keyword: 'sérum acide hyaluronique', count: 50 },
  
  // PROTECTION (15%)
  { keyword: 'crème solaire visage SPF 50', count: 100 },
  { keyword: 'crème solaire peau sensible', count: 50 },
  { keyword: 'crème solaire teintée', count: 50 },
  
  // ANTI-ÂGE (10%)
  { keyword: 'crème anti-rides rétinol', count: 50 },
  { keyword: 'sérum peptides anti-âge', count: 30 },
  { keyword: 'crème raffermissante', count: 30 },
  { keyword: 'bakuchiol sérum', count: 20 },
  
  // ÉCLAT (7.5%)
  { keyword: 'sérum vitamine C', count: 50 },
  { keyword: 'crème éclaircissante taches', count: 30 },
  { keyword: 'sérum niacinamide éclat', count: 30 },
  
  // TRAITEMENT-CIBLÉ (7.5%)
  { keyword: 'traitement acné', count: 50 },
  { keyword: 'sérum acide salicylique', count: 30 },
  { keyword: 'gel benzoyl peroxide', count: 20 },
  
  // APAISEMENT (10%)
  { keyword: 'crème apaisante rougeurs', count: 50 },
  { keyword: 'gel aloe vera visage', count: 30 },
  { keyword: 'crème cicatrisante cica', count: 30 },
  
  // EXFOLIATION (10%)
  { keyword: 'exfoliant visage AHA', count: 50 },
  { keyword: 'peeling chimique glycolique', count: 30 },
  { keyword: 'gommage enzymatique', count: 30 },
  
  // MASQUE (10%)
  { keyword: 'masque hydratant visage', count: 50 },
  { keyword: 'masque purifiant argile', count: 30 },
  { keyword: 'masque nuit réparateur', count: 30 }
]

// Total : ~1500-2000 produits
```

### 7.2 Script Import Progressif

```typescript
// scripts/import-amazon-products.ts
import { config } from 'dotenv'
import * as path from 'path'
const amazonPaapi = require('amazon-paapi')
import { createClient } from '@supabase/supabase-js'

config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SEARCH_QUERIES = [
  // ... (liste ci-dessus)
]

async function importBatch(query: { keyword: string; count: number }) {
  console.log(`\n🔍 Recherche : "${query.keyword}" (${query.count} produits)`)

  try {
    // 1. Rechercher sur Amazon
    const response = await amazonPaapi.SearchItems({
      AccessKey: process.env.AMAZON_ACCESS_KEY_ID!,
      SecretKey: process.env.AMAZON_SECRET_ACCESS_KEY!,
      PartnerTag: process.env.AMAZON_PARTNER_TAG!,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.fr'
    }, {
      Keywords: query.keyword,
      SearchIndex: 'Beauty',
      ItemCount: Math.min(query.count, 10), // Max 10 par requête
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ByLineInfo',
        'Offers.Listings.Price'
      ]
    })

    const items = response.SearchResult.Items || []
    console.log(`   ✅ ${items.length} produits récupérés`)

    // 2. Pour chaque produit
    for (const item of items) {
      const asin = item.ASIN
      
      // Vérifier si déjà importé
      const { data: existing } = await supabase
        .from('products')
        .select('catalog_id')
        .eq('catalog_id', `amazon-${asin}`)
        .single()

      if (existing) {
        console.log(`   ⏭️  Produit ${asin} déjà importé`)
        continue
      }

      // 3. Mapper vers format basique
      const product = {
        catalog_id: `amazon-${asin}`,
        name: item.ItemInfo.Title.DisplayValue,
        brand: item.ItemInfo.ByLineInfo?.Brand?.DisplayValue || 'Unknown',
        price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
        image_url: item.Images?.Primary?.Large?.URL,
        retailers: [{
          name: 'Amazon',
          url: `https://amazon.fr/dp/${asin}/?tag=${process.env.AMAZON_PARTNER_TAG}`,
          price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
          availability: 'in_stock'
        }],
        
        // Métadonnées à enrichir
        category: 'unknown',
        care_type: 'unknown',
        target_skin_types: [],
        target_concerns: [],
        active_ingredients: [],
        
        source: 'amazon',
        status: 'pending', // Sera enrichi après
        
        // Features Amazon (description)
        description: item.ItemInfo.Features?.DisplayValues?.join('\n') || ''
      }

      // 4. Insérer dans Supabase
      const { error } = await supabase
        .from('products')
        .insert(product)

      if (error) {
        console.error(`   ❌ Erreur insert ${asin}:`, error.message)
      } else {
        console.log(`   ✅ Produit ${asin} importé`)
      }

      // Rate limiting (1 requête/seconde Amazon)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

  } catch (error: any) {
    console.error(`   ❌ Erreur recherche:`, error.message)
  }
}

// Exécution
async function importAll() {
  console.log('🚀 Import Amazon commencé\n')
  
  for (const query of SEARCH_QUERIES) {
    await importBatch(query)
    
    // Pause entre batches
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.log('\n✅ Import terminé !')
}

importAll()
```

---

## 📋 ÉTAPE 8 : Enrichissement GPT-4o-mini

### 8.1 Script Enrichissement Post-Import

```typescript
// scripts/enrich-amazon-products.ts
import { config } from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function enrichProduct(product: any) {
  console.log(`\n🔬 Enrichissement : ${product.name}`)

  const prompt = `
Tu es un expert dermatologue. Analyse ce produit Amazon :

Nom : ${product.name}
Marque : ${product.brand}
Description : ${product.description}

Fournis JSON (strict) :
{
  "category": "cleanser|toner|serum|treatment|moisturizer|sunscreen|mask|exfoliant|balm|oil",
  "careType": "nettoyage|tonification|hydratation|protection|anti-age|eclat|traitement-cible|apaisement|exfoliation|masque",
  "targetSkinTypes": ["dry", "oily", "combination", "sensitive", "normal", "acne_prone", "mature"],
  "targetConcerns": ["hydratation", "rides", "taches", "acné", etc.],
  "activeIngredients": ["Retinol 0.5%", "Niacinamide 10%", etc.],
  "allergens": ["fragrance", "alcohol", etc.],
  "restrictedZones": ["lèvres", "yeux"] (si AHA, BHA, Retinol),
  "ingredients": ["Water", "Glycerin", etc.] (INCI complet si possible),
  "comedogenic": true/false,
  "irritant": true/false,
  "photosensitizing": true/false,
  "pregnancy_safe": true/false
}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0
    })

    const enriched = JSON.parse(response.choices[0].message.content || '{}')

    // Update Supabase
    await supabase
      .from('products')
      .update({
        category: enriched.category,
        care_type: enriched.careType,
        target_skin_types: enriched.targetSkinTypes,
        target_concerns: enriched.targetConcerns,
        active_ingredients: enriched.activeIngredients,
        allergens: enriched.allergens,
        restricted_zones: enriched.restrictedZones,
        ingredients: enriched.ingredients,
        comedogenic: enriched.comedogenic,
        irritant: enriched.irritant,
        photosensitizing: enriched.photosensitizing,
        pregnancy_safe: enriched.pregnancy_safe,
        status: 'active' // Produit prêt !
      })
      .eq('catalog_id', product.catalog_id)

    console.log(`   ✅ Enrichi : ${enriched.careType}`)
  } catch (error: any) {
    console.error(`   ❌ Erreur:`, error.message)
  }
}

// Enrichir tous produits pending
async function enrichAll() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'pending')
    .eq('source', 'amazon')

  console.log(`🔬 Enrichissement de ${products?.length} produits\n`)

  for (const product of products || []) {
    await enrichProduct(product)
    await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit GPT
  }

  console.log('\n✅ Enrichissement terminé !')
}

enrichAll()
```

---

## 📋 ÉTAPE 9 : Timeline Import Complet

### 9.1 Planning 3 Semaines

**Semaine 1** : Setup + Tests (5h)
- ✅ Inscription Programme Partenaires
- ✅ Demande accès API
- ✅ Configuration credentials
- ✅ Tests requêtes API
- ✅ Scripts import + enrichissement

**Semaine 2** : Import Progressif (20h passive)
- ✅ Batch 1-10 : 500 produits (2 jours)
- ✅ Batch 11-20 : 500 produits (2 jours)
- ✅ Batch 21-30 : 500 produits (2 jours)
- ✅ Batch 31-40 : 500 produits (2 jours)
- ✅ Total : 2000 produits importés

**Semaine 3** : Enrichissement + Validation (20h passive)
- ✅ Enrichissement GPT-4o-mini : 2000 produits ($0.33)
- ✅ Review 10% aléatoire (200 produits)
- ✅ Validation Zod (2000 produits)
- ✅ Tests E2E matching

### 9.2 Coûts Estimés

```
Amazon API : $0 (affilié)
GPT-4o-mini enrichissement : $0.33 (2000 produits × $0.000165)
Temps actif : 10h (développement + review)
Temps passif : 40h (scripts automatiques)

Total : $0.33
```

---

## 📋 ÉTAPE 10 : Vérification Liens d'Affiliation

### 10.1 Test Liens Générés

```bash
# Test manuel
open "https://amazon.fr/dp/B000IEPZTC/?tag=dermai-21"

# Vérifier :
# - Redirection vers page produit ✅
# - Tag visible dans URL ✅
# - Tracking fonctionnel (dashboard partenaires) ✅
```

### 10.2 Dashboard Partenaires

1. https://partenaires.amazon.fr/home
2. "Rapports" → "Commandes et gains"
3. Vérifier tracking des clics/ventes

**Métriques** :
- Clics : Nombre de clics sur tes liens
- Commandes : Achats effectués
- Revenus : Commissions gagnées (1-3% beauté)

---

## 🎯 RÉSUMÉ : Ce que tu dois faire

### Actions Immédiates

1. **S'inscrire Programme Partenaires** (30 min)
   - https://partenaires.amazon.fr/
   - Obtenir ton tag : `dermai-XXX`

2. **Demander accès API** (5 min)
   - Dashboard → Outils → Product Advertising API
   - Expliquer projet DermAI

3. **Générer credentials AWS** (10 min)
   - Console IAM : https://console.aws.amazon.com/iam/
   - Télécharger Access Key + Secret Key

4. **Configurer .env.local** (2 min)
   ```bash
   AMAZON_ACCESS_KEY_ID=...
   AMAZON_SECRET_ACCESS_KEY=...
   AMAZON_PARTNER_TAG=dermai-XXX
   ```

5. **Installer librairie** (1 min)
   ```bash
   npm install amazon-paapi
   ```

6. **Tester API** (5 min)
   ```bash
   npx tsx scripts/test-amazon-api-simple.ts
   ```

**Si test OK → Phase 4 peut démarrer ! ✅**

---

## 💡 POINTS CLÉS À RETENIR

1. ✅ **ASIN = ID unique produit** (ex: `B000IEPZTC`)
2. ✅ **Lien affiliation = `amazon.fr/dp/{ASIN}/?tag=TON_TAG`**
3. ✅ **API retourne ASIN + infos, TU construis le lien**
4. ✅ **Import 2000 produits = 40h passive + $0.33**
5. ✅ **Enrichissement GPT-4o-mini = métadonnées dermatologiques**
6. ✅ **Commission Amazon Beauté = 1-3% par vente**

---

## 📚 RESSOURCES

- **Documentation API** : https://webservices.amazon.com/paapi5/documentation/
- **Programme Partenaires** : https://partenaires.amazon.fr/
- **Console IAM AWS** : https://console.aws.amazon.com/iam/
- **Librairie amazon-paapi** : https://www.npmjs.com/package/amazon-paapi

---

**Version** : 1.0  
**Date** : 3 Octobre 2025  
**Prochaine étape** : Setup compte + Test API


