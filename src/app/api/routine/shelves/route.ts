import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/routine/shelves - Récupérer les étagères utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // supabase est déjà importé

    const { data: shelves, error } = await supabase
      .from('user_product_shelves')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Erreur récupération shelves:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Enrichir avec les données d'analyse liée si applicable
    const enrichedShelves = await Promise.all(
      shelves.map(async (shelf) => {
        if (shelf.linked_analysis_id) {
          const { data: analysis } = await supabase
            .from('user_analyses')
            .select('created_at, analysis_data')
            .eq('id', shelf.linked_analysis_id)
            .single()

          return {
            ...shelf,
            linkedAnalysis: analysis
          }
        }
        return shelf
      })
    )

    return NextResponse.json({ shelves: enrichedShelves })

  } catch (error) {
    console.error('Erreur API shelves GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/routine/shelves - Créer une nouvelle étagère
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { shelf_name, shelf_type, linked_analysis_id, products } = body

    // Validation
    if (!shelf_name || !shelf_type) {
      return NextResponse.json({ 
        error: 'Nom et type d\'étagère requis' 
      }, { status: 400 })
    }

    if (!['custom', 'analysis_linked'].includes(shelf_type)) {
      return NextResponse.json({ 
        error: 'Type d\'étagère invalide' 
      }, { status: 400 })
    }

    // supabase est déjà importé

    // Calculer l'ordre d'affichage (dernier + 1)
    const { data: lastShelf } = await supabase
      .from('user_product_shelves')
      .select('display_order')
      .eq('user_id', session.user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const displayOrder = (lastShelf?.display_order || 0) + 1

    const { data: shelf, error } = await supabase
      .from('user_product_shelves')
      .insert({
        user_id: session.user.id,
        shelf_name,
        shelf_type,
        linked_analysis_id: linked_analysis_id || null,
        products: products || [],
        display_order: displayOrder
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création shelf:', error)
      return NextResponse.json({ error: 'Erreur création' }, { status: 500 })
    }

    return NextResponse.json({ shelf })

  } catch (error) {
    console.error('Erreur API shelves POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
