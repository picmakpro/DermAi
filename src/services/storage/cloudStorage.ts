// ⚠️ ATTENTION: Ce service doit UNIQUEMENT être utilisé côté serveur (API routes)
// Les clés service role ne doivent JAMAIS être exposées côté client

import type { UserAnalysis } from '@/lib/supabase'
import type { SkinAnalysis } from '@/types'

export class CloudStorageService {
  // ⚠️ IMPORTANT: Toutes ces méthodes nécessitent supabaseAdmin
  // Elles doivent être appelées UNIQUEMENT depuis les API routes côté serveur
  
  // Sauvegarder analyse en cloud
  static async saveAnalysis(
    userId: string, 
    analysis: SkinAnalysis,
    options: {
      migrated_from_local?: boolean
      source?: string
    } = {}
  ): Promise<UserAnalysis> {
    // Import dynamique côté serveur uniquement
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    
    const { data, error } = await supabaseAdmin
      .from('user_analyses')
      .insert({
        user_id: userId,
        analysis_data: analysis,
        photos_metadata: analysis.photos || [],
        source: options.source || 'web',
        version: '2.0',
        migrated_from_local: options.migrated_from_local || false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Récupérer analyses utilisateur
  static async getUserAnalyses(
    userId: string,
    options: {
      limit?: number
      offset?: number
      includeDeleted?: boolean
    } = {}
  ): Promise<UserAnalysis[]> {
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    
    let query = supabaseAdmin
      .from('user_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!options.includeDeleted) {
      query = query.is('deleted_at', null)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Supprimer analyse (soft delete)
  static async deleteAnalysis(
    userId: string, 
    analysisId: string
  ): Promise<void> {
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    
    const { error } = await supabaseAdmin
      .from('user_analyses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', analysisId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Upload photo vers Supabase Storage
  static async uploadPhoto(
    userId: string, 
    photoBlob: Blob, 
    filename: string
  ): Promise<string> {
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    
    const filePath = `${userId}/${Date.now()}-${filename}`
    
    const { data, error } = await supabaseAdmin.storage
      .from('user-photos')
      .upload(filePath, photoBlob)

    if (error) throw error

    // Récupérer URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from('user-photos')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  }

  // Générer token de partage
  static async generateShareToken(
    userId: string, 
    analysisId: string
  ): Promise<string> {
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    
    const shareToken = crypto.randomUUID()
    
    const { error } = await supabaseAdmin
      .from('user_analyses')
      .update({ 
        share_token: shareToken,
        shared_publicly: true 
      })
      .eq('id', analysisId)
      .eq('user_id', userId)

    if (error) throw error
    return shareToken
  }

  // Récupérer analyse par token de partage
  static async getAnalysisByShareToken(shareToken: string): Promise<UserAnalysis | null> {
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    
    const { data, error } = await supabaseAdmin
      .from('user_analyses')
      .select('*')
      .eq('share_token', shareToken)
      .eq('shared_publicly', true)
      .is('deleted_at', null)
      .single()

    if (error) return null
    return data
  }

  // Mettre à jour analyse
  static async updateAnalysis(
    userId: string,
    analysisId: string,
    updates: Partial<Pick<UserAnalysis, 'analysis_data' | 'photos_metadata' | 'shared_publicly'>>
  ): Promise<UserAnalysis> {
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    
    const { data, error } = await supabaseAdmin
      .from('user_analyses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Compter les analyses d'un utilisateur
  static async getUserAnalysesCount(userId: string): Promise<number> {
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    
    const { count, error } = await supabaseAdmin
      .from('user_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (error) throw error
    return count || 0
  }

  // Récupérer la dernière analyse d'un utilisateur
  static async getLatestAnalysis(userId: string): Promise<UserAnalysis | null> {
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    
    const { data, error } = await supabaseAdmin
      .from('user_analyses')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) return null
    return data
  }
}
