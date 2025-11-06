/**
 * Démo de la routine V3 avec données d'exemple
 * 
 * Ce composant sert à tester l'intégration et sera remplacé
 * par l'intégration réelle avec l'IA lors du Sprint 3.
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import React from 'react';
import RoutineRefonteV3 from './RoutineRefonteV3';

// Types temporaires (identiques à RoutineRefonteV3)
type AiRoutineOutput = {
  phases: Array<{
    id: string;
    label?: string;
    durationLabel: string;
    education?: { title: string; text: string };
    slots: Record<"morning" | "evening" | "weekly", Array<{
      id: string;
      phase: string;
      routine_slot: "morning" | "evening" | "weekly";
      title: string;
      product: string;
      category: "cleanser" | "moisturizer" | "spf" | "treatment";
      is_continuous?: boolean;
      is_temporary?: boolean;
      introduce_from_week?: number;
      application_duration?: string;
      frequency?: string;
      application_instructions?: string;
      restrictions?: string[];
      target_zones?: string[];
      notes?: string;
      alternatives?: Array<{ id: string; name: string }>;
      image_url?: string;
    }>>;
  }>;
};

type DesignVariant = "A" | "B" | "C";
type Theme = "light" | "dark";

// Données d'exemple conformes à la Preview
const DEMO_ROUTINE: AiRoutineOutput = {
  phases: [
    {
      id: "immediate",
      label: "Phase Immédiate",
      durationLabel: "1–3 semaines (dictée par les traitements)",
      education: {
        title: "Objectif : Stabiliser la barrière cutanée",
        text: "On commence en douceur. Les traitements temporaires (exfoliation, actifs) dictent la durée de cette phase. Éviter la sur-stimulation.",
      },
      slots: {
        morning: [
          {
            id: "cleanse-am",
            phase: "immediate",
            routine_slot: "morning",
            title: "Nettoyage",
            product: "Bioderma Sensibio H2O Eau Micellaire",
            category: "cleanser",
            is_continuous: true,
            notes: "Nettoyant doux adapté au quotidien.",
            application_instructions: "Imbiber un coton, passer délicatement sur l'ensemble du visage. Inutile de rincer.",
            target_zones: ["Visage entier"],
            restrictions: ["Éviter le contact avec les yeux irrités"],
            alternatives: [
              { id: "alt_cetaphil_cleanser", name: "Cetaphil Gentle Skin Cleanser" },
              { id: "alt_lrp_tol", name: "La Roche-Posay Toleriane Dermo-Nettoyant" },
              { id: "alt_simple_mic", name: "Simple Micellar Water" },
            ],
          },
          {
            id: "hydrate-am",
            phase: "immediate",
            routine_slot: "morning",
            title: "Hydratation matin",
            product: "CeraVe Crème Hydratante Quotidienne",
            category: "moisturizer",
            is_continuous: true,
            notes: "Hydratant non-comédogène (céramides).",
            application_instructions: "Appliquer une noisette sur peau propre et sèche. Masser jusqu'à absorption.",
            target_zones: ["Joues", "Front", "Menton"],
            restrictions: ["Aucune particulière"],
            alternatives: [
              { id: "alt_lrp_hydreane", name: "La Roche-Posay Hydreane Légère" },
              { id: "alt_neutro_gel", name: "Neutrogena Hydro Boost Gel-Crème" },
              { id: "alt_bioderma_hydra", name: "Bioderma Hydrabio Gel-Crème" },
            ],
          },
        ],
        evening: [
          {
            id: "cleanse-pm",
            phase: "immediate",
            routine_slot: "evening",
            title: "Nettoyage",
            product: "Bioderma Sensibio H2O Eau Micellaire",
            category: "cleanser",
            is_continuous: true,
            application_instructions: "Imbiber un coton, démaquiller/nettoyer sans frotter. Répéter si nécessaire.",
            target_zones: ["Visage entier"],
            restrictions: ["Ne pas frotter les zones rouges"],
            alternatives: [
              { id: "alt_cetaphil_cleanser", name: "Cetaphil Gentle Skin Cleanser" },
              { id: "alt_lrp_tol", name: "La Roche-Posay Toleriane Dermo-Nettoyant" },
            ],
          },
          {
            id: "treat-niacinamide",
            phase: "immediate",
            routine_slot: "evening",
            title: "Traitement : irrégularités pigmentaires",
            product: "The Ordinary Niacinamide 10% + Zinc 1%",
            category: "treatment",
            is_temporary: true,
            introduce_from_week: 2,
            application_duration: "4–6 semaines",
            frequency: "daily",
            application_instructions: "Après le nettoyage, appliquer 2–3 gouttes sur les zones concernées, puis étaler. Attendre 60 s avant l'hydratant.",
            target_zones: ["Zone T", "Menton"],
            restrictions: [
              "Éviter le contour des yeux",
              "Ne pas combiner le même soir avec un autre exfoliant",
            ],
            alternatives: [
              { id: "alt_paula_niacin", name: "Paula's Choice 10% Niacinamide Booster" },
              { id: "alt_lrp_pure_niacin", name: "La Roche-Posay Pure Niacinamide 10" },
              { id: "alt_inkey_niacin", name: "The Inkey List Niacinamide" },
            ],
          },
          {
            id: "hydrate-pm",
            phase: "immediate",
            routine_slot: "evening",
            title: "Hydratation soir",
            product: "CeraVe PM Lotion Hydratante Nuit",
            category: "moisturizer",
            is_continuous: true,
            notes: "Niacinamide apaisant, soutien barrière.",
            application_instructions: "Appliquer uniformément sur le visage après le traitement. Ne pas rincer.",
            target_zones: ["Visage entier"],
            restrictions: ["Aucune particulière"],
            alternatives: [
              { id: "alt_lrp_toleriane", name: "La Roche-Posay Toleriane Sensitive" },
              { id: "alt_bioderma_atoderm", name: "Bioderma Atoderm Crème" },
              { id: "alt_uriage_light", name: "Uriage Eau Thermale Light" },
            ],
          },
        ],
        weekly: [
          {
            id: "treat-peel",
            phase: "immediate",
            routine_slot: "weekly",
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
              "Ne pas utiliser après rasage (24 h)",
              "Ne pas associer la même semaine à un autre peeling fort",
              "Éviter yeux/lèvres/plaies",
            ],
            alternatives: [
              { id: "alt_paula_bha", name: "Paula's Choice Skin Perfecting 2% BHA" },
              { id: "alt_cosrx_bha", name: "COSRX BHA Blackhead Power Liquid" },
              { id: "alt_theordinary_lactic", name: "The Ordinary Lactic Acid 5%" },
            ],
          },
        ],
      },
    },
    {
      id: "adaptation",
      label: "Phase d'Adaptation",
      durationLabel: "4–6 semaines (selon tolérance)",
      education: {
        title: "Objectif : Introduire progressivement des actifs",
        text: "Augmenter la puissance ou la fréquence si la tolérance est bonne. On évite les changements multiples simultanés.",
      },
      slots: {
        morning: [
          {
            id: "cleanse-am-2",
            phase: "adaptation",
            routine_slot: "morning",
            title: "Nettoyage",
            product: "Bioderma Sensibio H2O Eau Micellaire",
            category: "cleanser",
            is_continuous: true,
            application_instructions: "Passer délicatement un coton imbibé sur l'ensemble du visage.",
            target_zones: ["Visage entier"],
            restrictions: ["Aucune particulière"],
            alternatives: [],
          },
          {
            id: "hydrate-am-2",
            phase: "adaptation",
            routine_slot: "morning",
            title: "Hydratation matin",
            product: "CeraVe Crème Hydratante Quotidienne",
            category: "moisturizer",
            is_continuous: true,
            application_instructions: "Appliquer une noisette, masser jusqu'à absorption.",
            target_zones: ["Joues", "Front"],
            restrictions: ["Aucune particulière"],
            alternatives: [],
          },
        ],
        evening: [
          {
            id: "cleanse-pm-2",
            phase: "adaptation",
            routine_slot: "evening",
            title: "Nettoyage",
            product: "Bioderma Sensibio H2O Eau Micellaire",
            category: "cleanser",
            is_continuous: true,
            application_instructions: "Nettoyer sans frotter. Sécher par tapotements.",
            target_zones: ["Visage entier"],
            restrictions: ["Éviter zones irritées"],
            alternatives: [],
          },
          {
            id: "treat-niacinamide-continue",
            phase: "adaptation",
            routine_slot: "evening",
            title: "Traitement : irrégularités pigmentaires",
            product: "The Ordinary Niacinamide 10% + Zinc 1%",
            category: "treatment",
            is_temporary: true,
            introduce_from_week: 1,
            application_duration: "poursuivre si bénéfice",
            frequency: "daily",
            application_instructions: "Appliquer localement (Zone T/menton), puis étaler finement.",
            target_zones: ["Zone T", "Menton"],
            restrictions: ["Éviter contour des yeux"],
            alternatives: [],
          },
          {
            id: "hydrate-pm-2",
            phase: "adaptation",
            routine_slot: "evening",
            title: "Hydratation soir",
            product: "CeraVe PM Lotion Hydratante Nuit",
            category: "moisturizer",
            is_continuous: true,
            application_instructions: "Appliquer uniformément sur le visage après les actifs.",
            target_zones: ["Visage entier"],
            restrictions: ["Aucune particulière"],
            alternatives: [],
          },
        ],
        weekly: [
          {
            id: "weekly-mask",
            phase: "adaptation",
            routine_slot: "weekly",
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
              { id: "alt_lrp_cicaplast", name: "La Roche-Posay Cicaplast B5 Masque" },
              { id: "alt_urea_mask", name: "UreaRepair Mask" },
              { id: "alt_drjart_cicapair", name: "Dr.Jart+ Cicapair Masque" },
            ],
          },
        ],
      },
    },
    {
      id: "maintenance",
      label: "Phase de Maintenance",
      durationLabel: "Continu",
      education: {
        title: "Objectif : Maintenir les acquis",
        text: "Stabiliser la routine, prévenir les rechutes, ajuster les actifs au besoin (rythmes adaptés).",
      },
      slots: {
        morning: [
          {
            id: "cleanse-am-3",
            phase: "maintenance",
            routine_slot: "morning",
            title: "Nettoyage",
            product: "Bioderma Sensibio H2O Eau Micellaire",
            category: "cleanser",
            is_continuous: true,
            application_instructions: "Nettoyer en douceur, ne pas frotter les zones sensibles.",
            target_zones: ["Visage entier"],
            restrictions: ["Aucune particulière"],
            alternatives: [],
          },
          {
            id: "spf-1",
            phase: "maintenance",
            routine_slot: "morning",
            title: "Protection solaire",
            product: "La Roche-Posay Anthelios Clear Skin SPF 60",
            category: "spf",
            is_continuous: true,
            notes: "Non-comédogène, prévention taches & photo-vieillissement.",
            application_instructions: "Appliquer 2 doigts de produit sur visage/cou en dernière étape. Renouveler toutes les 2–3 h si exposition.",
            target_zones: ["Visage", "Cou"],
            restrictions: ["Éviter contact avec yeux"],
            alternatives: [
              { id: "alt_eucerin_oil", name: "Eucerin Oil Control SPF50+" },
              { id: "alt_bioderma_photoderm", name: "Bioderma Photoderm Aquafluid SPF50+" },
              { id: "alt_isdin_fusion", name: "ISDIN Fusion Water SPF50" },
            ],
          },
        ],
        evening: [
          {
            id: "cleanse-pm-3",
            phase: "maintenance",
            routine_slot: "evening",
            title: "Nettoyage",
            product: "Bioderma Sensibio H2O Eau Micellaire",
            category: "cleanser",
            is_continuous: true,
            application_instructions: "Nettoyer/démaquiller le soir avant soins.",
            target_zones: ["Visage entier"],
            restrictions: ["Aucune particulière"],
            alternatives: [],
          },
          {
            id: "treat-niacinamide-maintain",
            phase: "maintenance",
            routine_slot: "evening",
            title: "Traitement : maintien irrégularités pigmentaires",
            product: "The Ordinary Niacinamide 10% + Zinc 1%",
            category: "treatment",
            is_temporary: true,
            introduce_from_week: 1,
            application_duration: "selon résultats",
            frequency: "3–5x/week",
            application_instructions: "Appliquer localement sur zones concernées, puis étaler finement.",
            target_zones: ["Zone T", "Menton"],
            restrictions: ["Éviter contour des yeux"],
            alternatives: [],
          },
          {
            id: "hydrate-pm-3",
            phase: "maintenance",
            routine_slot: "evening",
            title: "Hydratation soir",
            product: "CeraVe PM Lotion Hydratante Nuit",
            category: "moisturizer",
            is_continuous: true,
            application_instructions: "Terminer par une couche uniforme sur tout le visage.",
            target_zones: ["Visage entier"],
            restrictions: ["Aucune particulière"],
            alternatives: [],
          },
        ],
        weekly: [
          {
            id: "weekly-exfo-soft",
            phase: "maintenance",
            routine_slot: "weekly",
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
              "Éviter zones eczémateuses",
            ],
            alternatives: [
              { id: "alt_theordinary_salic", name: "The Ordinary Salicylic Acid 2%" },
              { id: "alt_cosrx_bha", name: "COSRX BHA Blackhead Power Liquid" },
              { id: "alt_innisfree_bha", name: "Innisfree BHA Trouble Skin" },
            ],
          },
        ],
      },
    },
  ],
};

interface RoutineV3DemoProps {
  variant?: DesignVariant;
  initialTheme?: Theme;
}

export default function RoutineV3Demo({ 
  variant = "A", 
  initialTheme = "light" 
}: RoutineV3DemoProps) {
  const handleAnalyticsEvent = (event: string, data: any) => {
    console.log(`[routine-demo:${event}]`, data);
  };

  return (
    <RoutineRefonteV3 
      routine={DEMO_ROUTINE}
      variant={variant}
      initialTheme={initialTheme}
      onAnalyticsEvent={handleAnalyticsEvent}
    />
  );
}
