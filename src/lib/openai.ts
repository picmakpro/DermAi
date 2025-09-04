import OpenAI from 'openai'

// This function is called server-side only
export function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required')
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// GPT-4o model with built-in vision capabilities
export const ANALYSIS_MODEL = 'gpt-4o'
export const CHAT_MODEL = 'gpt-4o'
