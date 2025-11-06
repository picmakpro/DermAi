/**
 * Service de test pour générer une routine V3 compatible
 * 
 * Simule la sortie de l'Étape 4 optimisée avec format V3
 * pour tester l'intégration dans /results
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

export class RoutineV3TestService {
  
  /**
   * Générer une routine de test au format V3
   */
  static generateTestRoutine() {
    return {
      phases: [
        {
          id: "immediate",
          label: "Phase Immédiate",
          durationLabel: "1–3 semaines (dictée par les traitements)",
          education: {
            title: "Objectif : Stabiliser la barrière cutanée",
            text: "Cette phase prépare votre peau en douceur. Les traitements temporaires dictent la durée pour éviter la sur-stimulation."
          },
          slots: {
            morning: [
              {
                id: "cleanse-am-immediate",
                title: "Nettoyage",
                product: "Bioderma Sensibio H2O Eau Micellaire",
                category: "cleanser",
                is_continuous: true,
                application_instructions: "Imbiber un coton, passer délicatement sur l'ensemble du visage. Inutile de rincer.",
                target_zones: ["Visage entier"],
                restrictions: ["Éviter le contact avec les yeux irrités"],
                alternatives: [
                  { id: "alt_cetaphil", name: "Cetaphil Gentle Skin Cleanser" },
                  { id: "alt_lrp", name: "La Roche-Posay Toleriane Dermo-Nettoyant" }
                ]
              },
              {
                id: "hydrate-am-immediate",
                title: "Hydratation matin",
                product: "CeraVe Crème Hydratante Quotidienne",
                category: "moisturizer",
                is_continuous: true,
                application_instructions: "Appliquer une noisette sur peau propre et sèche. Masser jusqu'à absorption.",
                target_zones: ["Joues", "Front", "Menton"],
                restrictions: [],
                alternatives: [
                  { id: "alt_neutrogena", name: "Neutrogena Hydro Boost Gel-Crème" },
                  { id: "alt_bioderma", name: "Bioderma Hydrabio Gel-Crème" }
                ]
              }
            ],
            evening: [
              {
                id: "cleanse-pm-immediate",
                title: "Nettoyage",
                product: "Bioderma Sensibio H2O Eau Micellaire",
                category: "cleanser",
                is_continuous: true,
                application_instructions: "Démaquiller puis nettoyer sans frotter. Répéter si nécessaire.",
                target_zones: ["Visage entier"],
                restrictions: ["Ne pas frotter les zones rouges"],
                alternatives: []
              },
              {
                id: "treat-niacinamide-immediate",
                title: "Traitement : irrégularités pigmentaires",
                product: "The Ordinary Niacinamide 10% + Zinc 1%",
                category: "treatment",
                is_temporary: true,
                introduce_from_week: 2,
                application_duration: "4–6 semaines",
                frequency: "daily",
                application_instructions: "Après le nettoyage, appliquer 2–3 gouttes sur les zones concernées, puis étaler. Attendre 60s avant l'hydratant.",
                target_zones: ["Zone T", "Menton"],
                restrictions: [
                  "Éviter le contour des yeux",
                  "Ne pas combiner le même soir avec un autre exfoliant"
                ],
                alternatives: [
                  { id: "alt_paula", name: "Paula's Choice 10% Niacinamide Booster" },
                  { id: "alt_inkey", name: "The Inkey List Niacinamide" }
                ]
              },
              {
                id: "hydrate-pm-immediate",
                title: "Hydratation soir",
                product: "CeraVe PM Lotion Hydratante Nuit",
                category: "moisturizer",
                is_continuous: true,
                application_instructions: "Appliquer uniformément sur le visage après le traitement. Ne pas rincer.",
                target_zones: ["Visage entier"],
                restrictions: [],
                alternatives: []
              }
            ],
            weekly: [
              {
                id: "exfoliation-immediate",
                title: "Exfoliation chimique (AHA/BHA)",
                product: "The Ordinary AHA 30% + BHA 2% Peeling Solution",
                category: "treatment",
                is_temporary: true,
                introduce_from_week: 1,
                application_duration: "3 semaines max / jusqu'à disparition de la desquamation",
                frequency: "1x/week",
                application_instructions: "Le soir, sur peau sèche, appliquer en fine couche 8–10 min, rincer abondamment. SPF renforcé le lendemain.",
                target_zones: ["Joues", "Front"],
                restrictions: [
                  "Ne pas utiliser après rasage (24h)",
                  "Ne pas associer la même semaine à un autre peeling fort",
                  "Éviter yeux/lèvres/plaies"
                ],
                alternatives: [
                  { id: "alt_paula_bha", name: "Paula's Choice Skin Perfecting 2% BHA" },
                  { id: "alt_cosrx", name: "COSRX BHA Blackhead Power Liquid" }
                ]
              }
            ]
          }
        },
        {
          id: "adaptation",
          label: "Phase d'Adaptation",
          durationLabel: "4–6 semaines (selon tolérance)",
          education: {
            title: "Objectif : Introduire progressivement des actifs",
            text: "Augmentation graduelle de la puissance ou fréquence selon votre tolérance. Éviter les changements multiples simultanés."
          },
          slots: {
            morning: [
              {
                id: "cleanse-am-adaptation",
                title: "Nettoyage",
                product: "Bioderma Sensibio H2O Eau Micellaire",
                category: "cleanser",
                is_continuous: true,
                application_instructions: "Passer délicatement un coton imbibé sur l'ensemble du visage.",
                target_zones: ["Visage entier"],
                restrictions: [],
                alternatives: []
              },
              {
                id: "hydrate-am-adaptation",
                title: "Hydratation matin",
                product: "CeraVe Crème Hydratante Quotidienne",
                category: "moisturizer",
                is_continuous: true,
                application_instructions: "Appliquer une noisette, masser jusqu'à absorption.",
                target_zones: ["Joues", "Front"],
                restrictions: [],
                alternatives: []
              }
            ],
            evening: [
              {
                id: "cleanse-pm-adaptation",
                title: "Nettoyage",
                product: "Bioderma Sensibio H2O Eau Micellaire",
                category: "cleanser",
                is_continuous: true,
                application_instructions: "Nettoyer sans frotter. Sécher par tapotements.",
                target_zones: ["Visage entier"],
                restrictions: ["Éviter zones irritées"],
                alternatives: []
              },
              {
                id: "treat-continue-adaptation",
                title: "Traitement : maintien irrégularités",
                product: "The Ordinary Niacinamide 10% + Zinc 1%",
                category: "treatment",
                is_temporary: true,
                introduce_from_week: 1,
                application_duration: "poursuivre si bénéfice",
                frequency: "daily",
                application_instructions: "Appliquer localement (Zone T/menton), puis étaler finement.",
                target_zones: ["Zone T", "Menton"],
                restrictions: ["Éviter contour des yeux"],
                alternatives: []
              },
              {
                id: "hydrate-pm-adaptation",
                title: "Hydratation soir",
                product: "CeraVe PM Lotion Hydratante Nuit",
                category: "moisturizer",
                is_continuous: true,
                application_instructions: "Appliquer uniformément sur le visage après les actifs.",
                target_zones: ["Visage entier"],
                restrictions: [],
                alternatives: []
              }
            ],
            weekly: [
              {
                id: "mask-adaptation",
                title: "Masque apaisant",
                product: "Avène Masque Apaisant Hydratant",
                category: "treatment",
                is_temporary: true,
                introduce_from_week: 1,
                application_duration: "selon besoin",
                frequency: "1–2x/week",
                application_instructions: "Appliquer en couche généreuse 10–15 min, retirer l'excédent.",
                target_zones: ["Joues"],
                restrictions: ["Éviter plaies ouvertes"],
                alternatives: [
                  { id: "alt_lrp_cicaplast", name: "La Roche-Posay Cicaplast B5 Masque" }
                ]
              }
            ]
          }
        },
        {
          id: "maintenance",
          label: "Phase de Maintenance",
          durationLabel: "Continu",
          education: {
            title: "Objectif : Maintenir les acquis",
            text: "Stabilisation de la routine et prévention des rechutes. Ajustements possibles selon les résultats obtenus."
          },
          slots: {
            morning: [
              {
                id: "cleanse-am-maintenance",
                title: "Nettoyage",
                product: "Bioderma Sensibio H2O Eau Micellaire",
                category: "cleanser",
                is_continuous: true,
                application_instructions: "Nettoyer en douceur, ne pas frotter les zones sensibles.",
                target_zones: ["Visage entier"],
                restrictions: [],
                alternatives: []
              },
              {
                id: "spf-maintenance",
                title: "Protection solaire",
                product: "La Roche-Posay Anthelios Clear Skin SPF 60",
                category: "spf",
                is_continuous: true,
                application_instructions: "Appliquer 2 doigts de produit sur visage/cou en dernière étape. Renouveler toutes les 2–3h si exposition.",
                target_zones: ["Visage", "Cou"],
                restrictions: ["Éviter contact avec yeux"],
                alternatives: [
                  { id: "alt_eucerin", name: "Eucerin Oil Control SPF50+" },
                  { id: "alt_bioderma_spf", name: "Bioderma Photoderm Aquafluid SPF50+" }
                ]
              }
            ],
            evening: [
              {
                id: "cleanse-pm-maintenance",
                title: "Nettoyage",
                product: "Bioderma Sensibio H2O Eau Micellaire",
                category: "cleanser",
                is_continuous: true,
                application_instructions: "Nettoyer/démaquiller le soir avant soins.",
                target_zones: ["Visage entier"],
                restrictions: [],
                alternatives: []
              },
              {
                id: "treat-maintain",
                title: "Traitement : maintien irrégularités",
                product: "The Ordinary Niacinamide 10% + Zinc 1%",
                category: "treatment",
                is_temporary: true,
                introduce_from_week: 1,
                application_duration: "selon résultats",
                frequency: "3–5x/week",
                application_instructions: "Appliquer localement sur zones concernées, puis étaler finement.",
                target_zones: ["Zone T", "Menton"],
                restrictions: ["Éviter contour des yeux"],
                alternatives: []
              },
              {
                id: "hydrate-pm-maintenance",
                title: "Hydratation soir",
                product: "CeraVe PM Lotion Hydratante Nuit",
                category: "moisturizer",
                is_continuous: true,
                application_instructions: "Terminer par une couche uniforme sur tout le visage.",
                target_zones: ["Visage entier"],
                restrictions: [],
                alternatives: []
              }
            ],
            weekly: [
              {
                id: "exfoliation-maintenance",
                title: "Exfoliation douce",
                product: "Paula's Choice BHA 2%",
                category: "treatment",
                is_temporary: true,
                introduce_from_week: 1,
                application_duration: "long terme si toléré",
                frequency: "1x/week",
                application_instructions: "Après nettoyage, appliquer sur coton 1x/sem. Ne pas rincer. SPF le lendemain.",
                target_zones: ["Nez", "Front"],
                restrictions: [
                  "Éviter association le même soir avec peeling fort",
                  "Éviter zones eczémateuses"
                ],
                alternatives: [
                  { id: "alt_ordinary_salic", name: "The Ordinary Salicylic Acid 2%" },
                  { id: "alt_cosrx_bha", name: "COSRX BHA Blackhead Power Liquid" }
                ]
              }
            ]
          }
        }
      ]
    };
  }

  /**
   * Injecter routine V3 dans une analyse existante
   */
  static injectV3IntoAnalysis(analysis: any) {
    if (!analysis) return analysis;
    
    return {
      ...analysis,
      uiRoutine: this.generateTestRoutine()
    };
  }
}
