# 🚨 CORRECTION URGENTE GOOGLE OAUTH

## 🔍 **PROBLÈME IDENTIFIÉ**
- ✅ Email/Password fonctionne (utilisateur créé dans Supabase)
- ❌ Google OAuth en boucle infinie → `/auth/signin`
- ❌ Erreur `invalid_client (Unauthorized)`

## 🔧 **SOLUTION ÉTAPE PAR ÉTAPE**

### **ÉTAPE 1 : Google Cloud Console (CRITIQUE)**

1. **Aller sur :** https://console.cloud.google.com/
2. **Sélectionner :** Votre projet DermAI
3. **Naviguer :** APIs & Services → Credentials
4. **Cliquer :** Sur votre OAuth 2.0 Client ID

### **ÉTAPE 2 : Vérifier/Corriger les URLs**

**Dans "Authorized JavaScript origins" :**
```
http://localhost:3000
```

**Dans "Authorized redirect URIs" :**
```
http://localhost:3000/api/auth/callback/google
```

⚠️ **POINTS CRITIQUES :**
- Pas de slash final `/`
- Exactement `http://` (pas `https://`)
- Port `3000` correct
- Pas d'espaces avant/après

### **ÉTAPE 3 : Sauvegarder et Attendre**
- Cliquer "SAVE" / "ENREGISTRER"
- **Attendre 5-10 minutes** pour la propagation

### **ÉTAPE 4 : Vérifier les APIs Activées**

Dans Google Cloud Console :
1. **APIs & Services → Library**
2. Rechercher "Google+ API" ou "People API"
3. **S'assurer qu'elle est ACTIVÉE**

## 🧪 **TEST IMMÉDIAT**

### **1. Redémarrer le serveur :**
```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

### **2. Tester Google OAuth :**
1. Aller sur `http://localhost:3000/auth/signin`
2. Cliquer "Continuer avec Google"
3. **Résultat attendu :** Pas de boucle, connexion réussie

### **3. Vérifier les logs :**
```bash
# Logs de succès attendus :
✅ Google user créé avec succès: [USER_ID]
NextAuth Debug: OAUTH_CALLBACK_SUCCESS
```

## 🔍 **SI LE PROBLÈME PERSISTE**

### **Option A : Régénérer les Credentials**
1. Dans Google Cloud Console
2. Supprimer l'OAuth Client ID actuel
3. En créer un nouveau
4. Mettre à jour `.env.local`

### **Option B : Vérifier le Projet Google**
1. S'assurer d'être dans le bon projet Google Cloud
2. Vérifier que le projet n'est pas suspendu
3. Vérifier les quotas et limites

### **Option C : Test avec un autre compte**
- Tester avec un autre compte Google
- Vérifier si le problème est spécifique à un utilisateur

## 📊 **DIAGNOSTIC AVANCÉ**

Si le problème persiste, lancer :
```bash
node scripts/test-google-oauth.js
```

Et vérifier dans les logs NextAuth :
- `NextAuth Error:` → Configuration incorrecte
- `OAUTH_CALLBACK_ERROR` → Problème Google Cloud
- `invalid_client` → Credentials incorrects

## 🎯 **RÉSULTAT ATTENDU**

Après correction :
- ✅ Google OAuth fonctionne sans boucle
- ✅ Utilisateur Google créé dans Supabase
- ✅ Session persistée correctement
- ✅ Redirection vers dashboard (ou page configurée)

---

**⏰ TEMPS ESTIMÉ :** 10-15 minutes (+ 5-10 min propagation Google)
**🎯 PRIORITÉ :** CRITIQUE - Bloque la Phase 1
