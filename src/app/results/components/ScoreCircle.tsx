interface ScoreCircleProps {
  score: number
  label: string
  icon: React.ReactNode
}

export default function ScoreCircle({ score, label, icon }: ScoreCircleProps) {
  const getColor = (score: number) => {
    if (score >= 70) return { stroke: '#10b981', bg: '#d1fae5', text: 'text-emerald-600' }
    if (score >= 50) return { stroke: '#f59e0b', bg: '#fef3c7', text: 'text-amber-600' }
    return { stroke: '#ef4444', bg: '#fee2e2', text: 'text-red-600' }
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
    <div className="flex flex-col items-center space-y-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
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
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Icon and score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`w-6 h-6 ${color.text} mb-1`}>
            {icon}
          </div>
          <div className="text-lg font-bold text-gray-900">{score}</div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className={`text-xs px-2 py-1 rounded-full ${color.bg} ${color.text} font-medium`}>
          {getQualifier(score)}
        </div>
      </div>
    </div>
  )
}
