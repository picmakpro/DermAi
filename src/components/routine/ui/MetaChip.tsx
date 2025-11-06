/**
 * Chips pour métadonnées (zones/fréquence/durée)
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import React from 'react';
import { DesignVariant } from '@/types/aiRoutine';

interface MetaChipProps {
  label: string;
  value: string;
  tone?: "default" | "warn" | "zone";
  variant: DesignVariant;
}

export default function MetaChip({ 
  label, 
  value, 
  tone = "default", 
  variant 
}: MetaChipProps) {
  const base = "text-xs rounded-xl px-3 py-2 border inline-flex items-center gap-2 font-medium";
  
  if (tone === "warn") {
    return (
      <div className={`${base} text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-800`}>
        <span className="opacity-75">{label}</span>
        <span>{value}</span>
      </div>
    );
  }
  
  if (tone === "zone") {
    return (
      <div className={`${base} text-[#8F7BFF] bg-[#8F7BFF]/10 border-[#8F7BFF]/20 dark:text-[#8F7BFF] dark:bg-[#8F7BFF]/10 dark:border-[#8F7BFF]/20`}>
        <span className="opacity-75">{label}</span>
        <span>{value}</span>
      </div>
    );
  }
  
  return (
    <div className={`${base} text-gray-700 bg-gray-50 border-gray-200 dark:text-zinc-300 dark:bg-zinc-800/60 dark:border-zinc-700`}>
      <span className="opacity-75">{label}</span>
      <span>{value}</span>
    </div>
  );
}
