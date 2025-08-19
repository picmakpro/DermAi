import { NextRequest, NextResponse } from 'next/server'
import { createOpenAIClient, CHAT_MODEL } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      messages: { role: 'user' | 'assistant' | 'system', content: string }[]
      analysis: any
      questionnaire?: any
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
    }

    const openai = createOpenAIClient()

    const systemPrompt = `Tu es l'assistant Derma AI.
Objectif: répondre UNIQUEMENT aux questions liées au diagnostic, aux scores et aux recommandations affichées à l'utilisateur.
Comportement:
- Style clair, empathique, professionnel.
- Pas de jargon technique inutile.
- Si la question est hors sujet (ex: actualités, sujets personnels, technique), réponds poliment que tu es dédié au diagnostic en cours.
- Si une recommandation comporte un ingrédient listé en allergie, propose une alternative.
- N'invente pas des données absentes du résultat fourni.
`

    const contextPrompt = `CONTEXTE ANALYSE (JSON):\n${JSON.stringify({ analysis: body.analysis, questionnaire: body.questionnaire ?? null })}`

    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: contextPrompt },
        ...body.messages,
      ],
      max_tokens: 600,
    })

    const text = response.choices[0]?.message?.content ?? 'Désolé, je n’ai pas pu formuler une réponse.'
    return NextResponse.json({ reply: text })

  } catch (error) {
    console.error('Erreur API /chat:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 })
}


