/**
 * Badge numéroté avec gradient pour les étapes de routine
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import React from 'react';
import { DesignVariant } from '@/types/aiRoutine';

interface StepBadgeProps {
  n: number;
  variant: DesignVariant;
  size?: 'sm' | 'md' | 'lg';
}

export default function StepBadge({ 
  n, 
  variant, 
  size = 'md' 
}: StepBadgeProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm", 
    lg: "w-12 h-12 text-base"
  };
  
  return (
    <div className={`shrink-0 ${sizes[size]} grid place-items-center rounded-2xl bg-gradient-to-br from-[#8F7BFF] to-[#5A4AE3] text-white font-bold shadow-lg`}>
      {n}
    </div>
  );
}
