import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// DELETE /api/settings/delete-account - Supprimer définitivement le compte utilisateur
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = session.user.id

    // Supprimer toutes les données utilisateur dans l'ordre correct (foreign keys)
    const deletionSteps = [
      // 1. Supprimer les complétions de routine
      supabase
        .from('routine_completions')
        .delete()
        .eq('user_id', userId),
      
      // 2. Supprimer les étagères produits
      supabase
        .from('user_product_shelves')
        .delete()
        .eq('user_id', userId),
      
      // 3. Supprimer les badges utilisateur (si la table existe)
      supabase
        .from('user_badges')
        .delete()
        .eq('user_id', userId),
      
      // 4. Supprimer les conversations coach IA (si la table existe)
      supabase
        .from('ai_coach_conversations')
        .delete()
        .eq('user_id', userId),
      
      // 5. Supprimer les analyses utilisateur
      supabase
        .from('user_analyses')
        .delete()
        .eq('user_id', userId),
      
      // 6. Enfin, supprimer le profil utilisateur
      supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
    ]

    // Exécuter les suppressions en séquence
    for (const deletion of deletionSteps) {
      const { error } = await deletion
      if (error) {
        // Certaines tables peuvent ne pas exister encore, on continue
        console.warn('Erreur suppression (peut être normale):', error.message)
      }
    }

    // Supprimer les fichiers stockés (photos) si nécessaire
    try {
      const { data: files } = await supabase.storage
        .from('user-photos')
        .list(userId)
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`)
        await supabase.storage
          .from('user-photos')
          .remove(filePaths)
      }
    } catch (storageError) {
      console.warn('Erreur suppression fichiers:', storageError)
      // On continue même si la suppression des fichiers échoue
    }

    // Log de l'action pour audit
    console.log(`Compte utilisateur supprimé: ${userId} à ${new Date().toISOString()}`)

    return NextResponse.json({ 
      message: 'Compte supprimé avec succès',
      deleted_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erreur API delete account:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}








