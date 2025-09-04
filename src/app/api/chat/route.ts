import { NextRequest, NextResponse } from 'next/server'
import { createOpenAIClient, CHAT_MODEL } from '@/lib/openai'
import type { SkinAnalysis, AnalyzeRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    interface ChatRequestBody {
      messages: { role: 'user' | 'assistant' | 'system', content: string }[]
      analysis: SkinAnalysis
      questionnaire?: AnalyzeRequest
    }
    
    const body = await request.json() as ChatRequestBody

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const openai = createOpenAIClient()

    const systemPrompt = `You are the Derma AI assistant.
Objective: respond ONLY to questions related to the assessment, scores and recommendations displayed to the user.
Behavior:
- Clear, empathetic, professional style.
- No unnecessary technical jargon.
- If the question is off-topic (e.g.: news, personal topics, technical), politely respond that you are dedicated to the current assessment.
- If a recommendation contains an ingredient listed as an allergy, suggest an alternative.
- Don't invent data absent from the provided results.
`

    // Create an optimized context with only essential information
    const essentialContext = {
      beautyAssessment: body.analysis?.beautyAssessment || null,
      scores: body.analysis?.scores || null,
      recommendations: {
        routine: body.analysis?.recommendations?.routine || null,
        products: body.analysis?.recommendations?.products?.slice(0, 3) || null // Limit to 3 products
      },
      userProfile: {
        age: body.questionnaire?.userProfile?.age || null,
        gender: body.questionnaire?.userProfile?.gender || null,
        skinType: body.questionnaire?.userProfile?.skinType || null
      },
      allergies: body.questionnaire?.allergies?.ingredients || null
    }
    
    const contextPrompt = `ANALYSIS CONTEXT:\n${JSON.stringify(essentialContext, null, 2)}`

    // Limit message history to avoid too many tokens
    const recentMessages = body.messages.slice(-6) // Keep only the last 6 messages
    
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: contextPrompt },
        ...recentMessages,
      ],
      max_tokens: 400, // Also reduce response size
    })

    const text = response.choices[0]?.message?.content ?? 'Sorry, I couldn\'t formulate a response.'
    return NextResponse.json({ reply: text })

  } catch (error) {
    console.error('API error /chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}


