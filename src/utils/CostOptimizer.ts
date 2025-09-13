import { logger } from './Logger'

/**
 * 🔥 COST OPTIMIZER - SPRINT 3 OPTIMISATION
 * Monitoring et optimisation des coûts OpenAI en temps réel
 * Alertes automatiques et limitation intelligente
 */

export interface CostMetrics {
  totalTokens: number
  promptTokens: number
  completionTokens: number
  estimatedCost: number // En euros
  requestCount: number
  timestamp: number
}

export interface DailyCostSummary {
  date: string
  totalCost: number
  requestCount: number
  averageCostPerRequest: number
  tokenUsage: {
    total: number
    prompt: number
    completion: number
  }
  modelBreakdown: Record<string, {
    requests: number
    cost: number
    tokens: number
  }>
}

export interface CostAlert {
  type: 'daily_limit' | 'hourly_spike' | 'inefficient_prompt' | 'budget_warning'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  data: any
  timestamp: number
}

export class CostOptimizer {
  private static instance: CostOptimizer
  private dailyMetrics = new Map<string, CostMetrics[]>()
  private alerts: CostAlert[] = []
  
  // Configuration des coûts OpenAI (prix par 1K tokens en EUR)
  private static readonly MODEL_COSTS = {
    'gpt-4o': {
      prompt: 0.00375, // $2.50 / 1M tokens * 0.85 EUR/USD / 1000
      completion: 0.015 // $10.00 / 1M tokens * 0.85 EUR/USD / 1000
    },
    'gpt-4o-vision': {
      prompt: 0.00375,
      completion: 0.015
    },
    'gpt-4': {
      prompt: 0.0255, // Plus cher
      completion: 0.051
    }
  }

  // Limites et seuils
  private static readonly LIMITS = {
    dailyBudget: 50.0, // 50€ par jour max
    hourlyBudget: 10.0, // 10€ par heure max
    requestBudget: 2.0, // 2€ par requête max
    alertThresholds: {
      daily: 0.8, // 80% du budget quotidien
      hourly: 0.9, // 90% du budget horaire
      inefficient: 1.0 // 1€ par requête = inefficace
    }
  }

  private constructor() {
    this.startPeriodicCleanup()
  }

  static getInstance(): CostOptimizer {
    if (!CostOptimizer.instance) {
      CostOptimizer.instance = new CostOptimizer()
    }
    return CostOptimizer.instance
  }

  /**
   * Enregistre l'usage d'une requête OpenAI
   */
  recordUsage(
    model: string,
    promptTokens: number,
    completionTokens: number,
    requestType: 'diagnostic' | 'routine' | 'products'
  ): CostMetrics {
    const totalTokens = promptTokens + completionTokens
    const modelCost = CostOptimizer.MODEL_COSTS[model as keyof typeof CostOptimizer.MODEL_COSTS]
    
    if (!modelCost) {
      logger.warn(`Modèle inconnu pour calcul coût: ${model}`)
      return {
        totalTokens,
        promptTokens,
        completionTokens,
        estimatedCost: 0,
        requestCount: 1,
        timestamp: Date.now()
      }
    }

    const estimatedCost = 
      (promptTokens / 1000) * modelCost.prompt + 
      (completionTokens / 1000) * modelCost.completion

    const metrics: CostMetrics = {
      totalTokens,
      promptTokens,
      completionTokens,
      estimatedCost,
      requestCount: 1,
      timestamp: Date.now()
    }

    // Stocker les métriques quotidiennes
    const today = new Date().toISOString().split('T')[0]
    if (!this.dailyMetrics.has(today)) {
      this.dailyMetrics.set(today, [])
    }
    this.dailyMetrics.get(today)!.push(metrics)

    // Vérifier les seuils et générer des alertes
    this.checkThresholds(metrics, requestType, model)

    logger.info('Usage OpenAI enregistré', {
      model,
      requestType,
      tokens: totalTokens,
      cost: estimatedCost.toFixed(4),
      costPerToken: (estimatedCost / totalTokens * 1000).toFixed(6)
    })

    return metrics
  }

