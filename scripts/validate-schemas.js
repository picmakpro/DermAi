/**
 * Validation simple des schémas Zod pour le script de test Sprint 1
 */

// Test simple de génération de seed déterministe
function hashImage(base64Data) {
  const sample = base64Data.slice(0, 100) + base64Data.slice(-100)
  let hash = 0
  
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return Math.abs(hash).toString(36)
}

function generateSeed(imageHashes) {
  const combined = imageHashes.sort().join('')
  let hash = 0
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return Math.abs(hash) || 1
}

// Test de reproductibilité
function testReproducibility() {
  const testImages = ['img1', 'img2']
  const hashes = testImages.map(hashImage)
  
  const seed1 = generateSeed(hashes)
  const seed2 = generateSeed(hashes)
  const seed3 = generateSeed(hashes)
  
  return {
    success: seed1 === seed2 && seed2 === seed3,
    seed: seed1,
    reproducible: seed1 === seed2 && seed2 === seed3
  }
}

module.exports = {
  testReproducibility,
  hashImage,
  generateSeed
}
