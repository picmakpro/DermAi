import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProductShelves } from '@/components/dashboard/routine/ProductShelves'

export default function ShelvesPage() {
  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/routine"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la routine
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Étagères Produits
        </h1>
        <p className="text-gray-600">
          Organisez vos produits par routine, analyse ou préférence personnelle
        </p>
      </div>

      {/* Composant principal */}
      <Suspense fallback={<ProductShelvesSkeleton />}>
        <ProductShelves />
      </Suspense>

      {/* Aide contextuelle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Comment utiliser les étagères ?
        </h3>
        <div className="space-y-2 text-blue-800">
          <p>• <strong>Étagères liées aux analyses :</strong> Créées automatiquement avec vos diagnostics, contiennent les produits recommandés par l'IA</p>
          <p>• <strong>Étagères personnalisées :</strong> Créez vos propres collections de produits selon vos besoins</p>
          <p>• <strong>Réorganisation :</strong> Glissez-déposez pour réorganiser l'ordre de vos étagères et produits</p>
          <p>• <strong>Produits personnalisés :</strong> Ajoutez vos propres produits non présents dans notre catalogue</p>
        </div>
      </div>
    </div>
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