  /**
   * Vérifie les seuils et génère des alertes si nécessaire
   */
  private checkThresholds(
    metrics: CostMetrics,
    requestType: string,
    model: string
  ): void {
    const now = Date.now()
    const today = new Date().toISOString().split('T')[0]
    const currentHour = new Date().getHours()

    // Vérifier coût par requête
    if (metrics.estimatedCost > CostOptimizer.LIMITS.requestBudget) {
      this.addAlert({
        type: 'inefficient_prompt',
        severity: 'high',
        message: `Requête coûteuse détectée: ${metrics.estimatedCost.toFixed(4)}€ (${metrics.totalTokens} tokens)`,
        data: { requestType, model, cost: metrics.estimatedCost, tokens: metrics.totalTokens },
        timestamp: now
      })
    }

    // Vérifier budget quotidien
    const dailyCost = this.getDailyCost(today)
    const dailyThreshold = CostOptimizer.LIMITS.dailyBudget * CostOptimizer.LIMITS.alertThresholds.daily
    
    if (dailyCost > dailyThreshold) {
      this.addAlert({
        type: 'budget_warning',
        severity: dailyCost > CostOptimizer.LIMITS.dailyBudget ? 'critical' : 'medium',
        message: `Budget quotidien atteint: ${dailyCost.toFixed(2)}€ / ${CostOptimizer.LIMITS.dailyBudget}€`,
        data: { dailyCost, budget: CostOptimizer.LIMITS.dailyBudget },
        timestamp: now
      })
    }

    // Vérifier budget horaire
    const hourlyCost = this.getHourlyCost(today, currentHour)
    const hourlyThreshold = CostOptimizer.LIMITS.hourlyBudget * CostOptimizer.LIMITS.alertThresholds.hourly
    
    if (hourlyCost > hourlyThreshold) {
      this.addAlert({
        type: 'hourly_spike',
        severity: hourlyCost > CostOptimizer.LIMITS.hourlyBudget ? 'critical' : 'high',
        message: `Pic de coût horaire: ${hourlyCost.toFixed(2)}€ / ${CostOptimizer.LIMITS.hourlyBudget}€`,
        data: { hourlyCost, hour: currentHour },
        timestamp: now
      })
    }
  }

  /**
   * Ajoute une alerte
   */
  private addAlert(alert: CostAlert): void {
    this.alerts.push(alert)
    
    // Garder seulement les 100 dernières alertes
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }

    // Logger selon la sévérité
    const logLevel = alert.severity === 'critical' ? 'error' : 
                    alert.severity === 'high' ? 'warn' : 'info'
    
