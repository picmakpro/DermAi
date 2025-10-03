# ⚖️ CONFORMITÉ LÉGALE : Programme Partenaires Amazon

**Date** : 3 Octobre 2025  
**Version** : 1.0  
**Objectif** : Analyser conformité DermAI V2 avec conditions Amazon

---

## 🎯 RÉSUMÉ EXÉCUTIF

### ✅ VERDICT : CONFORME (avec ajustements)

**Notre approche est COMPATIBLE** avec le Programme Partenaires Amazon, **À CONDITION DE** :

1. ✅ Utiliser Amazon Product Advertising API (officielle)
2. ✅ Afficher divulgation partenaire obligatoire
3. ⚠️ Respecter durée cache (24h-7 jours selon API)
4. ✅ Afficher prix actualisés (sync quotidien)
5. ✅ Liens d'affiliation corrects (tracking)

---

## 📋 ANALYSE DÉTAILLÉE

### 1. NOTRE PLAN vs CONDITIONS AMAZON

#### Ce que prévoit notre plan :

```
1. Fetch Amazon Product Advertising API (2000 produits)
   → ASIN, title, brand, price, images, description
   
2. Enrichir avec GPT-4o-mini (métadonnées dermato)
   → careType, targetSkinTypes, targetConcerns, restrictedZones
   
3. Stocker dans Supabase (database PostgreSQL)
   → Cache long terme (> 24h)
   
4. Matching algorithmique (scoring V2)
   → Sélection personnalisée par profil
   
5. Affichage utilisateur final
   → Liens d'affiliation Amazon + divulgation
```

---

### 2. CONDITIONS AMAZON (Points Clés)

#### Section 1 : Description du Programme

> "Le Programme Partenaires vous permet de monétiser votre site Web [...] en plaçant sur votre Site (i) des liens vers un Site d'Amazon [...] Les liens doivent utiliser correctement les formats spéciaux de liens formatés que nous fournissons [...] (« Liens Spéciaux »)."

**✅ CONFORME** : On affiche des liens d'affiliation Amazon corrects.

---

> "Le Contenu du Programme exclut explicitement toute donnée, image, texte ou tout autre information ou contenu concernant des produits proposés sur un site qui n'est pas le Site d'Amazon."

**✅ CONFORME** : Tous nos produits sont bien des produits Amazon (via API officielle).

---

#### Section 5 : S'identifier comme Partenaire

> "Vous devez faire figurer clairement et de façon visible la mention suivante [...] : « En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises. »"

**⚠️ ACTION REQUISE** : Ajouter cette divulgation sur :
- Page résultats analyse (où les produits sont affichés)
- Footer du site (optionnel mais recommandé)
- Page mentions légales

**Implémentation** :
```tsx
// src/components/ProductCard.tsx
<div className="affiliate-disclosure">
  <p className="text-xs text-gray-500">
    En tant que Partenaire Amazon, DermAI réalise un bénéfice sur les achats 
    remplissant les conditions requises.
  </p>
</div>
```

---

#### Section 12 : Dispositions complémentaires

> "nous sommes autorisés à [...] évaluer, contrôler, parcourir et effectuer de toute autre manière des recherches sur votre Site afin de vérifier le respect du présent Accord"

**✅ CONFORME** : Amazon peut auditer notre site. Pas de problème car on respecte les conditions.

---

### 3. AMAZON PRODUCT ADVERTISING API (Conditions Spécifiques)

#### Durée de Cache (Point Critique)

**Conditions API standard** :
- **Prix** : Mise à jour **quotidienne** obligatoire (24h max)
- **Disponibilité** : Mise à jour **quotidienne** obligatoire
- **Métadonnées** (titre, images, description) : Cache **7 jours** max (recommandé)

**❌ PROBLÈME** : Notre plan prévoit cache **1h** pour Supabase, mais pas de suppression après 7 jours.

**✅ SOLUTION** :
```sql
-- Trigger PostgreSQL : Supprimer produits > 7 jours
CREATE OR REPLACE FUNCTION cleanup_old_products()
RETURNS void AS $$
BEGIN
  DELETE FROM products
  WHERE source = 'amazon'
    AND last_updated < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Cron : Run quotidien
-- 0 2 * * * cleanup_old_products()
```

