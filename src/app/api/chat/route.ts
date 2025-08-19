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

    // Créer un contexte optimisé avec seulement les infos essentielles
    const essentialContext = {
      diagnostic: body.analysis?.diagnostic || null,
      scores: body.analysis?.scores || null,
      recommendations: {
        routine: body.analysis?.recommendations?.routine || null,
        products: body.analysis?.recommendations?.products?.slice(0, 3) || null // Limiter à 3 produits
      },
      userProfile: {
        age: body.questionnaire?.userProfile?.age || null,
        gender: body.questionnaire?.userProfile?.gender || null,
        skinType: body.questionnaire?.userProfile?.skinType || null
      },
      allergies: body.questionnaire?.allergies?.ingredients || null
    }
    
    const contextPrompt = `CONTEXTE ANALYSE:\n${JSON.stringify(essentialContext, null, 2)}`

    // Limiter l'historique des messages pour éviter trop de tokens
    const recentMessages = body.messages.slice(-6) // Garder seulement les 6 derniers messages
    
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: contextPrompt },
        ...recentMessages,
      ],
      max_tokens: 400, // Réduire aussi la taille de la réponse
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


