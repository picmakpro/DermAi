import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDistanceToNow(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diffInMs = now.getTime() - d.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return "Aujourd'hui"
  } else if (diffInDays === 1) {
    return "Hier"
  } else if (diffInDays < 7) {
    return `Il y a ${diffInDays} jours`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  } else {
    const months = Math.floor(diffInDays / 30)
    return `Il y a ${months} mois`
  }
}


