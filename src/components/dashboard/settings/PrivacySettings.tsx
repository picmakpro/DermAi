'use client'

import { useState } from 'react'
import { Shield, Download, Trash2, AlertTriangle, FileText, Loader2 } from 'lucide-react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { toast } from 'sonner'

export function PrivacySettings() {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleExportData = async () => {
    setExportLoading(true)
    
    try {
      const response = await fetch('/api/settings/export-data', {
        method: 'POST'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dermai-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success('Données exportées avec succès')
      } else {
        throw new Error('Erreur export')
      }
    } catch (error) {
      console.error('Erreur export données:', error)
      toast.error('Erreur lors de l\'export des données')
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      toast.error('Veuillez taper SUPPRIMER pour confirmer')
      return
    }
    
    setDeleteLoading(true)
    
    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Compte supprimé. Vous allez être déconnecté.')
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } else {
        throw new Error('Erreur suppression')
      }
    } catch (error) {
      console.error('Erreur suppression compte:', error)
      toast.error('Erreur lors de la suppression du compte')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <DashboardCard title="Confidentialité des Données">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-green-900">Vos données sont sécurisées</h3>
              <p className="text-sm text-green-800 mt-1">
                Toutes vos données sont chiffrées et stockées de manière sécurisée. 
                Nous ne partageons jamais vos informations personnelles avec des tiers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🔒 Chiffrement</h4>
              <p className="text-sm text-gray-600">
                Toutes vos photos et données personnelles sont chiffrées avant stockage.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">🛡️ Accès sécurisé</h4>
              <p className="text-sm text-gray-600">
                Seul vous avez accès à vos données via votre compte sécurisé.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">📍 Localisation</h4>
              <p className="text-sm text-gray-600">
                Données stockées en Europe, conformément au RGPD.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">⏰ Rétention</h4>
              <p className="text-sm text-gray-600">
                Vos données sont conservées tant que votre compte est actif.
              </p>
            </div>
          </div>
        </div>
      </DashboardCard>
      
      <DashboardCard title="Gestion des Données">
        <div className="space-y-4">
          {/* Export données */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Exporter mes données</p>
                <p className="text-sm text-gray-600">
                  Téléchargez toutes vos données au format JSON (analyses, profil, routine)
                </p>
              </div>
            </div>
            <button
              onClick={handleExportData}
              disabled={exportLoading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exportLoading ? 'Export...' : 'Exporter'}
            </button>
          </div>

          {/* Voir politique de confidentialité */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Politique de confidentialité</p>
                <p className="text-sm text-gray-600">
                  Consultez notre politique de confidentialité complète
                </p>
              </div>
            </div>
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Consulter
            </a>
          </div>
          
          {/* Supprimer compte */}
          <div className="flex items-center justify-between p-4 border-2 border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-900">Supprimer mon compte</p>
                <p className="text-sm text-red-700">
                  Cette action est irréversible et supprimera toutes vos données
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Vos Droits RGPD">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">✅ Droit d'accès</h4>
            <p className="text-sm text-gray-600">
              Vous pouvez consulter toutes vos données via votre dashboard.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">📝 Droit de rectification</h4>
            <p className="text-sm text-gray-600">
              Modifiez vos informations dans l'onglet Profil.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">📦 Droit à la portabilité</h4>
            <p className="text-sm text-gray-600">
              Exportez vos données au format JSON standard.
            </p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">🗑️ Droit à l'effacement</h4>
            <p className="text-sm text-gray-600">
              Supprimez définitivement votre compte et toutes vos données.
            </p>
          </div>
        </div>
      </DashboardCard>
      
      {/* Modal suppression compte */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        size="md"
      >
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Supprimer votre compte
            </h3>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-4">
            <p className="text-gray-600">
              Cette action supprimera définitivement et de manière irréversible :
            </p>
            
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Toutes vos analyses et photos</li>
              <li>Vos routines et étagères produits</li>
              <li>Votre historique et vos badges</li>
              <li>Toutes vos données personnelles</li>
              <li>Vos préférences et paramètres</li>
            </ul>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Attention :</strong> Cette action ne peut pas être annulée. 
                Assurez-vous d'avoir exporté vos données si vous souhaitez les conserver.
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="SUPPRIMER"
              />
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirmation !== 'SUPPRIMER' || deleteLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleteLoading ? 'Suppression...' : 'Supprimer définitivement'}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  )
}


