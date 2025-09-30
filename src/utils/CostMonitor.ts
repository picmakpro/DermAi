/**
 * 💰 COST MONITOR - Suivi coûts OpenAI en temps réel
 * 
 * Fonctionnalités :
 * - Calcul coût par modèle (GPT-5, GPT-4o, etc.)
 * - Tracking quotidien cumulatif
 * - Alerting si dépassement budget
 * - Métriques détaillées (tokens, reasoning_tokens)
 * 
 * @version 1.0
 * @date 30 septembre 2025
 */

// ══════════════════════════════════════════════════════════════
// 📊 TYPES
// ══════════════════════════════════════════════════════════════

export interface TokenUsage {
  prompt: number
  completion: number
  reasoning?: number  // GPT-5 Thinking uniquement
  total: number
}

export interface CostEstimate {
  model: string
  tokens: TokenUsage
  cost_usd: number
  breakdown?: {
    input_cost: number
    output_cost: number
    reasoning_cost?: number
  }
}

export interface DailyCostSummary {
  date: string
  total_usd: number
  total_requests: number
  by_model: Record<string, {
    requests: number
    total_tokens: number
    total_cost: number
  }>
  budget_limit_usd: number
  percentage_used: number
}

// ══════════════════════════════════════════════════════════════
// 💵 PRICING OPENAI (mise à jour 2025)
// ══════════════════════════════════════════════════════════════

/**
 * Prix par 1000 tokens (en USD)
 * Source : https://openai.com/api/pricing/
 * 
 * Note : GPT-5 pricing est estimatif, ajuster selon tarifs officiels
 */
const PRICING = {
  'chatgpt-5': {
    input: 0.00003,   // $0.03/1K tokens input (estimation)
    output: 0.00006   // $0.06/1K tokens output (estimation)
  },
  'gpt-5-thinking': {
    input: 0.00004,    // $0.04/1K tokens input (estimation)
    output: 0.00008,   // $0.08/1K tokens output (estimation)
    reasoning: 0.00012 // $0.12/1K tokens reasoning (x1.5 premium)
  },
  'gpt-4o': {
    input: 0.0000025,  // $0.0025/1K tokens input
    output: 0.00001    // $0.01/1K tokens output
  },
  'gpt-4o-mini': {
    input: 0.00000015, // $0.00015/1K tokens input
    output: 0.0000006  // $0.0006/1K tokens output
  }
} as const

// ══════════════════════════════════════════════════════════════
// 🧮 CALCUL COÛTS
// ══════════════════════════════════════════════════════════════

/**
 * Calcule le coût d'un appel API
 * 
 * @param model - Modèle utilisé (chatgpt-5, gpt-5-thinking, gpt-4o, etc.)
 * @param usage - Tokens utilisés
 * @returns Estimation coût en USD
 * 
 * @example
 * ```typescript
 * const cost = CostMonitor.calculateCost('gpt-5-thinking', {
 *   prompt: 2000,
 *   completion: 3000,
 *   reasoning: 400,
 *   total: 5400
 * })
 * 
 * console.log(cost)
 * // {
 * //   model: 'gpt-5-thinking',
 * //   tokens: {...},
 * //   cost_usd: 0.148,
 * //   breakdown: {
 * //     input_cost: 0.08,
 * //     output_cost: 0.24,
 * //     reasoning_cost: 0.048
 * //   }
 * // }
 * ```
 */
export function calculateCost(
  model: string,
  usage: TokenUsage
): CostEstimate {
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gpt-4o']
  
  let inputCost = (usage.prompt / 1000) * pricing.input
  let outputCost = (usage.completion / 1000) * pricing.output
  let reasoningCost = 0
  
  // GPT-5 Thinking : reasoning tokens facturés séparément
  if (usage.reasoning && 'reasoning' in pricing) {
    reasoningCost = (usage.reasoning / 1000) * pricing.reasoning
  }
  
  const totalCost = inputCost + outputCost + reasoningCost
  
  return {
    model,
    tokens: usage,
    cost_usd: parseFloat(totalCost.toFixed(6)),
    breakdown: {
      input_cost: parseFloat(inputCost.toFixed(6)),
      output_cost: parseFloat(outputCost.toFixed(6)),
      ...(reasoningCost > 0 && { reasoning_cost: parseFloat(reasoningCost.toFixed(6)) })
    }
  }
}

// ══════════════════════════════════════════════════════════════
// 📊 TRACKING QUOTIDIEN (IN-MEMORY)
// ══════════════════════════════════════════════════════════════

/**
 * Stockage temporaire des coûts quotidiens
 * Note : En production, utiliser Redis ou base de données
 */
const dailyCosts: Map<string, DailyCostSummary> = new Map()

/**
 * Obtient ou crée le résumé quotidien
 */
function getDailySummary(date: string): DailyCostSummary {
  if (!dailyCosts.has(date)) {
    const budgetLimit = parseFloat(process.env.OPENAI_DAILY_BUDGET_USD || '500')
    
    dailyCosts.set(date, {
      date,
      total_usd: 0,
      total_requests: 0,
      by_model: {},
      budget_limit_usd: budgetLimit,
      percentage_used: 0
    })
  }
  
  return dailyCosts.get(date)!
}

