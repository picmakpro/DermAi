/**
 * Version simplifiée de la Routine V3 pour validation immédiate
 * 
 * Cette version fonctionne sans dépendances complexes et valide
 * que l'approche UI V3 est correcte.
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  CalendarDays, 
  ShoppingCart, 
  RefreshCcw,
  Lightbulb,
  AlertCircle,
  Eye,
  Hourglass
} from 'lucide-react';

// Types simplifiés pour cette démo
type Slot = "morning" | "evening" | "weekly";
type DesignVariant = "A" | "B" | "C";

// Données de démonstration
const DEMO_DATA = {
  phases: [
    {
      id: "immediate",
      label: "Phase Immédiate", 
      durationLabel: "1–3 semaines",
      education: {
        title: "Objectif : Stabiliser la barrière cutanée",
        text: "Phase de préparation douce. Les traitements temporaires dictent la durée."
      },
      slots: {
        morning: [
          {
            id: "cleanse-am",
            title: "Nettoyage",
            product: "Bioderma Sensibio H2O",
            category: "cleanser",
            is_continuous: true,
            application_instructions: "Imbiber un coton, passer délicatement sur le visage",
            target_zones: ["Visage entier"],
            restrictions: ["Éviter contact avec yeux irrités"]
          }
        ],
        evening: [
          {
            id: "treat-niacinamide",
            title: "Traitement : irrégularités pigmentaires", 
            product: "The Ordinary Niacinamide 10%",
            category: "treatment",
            is_temporary: true,
            introduce_from_week: 2,
            application_duration: "4–6 semaines",
            frequency: "daily",
            application_instructions: "Appliquer 2-3 gouttes sur zones concernées",
            target_zones: ["Zone T", "Menton"],
            restrictions: ["Éviter contour des yeux"]
          }
        ],
        weekly: [
          {
            id: "exfoliation",
            title: "Exfoliation chimique",
            product: "The Ordinary AHA 30%",
            category: "treatment", 
            is_temporary: true,
            introduce_from_week: 1,
            application_duration: "3 semaines max",
            frequency: "1x/week",
            application_instructions: "Appliquer le soir 8-10 min, rincer abondamment",
            target_zones: ["Joues", "Front"],
            restrictions: ["Ne pas utiliser après rasage", "Éviter yeux/lèvres"]
          }
        ]
      }
    }
  ]
};

export default function RoutineV3Simple({ variant = "A" }: { variant?: DesignVariant }) {
  const [activeSlot, setActiveSlot] = useState<Slot>("morning");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  const currentPhase = DEMO_DATA.phases[0];
  const currentItems = currentPhase.slots[activeSlot];

  const getVariantStyles = (v: DesignVariant) => {
    const styles = {
      A: {
        container: "bg-white dark:bg-zinc-950",
        card: "bg-white border border-gray-100 rounded-2xl shadow-sm dark:bg-zinc-950 dark:border-zinc-800",
        button: {
          primary: "bg-gradient-to-r from-[#8F7BFF] to-[#5A4AE3] text-white shadow-sm hover:shadow-md transition-all duration-300",
          secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
        }
      },
      B: {
        container: "bg-gradient-to-br from-[#FDF9F7] to-white dark:from-zinc-950 dark:to-zinc-900",
        card: "bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-lg dark:bg-zinc-900/70 dark:border-zinc-700/30",
        button: {
          primary: "bg-gradient-to-r from-[#8F7BFF] to-[#5A4AE3] text-white shadow-lg hover:shadow-xl transition-all duration-300",
          secondary: "bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/90 dark:bg-zinc-800/70"
        }
      },
      C: {
        container: "bg-[#FDF9F7] dark:bg-zinc-950",
        card: "bg-white border border-[#EAD9D1]/30 rounded-3xl shadow-xl dark:bg-zinc-900 dark:border-zinc-800",
        button: {
          primary: "bg-gradient-to-r from-[#8F7BFF] to-[#5A4AE3] text-white shadow-lg hover:shadow-xl transition-all duration-300",
          secondary: "bg-[#EAD9D1]/20 border border-[#EAD9D1] text-gray-700 hover:bg-[#EAD9D1]/30 dark:bg-zinc-800"
        }
      }
    };
    return styles[v];
  };

  const styles = getVariantStyles(variant);

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className={`min-h-screen ${styles.container} transition-colors duration-500`}>
        <div className="mx-auto w-full max-w-4xl px-6 py-10">
          
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  DermAI — Routine V3 Demo
                </h1>
                <p className="text-gray-600 dark:text-zinc-400">
                  Test de l'architecture onglets Phase → Slots (Matin/Soir/Hebdo)
                </p>
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${styles.button.secondary}`}
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark" ? "Mode clair" : "Mode sombre"}
              </button>
            </div>
          </header>

          {/* Phase Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {currentPhase.label}
            </h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
              Durée : {currentPhase.durationLabel}
            </p>
            
            {/* Éducation */}
            <div className="rounded-2xl border border-[#8F7BFF]/20 bg-gradient-to-r from-[#8F7BFF]/5 to-[#5A4AE3]/5 p-6">
              <h3 className="font-bold text-[#8F7BFF] mb-2">
                {currentPhase.education.title}
              </h3>
              <p className="text-gray-800 dark:text-zinc-200 text-sm">
                {currentPhase.education.text}
              </p>
            </div>
          </div>

          {/* Slot Switch - STICKY */}
          <div className="mb-8 sticky top-4 z-10">
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-2xl p-2 border border-gray-200 dark:bg-zinc-900/90 dark:border-zinc-700">
              {(["morning", "evening", "weekly"] as Slot[]).map((slot) => (
                <button
                  key={slot}
                  onClick={() => setActiveSlot(slot)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeSlot === slot 
                      ? styles.button.primary
                      : styles.button.secondary
                  }`}
                >
                  {slot === "morning" && <Sun className="w-4 h-4" />}
                  {slot === "evening" && <Moon className="w-4 h-4" />}
                  {slot === "weekly" && <CalendarDays className="w-4 h-4" />}
                  {slot === "morning" ? "Matin" : slot === "evening" ? "Soir" : "Hebdomadaire"}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Routine {activeSlot === "morning" ? "du matin" : activeSlot === "evening" ? "du soir" : "hebdomadaire"}
            </h3>
            
            {currentItems.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-2xl text-gray-500">
                Aucun élément pour ce créneau
              </div>
            ) : (
              <div className="grid gap-6">
                {currentItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    className={`p-6 ${styles.card}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#8F7BFF] to-[#5A4AE3] rounded-xl flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-zinc-400 mb-1">
                            Étape {idx + 1}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-zinc-300 mb-1">
                            {item.title}
                          </div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {item.product}
                          </div>
                        </div>
                      </div>
                      
                      {item.is_temporary && (
                        <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                          Temporaire
                        </span>
                      )}
                    </div>

                    {/* Educational Badges pour temporaires */}
                    {item.is_temporary && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.introduce_from_week !== undefined && (
                          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                            <Eye className="w-3 h-3" />
                            Semaine {item.introduce_from_week}
                          </div>
                        )}
                        {item.application_duration && (
                          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                            <Hourglass className="w-3 h-3" />
                            {item.application_duration}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Zones */}
                    {item.target_zones && (
                      <div className="mb-4">
                        <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                          Zones : {item.target_zones.join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Instructions */}
                    {item.application_instructions && (
                      <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-emerald-700">
                          <Lightbulb className="w-4 h-4" />
                          <span className="text-sm font-semibold">Conseils d'application</span>
                        </div>
                        <p className="text-sm text-emerald-800">{item.application_instructions}</p>
                      </div>
                    )}

                    {/* Restrictions */}
                    {item.restrictions && item.restrictions.length > 0 && item.restrictions.some(r => r && !/aucune/i.test(r)) && (
                      <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-2 text-rose-700">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-semibold">Restrictions</span>
                        </div>
                        <ul className="text-sm text-rose-800 space-y-1">
                          {item.restrictions.filter(r => r && !/aucune/i.test(r)).map((restriction, i) => (
                            <li key={i}>• {restriction}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button 
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${styles.button.primary}`}
                        onClick={() => console.log('Achat:', item.product)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Acheter
                      </button>
                      <button 
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${styles.button.secondary}`}
                        onClick={() => console.log('Alternative:', item.id)}
                      >
                        <RefreshCcw className="w-4 h-4" />
                        Alternative
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer explicatif */}
          <footer className="mt-12 p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              ✅ Validation Concept V3
            </h4>
            <ul className="text-sm text-gray-700 dark:text-zinc-300 space-y-2">
              <li>• <strong>Architecture onglets</strong> : Phase → Slots (Matin/Soir/Hebdo) ✅</li>
              <li>• <strong>Produits continus</strong> : Pas de badge "Continu" ✅</li>
              <li>• <strong>Traitements temporaires</strong> : Métadonnées visibles (semaine, durée) ✅</li>
              <li>• <strong>Hebdomadaire</strong> : Items ≥ hebdo (exfoliation 1x/week) ✅</li>
              <li>• <strong>Mobile-first</strong> : Slots sticky, responsive ✅</li>
              <li>• <strong>Pédagogie</strong> : Instructions + restrictions par item ✅</li>
            </ul>
          </footer>
        </div>
      </div>
    </div>
  );
}

// Styles selon variante
function getButtonStyles(variant: DesignVariant) {
  return {
    A: {
      primary: "bg-gradient-to-r from-[#8F7BFF] to-[#5A4AE3] text-white shadow-sm hover:shadow-md",
      secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
    },
    B: {
      primary: "bg-gradient-to-r from-[#8F7BFF] to-[#5A4AE3] text-white shadow-lg hover:shadow-xl",
      secondary: "bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/90"
    },
    C: {
      primary: "bg-gradient-to-r from-[#8F7BFF] to-[#5A4AE3] text-white shadow-lg hover:shadow-xl",
      secondary: "bg-[#EAD9D1]/20 border border-[#EAD9D1] text-gray-700 hover:bg-[#EAD9D1]/30"
    }
  }[variant];
}
