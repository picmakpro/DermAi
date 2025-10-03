/**
 * 🌍 UV RISK CALCULATOR
 * Calcul risque UV selon latitude et mois pour adaptation SPF
 * Sprint 0 - Fondations
 */

export type UvBand = "Low" | "Moderate" | "High" | "VeryHigh";

/**
 * Calcule le risque UV selon latitude et mois
 * @param lat Latitude (-90 à 90)
 * @param month Mois (1-12)
 * @returns Bande de risque UV
 */
export function uvRiskFromLatMonth(lat: number, month: number): UvBand {
  const abs = Math.abs(lat);
  
  // Latitudes élevées (>50°) : rayonnement faible sauf été
  if (abs >= 50) {
    if ([6, 7, 8].includes(month)) return "High";
    if ([5, 9].includes(month)) return "Moderate";
    return "Low";
  }
  
  // Latitudes moyennes (30-50°) : rayonnement modéré à élevé
  if (abs >= 30) {
    if ([6, 7, 8].includes(month)) return "VeryHigh";
    if ([4, 5, 9, 10].includes(month)) return "High";
    return "Moderate";
  }
  
  // Latitudes basses (<30°) : rayonnement fort toute l'année
  return "VeryHigh";
}

/**
 * Fallback latitude par pays si coords non fournies
 * @param country Code pays ou nom
 * @returns Latitude approximative
 */
export function fallbackLatFromCountry(country: string): number {
  const countryLats: Record<string, number> = {
    'France': 46.0,
    'FR': 46.0,
    'Belgique': 50.5,
    'BE': 50.5,
    'Suisse': 47.0,
    'CH': 47.0,
    'Canada': 56.0,
    'CA': 56.0,
    'Maroc': 32.0,
    'MA': 32.0,
    'Tunisie': 34.0,
    'TN': 34.0,
    'Algérie': 28.0,
    'DZ': 28.0,
    'Sénégal': 14.5,
    'SN': 14.5,
    'Côte d\'Ivoire': 7.5,
    'CI': 7.5,
    'Madagascar': -19.0,
    'MG': -19.0,
    'Espagne': 40.0,
    'ES': 40.0,
    'Italie': 42.0,
    'IT': 42.0,
    'Allemagne': 51.0,
    'DE': 51.0,
    'Royaume-Uni': 52.5,
    'UK': 52.5,
    'GB': 52.5,
    'Pays-Bas': 52.0,
    'NL': 52.0,
    'Norvège': 60.0,
    'NO': 60.0,
    'Suède': 62.0,
    'SE': 62.0,
    'États-Unis': 38.0,
    'US': 38.0,
    'USA': 38.0,
    'Mexique': 23.0,
    'MX': 23.0,
    'Brésil': -10.0,
    'BR': -10.0,
    'Argentine': -34.0,
    'AR': -34.0,
    'Australie': -25.0,
    'AU': -25.0,
    'Nouvelle-Zélande': -41.0,
    'NZ': -41.0,
  };
  
  return countryLats[country] || 45.0; // Défaut: latitude moyenne Europe
}

/**
 * Politique SPF dérivée du risque UV (pour micro-copy UI)
 */
export function uvPolicyMessage(uvBand: UvBand): string {
  const messages = {
    Low: "Renouveler si exposition prolongée",
    Moderate: "Renouveler toutes les 2-3h en extérieur",
    High: "Renouveler toutes les 2h + protection recommandée",
    VeryHigh: "Renouveler toutes les 2h + chapeau/lunettes conseillés"
  };
  return messages[uvBand];
}

