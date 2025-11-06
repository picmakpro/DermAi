import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createOpenAIClient } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

interface CoachContext {
  hasRecentAnalysis: boolean
  currentProducts: string[]
  routineStreak: number
}

interface CoachRequest {
  message: string
  context: CoachContext
}

// POST /api/coach/chat - Envoyer un message au coach IA
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body: CoachRequest = await request.json()
    const { message, context } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Message requis' 
      }, { status: 400 })
    }

    // Construire le contexte utilisateur
    const userContext = await buildUserContext(session.user.id)
    
    // Générer la réponse avec GPT-4o
    const response = await generateCoachResponse(message, userContext)
    
    // Sauvegarder la conversation
    await saveConversation(session.user.id, message, response.content)
    
    return NextResponse.json({
      content: response.content,
      suggestions: response.suggestions || [],
      contextUsed: response.contextUsed || []
    })

  } catch (error) {
    console.error('Erreur API coach chat:', error)
    
    // Fallback sur réponse pré-écrite
    const fallbackResponse = getFallbackResponse(body?.message || '')
    
    return NextResponse.json({
      content: fallbackResponse.content,
      suggestions: fallbackResponse.suggestions || [],
      contextUsed: ['fallback']
    })
  }
}

// Construire contexte utilisateur intelligent
async function buildUserContext(userId: string) {
  try {
    const [profile, lastAnalysis, routineStats] = await Promise.all([
      getUserProfile(userId),
      getLastAnalysis(userId),
      getRoutineStats(userId)
    ])
    
    return {
      skinProfile: {
        type: profile?.skin_type || 'unknown',
        age: profile?.birth_year ? new Date().getFullYear() - profile.birth_year : null,
        concerns: profile?.concerns || []
      },
      currentState: {
        lastAnalysisDate: lastAnalysis?.created_at,
        globalScore: lastAnalysis?.analysis_data?.globalScore,
        mainIssues: lastAnalysis?.analysis_data?.mainConcerns || []
      },
      routineAdherence: {
        currentStreak: routineStats?.currentStreak || 0,
        completionRate: routineStats?.completionRate || 0,
        missedDays: routineStats?.recentMissedDays || 0
      }
    }
  } catch (error) {
    console.error('Erreur construction contexte:', error)
    return {
      skinProfile: { type: 'unknown', age: null, concerns: [] },
      currentState: { lastAnalysisDate: null, globalScore: null, mainIssues: [] },
      routineAdherence: { currentStreak: 0, completionRate: 0, missedDays: 0 }
    }
  }
}

// Générer réponse coach avec GPT-4o
async function generateCoachResponse(message: string, context: any) {
  const systemPrompt = `Tu es un coach IA spécialisé en soins de la peau pour DermAI. 
Tu es bienveillant, éducatif et personnalisé dans tes réponses.

CONTEXTE UTILISATEUR:
${JSON.stringify(context, null, 2)}

RÈGLES:
1. Réponses courtes et actionables (max 150 mots)
2. Toujours personnaliser selon le profil
3. Suggérer des produits du catalogue si pertinent
4. Être encourageant sur les progrès
5. Ne jamais donner de conseil médical
6. Utiliser un ton bienveillant et motivant

CAPACITÉS:
- Expliquer les routines et leur logique
- Suggérer des ajustements selon l'évolution
- Motiver pour la régularité
- Répondre aux questions sur les produits
- Donner des tips personnalisés`
    
  try {
    const openai = createOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 300
    })
    
    const responseContent = completion.choices[0].message.content || ''
    
    // Extraire suggestions produits si mentionnées
    const suggestions = await extractProductSuggestions(responseContent)
    
    return {
      content: responseContent,
      suggestions,
      contextUsed: Object.keys(context)
    }
  } catch (error) {
    console.error('Erreur génération réponse coach:', error)
    throw error
  }
}

// Extraire produits mentionnés
async function extractProductSuggestions(content: string) {
  try {
    // Rechercher mentions de produits dans le texte
    const productMentions = content.match(/\b(sérum|crème|nettoyant|masque|lotion|huile|gel|mousse)\b/gi) || []
    
    if (productMentions.length === 0) return []
    
    // Rechercher dans catalogue (simulation - à adapter selon votre catalogue)
    const suggestions = []
    for (const mention of productMentions.slice(0, 2)) { // Max 2 suggestions
      // Ici vous pouvez intégrer votre logique de recherche produits
      // Pour l'instant, on retourne des exemples
      suggestions.push({
        id: `product-${Date.now()}`,
        name: `${mention} recommandé`,
        brand: 'DermAI Selection',
        category: mention.toLowerCase(),
        affiliate_link: '#'
      })
    }
    
    return suggestions.slice(0, 3) // Max 3 suggestions
  } catch (error) {
    console.error('Erreur extraction produits:', error)
    return []
  }
}

// Réponses fallback par catégorie
function getFallbackResponse(message: string) {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('routine')) {
    return {
      content: "Pour une routine efficace, la régularité est clé ! Appliquez vos produits matin et soir dans l'ordre : nettoyant, sérum, crème. N'oubliez pas la protection solaire le matin.",
      suggestions: []
    }
  }
  
  if (lowerMessage.includes('produit')) {
    return {
      content: "Chaque produit a son rôle : le nettoyant purifie, le sérum traite en profondeur, la crème hydrate et protège. Choisissez selon vos besoins spécifiques.",
      suggestions: []
    }
  }
  
  if (lowerMessage.includes('peau')) {
    return {
      content: "Votre peau est unique ! Observez comment elle réagit aux produits et ajustez votre routine. La patience est importante : les résultats apparaissent après 4-6 semaines.",
      suggestions: []
    }
  }
  
  return {
    content: "Je suis temporairement limité dans mes réponses. Pour des conseils personnalisés, consultez votre historique d'analyses ou vos étagères produits.",
    suggestions: []
  }
}

// Helpers pour récupérer les données utilisateur
async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('skin_type, birth_year, concerns')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur récupération profil:', error)
    return null
  }
}

async function getLastAnalysis(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_analyses')
      .select('created_at, analysis_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur récupération dernière analyse:', error)
    return null
  }
}

async function getRoutineStats(userId: string) {
  try {
    // Simulation des stats de routine - à adapter selon votre implémentation
    return {
      currentStreak: 7,
      completionRate: 85,
      recentMissedDays: 2
    }
  } catch (error) {
    console.error('Erreur récupération stats routine:', error)
    return {
      currentStreak: 0,
      completionRate: 0,
      recentMissedDays: 0
    }
  }
}

// Sauvegarder conversation
async function saveConversation(userId: string, userMessage: string, assistantResponse: string) {
  try {
    // Pour l'instant, on log juste - vous pouvez implémenter la sauvegarde en base
    console.log('Conversation sauvegardée:', {
      userId,
      userMessage: userMessage.substring(0, 50) + '...',
      assistantResponse: assistantResponse.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erreur sauvegarde conversation:', error)
  }
}
