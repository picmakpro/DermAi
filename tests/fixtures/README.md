# Fixtures de Test DermAI V2

Ce dossier contient les fichiers de test nécessaires pour les tests E2E.

## Images de Test

### test-face.jpg
Image de visage de test pour valider le parcours d'upload et d'analyse.
- Résolution : 800x600
- Format : JPEG
- Taille : ~50KB

### large-image.jpg  
Image volontairement trop volumineuse pour tester la gestion d'erreurs d'upload.
- Résolution : 4000x3000
- Format : JPEG
- Taille : ~2MB

## Génération Automatique

Les images de test sont générées automatiquement par les tests si elles n'existent pas, en utilisant Canvas API pour créer des images synthétiques.

## Usage

Ces fixtures sont utilisées par :
- `tests/e2e/user-journey.spec.ts` - Tests du parcours utilisateur
- `tests/e2e/performance.spec.ts` - Tests de performance et charge

## Sécurité

Aucune image réelle de visage n'est stockée dans ce dossier pour des raisons de confidentialité. Toutes les images sont générées synthétiquement.