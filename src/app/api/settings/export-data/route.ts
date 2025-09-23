import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/settings/export-data - Exporter toutes les données utilisateur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = session.user.id

    // Récupérer toutes les données utilisateur
    const [
      profileResult,
      analysesResult,
      routineCompletionsResult,
      shelvesResult
    ] = await Promise.all([
      // Profil utilisateur
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      
      // Analyses
      supabase
        .from('user_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      
      // Complétions de routine
      supabase
        .from('routine_completions')
        .select('*')
        .eq('user_id', userId)
        .order('completion_date', { ascending: false }),
      
      // Étagères produits
      supabase
        .from('user_product_shelves')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ])

    // Vérifier les erreurs
    if (profileResult.error) {
      console.error('Erreur récupération profil:', profileResult.error)
      return NextResponse.json({ error: 'Erreur récupération données' }, { status: 500 })
    }

    // Construire l'export de données
    const exportData = {
      export_info: {
        user_id: userId,
        export_date: new Date().toISOString(),
        version: '1.0',
        description: 'Export complet des données DermAI'
      },
      profile: {
        ...profileResult.data,
        // Exclure les champs sensibles
        id: undefined,
        created_at: profileResult.data.created_at,
        updated_at: profileResult.data.updated_at
      },
      analyses: {
        count: analysesResult.data?.length || 0,
        data: analysesResult.data?.map(analysis => ({
          id: analysis.id,
          created_at: analysis.created_at,
          analysis_data: analysis.analysis_data,
          photos_metadata: analysis.photos_metadata,
          questionnaire_data: analysis.questionnaire_data
        })) || []
      },
      routine_completions: {
        count: routineCompletionsResult.data?.length || 0,
        data: routineCompletionsResult.data?.map(completion => ({
          completion_date: completion.completion_date,
          phase: completion.phase,
          completed: completion.completed,
          products_used: completion.products_used,
          notes: completion.notes,
          created_at: completion.created_at
        })) || []
      },
      product_shelves: {
        count: shelvesResult.data?.length || 0,
        data: shelvesResult.data?.map(shelf => ({
          shelf_name: shelf.shelf_name,
          shelf_type: shelf.shelf_type,
          products: shelf.products,
          created_at: shelf.created_at,
          updated_at: shelf.updated_at
        })) || []
      },
      statistics: {
        total_analyses: analysesResult.data?.length || 0,
        total_routine_days: routineCompletionsResult.data?.length || 0,
        total_shelves: shelvesResult.data?.length || 0,
        account_age_days: profileResult.data?.created_at 
          ? Math.floor((new Date().getTime() - new Date(profileResult.data.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0
      }
    }

    // Créer la réponse JSON
    const jsonData = JSON.stringify(exportData, null, 2)
    const buffer = Buffer.from(jsonData, 'utf-8')

    // Headers pour le téléchargement
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set('Content-Disposition', `attachment; filename="dermai-export-${new Date().toISOString().split('T')[0]}.json"`)
    headers.set('Content-Length', buffer.length.toString())

    return new NextResponse(buffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Erreur API export data:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}


