import OpenAI from 'openai'

// Client OpenAI (backend uniquement)
export function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

// Alias internes pour les modèles utilisés par DermAI Vision 3.0
export const ANALYSIS_MODEL = 'gpt-4o'
export const CHAT_MODEL = 'gpt-4o'
