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
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Search, Plus, X, Grip, Package, Edit2, Trash2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  brand: string
  type: 'internal' | 'custom'
  category: string
  phase: 'morning' | 'evening' | 'both'
  affiliate_link?: string
  user_notes?: string
  price?: number
  image_url?: string
}

interface ProductShelf {
  id?: string
  shelf_name: string
  shelf_type: 'custom' | 'analysis_linked'
  linked_analysis_id?: string
  products: Product[]
  display_order?: number
}

interface ShelfEditorProps {
  shelf?: ProductShelf | null
  onSave: (shelfData: any) => void
  onCancel: () => void
}

export function ShelfEditor({ shelf, onSave, onCancel }: ShelfEditorProps) {
  const [shelfName, setShelfName] = useState(shelf?.shelf_name || '')
  const [products, setProducts] = useState<Product[]>(shelf?.products || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const isEditing = !!shelf
  const isAnalysisLinked = shelf?.shelf_type === 'analysis_linked'

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchProducts(searchQuery)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchProducts = async (query: string) => {
    try {
      // Recherche dans le catalogue interne
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.products || [])
      }
    } catch (error) {
      console.error('Erreur recherche produits:', error)
      setSearchResults([])
    }
  }

  const handleAddInternalProduct = (product: Product) => {
    // Vérifier si le produit n'est pas déjà dans l'étagère
    if (products.find(p => p.id === product.id)) {
      return
    }

    setProducts(prev => [...prev, {
      ...product,
      type: 'internal'
    }])
    setSearchQuery('')
    setSearchResults([])
  }

  const handleAddCustomProduct = (customProduct: Omit<Product, 'id' | 'type'>) => {
    const newProduct: Product = {
      ...customProduct,
      id: `custom-${Date.now()}`,
      type: 'custom'
    }

    setProducts(prev => [...prev, newProduct])
    setShowCustomForm(false)
  }

  const handleRemoveProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = products.findIndex(product => product.id === active.id)
      const newIndex = products.findIndex(product => product.id === over.id)

      setProducts(arrayMove(products, oldIndex, newIndex))
    }
  }

  const handleSave = async () => {
    if (!shelfName.trim()) {
      alert('Le nom de l\'étagère est requis')
      return
    }

    setLoading(true)

    const shelfData = {
      shelf_name: shelfName.trim(),
      shelf_type: shelf?.shelf_type || 'custom',
      linked_analysis_id: shelf?.linked_analysis_id || null,
      products
    }

    try {
      await onSave(shelfData)
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Modifier l\'étagère' : 'Créer une étagère'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nom de l'étagère */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'étagère
            </label>
            <input
              type="text"
              value={shelfName}
              onChange={(e) => setShelfName(e.target.value)}
              placeholder="Ex: Ma routine hiver"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              disabled={isAnalysisLinked}
            />
            {isAnalysisLinked && (
              <p className="mt-1 text-sm text-gray-500">
                Les étagères liées aux analyses ne peuvent pas être renommées
              </p>
            )}
          </div>

          {/* Recherche produits internes */}
          {!isAnalysisLinked && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ajouter des produits
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans le catalogue..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              {/* Résultats de recherche */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAddInternalProduct(product)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.brand}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Bouton produit personnalisé */}
              <button
                onClick={() => setShowCustomForm(true)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
                Ajouter un produit personnalisé
              </button>
            </div>
          )}

          {/* Liste des produits avec drag & drop */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Produits dans l'étagère ({products.length})
              </h3>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun produit dans cette étagère</p>
                <p className="text-sm">Utilisez la recherche pour ajouter des produits</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={products.map(product => product.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {products.map((product) => (
                      <SortableProductItem
                        key={product.id}
                        product={product}
                        onRemove={() => handleRemoveProduct(product.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              disabled={loading || !shelfName.trim()}
            >
              {loading ? 'Sauvegarde...' : (isEditing ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </div>
      </div>

      {/* Modal produit personnalisé */}
      {showCustomForm && (
        <CustomProductForm
          onSave={handleAddCustomProduct}
          onCancel={() => setShowCustomForm(false)}
        />
      )}
    </div>
  )
}

interface CustomProductFormProps {
  onSave: (product: Omit<Product, 'id' | 'type'>) => void
  onCancel: () => void
}

function CustomProductForm({ onSave, onCancel }: CustomProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'serum',
    phase: 'both' as 'morning' | 'evening' | 'both',
    user_notes: '',
    affiliate_link: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.brand.trim()) {
      alert('Le nom et la marque sont requis')
      return
    }

    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Ajouter un produit personnalisé
            </h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du produit *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="Ex: Sérum Vitamine C"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marque *
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="Ex: The Ordinary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              >
                <option value="cleanser">Nettoyant</option>
                <option value="serum">Sérum</option>
                <option value="moisturizer">Hydratant</option>
                <option value="sunscreen">Protection solaire</option>
                <option value="exfoliant">Exfoliant</option>
                <option value="mask">Masque</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Utilisation
              </label>
              <select
                value={formData.phase}
                onChange={(e) => setFormData(prev => ({ ...prev, phase: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              >
                <option value="morning">Matin uniquement</option>
                <option value="evening">Soir uniquement</option>
                <option value="both">Matin et soir</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes personnelles
              </label>
              <textarea
                value={formData.user_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, user_notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                rows={3}
                placeholder="Ex: Fonctionne bien pour ma peau sensible"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >
                Ajouter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

interface SortableProductItemProps {
  product: Product
  onRemove: () => void
}

function SortableProductItem({ product, onRemove }: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <Grip className="h-4 w-4 text-gray-400" />
      </div>

      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-10 h-10 rounded object-cover"
        />
      )}

      <div className="flex-1">
        <p className="font-medium text-gray-900">{product.name}</p>
        <p className="text-sm text-gray-600">
          {product.brand} • {product.category}
          {product.type === 'custom' && (
            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
              Personnalisé
            </span>
          )}
        </p>
        {product.user_notes && (
          <p className="text-sm text-gray-500 mt-1">{product.user_notes}</p>
        )}
      </div>

      <div className="flex gap-2">
        {product.phase && (
          <span className={`px-2 py-1 text-xs rounded-full ${
            product.phase === 'morning' ? 'bg-orange-100 text-orange-700' :
            product.phase === 'evening' ? 'bg-indigo-100 text-indigo-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {product.phase === 'morning' ? 'Matin' :
             product.phase === 'evening' ? 'Soir' : 'Matin & Soir'}
          </span>
        )}

        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