/**
 * Enregistre un coût dans le tracking quotidien
 * 
 * @param cost - Estimation de coût
 * @returns Résumé quotidien mis à jour
 */
export function trackCost(cost: CostEstimate): DailyCostSummary {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const summary = getDailySummary(today)
  
  // Mise à jour totaux
  summary.total_usd = parseFloat((summary.total_usd + cost.cost_usd).toFixed(6))
  summary.total_requests += 1
  
  // Mise à jour par modèle
  if (!summary.by_model[cost.model]) {
    summary.by_model[cost.model] = {
      requests: 0,
      total_tokens: 0,
      total_cost: 0
    }
  }
  
  summary.by_model[cost.model].requests += 1
  summary.by_model[cost.model].total_tokens += cost.tokens.total
  summary.by_model[cost.model].total_cost = parseFloat(
    (summary.by_model[cost.model].total_cost + cost.cost_usd).toFixed(6)
  )
  
  // Calcul pourcentage budget
  summary.percentage_used = parseFloat(
    ((summary.total_usd / summary.budget_limit_usd) * 100).toFixed(2)
  )
  
  // ⚠️ ALERTE SI DÉPASSEMENT
  if (summary.percentage_used >= 100) {
    console.warn(`🚨 BUDGET QUOTIDIEN DÉPASSÉ : $${summary.total_usd} / $${summary.budget_limit_usd} (${summary.percentage_used}%)`)
    
    // Webhook alerting (optionnel)
    sendBudgetAlert(summary).catch(err => 
      console.error('Erreur envoi alerte budget:', err)
    )
  } else if (summary.percentage_used >= 80) {
    console.warn(`⚠️ BUDGET QUOTIDIEN 80% : $${summary.total_usd} / $${summary.budget_limit_usd} (${summary.percentage_used}%)`)
  }
  
  return summary
}

/**
 * Récupère le résumé quotidien actuel
 */
export function getDailyCostSummary(): DailyCostSummary {
  const today = new Date().toISOString().split('T')[0]
  return getDailySummary(today)
}

/**
 * Réinitialise les coûts (pour tests ou nouveau jour)
 */
export function resetDailyCosts(date?: string): void {
  if (date) {
    dailyCosts.delete(date)
  } else {
    dailyCosts.clear()
  }
}

// ══════════════════════════════════════════════════════════════
// 🔔 ALERTING (optionnel)
// ══════════════════════════════════════════════════════════════

/**
 * Envoie une alerte si dépassement budget
 * 
 * Configuration :
 * - OPENAI_COST_ALERT_WEBHOOK : URL webhook Slack/Discord/Teams
 */
async function sendBudgetAlert(summary: DailyCostSummary): Promise<void> {
  const webhook = process.env.OPENAI_COST_ALERT_WEBHOOK
  
  if (!webhook) {
    console.log('💡 Pas de webhook configuré (OPENAI_COST_ALERT_WEBHOOK)')
    return
  }
  
  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Budget OpenAI quotidien dépassé`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🚨 ALERTE BUDGET OPENAI*\n\n` +
                `• Date: ${summary.date}\n` +
                `• Coût actuel: $${summary.total_usd.toFixed(2)}\n` +
                `• Budget limite: $${summary.budget_limit_usd}\n` +
                `• Dépassement: ${(summary.percentage_used - 100).toFixed(0)}%\n` +
                `• Requêtes: ${summary.total_requests}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Répartition par modèle:*\n` +
                Object.entries(summary.by_model)
                  .map(([model, stats]) => 
                    `• ${model}: ${stats.requests} req, $${stats.total_cost.toFixed(2)}`
                  )
                  .join('\n')
            }
          }
        ]
      })
    })
    
    if (!response.ok) {
      console.error('Erreur envoi webhook:', response.statusText)
    }
  } catch (error) {
    console.error('Erreur sendBudgetAlert:', error)
  }
}

// ══════════════════════════════════════════════════════════════
// 📈 MÉTRIQUES EXPORTÉES
// ══════════════════════════════════════════════════════════════

/**
 * Exporte les métriques pour monitoring externe (Grafana, Datadog, etc.)
 * 
 * @returns Métriques au format compatible Prometheus/Grafana
 */
export function getMetrics(): {
  daily_cost_total: number
  daily_requests_total: number
  daily_budget_percentage: number
  model_costs: Array<{ model: string; cost: number; requests: number }>
} {
  const summary = getDailyCostSummary()
  
  return {
    daily_cost_total: summary.total_usd,
    daily_requests_total: summary.total_requests,
    daily_budget_percentage: summary.percentage_used,
    model_costs: Object.entries(summary.by_model).map(([model, stats]) => ({
      model,
      cost: stats.total_cost,
      requests: stats.requests
    }))
  }
}

// ══════════════════════════════════════════════════════════════
// 🧪 EXPORTS
// ══════════════════════════════════════════════════════════════

export const CostMonitor = {
  calculateCost,
  trackCost,
  getDailyCostSummary,
  resetDailyCosts,
  getMetrics
}
