/**
 * Modal de sélection des alternatives produits
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import React from 'react';
import { X } from 'lucide-react';
import { DesignVariant } from '@/types/aiRoutine';
import ProductThumb from './ProductThumb';

interface AlternativesModalProps {
  open: boolean;
  onClose: () => void;
  options: { id: string; name: string }[];
  onSelect: (opt: { id: string; name: string }) => void;
  variant: DesignVariant;
}

function getVariantStyles(variant: DesignVariant) {
  const styles = {
    A: {
      card: "bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(20,20,20,0.04)] dark:bg-zinc-950 dark:border-zinc-800",
      button: {
        secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
      },
      typography: {
        title: "font-medium text-gray-900 dark:text-white",
        subtitle: "text-gray-600 dark:text-zinc-400",
        body: "text-gray-800 dark:text-zinc-200"
      }
    },
    B: {
      card: "bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(143,123,255,0.08)] dark:bg-zinc-900/70 dark:border-zinc-700/30",
      button: {
        secondary: "bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/90 dark:bg-zinc-800/70 dark:border-zinc-600/30 dark:text-zinc-100 dark:hover:bg-zinc-800/90"
      },
      typography: {
        title: "font-semibold text-gray-900 dark:text-white",
        subtitle: "text-gray-600 dark:text-zinc-400",
        body: "text-gray-800 dark:text-zinc-200"
      }
    },
    C: {
      card: "bg-white border border-[#EAD9D1]/30 rounded-3xl shadow-[0_16px_48px_rgba(20,20,20,0.08)] dark:bg-zinc-900 dark:border-zinc-800",
      button: {
        secondary: "bg-[#EAD9D1]/20 border border-[#EAD9D1] text-gray-700 hover:bg-[#EAD9D1]/30 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-700"
      },
      typography: {
        title: "font-bold text-gray-900 dark:text-white",
        subtitle: "text-gray-700 dark:text-zinc-300",
        body: "text-gray-800 dark:text-zinc-200"
      }
    }
  };
  return styles[variant];
}

export default function AlternativesModal({
  open,
  onClose,
  options,
  onSelect,
  variant,
}: AlternativesModalProps) {
  const styles = getVariantStyles(variant);
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
        aria-label="Fermer le modal"
      />
      <div 
        className={`absolute inset-x-4 sm:inset-x-0 sm:left-1/2 sm:-translate-x-1/2 top-16 sm:top-24 mx-auto w-auto sm:w-[600px] rounded-3xl border shadow-2xl ${styles.card}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800`}>
          <div 
            id="modal-title"
            className={`text-lg font-semibold ${styles.typography.title}`}
          >
            Choisir une alternative
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors" 
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {options?.length ? (
            options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelect(opt)}
                className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-300 w-full ${styles.button.secondary} hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#8F7BFF]/50`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <ProductThumb seed={opt.name} variant={variant} />
                  <div className={`text-sm font-medium ${styles.typography.body}`}>
                    {opt.name}
                  </div>
                </div>
                <span className="text-xs px-3 py-2 rounded-xl border border-[#8F7BFF]/20 bg-[#8F7BFF]/10 text-[#8F7BFF] font-medium">
                  Sélectionner
                </span>
              </button>
            ))
          ) : (
            <div className={`text-sm ${styles.typography.subtitle} text-center py-8`}>
              Aucune alternative fournie.
            </div>
          )}
        </div>
        
        <div className={`px-6 py-4 border-t border-gray-100 dark:border-zinc-800 text-xs ${styles.typography.subtitle}`}>
          Les alternatives sont générées par l'IA selon ton diagnostic et tes préférences.
        </div>
      </div>
    </div>
  );
}
