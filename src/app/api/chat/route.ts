import { NextRequest, NextResponse } from 'next/server'
import { createOpenAIClient, CHAT_MODEL } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      messages: { role: 'user' | 'assistant' | 'system', content: string }[]
      analysis: Record<string, unknown>
      questionnaire?: Record<string, unknown>
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
    }

    const openai = createOpenAIClient()

    const systemPrompt = `Tu es l'assistant DermAI (Derma AI Vision 3.0).
Objectif: répondre UNIQUEMENT aux questions liées au diagnostic, aux scores et aux recommandations affichées à l'utilisateur.
Style: clair, empathique, professionnel. Pas de jargon. Si hors sujet, expliquer poliment que tu es dédié au diagnostic en cours.`

    const essentialContext = {
      diagnostic: body.analysis?.diagnostic || null,
      scores: body.analysis?.scores || null,
      recommendations: {
        routine: body.analysis?.recommendations?.routine || null,
        products: (body.analysis as any)?.recommendations?.products?.slice?.(0, 3) || null
      },
      userProfile: {
        age: (body.questionnaire as any)?.userProfile?.age || null,
        gender: (body.questionnaire as any)?.userProfile?.gender || null,
        skinType: (body.questionnaire as any)?.userProfile?.skinType || null
      },
      allergies: (body.questionnaire as any)?.allergies?.ingredients || null
    }
    
    const contextPrompt = `CONTEXTE ANALYSE:\n${JSON.stringify(essentialContext, null, 2)}`

    const recentMessages = body.messages.slice(-6)
    
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: contextPrompt },
        ...recentMessages,
      ],
      max_tokens: 400,
    })

    const text = response.choices?.[0]?.message?.content?.trim()
    return NextResponse.json({ reply: text || 'Je n’ai pas pu générer de réponse pour le moment.' })

  } catch (error) {
    console.error('Erreur API /chat:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 })
}


