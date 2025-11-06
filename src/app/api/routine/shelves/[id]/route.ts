import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/routine/shelves/[id] - Récupérer une étagère spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // supabase est déjà importé

    const { data: shelf, error } = await supabase
      .from('user_product_shelves')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      console.error('Erreur récupération shelf:', error)
      return NextResponse.json({ error: 'Étagère non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ shelf })

  } catch (error) {
    console.error('Erreur API shelf GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/routine/shelves/[id] - Modifier une étagère
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { shelf_name, products, display_order } = body

    // supabase est déjà importé

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (shelf_name !== undefined) updateData.shelf_name = shelf_name
    if (products !== undefined) updateData.products = products
    if (display_order !== undefined) updateData.display_order = display_order

    const { data: shelf, error } = await supabase
      .from('user_product_shelves')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', session.user.id) // Sécurité
      .select()
      .single()

    if (error) {
      console.error('Erreur modification shelf:', error)
      return NextResponse.json({ error: 'Erreur modification' }, { status: 500 })
    }

    return NextResponse.json({ shelf })

  } catch (error) {
    console.error('Erreur API shelf PUT:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/routine/shelves/[id] - Supprimer une étagère
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // supabase est déjà importé

    // Soft delete (marquer comme inactive)
    const { error } = await supabase
      .from('user_product_shelves')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id) // Sécurité

    if (error) {
      console.error('Erreur suppression shelf:', error)
      return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur API shelf DELETE:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
