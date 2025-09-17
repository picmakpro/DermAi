/** @type {import('jest').Config} */
const config = {
  // Environnement de test
  testEnvironment: 'jsdom',
  
  // Extensions de fichiers à traiter
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transformation des fichiers
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      jsx: 'react-jsx'
    }]
  },
  
  // Ignorer les transformations pour les modules JS
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  
  // Résolution des modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
  },
  
  // Fichiers de setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Patterns de test
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/tests/**/*.(test|spec).(ts|tsx|js)'
  ],
  
  // Couverture de code
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ],
  
  // Seuils de couverture pour Sprint 1
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // Seuils spécifiques pour services critiques
    'src/services/ai/analysis.service.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    'src/schemas/index.ts': {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95
    }
  },
  
  // Ignorer certains fichiers
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/' // Tests Playwright séparés
  ],
  
  // Variables d'environnement pour les tests
  setupFiles: ['<rootDir>/jest.env.js'],
  
  // Timeout pour les tests (Sprint 1: cohérence avec timeouts API)
  testTimeout: 35000,
  
  // Verbose pour debugging Sprint 1
  verbose: true,
  
  // Reporters pour CI/CD
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ]
}

module.exports = config
