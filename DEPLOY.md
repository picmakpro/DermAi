# 🚀 Guide de déploiement DermAI sur Vercel

## Prérequis
- Compte Vercel (gratuit)
- Clé API OpenAI
- Git repository sur GitHub/GitLab

## Étapes de déploiement

### 1. Préparer le repository
```bash
git add .
git commit -m "Configuration pour déploiement Vercel"
git push origin main
```

### 2. Connecter à Vercel
1. Aller sur [vercel.com](https://vercel.com)
2. Se connecter avec GitHub/GitLab
3. Cliquer sur "New Project"
4. Importer le repository `dermai-v2`

### 3. Configuration des variables d'environnement
Dans le dashboard Vercel, aller dans Settings > Environment Variables et ajouter :

**Variables obligatoires :**
- `OPENAI_API_KEY` = `sk-votre-cle-openai`
- `NEXT_PUBLIC_APP_URL` = `https://votre-app.vercel.app`
- `NODE_ENV` = `production`

**Variables optionnelles (pour les recommandations de produits) :**
- `SEPHORA_API_KEY`
- `DOUGLAS_API_KEY`
- `AMAZON_ACCESS_KEY`
- `AMAZON_SECRET_KEY`
- `AMAZON_ASSOCIATE_TAG`

### 4. Déployer
1. Cliquer sur "Deploy"
2. Attendre la construction (~2-3 minutes)
3. Votre app sera disponible sur l'URL fournie

## Vérifications post-déploiement

### ✅ Tests à effectuer
- [ ] Page d'accueil se charge
- [ ] Upload de photos fonctionne
- [ ] Questionnaire se remplit
- [ ] Analyse IA fonctionne (avec photo test)
- [ ] Chat assistant répond
- [ ] Pas d'erreurs dans les logs

### 🔧 Résolution de problèmes

**Erreur "OPENAI_API_KEY is required"**
→ Vérifier que la variable d'environnement est bien configurée

**Erreur 500 sur /api/analyze**
→ Vérifier les logs Vercel, souvent lié à OpenAI API

**Images ne se chargent pas**
→ Vérifier la configuration next.config.ts

## 📊 Monitoring

- **Logs**: Dashboard Vercel > Functions
- **Performance**: Dashboard Vercel > Analytics
- **Erreurs**: Dashboard Vercel > Functions > View Function Logs

## 🎯 Optimisations post-déploiement

1. **Domaine personnalisé** : Settings > Domains
2. **Analytics** : Activer Vercel Analytics
3. **Cache** : Optimiser les headers de cache
4. **Images** : Utiliser Vercel Image Optimization

---

**Support** : Si vous rencontrez des problèmes, vérifiez d'abord les logs Vercel.
