import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour DermAI V2
 * Tests E2E complets avec performance et responsive
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Configuration globale */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter configuration */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }]
  ],
  
  /* Configuration globale des tests */
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* Timeouts adaptés à l'analyse IA */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* Configuration serveur local */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /* Projets de test multi-navigateurs */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Tests mobile */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Tests tablette */
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  /* Dossiers de sortie */
  outputDir: 'test-results/e2e-artifacts',
  
  /* Configuration timeouts spécifiques DermAI */
  timeout: 60000, // 1 minute par test
  expect: {
    timeout: 10000, // 10s pour les assertions
  },
});
