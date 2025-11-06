/**
 * Vignette produit avec image ou fallback gradient
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import React from 'react';
import { DesignVariant } from '@/types/aiRoutine';

interface ProductThumbProps {
  seed?: string;
  src?: string;
  variant: DesignVariant;
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
}

function hashToGradient(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const hue2 = (hue + 40) % 360;
  return `from-[hsl(${hue}deg_70%_75%)] to-[hsl(${hue2}deg_70%_65%)]`;
}

export default function ProductThumb({ 
  seed, 
  src, 
  variant, 
  size = 'md',
  alt = "Produit"
}: ProductThumbProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };
  
  if (src) {
    return (
      <div className={`${sizes[size]} rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-700 bg-white shadow-sm`}>
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover" 
          loading="lazy" 
        />
      </div>
    );
  }
  
  const bg = seed ? hashToGradient(seed) : "from-[#8F7BFF] to-[#5A4AE3]";
  
  return (
    <div 
      className={`${sizes[size]} rounded-xl bg-gradient-to-br ${bg} shadow-sm`}
      aria-label={`Image produit ${alt}`}
    />
  );
}
