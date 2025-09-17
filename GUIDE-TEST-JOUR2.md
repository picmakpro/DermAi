# 🧪 GUIDE DE TEST - Configuration NextAuth.js (Jour 2)

## 📋 TESTS À FAIRE DE VOTRE CÔTÉ

### **🚀 TEST 1 : Démarrage du Serveur**

**Commande à exécuter :**
```bash
npm run dev
```

**✅ Résultat attendu :**
```
▲ Next.js 15.4.6 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://192.168.1.111:3000
- Environments: .env.local  ← IMPORTANT: Doit apparaître
- Experiments (use with caution):
  · optimizePackageImports

✓ Starting...
✓ Ready in 2.8s
```

**❌ Si ça ne marche pas :**
- Vérifiez que `.env.local` existe dans le dossier racine
- Vérifiez qu'il n'y a pas d'erreurs de syntaxe dans `.env.local`

---

### **🔗 TEST 2 : Endpoints NextAuth**

**Gardez le serveur ouvert et dans un nouveau terminal :**

#### **2A. Test des Providers**
```bash
curl http://localhost:3000/api/auth/providers
```

**✅ Résultat attendu :**
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    "signinUrl": "http://localhost:3000/api/auth/signin/google",
    "callbackUrl": "http://localhost:3000/api/auth/callback/google"
  },
  "credentials": {
    "id": "credentials",
    "name": "email",
    "type": "credentials",
    "signinUrl": "http://localhost:3000/api/auth/signin/credentials",
    "callbackUrl": "http://localhost:3000/api/auth/callback/credentials"
  }
}
```

#### **2B. Test de la Session**
```bash
curl http://localhost:3000/api/auth/session
```

**✅ Résultat attendu :**
```json
{}
```
*(Vide car pas encore connecté)*

---

### **🌐 TEST 3 : Page de Connexion**

**Dans votre navigateur, allez sur :**
```
http://localhost:3000/auth/signin
```

**✅ Résultat attendu :**
- Page qui se charge sans erreur
- Titre : "Connectez-vous à DermAI"
- Bouton "Continuer avec Google" (peut être grisé si Google pas configuré)
- Bouton "Continuer en mode invité"
- Section Debug Info en bas avec :
  - Callback URL: /dashboard
  - Error: Aucune
  - Providers: google, credentials

**📱 Screenshot attendu :**
```
┌─────────────────────────────────────┐
│        Connectez-vous à DermAI      │
│   Accédez à votre historique       │
│         d'analyses                  │
│                                     │
│  [Continuer avec Google]            │
│                                     │
│     Continuer en mode invité        │
│                                     │
│  Debug Info:                        │
│  Callback URL: /dashboard           │
│  Error: Aucune                      │
│  Providers: google, credentials     │
└─────────────────────────────────────┘
```

---

### **🔍 TEST 4 : Vérification Console Navigateur**

**Dans la page `/auth/signin`, ouvrez la console (F12) :**

**✅ Résultat attendu :**
- Aucune erreur rouge
- Possibles warnings jaunes (normaux)
- Pas d'erreur de type "Failed to fetch" ou "Network error"

**❌ Erreurs possibles et solutions :**
- `Failed to fetch providers` → Variables d'environnement mal configurées
- `NEXTAUTH_URL is not set` → Ajouter `NEXTAUTH_URL=http://localhost:3000` dans `.env.local`

---

### **⚡ TEST 5 : Test Rapide Google OAuth (Optionnel)**

**Si vous voulez tester Google OAuth :**

1. Cliquez sur "Continuer avec Google"
2. **✅ Résultat attendu :** Redirection vers Google (même si erreur après)
3. **❌ Si erreur immédiate :** Variables Google mal configurées

---

## 🎯 RÉSUMÉ DES RÉSULTATS ATTENDUS

### **✅ TOUT FONCTIONNE SI :**
- [ ] Serveur démarre avec "Environments: .env.local"
- [ ] `/api/auth/providers` retourne Google + Credentials
- [ ] `/api/auth/session` retourne `{}`
- [ ] Page `/auth/signin` se charge avec le bon contenu
- [ ] Aucune erreur dans la console navigateur

### **🔧 À CORRIGER SI :**
- [ ] Serveur ne démarre pas → Problème de dépendances
- [ ] "Environments: .env.local" n'apparaît pas → Fichier `.env.local` mal placé
- [ ] Endpoints retournent des erreurs → Variables d'environnement incorrectes
- [ ] Page blanche ou erreur 500 → Problème de configuration NextAuth

---

## 🆘 COMMANDES DE DEBUG

**Si quelque chose ne marche pas :**

```bash
# Vérifier que .env.local existe
ls -la .env.local

# Vérifier le contenu (sans afficher les secrets)
head -5 .env.local

# Redémarrer proprement
npm run dev
```

---

## 📞 QUOI FAIRE APRÈS LES TESTS

**Envoyez-moi :**
1. ✅ ou ❌ pour chaque test
2. Captures d'écran de la page `/auth/signin`
3. Copie des erreurs si il y en a
4. Résultat de `curl http://localhost:3000/api/auth/providers`

**Ensuite nous pourrons passer au Jour 3 !** 🚀