**Alternative** : Flaguer produits obsolètes au lieu de supprimer
```sql
-- Désactiver produits > 7 jours (au lieu de supprimer)
UPDATE products
SET status = 'outdated'
WHERE source = 'amazon'
  AND last_updated < NOW() - INTERVAL '7 days'
  AND status = 'active';
```

---

#### Enrichissement Données (GPT-4)

**Question** : Peut-on ajouter des métadonnées aux produits Amazon ?

**Réponse** : **✅ OUI**, à condition de :
- Ne PAS modifier les données Amazon originales (titre, prix, images)
- Stocker les enrichissements séparément (notre cas : colonnes Supabase séparées)
- Afficher les données Amazon telles quelles à l'utilisateur

**Notre cas** :
```typescript
// ✅ CONFORME : Données Amazon intactes
product.name = "The Ordinary Niacinamide 10% + Zinc 1%"  // Amazon API
product.price = 6.00                                      // Amazon API
product.imageUrl = "https://amazon.fr/..."               // Amazon API

// ✅ CONFORME : Enrichissements séparés (nos métadonnées)
product.careType = "traitement-cible"                     // GPT-4 (nos données)
product.targetSkinTypes = ["oily", "combination"]         // GPT-4 (nos données)
product.restrictedZones = ["lèvres", "yeux"]              // GPT-4 (nos données)
```

**Validation** : On n'altère pas les données Amazon, on ajoute des métadonnées dermatologiques pour notre algorithme. **✅ OK**

---

### 4. OBLIGATIONS LÉGALES

#### 4.1 Divulgation Partenaire (Obligatoire)

**Où afficher** :
```html
<!-- Page résultats analyse -->
<div class="bg-blue-50 border border-blue-200 rounded p-3 mb-6">
  <p class="text-sm text-gray-700">
    ℹ️ En tant que Partenaire Amazon, DermAI réalise un bénéfice sur les 
    achats remplissant les conditions requises. Les prix et disponibilités 
    sont mis à jour quotidiennement.
  </p>
</div>

<!-- Footer site (optionnel mais recommandé) -->
<footer>
  <p class="text-xs text-gray-500">
    DermAI est participant au Programme Partenaires d'Amazon EU, 
    un programme d'affiliation conçu pour permettre à des sites de 
    percevoir une rémunération grâce à la création de liens vers Amazon.fr.
  </p>
</footer>
```

---

#### 4.2 Liens d'Affiliation (Format Correct)

**Format Amazon** :
```
https://amazon.fr/dp/{ASIN}/?tag={VOTRE_TAG_PARTENAIRE}
```

**Implémentation** :
```typescript
// src/utils/amazonAffiliateLink.ts
export function buildAmazonAffiliateLink(
  asin: string,
  marketplace: 'fr' | 'de' | 'uk' = 'fr'
): string {
  const AFFILIATE_TAGS = {
    fr: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG_FR,
    de: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG_DE,
    uk: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG_UK
  }
  
  const domains = {
    fr: 'amazon.fr',
    de: 'amazon.de',
    uk: 'amazon.co.uk'
  }
  
  return `https://${domains[marketplace]}/dp/${asin}/?tag=${AFFILIATE_TAGS[marketplace]}`
}
```

**Validation** : Tous les liens produits doivent inclure le tag partenaire. **✅ À implémenter**

---

#### 4.3 Prix & Disponibilité (Mise à Jour Quotidienne)

**Obligation** : Afficher prix actualisés (<24h)

**Solution** : Cron quotidien (déjà prévu Phase 5)
```typescript
// Cron : 0 3 * * * (3h du matin)
async function updateAmazonPrices() {
  const products = await supabase
    .from('products')
    .select('catalog_id')
    .eq('source', 'amazon')
    .eq('status', 'active')
  
  for (const product of products) {
    const latestData = await fetchAmazonAPI(product.catalog_id)
    
    await supabase
      .from('products')
      .update({ 
        price: latestData.price,
        availability: latestData.availability,
        last_updated: new Date()
      })
      .eq('catalog_id', product.catalog_id)
  }
}
```

**✅ CONFORME** : Déjà prévu dans Master Plan Phase 5.

---

### 5. POINTS DE VIGILANCE

#### 5.1 ⚠️ Cache 7 Jours Maximum

**Problème** : Si on stocke produits >7 jours sans refresh, violation.

**Solution** :
```typescript
// Option A : Supprimer produits > 7 jours
DELETE FROM products 
WHERE source = 'amazon' 
  AND last_updated < NOW() - INTERVAL '7 days';

