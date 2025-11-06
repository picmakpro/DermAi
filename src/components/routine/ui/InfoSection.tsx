/**
 * Sections pédagogiques (advice/warn/meta)
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import React from 'react';
import { DesignVariant } from '@/types/aiRoutine';

interface InfoSectionProps {
  tone: "advice" | "warn" | "meta";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  variant: DesignVariant;
}

export default function InfoSection({
  tone,
  icon,
  title,
  children,
  variant,
}: InfoSectionProps) {
  const map = {
    advice: {
      container: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-900/10",
      title: "text-emerald-700 dark:text-emerald-300",
      content: "text-emerald-800 dark:text-emerald-200"
    },
    warn: {
      container: "border-rose-200 bg-rose-50/50 dark:border-rose-800/30 dark:bg-rose-900/10",
      title: "text-rose-700 dark:text-rose-300",
      content: "text-rose-800 dark:text-rose-200"
    },
    meta: {
      container: "border-gray-200 bg-gray-50/50 dark:border-zinc-700/30 dark:bg-zinc-800/20",
      title: "text-gray-700 dark:text-zinc-300",
      content: "text-gray-800 dark:text-zinc-200"
    },
  } as const;
  
  const styles = map[tone];
  const radius = variant === "C" ? "rounded-2xl" : "rounded-xl";
  
  return (
    <div className={`border p-4 ${radius} ${styles.container}`}>
      <div className={`flex items-center gap-3 mb-3 ${styles.title}`}>
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className={`text-sm leading-relaxed ${styles.content}`}>
        {children}
      </div>
    </div>
  );
}
