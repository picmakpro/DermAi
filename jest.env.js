/**
 * Variables d'environnement pour les tests Jest - Sprint 1
 */

// Variables d'environnement de test
process.env.NODE_ENV = 'test'
process.env.OPENAI_API_KEY = 'sk-test-key-for-jest-mocking-do-not-use-in-production'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Configuration pour éviter les warnings de dépendances
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true'