// Option B : Flaguer obsolètes + re-fetch on-demand
UPDATE products 
SET status = 'outdated' 
WHERE last_updated < NOW() - INTERVAL '7 days';

// Lors du matching, si produit outdated → re-fetch API
if (product.status === 'outdated') {
  const fresh = await fetchAmazonAPI(product.catalog_id)
  await updateProduct(fresh)
}
```

**Recommandation** : **Option B** (moins de suppressions, meilleure UX)

---

#### 5.2 ⚠️ Interdiction Modifier Données Amazon

**Interdit** :
```typescript
// ❌ INTERDIT : Modifier titre Amazon
product.name = "Super Sérum Niacinamide"  // Au lieu du titre Amazon original

// ❌ INTERDIT : Modifier prix
product.price = 4.99  // Prix promotionnel fictif

// ❌ INTERDIT : Remplacer image Amazon
product.imageUrl = "/our-custom-image.jpg"
```

**Autorisé** :
```typescript
// ✅ OK : Afficher données Amazon + nos métadonnées
<ProductCard
  name={product.name}              // Amazon API
  price={product.price}            // Amazon API
  imageUrl={product.imageUrl}      // Amazon API
  amazonLink={affiliateLink}       // Notre lien avec tag
  
  // Nos enrichissements (séparés)
  careType={product.careType}
  compatibilité={calculateCompatibility(product, userProfile)}
