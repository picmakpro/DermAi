interface ScoreCircleProps {
  score: number
  label: string
  icon: React.ReactNode
}

export default function ScoreCircle({ score, label, icon }: ScoreCircleProps) {
  const getColor = (score: number) => {
    if (score >= 70) return { 
      stroke: 'rgba(34, 197, 94, 0.8)', // vert clair translucide
      bg: 'rgba(220, 252, 231, 0.6)', // fond vert très clair
      text: 'text-emerald-700',
      bgCircle: 'rgba(220, 252, 231, 0.3)' // fond cercle très clair
    }
    if (score >= 50) return { 
      stroke: 'rgba(251, 191, 36, 0.8)', // orange clair translucide
      bg: 'rgba(254, 243, 199, 0.6)', // fond orange très clair
      text: 'text-amber-700',
      bgCircle: 'rgba(254, 243, 199, 0.3)' // fond cercle très clair
    }
    return { 
      stroke: 'rgba(239, 68, 68, 0.8)', // rouge clair translucide
      bg: 'rgba(254, 226, 226, 0.6)', // fond rouge très clair
      text: 'text-red-700',
      bgCircle: 'rgba(254, 226, 226, 0.3)' // fond cercle très clair
    }
  }

  const getQualifier = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Bon' 
    if (score >= 40) return 'Moyen'
    return 'Perfectible'
  }

  const color = getColor(score)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center space-y-2 md:space-y-3">
      <div className="relative w-20 h-20 md:w-28 md:h-28">
        <svg className="w-20 h-20 md:w-28 md:h-28 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle with colored fill */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill={color.bgCircle}
            stroke="rgba(229, 231, 235, 0.5)"
            strokeWidth="2"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={color.stroke}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out drop-shadow-sm"
          />
        </svg>
        {/* Icon and score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-lg md:text-xl font-bold text-gray-800">{score}</div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-xs md:text-sm font-semibold text-gray-900 mb-1">{label}</div>
        <div className={`text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-full ${color.bg} ${color.text} font-medium backdrop-blur-sm`}>
          {getQualifier(score)}
        </div>
      </div>
    </div>
  )
}