    logger[logLevel](`Alerte coût OpenAI: ${alert.message}`, alert.data)
  }

  /**
   * Calcule le coût total d'une journée
   */
  private getDailyCost(date: string): number {
    const dayMetrics = this.dailyMetrics.get(date) || []
    return dayMetrics.reduce((sum, m) => sum + m.estimatedCost, 0)
  }

  /**
   * Calcule le coût d'une heure spécifique
   */
  private getHourlyCost(date: string, hour: number): number {
    const dayMetrics = this.dailyMetrics.get(date) || []
    const hourStart = new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00`).getTime()
    const hourEnd = hourStart + 60 * 60 * 1000

    return dayMetrics
      .filter(m => m.timestamp >= hourStart && m.timestamp < hourEnd)
      .reduce((sum, m) => sum + m.estimatedCost, 0)
  }

  /**
   * Vérifie si une requête peut être exécutée selon les limites
   */
  canExecuteRequest(estimatedTokens: number, model: string): {
    allowed: boolean
    reason?: string
    suggestedAction?: string
  } {
    const today = new Date().toISOString().split('T')[0]
    const currentHour = new Date().getHours()
    
    const modelCost = CostOptimizer.MODEL_COSTS[model as keyof typeof CostOptimizer.MODEL_COSTS]
    if (!modelCost) {
      return { allowed: true } // Modèle inconnu, on laisse passer
    }

    // Estimation du coût de la requête
    const estimatedCost = (estimatedTokens / 1000) * (modelCost.prompt + modelCost.completion) / 2

    // Vérifier limite par requête
    if (estimatedCost > CostOptimizer.LIMITS.requestBudget) {
      return {
        allowed: false,
        reason: `Requête trop coûteuse: ${estimatedCost.toFixed(4)}€ > ${CostOptimizer.LIMITS.requestBudget}€`,
        suggestedAction: 'Optimiser le prompt pour réduire les tokens'
      }
    }

    // Vérifier budget quotidien
    const dailyCost = this.getDailyCost(today)
    if (dailyCost + estimatedCost > CostOptimizer.LIMITS.dailyBudget) {
      return {
        allowed: false,
        reason: `Budget quotidien dépassé: ${(dailyCost + estimatedCost).toFixed(2)}€ > ${CostOptimizer.LIMITS.dailyBudget}€`,
        suggestedAction: 'Attendre demain ou utiliser le cache'
      }
    }

    // Vérifier budget horaire
    const hourlyCost = this.getHourlyCost(today, currentHour)
    if (hourlyCost + estimatedCost > CostOptimizer.LIMITS.hourlyBudget) {
      return {
        allowed: false,
        reason: `Budget horaire dépassé: ${(hourlyCost + estimatedCost).toFixed(2)}€ > ${CostOptimizer.LIMITS.hourlyBudget}€`,
        suggestedAction: 'Attendre la prochaine heure ou utiliser le cache'
      }
    }

    return { allowed: true }
  }

  /**
   * Optimise un prompt pour réduire les tokens
   */
  optimizePrompt(prompt: string, targetReduction: number = 0.2): string {
    // Stratégies d'optimisation
    let optimized = prompt

    // 1. Supprimer les espaces multiples
    optimized = optimized.replace(/\s+/g, ' ')

    // 2. Supprimer les phrases répétitives
    const sentences = optimized.split('. ')
    const uniqueSentences = [...new Set(sentences)]
    if (uniqueSentences.length < sentences.length) {
      optimized = uniqueSentences.join('. ')
    }

    // 3. Raccourcir les exemples si trop longs
    if (optimized.includes('Exemple :') || optimized.includes('Example:')) {
      optimized = optimized.replace(/Exemple\s*:.*?(?=\n\n|\n[A-Z]|$)/gs, 'Exemple: [raccourci]')
    }

    // 4. Simplifier les listes longues
    const listPattern = /^[-*]\s.+$/gm
    const lists = optimized.match(listPattern)
    if (lists && lists.length > 10) {
      // Garder seulement les 8 premiers éléments + "..."
      const shortList = lists.slice(0, 8).join('\n') + '\n- ...'
      optimized = optimized.replace(listPattern, shortList)
    }

    const originalLength = prompt.length
    const optimizedLength = optimized.length
    const reduction = (originalLength - optimizedLength) / originalLength

    logger.info('Prompt optimisé', {
      originalLength,
      optimizedLength,
      reduction: (reduction * 100).toFixed(1) + '%',
      targetReduction: (targetReduction * 100).toFixed(1) + '%'
    })

    return optimized
  }

  /**
   * Génère un résumé quotidien des coûts
   */
  getDailySummary(date?: string): DailyCostSummary | null {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const dayMetrics = this.dailyMetrics.get(targetDate)
    
    if (!dayMetrics || dayMetrics.length === 0) {
      return null
    }

    const totalCost = dayMetrics.reduce((sum, m) => sum + m.estimatedCost, 0)
    const requestCount = dayMetrics.length
    const totalTokens = dayMetrics.reduce((sum, m) => sum + m.totalTokens, 0)
    const promptTokens = dayMetrics.reduce((sum, m) => sum + m.promptTokens, 0)
    const completionTokens = dayMetrics.reduce((sum, m) => sum + m.completionTokens, 0)

    return {
      date: targetDate,
      totalCost,
      requestCount,
      averageCostPerRequest: totalCost / requestCount,
      tokenUsage: {
        total: totalTokens,
        prompt: promptTokens,
        completion: completionTokens
      },
      modelBreakdown: {} // TODO: implémenter si nécessaire
    }
  }

  /**
   * Récupère les alertes récentes
   */
  getRecentAlerts(hours: number = 24): CostAlert[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return this.alerts.filter(alert => alert.timestamp > cutoff)
  }

  /**
   * Nettoyage périodique des anciennes données
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 7) // Garder 7 jours
      const cutoffString = cutoffDate.toISOString().split('T')[0]

      for (const [date] of this.dailyMetrics.entries()) {
        if (date < cutoffString) {
          this.dailyMetrics.delete(date)
        }
      }

      // Nettoyer les alertes anciennes
      const alertCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
      this.alerts = this.alerts.filter(alert => alert.timestamp > alertCutoff)

    }, 60 * 60 * 1000) // Toutes les heures
  }

  /**
   * Export des métriques pour analyse
   */
  exportMetrics(): {
    dailyMetrics: Record<string, CostMetrics[]>
    alerts: CostAlert[]
    summary: {
      totalCost: number
      totalRequests: number
      totalTokens: number
      averageCostPerRequest: number
    }
  } {
    let totalCost = 0
    let totalRequests = 0
    let totalTokens = 0

    const dailyMetricsObj: Record<string, CostMetrics[]> = {}
    
    for (const [date, metrics] of this.dailyMetrics.entries()) {
      dailyMetricsObj[date] = metrics
      totalCost += metrics.reduce((sum, m) => sum + m.estimatedCost, 0)
      totalRequests += metrics.length
      totalTokens += metrics.reduce((sum, m) => sum + m.totalTokens, 0)
    }

    return {
      dailyMetrics: dailyMetricsObj,
      alerts: this.alerts,
      summary: {
        totalCost,
        totalRequests,
        totalTokens,
        averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0
      }
    }
  }
}

// Export singleton
export const costOptimizer = CostOptimizer.getInstance()

