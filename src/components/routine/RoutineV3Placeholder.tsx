/**
 * Placeholder temporaire pour Routine V3
 * 
 * Ce composant sera remplacé par l'intégration complète de la Preview
 * lors du Sprint 2 de la refonte V3.
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Calendar, Sparkles } from 'lucide-react';

interface RoutineV3PlaceholderProps {
  message?: string;
  showDetails?: boolean;
}

export default function RoutineV3Placeholder({ 
  message = "Refonte Routine V3 en cours...",
  showDetails = true 
}: RoutineV3PlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-3xl border border-blue-200 dark:border-blue-800"
    >
      <div className="text-center space-y-6">
        {/* Icône principale */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Wrench className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Message principal */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {message}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Nouvelle expérience routine en développement
          </p>
        </div>

        {/* Détails du développement */}
        {showDetails && (
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Calendar className="w-4 h-4" />
              <span>Sprint 1 : Fondations & Types ✅</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-xl">
                <div className="font-semibold mb-1">✅ Types créés</div>
                <div className="text-xs">AiRoutineOutput</div>
              </div>
              
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-xl">
                <div className="font-semibold mb-1">✅ Mapper prêt</div>
                <div className="text-xs">Mapping strict</div>
              </div>
              
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-3 rounded-xl">
                <div className="font-semibold mb-1">🔄 Sprint 2</div>
                <div className="text-xs">Preview UI</div>
              </div>
            </div>
          </div>
        )}

        {/* Aperçu des fonctionnalités */}
        <div className="text-left bg-white/40 dark:bg-gray-800/40 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            🎯 Nouveautés V3
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              Architecture onglets Phase → Slots (Matin/Soir/Hebdo)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-full"></div>
              Suppression badges "Continu" + métadonnées riches
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-full"></div>
              3 variantes design (Clinical/Glow/Editorial)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
              Mobile-first avec slots sticky
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