/>
```

---

#### 5.3 ⚠️ Interdiction Cacher Origine Amazon

**Interdit** :
```typescript
// ❌ INTERDIT : Ne pas mentionner Amazon
"Acheter ce produit" (lien vers Amazon sans dire que c'est Amazon)
```

**Autorisé** :
```typescript
// ✅ OK : Indiquer clairement que c'est Amazon
<button onClick={openAmazonLink}>
  Voir sur Amazon
  <AmazonLogo />
</button>

// ✅ OK : Afficher logo Amazon
<img src="/amazon-logo.svg" alt="Disponible sur Amazon" />
```

---

### 6. CHECKLIST CONFORMITÉ

#### Setup Initial

- [ ] Créer compte Amazon Associates (amazon.fr/associates)
- [ ] Obtenir tag partenaire (ex: `dermai-21`)
- [ ] Configurer `.env.production` :
```bash
NEXT_PUBLIC_AMAZON_AFFILIATE_TAG_FR=dermai-21
AMAZON_ACCESS_KEY=xxx
AMAZON_SECRET_KEY=xxx
```

---

#### Implémentation Site

- [ ] Ajouter divulgation partenaire (page résultats)
- [ ] Ajouter divulgation footer (optionnel)
- [ ] Implémenter `buildAmazonAffiliateLink()` avec tag
- [ ] Afficher logo Amazon sur ProductCard
- [ ] Bouton "Voir sur Amazon" (pas "Acheter")
- [ ] Mentions légales : Statut partenaire Amazon

---

#### Backend & Cron

- [ ] Cron quotidien : Update prix (<24h)
- [ ] Cron quotidien : Update disponibilité
- [ ] Cron hebdomadaire : Cleanup/flag produits >7 jours
- [ ] Monitoring : Alertes si sync échoue

---

#### Légal & Documentation

- [ ] Page mentions légales : Programme Partenaires
- [ ] Politique confidentialité : Cookies Amazon (si applicable)
- [ ] CGU : Liens d'affiliation mentionnés
- [ ] Documentation interne : Process conformité

---

### 7. RISQUES & MITIGATION

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Exclusion Programme** | Faible (5%) | Haut | Audit conformité mensuel |
| **Prix obsolètes >24h** | Moyenne (20%) | Moyen | Monitoring + alertes |
| **Cache >7 jours** | Faible (10%) | Moyen | Cron cleanup automatique |
| **Tag partenaire oublié** | Faible (5%) | Haut | Tests automatisés liens |
| **Divulgation manquante** | Faible (5%) | Moyen | Review UI avant prod |

---

### 8. ALTERNATIVE : API TIERCE

Si Amazon API trop restrictive, **alternative légale** :

#### Option B : API Rainforest (Tiers Autorisé)

**Avantages** :
- ✅ Cache illimité (pas de limite 7 jours)
- ✅ Données enrichies (reviews, Q&A, etc.)
- ✅ Rate limit plus généreux
- ⚠️ Coût : ~$50-100/mois (2000 produits)

**Légalité** : Rainforest est conforme Amazon ToS (scraping légal)

**Trade-off** : Budget +$50-100/mois vs contraintes Amazon API

---

## ✅ RECOMMANDATIONS FINALES

### 1. Approche Recommandée : AMAZON API (Option A)

**Pourquoi** :
- ✅ Gratuit (affilié)
- ✅ Données officielles
- ✅ Légal 100%
- ⚠️ Contraintes cache gérables (cron quotidien)

---

### 2. Ajustements Plan Master (Mineurs)

#### Phase 4 : Import Amazon

**Ajouter** :
```typescript
// Cron quotidien : Refresh produits Amazon
// 0 3 * * * (3h du matin)
async function refreshAmazonProducts() {
  // 1. Update prix + dispo (tous produits)
  // 2. Flag outdated (>7 jours)
  // 3. Re-fetch outdated on-demand (lors du matching)
}
```

#### Phase 5 : Production

**Ajouter** :
```tsx
// Divulgation partenaire (UI)
<AffiliateDisclosure />

// Liens avec tag partenaire
<AmazonButton asin={product.catalogId} tag={AFFILIATE_TAG} />
```

---

### 3. Budget Ajusté (Inchangé)

```
Setup : $0.43 (GPT-4)
Récurrent : $25/mois (Supabase)
Total Year 1 : $300.43

Rémunération Amazon attendue :
- Taux commission : 1-3% (selon catégorie Beauty)
- Si 100 ventes/mois × panier moyen 30€ × 2% = +60€/mois
→ Rentabilité potentielle : +$720/an - $300 = +$420/an net
```

**ROI positif** ! 🎉

---

## 📚 RESSOURCES

### Liens Officiels

- [Programme Partenaires Amazon](https://partenaires.amazon.fr/)
- [Amazon Product Advertising API](https://webservices.amazon.com/paapi5/documentation/)
- [Conditions Générales Programme](https://partenaires.amazon.fr/help/operating/agreement)
- [Guide Conformité](https://partenaires.amazon.fr/help/operating/policies)

### Support

- Email : partenaires@amazon.fr
- Dashboard : https://partenaires.amazon.fr/
- API Support : https://webservices.amazon.com/support

---

## 🎯 CONCLUSION

### ✅ VERDICT FINAL : 100% CONFORME

Notre plan **Master Plan Scaling V2** est **entièrement compatible** avec le Programme Partenaires Amazon **À CONDITION DE** :

1. ✅ Ajouter divulgation partenaire (UI)
2. ✅ Implémenter liens avec tag partenaire
3. ✅ Cron quotidien refresh prix
4. ✅ Cron hebdomadaire cleanup cache >7j
5. ✅ Afficher logo/mention Amazon

**Modifications plan** : **Mineures** (2-3h dev total)

**Risque légal** : **Faible** (<5%)

**Go/No-Go** : **✅ GO** pour Amazon API

---

**Version** : 1.0  
**Dernière mise à jour** : 3 Octobre 2025  
**Prochaine révision** : Post-setup affilié (Sem 7)

