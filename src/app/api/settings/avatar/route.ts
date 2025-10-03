import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/settings/avatar - Upload et mise à jour de l'avatar utilisateur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Vérifications du fichier
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5MB)' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 })
    }

    const userId = session.user.id
    const fileExt = file.name.split('.').pop()
    const fileName = `avatar-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Erreur upload avatar:', uploadError)
      return NextResponse.json({ error: 'Erreur upload fichier' }, { status: 500 })
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('user-photos')
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Mettre à jour le profil avec la nouvelle URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Erreur mise à jour profil avatar:', updateError)
      // Supprimer le fichier uploadé en cas d'erreur
      await supabase.storage
        .from('user-photos')
        .remove([filePath])
      
      return NextResponse.json({ error: 'Erreur mise à jour profil' }, { status: 500 })
    }

    // Optionnel : supprimer l'ancien avatar si il existe
    try {
      const currentUser = session.user as any
      if (currentUser.image && currentUser.image.includes('supabase')) {
        // Extraire le chemin de l'ancienne image
        const oldPath = currentUser.image.split('/').slice(-2).join('/')
        await supabase.storage
          .from('user-photos')
          .remove([oldPath])
      }
    } catch (cleanupError) {
      // Erreur de nettoyage non critique
      console.warn('Erreur nettoyage ancien avatar:', cleanupError)
    }

    return NextResponse.json({ 
      avatar_url: avatarUrl,
      message: 'Avatar mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur API avatar upload:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}






