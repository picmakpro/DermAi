'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Edit, Trash2, Package, Calendar, Grip } from 'lucide-react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import { ShelfEditor } from './ShelfEditor'

interface Product {
  id: string
  name: string
  brand: string
  type: 'internal' | 'custom'
  category: string
  phase: 'morning' | 'evening' | 'both'
  affiliate_link?: string
  user_notes?: string
}

interface ProductShelf {
  id: string
  shelf_name: string
  shelf_type: 'custom' | 'analysis_linked'
  linked_analysis_id?: string
  products: Product[]
  display_order: number
  is_active: boolean
  created_at: string
  linkedAnalysis?: {
    created_at: string
    analysis_data: any
  }
}

interface ProductShelvesProps {
  className?: string
}

export function ProductShelves({ className }: ProductShelvesProps) {
  const [shelves, setShelves] = useState<ProductShelf[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingShelf, setEditingShelf] = useState<ProductShelf | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchShelves()
  }, [])

  const fetchShelves = async () => {
    try {
      const response = await fetch('/api/routine/shelves')
      if (response.ok) {
        const data = await response.json()
        setShelves(data.shelves)
      }
    } catch (error) {
      console.error('Erreur chargement shelves:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateShelf = () => {
    setEditingShelf(null)
    setShowEditor(true)
  }

  const handleEditShelf = (shelf: ProductShelf) => {
    setEditingShelf(shelf)
    setShowEditor(true)
  }

  const handleDeleteShelf = async (shelfId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette étagère ?')) {
      return
    }

    try {
      const response = await fetch(`/api/routine/shelves/${shelfId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShelves(prev => prev.filter(shelf => shelf.id !== shelfId))
      }
    } catch (error) {
      console.error('Erreur suppression shelf:', error)
    }
  }

  const handleSaveShelf = async (shelfData: any) => {
    try {
      const url = editingShelf 
        ? `/api/routine/shelves/${editingShelf.id}`
        : '/api/routine/shelves'
      
      const method = editingShelf ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shelfData)
      })

      if (response.ok) {
        const { shelf } = await response.json()
        
        if (editingShelf) {
          setShelves(prev => prev.map(s => s.id === shelf.id ? shelf : s))
        } else {
          setShelves(prev => [...prev, shelf])
        }
        
        setShowEditor(false)
        setEditingShelf(null)
      }
    } catch (error) {
      console.error('Erreur sauvegarde shelf:', error)
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = shelves.findIndex(shelf => shelf.id === active.id)
      const newIndex = shelves.findIndex(shelf => shelf.id === over.id)

      const updatedShelves = arrayMove(shelves, oldIndex, newIndex).map((shelf, index) => ({
        ...shelf,
        display_order: index
      }))

      setShelves(updatedShelves)

      // Sauvegarder l'ordre côté serveur
      try {
        await Promise.all(
          updatedShelves.map(shelf =>
            fetch(`/api/routine/shelves/${shelf.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ display_order: shelf.display_order })
            })
          )
        )
      } catch (error) {
        console.error('Erreur sauvegarde ordre:', error)
      }
    }
  }

  if (loading) {
    return <ProductShelvesSkeleton />
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mes Étagères Produits</h2>
          <p className="text-gray-600">Organisez vos produits par routine ou analyse</p>
        </div>
        
        <button
          onClick={handleCreateShelf}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Créer une étagère
        </button>
      </div>

      {/* Liste des étagères */}
      {shelves.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune étagère créée
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre première étagère pour organiser vos produits
          </p>
          <button
            onClick={handleCreateShelf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Créer une étagère
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={shelves.map(shelf => shelf.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {shelves.map((shelf) => (
                <SortableShelfCard
                  key={shelf.id}
                  shelf={shelf}
                  onEdit={() => handleEditShelf(shelf)}
                  onDelete={() => handleDeleteShelf(shelf.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal éditeur */}
      {showEditor && (
        <ShelfEditor
          shelf={editingShelf}
          onSave={handleSaveShelf}
          onCancel={() => {
            setShowEditor(false)
            setEditingShelf(null)
          }}
        />
      )}
    </div>
  )
}

interface ShelfCardProps {
  shelf: ProductShelf
  onEdit: () => void
  onDelete: () => void
}

function SortableShelfCard({ shelf, onEdit, onDelete }: ShelfCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shelf.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'z-50' : ''}>
      <ShelfCard
        shelf={shelf}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

function ShelfCard({ shelf, onEdit, onDelete, dragHandleProps }: ShelfCardProps & { dragHandleProps?: any }) {
  const isAnalysisLinked = shelf.shelf_type === 'analysis_linked'
  const productCount = shelf.products.length

  return (
    <DashboardCard className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* Drag handle */}
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <Grip className="h-5 w-5 text-gray-400" />
          </div>

          {/* Icône type */}
          <div className={`p-2 rounded-lg ${
            isAnalysisLinked 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-purple-100 text-purple-600'
          }`}>
            {isAnalysisLinked ? (
              <Calendar className="h-5 w-5" />
            ) : (
              <Package className="h-5 w-5" />
            )}
          </div>

          {/* Contenu */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{shelf.shelf_name}</h3>
              {isAnalysisLinked && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                  Liée à l'analyse
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {productCount} produit{productCount !== 1 ? 's' : ''}
              {isAnalysisLinked && shelf.linkedAnalysis && (
                <span className="ml-2">
                  • Analyse du {new Date(shelf.linkedAnalysis.created_at).toLocaleDateString('fr-FR')}
                </span>
              )}
            </p>

            {/* Aperçu produits */}
            {productCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {shelf.products.slice(0, 3).map((product, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {product.name}
                  </div>
                ))}
                {productCount > 3 && (
                  <div className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                    +{productCount - 3} autres
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Edit className="h-4 w-4" />
          </button>
          {!isAnalysisLinked && (
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </DashboardCard>
  )
}

function ProductShelvesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-64 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="w-40 h-5 bg-gray-200 rounded animate-pulse" />
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="w-24 h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
