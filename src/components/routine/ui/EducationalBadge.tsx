/**
 * Badges éducatifs pour observe/duration/objective
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import React from 'react';
import { Eye, Hourglass, Target } from 'lucide-react';
import { DesignVariant } from '@/types/aiRoutine';

interface EducationalBadgeProps {
  type: "observe" | "duration" | "objective";
  text: string;
  variant: DesignVariant;
}

export default function EducationalBadge({ 
  type, 
  text, 
  variant 
}: EducationalBadgeProps) {
  const icons = {
    observe: <Eye className="w-3.5 h-3.5" />,
    duration: <Hourglass className="w-3.5 h-3.5" />,
    objective: <Target className="w-3.5 h-3.5" />
  };
  
  const colors = {
    observe: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    duration: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    objective: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
  };
  
  return (
    <div 
      className={`inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border font-medium ${colors[type]}`}
      role="img"
      aria-label={`${type}: ${text}`}
    >
      {icons[type]}
      <span>{text}</span>
    </div>
  );
}
