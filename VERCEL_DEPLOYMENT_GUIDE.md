# 🚀 Guide de Déploiement Vercel - DermAI V2

## 🐛 **PROBLÈME IDENTIFIÉ**

**Erreur :** "The string did not match the expected pattern"  
**Cause :** Problème de configuration Vercel ou API OpenAI

---

## 🔧 **ÉTAPES DE DIAGNOSTIC**

### **1. Tester l'API de diagnostic**
```bash
# Accéder à l'endpoint de test
https://votre-app.vercel.app/api/test
```

### **2. Vérifier les variables d'environnement Vercel**
Dans le dashboard Vercel :
1. Aller dans **Settings** → **Environment Variables**
2. Vérifier que `OPENAI_API_KEY` est bien définie
3. S'assurer qu'elle commence par `sk-`

### **3. Variables d'environnement requises**
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NODE_ENV=production
```

---

## 🚨 **CAUSES POSSIBLES & SOLUTIONS**

### **🔑 1. Clé API OpenAI manquante/incorrecte**
**Symptômes :** Erreur dès le début de l'analyse
**Solution :**
```bash
# Vérifier la clé dans Vercel Dashboard
# Redéployer après modification
vercel --prod
```

### **⏱️ 2. Timeout de fonction serverless**
**Symptômes :** Analyse qui traîne puis erreur
**Solution :** Ajouter dans `vercel.json` :
```json
{
  "functions": {
    "src/app/api/analyze/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### **📦 3. Taille d'image trop importante**
**Symptômes :** "expected pattern" après envoi image
**Solution :** Compression côté client :
```typescript
// Dans PhotoUploadZone.tsx - Réduire la qualité
canvas.toDataURL('image/jpeg', 0.7) // Au lieu de 0.9
```

### **🌐 4. Problème de région Vercel**
**Symptômes :** Timeouts réseau intermittents
**Solution :** Forcer la région US East :
```json
// vercel.json
{
  "functions": {
    "src/app/api/*/route.ts": {
      "regions": ["iad1"]
    }
  }
}
```

### **🔄 5. Limite de taux OpenAI**
**Symptômes :** Erreur après plusieurs tentatives
**Solution :** Augmenter les limites dans OpenAI Dashboard

---

## 🛠️ **CONFIGURATION VERCEL OPTIMISÉE**

### **vercel.json mis à jour**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "functions": {
    "src/app/api/analyze/route.ts": {
      "maxDuration": 30,
      "regions": ["iad1"]
    },
    "src/app/api/chat/route.ts": {
      "maxDuration": 15,
      "regions": ["iad1"]
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/$1"
    }
  ]
}
```

---

## 🧪 **TESTS DE VALIDATION**

### **1. Test des variables d'environnement**
```bash
curl https://votre-app.vercel.app/api/test
```

### **2. Test avec image légère**
- Utiliser une image < 500KB
- Format JPEG de préférence
- Résolution 800x600 max

### **3. Monitoring des logs**
```bash
# Vercel CLI pour voir les logs en temps réel
vercel logs --follow
```

---

## 🔍 **DEBUGGING EN PRODUCTION**

### **Console logs Vercel**
Les `console.log` sont visibles dans :
1. Vercel Dashboard → Functions → View Function Logs
2. Via Vercel CLI : `vercel logs`

### **Messages d'erreur améliorés**
Le service inclut maintenant des diagnostics spécifiques :
- ✅ Configuration OpenAI
- ✅ Problèmes réseau  
- ✅ Timeouts
- ✅ Parsing JSON
- ✅ Limites de taux

---

## 🚀 **DÉPLOIEMENT RECOMMANDÉ**

```bash
# 1. Build local pour vérifier
npm run build

# 2. Test avec Vercel CLI
vercel dev

# 3. Déploiement preview
vercel

# 4. Déploiement production  
vercel --prod

# 5. Test immédiat
curl https://votre-app.vercel.app/api/test
```

---

## 📞 **SUPPORT**

Si le problème persiste :
1. Vérifier `/api/test` pour diagnostics
2. Consulter les logs Vercel
3. Tester avec image plus petite
4. Vérifier quota OpenAI

**Note :** Le fonctionnement en localhost vs Vercel diffère principalement par :
- Variables d'environnement
- Timeouts de fonction
- Région de déploiement
- Compression réseau
