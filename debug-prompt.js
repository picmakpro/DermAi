// Script de debug pour tester le prompt V2.1
const { getPromptForAttempt } = require('./dist/services/ai/core/prompts/diagnosticPur.js');

console.log('=== TEST PROMPT V2.1 ===');

const { systemPrompt, userPromptBuilder } = getPromptForAttempt(1);

console.log('\n=== SYSTEM PROMPT ===');
console.log(systemPrompt.substring(0, 500) + '...');

console.log('\n=== USER PROMPT ===');
const photos = [
  { url: 'test1.jpg', type: 'Face' },
  { url: 'test2.jpg', type: 'Profile' }
];
const userPrompt = userPromptBuilder(photos);
console.log(userPrompt);

console.log('\n=== VALIDATION CHECKS ===');
console.log('✓ Contient "intensity = légère OU modérée OU intense":', systemPrompt.includes('intensity = "légère" OU "modérée" OU "intense"'));
console.log('✓ Contient "skinType = Sèche|Normale|Mixte":', systemPrompt.includes('skinType = Sèche|Normale|Mixte'));
console.log('✓ Contient "VALIDATION FINALE OBLIGATOIRE":', systemPrompt.includes('VALIDATION FINALE OBLIGATOIRE'));
console.log('✓ User prompt contient "OBLIGATOIRE: intensity":', userPrompt.includes('OBLIGATOIRE: intensity'));

