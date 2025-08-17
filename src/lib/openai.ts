import OpenAI from 'openai'

// Cette fonction sera appelée uniquement côté serveur
export function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required')
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// Modèle GPT-4o avec capacités vision intégrées
export const ANALYSIS_MODEL = 'gpt-4o'
export const CHAT_MODEL = 'gpt-4o'
