/**
 * DermAI – Routine personnalisée refondée V3
 * 
 * Architecture: Onglets Phase → Slots (Matin/Soir/Hebdo)
 * Variantes: Clinical/Glow/Editorial (A/B/C)
 * Principe: Mapping pur des données IA, zéro inférence métier
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  CalendarDays,
  Droplets,
  ShieldHalf,
  Sparkles,
  FlaskConical,
  Bath,
  Info,
  X,
  ShoppingCart,
  RefreshCcw,
  Hourglass,
  Lightbulb,
  AlertCircle,
  Eye,
  Target,
  HelpCircle
} from "lucide-react";

// Types temporaires pour compilation (seront remplacés par imports)
type AiRoutineOutput = {
  phases: AiRoutinePhase[];
};

type AiRoutinePhase = {
  id: string;
  label?: string;
  durationLabel: string;
  education?: { title: string; text: string };
  slots: Record<Slot, AiRoutineItem[]>;
};

type AiRoutineItem = {
  id: string;
  phase: string;
  routine_slot: Slot;
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
};

type Slot = "morning" | "evening" | "weekly";
type DesignVariant = "A" | "B" | "C";
type Theme = "light" | "dark";
type ProductOverride = { product: string; imgSeed?: string; imgSrc?: string };

// ===== DONNÉES D'EXEMPLE (remplacées par props.routine) =====

const productImages: Record<string, string> = {
  "Bioderma Sensibio H2O Eau Micellaire":
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop",
  "CeraVe Crème Hydratante Quotidienne":
    "https://images.unsplash.com/photo-1604908812581-4054e9c3c9a4?q=80&w=600&auto=format&fit=crop",
  "CeraVe PM Lotion Hydratante Nuit":
    "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?q=80&w=600&auto=format&fit=crop",
  "The Ordinary Niacinamide 10% + Zinc 1%":
    "https://images.unsplash.com/photo-1603655885943-0a3b4a3e7b4a?q=80&w=600&auto=format&fit=crop",
  "The Ordinary AHA 30% + BHA 2% Peeling Solution":
    "https://images.unsplash.com/photo-1606122017369-d782bbb78f32?q=80&w=600&auto=format&fit=crop",
  "Avène Masque Apaisant Hydratant":
    "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600&auto=format&fit=crop",
  "Paula's Choice BHA 2%":
    "https://images.unsplash.com/photo-1585386959984-a41552231658?q=80&w=600&auto=format&fit=crop",
  "La Roche-Posay Anthelios Clear Skin SPF 60":
    "https://images.unsplash.com/photo-1618354691673-8ed615d6021f?q=80&w=600&auto=format&fit=crop",
};

function productImg(name: string): string | undefined {
  return productImages[name];
}

function buyUrl(name: string): string {
  const base = "https://www.amazon.fr/s?k=";
  return base + encodeURIComponent(name);
}

// ===== DESIGN SYSTEM COMPONENTS =====

function getVariantStyles(variant: DesignVariant) {
  const styles = {
    A: {
      // Clinical Minimal
      container: "bg-white dark:bg-zinc-950",
      card: "bg-white border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(20,20,20,0.04)] dark:bg-zinc-950 dark:border-zinc-800",
      cardGlow: "",
      button: {
        primary: "bg-gradient-to-r from-[#8F7BFF] to-[#5A4AE3] text-white shadow-sm hover:shadow-md transition-all duration-300",
        secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
      },
      typography: {
        title: "font-medium text-gray-900 dark:text-white",
        subtitle: "text-gray-600 dark:text-zinc-400",
        body: "text-gray-800 dark:text-zinc-200"
      }
    },
    B: {
      // Card Glow
      container: "bg-gradient-to-br from-[#FDF9F7] to-white dark:from-zinc-950 dark:to-zinc-900",
      card: "bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(143,123,255,0.08)] dark:bg-zinc-900/70 dark:border-zinc-700/30",
      cardGlow: "hover:shadow-[0_12px_40px_rgba(143,123,255,0.15)] hover:border-[#8F7BFF]/20",
      button: {
        primary: "bg-gradient-to-r from-[#8F7BFF] to-[#5A4AE3] text-white shadow-[0_4px_16px_rgba(143,123,255,0.3)] hover:shadow-[0_8px_24px_rgba(143,123,255,0.4)] transition-all duration-300",
        secondary: "bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/90 dark:bg-zinc-800/70 dark:border-zinc-600/30 dark:text-zinc-100 dark:hover:bg-zinc-800/90"
      },
      typography: {
        title: "font-semibold text-gray-900 dark:text-white",
        subtitle: "text-gray-600 dark:text-zinc-400",
        body: "text-gray-800 dark:text-zinc-200"
      }
    },
    C: {
      // Editorial Soft
      container: "bg-[#FDF9F7] dark:bg-zinc-950",
      card: "bg-white border border-[#EAD9D1]/30 rounded-3xl shadow-[0_16px_48px_rgba(20,20,20,0.08)] dark:bg-zinc-900 dark:border-zinc-800",
      cardGlow: "",
      button: {
        primary: "bg-gradient-to-r from-[#8F7BFF] to-[#5A4AE3] text-white shadow-lg hover:shadow-xl transition-all duration-300",
        secondary: "bg-[#EAD9D1]/20 border border-[#EAD9D1] text-gray-700 hover:bg-[#EAD9D1]/30 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-700"
      },
      typography: {
        title: "font-bold text-gray-900 dark:text-white",
        subtitle: "text-gray-700 dark:text-zinc-300",
        body: "text-gray-800 dark:text-zinc-200"
      }
    }
  };
  return styles[variant];
}

// ===== UI COMPONENTS =====

function ThemeToggle({ 
  theme, 
  setTheme, 
  variant 
}: { 
  theme: Theme; 
  setTheme: (t: Theme) => void; 
  variant: DesignVariant; 
}) {
  const styles = getVariantStyles(variant);
  const other = theme === "dark" ? "light" : "dark";
  
  return (
    <button
      onClick={() => setTheme(other)}
      className={`inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300 ${styles.button.secondary}`}
      aria-label="Basculer le thème"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="font-medium">{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
    </button>
  );
}

function SlotSwitch({ 
  active, 
  onChange, 
  variant 
}: { 
  active: Slot; 
  onChange: (s: Slot) => void; 
  variant: DesignVariant; 
}) {
  const styles = getVariantStyles(variant);
  
  const btn = (id: Slot, label: string, Icon: any) => (
    <button
      key={id}
      onClick={() => onChange(id)}
      className={`group shrink-0 inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
        active === id
          ? styles.button.primary
          : styles.button.secondary
      }`}
      aria-pressed={active === id}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
  
  return (
    <div className="inline-flex items-center gap-3 w-full overflow-x-auto whitespace-nowrap bg-white/80 backdrop-blur-sm rounded-3xl p-2 border border-gray-100 dark:bg-zinc-900/80 dark:border-zinc-800">
      {btn("morning", "Matin", Sun)}
      {btn("evening", "Soir", Moon)}
      {btn("weekly", "Hebdomadaire", CalendarDays)}
    </div>
  );
}

function EducationalBadge({ 
  type, 
  text, 
  variant 
}: { 
  type: "observe" | "duration" | "objective"; 
  text: string; 
  variant: DesignVariant; 
}) {
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
    <div className={`inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border font-medium ${colors[type]}`}>
      {icons[type]}
      <span>{text}</span>
    </div>
  );
}

function MetaChip({ 
  label, 
  value, 
  tone = "default", 
  variant 
}: { 
  label: string; 
  value: string; 
  tone?: "default" | "warn" | "zone"; 
  variant: DesignVariant; 
}) {
  const styles = getVariantStyles(variant);
  
  const base = "text-xs rounded-xl px-3 py-2 border inline-flex items-center gap-2 font-medium";
  
  if (tone === "warn")
    return (
      <div className={`${base} text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-900/20 dark:border-rose-800`}>
        <span className="opacity-75">{label}</span>
        <span>{value}</span>
      </div>
    );
  
  if (tone === "zone")
    return (
      <div className={`${base} text-[#8F7BFF] bg-[#8F7BFF]/10 border-[#8F7BFF]/20 dark:text-[#8F7BFF] dark:bg-[#8F7BFF]/10 dark:border-[#8F7BFF]/20`}>
        <span className="opacity-75">{label}</span>
        <span>{value}</span>
      </div>
    );
  
  return (
    <div className={`${base} text-gray-700 bg-gray-50 border-gray-200 dark:text-zinc-300 dark:bg-zinc-800/60 dark:border-zinc-700`}>
      <span className="opacity-75">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function InfoSection({
  tone,
  icon,
  title,
  children,
  variant,
}: {
  tone: "advice" | "warn" | "meta";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  variant: DesignVariant;
}) {
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

function StepBadge({ 
  n, 
  variant 
}: { 
  n: number; 
  variant: DesignVariant; 
}) {
  return (
    <div className="shrink-0 w-10 h-10 grid place-items-center rounded-2xl bg-gradient-to-br from-[#8F7BFF] to-[#5A4AE3] text-white text-sm font-bold shadow-lg">
      {n}
    </div>
  );
}

function ProductThumb({ 
  seed, 
  src, 
  variant 
}: { 
  seed?: string; 
  src?: string; 
  variant: DesignVariant; 
}) {
  if (src) {
    return (
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-700 bg-white shadow-sm">
        <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
    );
  }
  
  const bg = seed ? hashToGradient(seed) : "from-[#8F7BFF] to-[#5A4AE3]";
  return <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} shadow-sm`} />;
}

function hashToGradient(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const hue2 = (hue + 40) % 360;
  return `from-[hsl(${hue}deg_70%_75%)] to-[hsl(${hue2}deg_70%_65%)]`;
}

// ===== COMPOSANT PRINCIPAL =====

interface RoutineRefonteV3Props {
  routine: AiRoutineOutput;
  variant?: DesignVariant;
  initialTheme?: Theme;
  onAnalyticsEvent?: (event: string, data: any) => void;
}

export default function RoutineRefonteV3({ 
  routine,
  variant = "A",
  initialTheme = "light",
  onAnalyticsEvent
}: RoutineRefonteV3Props) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [activePhase, setActivePhase] = useState<string>(
    routine.phases[0]?.id || "immediate"
  );
  const [slot, setSlot] = useState<Slot>("morning");
  const [overrides, setOverrides] = useState<Record<string, ProductOverride | undefined>>({});
  const [altOpenFor, setAltOpenFor] = useState<string | null>(null);

  const styles = getVariantStyles(variant);

  // Theme persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dermai.theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
      else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme("dark");
    } catch {}
  }, []);

  useEffect(() => {
    try { 
      localStorage.setItem("dermai.theme", theme); 
      onAnalyticsEvent?.('routine:theme_toggle', { theme });
    } catch {}
  }, [theme, onAnalyticsEvent]);

  // Current phase
  const currentPhase = useMemo(
    () => routine.phases.find((p) => p.id === activePhase) || routine.phases[0],
    [activePhase, routine.phases]
  );

  // Analytics
  const handlePhaseChange = (phaseId: string) => {
    setActivePhase(phaseId);
    onAnalyticsEvent?.('routine:phase_change', { phase: phaseId });
  };

  const handleSlotChange = (newSlot: Slot) => {
    setSlot(newSlot);
    onAnalyticsEvent?.('routine:slot_change', { slot: newSlot });
  };

  // Alternatives handling
  const openAlt = (id: string) => {
    setAltOpenFor(id);
    onAnalyticsEvent?.('routine:alt_open', { itemId: id });
  };
  
  const closeAlt = () => setAltOpenFor(null);
  
  const onSelectAlt = (opt: { id: string; name: string }) => {
    if (!altOpenFor) return;
    setOverrides((prev) => ({
      ...prev,
      [altOpenFor]: { 
        product: opt.name, 
        imgSeed: opt.name, 
        imgSrc: productImg(opt.name) 
      },
    }));
    onAnalyticsEvent?.('routine:alt_select', { 
      itemId: altOpenFor, 
      oldProduct: 'unknown', 
      newProduct: opt.name 
    });
    closeAlt();
  };

  const altOptions = useMemo(() => {
    if (!currentPhase) return [];
    const pool = [...currentPhase.slots.morning, ...currentPhase.slots.evening, ...currentPhase.slots.weekly];
    const target = pool.find((i) => i.id === altOpenFor);
    return target?.alternatives ?? [];
  }, [altOpenFor, currentPhase]);

  if (!routine.phases.length) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Aucune routine disponible</p>
      </div>
    );
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className={`min-h-screen ${styles.container} transition-colors duration-500`}>
        <div className="mx-auto w-full max-w-screen-2xl px-6 py-10 lg:py-16">
          {/* Header */}
          <header className="mb-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className={`text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight mb-4 ${styles.typography.title} ${variant === "C" ? "font-black" : ""}`}>
                  DermAI — Routine personnalisée
                </h1>
                <p className={`text-base lg:text-lg max-w-3xl leading-relaxed ${styles.typography.subtitle}`}>
                  Affichage par horaire dans chaque phase. Données 100% fournies par l'IA (phase, timing, fréquence, introduction, durée). L'UI se contente de mapper et d'organiser.
                </p>
              </div>
              <ThemeToggle theme={theme} setTheme={setTheme} variant={variant} />
            </div>
          </header>

          {/* Phase Tabs - sticky & horizontal scrollable, parfaitement en-dessous du header sticky */}
          <div className="mb-8">
            {/* top-20 = header sticky avec padding (py-4) + logo, évite d'être masqué */}
            <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-sm rounded-2xl p-2 border border-gray-100 inline-flex items-center gap-3 w-full overflow-x-auto whitespace-nowrap">
              {routine.phases.map((phase) => (
                <button
                  key={phase.id}
                  onClick={() => setActivePhase(phase.id)}
                  className={`px-6 py-3 rounded-2xl transition-all duration-300 text-sm font-semibold ${
                    phase.id === activePhase ? styles.button.primary : styles.button.secondary
                  }`}
                >
                  {phase.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phase Header */}
          {currentPhase && (
            <div className="mb-10 space-y-6">
              <div>
                <div className={`text-base ${styles.typography.subtitle} mb-3`}>
                  Durée indicative de la phase : <span className={`font-semibold ${styles.typography.title}`}>{currentPhase.durationLabel}</span>
                </div>
                {currentPhase.education && (
                  <div className={`rounded-2xl border border-[#8F7BFF]/20 bg-gradient-to-r from-[#8F7BFF]/5 to-[#5A4AE3]/5 p-6 text-sm ${variant === "C" ? "rounded-3xl" : ""}`}>
                    <div className={`font-bold text-base mb-3 text-[#8F7BFF] ${variant === "C" ? "text-lg" : ""}`}>
                      {currentPhase.education.title}
                    </div>
                    <div className={`leading-relaxed ${styles.typography.body}`}>
                      {currentPhase.education.text}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Slot Switch */}
          <div className="mb-10 sticky top-4 z-10">
            <SlotSwitch active={slot} onChange={handleSlotChange} variant={variant} />
          </div>

          {/* Content */}
          <div className="space-y-8">
            {currentPhase && (
              <RoutineColumn 
                title={`Routine ${slot === 'morning' ? 'du matin' : slot === 'evening' ? 'du soir' : 'hebdomadaire'}`}
                items={currentPhase.slots[slot] || []}
                overrides={overrides}
                onOpenAlt={openAlt}
                onBuyClick={(productName) => onAnalyticsEvent?.('routine:buy_click', { product_name: productName, retailer: 'amazon' })}
                variant={variant}
              />
            )}
          </div>

          {/* Footer */}
          <footer className={`mt-16 text-sm ${styles.typography.subtitle} space-y-3`}>
            <ul className="list-disc ml-6 space-y-2 max-w-4xl">
              <li>
                Les produits de base (nettoyage, hydratation, SPF) sont repris automatiquement entre phases s'ils ne changent pas. Aucun badge « continu » n'est affiché.
              </li>
              <li>
                Les traitements temporaires affichent toujours : <span className={`font-semibold ${styles.typography.title}`}>introduction (semaine X), durée, fréquence</span> et peuvent apparaître en Matin/Soir ou dans <span className={`font-semibold ${styles.typography.title}`}>l'onglet Hebdomadaire</span> selon leur cadence (au minimum hebdomadaire).
              </li>
              <li>
                L'éducation par phase met en avant l'objectif et la progressivité (référence à l'interface éducative).
              </li>
            </ul>
          </footer>
        </div>
      </div>

      {/* Alternatives Modal */}
      <AlternativesModal 
        open={!!altOpenFor} 
        onClose={closeAlt} 
        options={altOptions} 
        onSelect={onSelectAlt} 
        variant={variant}
      />
    </div>
  );
}

// ===== COMPOSANTS AUXILIAIRES =====

function RoutineColumn({ 
  title, 
  items, 
  overrides, 
  onOpenAlt, 
  onBuyClick,
  variant 
}: {
  title: string; 
  items: AiRoutineItem[]; 
  overrides: Record<string, ProductOverride | undefined>; 
  onOpenAlt: (id: string) => void;
  onBuyClick: (productName: string) => void;
  variant: DesignVariant;
}) {
  const styles = getVariantStyles(variant);
  
  return (
    <div className="flex-1 min-w-0 mx-auto max-w-7xl">
      <div className="mb-8 flex items-center gap-3">
        <h4 className={`text-xl font-semibold ${styles.typography.title}`}>{title}</h4>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-sm border border-dashed rounded-2xl p-8 text-center xl:col-span-2 ${styles.typography.subtitle}`}
            >
              Aucun élément
            </motion.div>
          ) : (
            items.map((item, idx) => (
              <RoutineCard
                key={item.id}
                item={item}
                stepNumber={idx + 1}
                override={overrides[item.id]}
                onChooseAlt={onOpenAlt}
                onBuyClick={onBuyClick}
                variant={variant}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RoutineCard({ 
  item, 
  stepNumber, 
  override, 
  onChooseAlt, 
  onBuyClick,
  variant 
}: {
  item: AiRoutineItem; 
  stepNumber: number; 
  override?: ProductOverride; 
  onChooseAlt: (id: string) => void;
  onBuyClick: (productName: string) => void;
  variant: DesignVariant;
}) {
  const styles = getVariantStyles(variant);
  const temporary = item.is_temporary;
  const displayProduct = override?.product ?? item.product;
  const imgSeed = override?.imgSeed ?? displayProduct;
  const imgSrc = override?.imgSrc ?? productImg(displayProduct);

  const restrictions: string[] = (item.restrictions || []).filter(
    (r: string) => r && !/aucune/i.test(r)
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`p-6 transition-all duration-300 ${styles.card} ${styles.cardGlow}`}
    >
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="flex items-center gap-4">
          <StepBadge n={stepNumber} variant={variant} />
          <div>
            <div className={`text-xs uppercase tracking-wider ${styles.typography.subtitle} font-medium mb-1`}>
              Étape {stepNumber}
            </div>
            <div className={`text-sm ${styles.typography.subtitle} mb-2`}>{item.title}</div>
            <div className={`text-lg font-semibold leading-tight ${styles.typography.title}`}>
              {displayProduct}
            </div>
          </div>
        </div>
        {temporary && (
          <div className="flex flex-col gap-2">
            <span className="text-xs rounded-xl px-3 py-2 border border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300 font-medium">
              Temporaire
            </span>
          </div>
        )}
      </div>

      {/* Educational Badges */}
      {temporary && (
        <div className="flex flex-wrap gap-3 mb-6">
          {item.introduce_from_week !== undefined && (
            <EducationalBadge 
              type="observe" 
              text={`Semaine ${Math.max(1, item.introduce_from_week)}`} 
              variant={variant}
            />
          )}
          {item.application_duration && (
            <EducationalBadge 
              type="duration" 
              text={item.application_duration} 
              variant={variant}
            />
          )}
        </div>
      )}

      {/* Zones */}
      {item.target_zones?.length && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <MetaChip label="Zones :" value={item.target_zones.join(", ")} tone="zone" variant={variant} />
          </div>
        </div>
      )}

      {/* Product Section */}
      <div className={`rounded-2xl border p-5 mb-6 ${variant === "B" ? "bg-white/50 backdrop-blur-sm border-white/30" : "bg-gray-50/50 border-gray-100"} dark:bg-zinc-800/30 dark:border-zinc-700/30`}>
        <div className="grid gap-4 lg:flex lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <ProductThumb seed={imgSeed} src={imgSrc} variant={variant} />
            <div>
              <div className={`text-xs ${styles.typography.subtitle} mb-1 font-medium uppercase tracking-wider`}>
                Produit recommandé
              </div>
              <div className={`text-sm font-semibold ${styles.typography.title} break-words`}>
                {displayProduct}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onBuyClick(displayProduct)}
              className={`inline-flex items-center justify-center gap-2 text-sm px-6 py-3 rounded-xl font-medium ${styles.button.primary}`}
            >
              <ShoppingCart className="w-4 h-4" /> 
              Acheter
            </button>
            <button
              onClick={() => onChooseAlt(item.id)}
              className={`inline-flex items-center justify-center gap-2 text-sm px-6 py-3 rounded-xl font-medium ${styles.button.secondary}`}
            >
              <RefreshCcw className="w-4 h-4" />
              <span className="sm:hidden">Alternative</span>
              <span className="hidden sm:inline">Choisir une alternative</span>
            </button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        {item.application_instructions && (
          <InfoSection 
            tone="advice" 
            icon={<Lightbulb className="w-4 h-4" />} 
            title="Conseils d'application"
            variant={variant}
          >
            <p className="break-words">{item.application_instructions}</p>
          </InfoSection>
        )}

        {(item.frequency || item.application_duration) && (
          <InfoSection 
            tone="meta" 
            icon={<CalendarDays className="w-4 h-4" />} 
            title="Timing & durée"
            variant={variant}
          >
            <div className="flex flex-wrap gap-3">
              {item.frequency && (
                <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/60 font-medium">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="opacity-75">Fréquence :</span> {item.frequency}
                </span>
              )}
              {item.application_duration && (
                <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/60 font-medium">
                  <Hourglass className="w-3.5 h-3.5" />
                  <span className="opacity-75">Durée :</span> {item.application_duration}
                </span>
              )}
            </div>
          </InfoSection>
        )}

        {restrictions.length > 0 && (
          <InfoSection 
            tone="warn" 
            icon={<AlertCircle className="w-4 h-4" />} 
            title="Restrictions"
            variant={variant}
          >
            <ul className="list-disc ml-5 space-y-2 text-sm">
              {restrictions.map((r: string, idx: number) => (
                <li key={idx} className="break-words">{r}</li>
              ))}
            </ul>
          </InfoSection>
        )}
      </div>
    </motion.div>
  );
}

function AlternativesModal({
  open,
  onClose,
  options,
  onSelect,
  variant,
}: {
  open: boolean;
  onClose: () => void;
  options: { id: string; name: string }[];
  onSelect: (opt: { id: string; name: string }) => void;
  variant: DesignVariant;
}) {
  const styles = getVariantStyles(variant);
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`absolute inset-x-4 sm:inset-x-0 sm:left-1/2 sm:-translate-x-1/2 top-16 sm:top-24 mx-auto w-auto sm:w-[600px] rounded-3xl border shadow-2xl ${styles.card}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800`}>
          <div className={`text-lg font-semibold ${styles.typography.title}`}>Choisir une alternative</div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors" 
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {options?.length ? (
            options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelect(opt)}
                className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-300 w-full ${styles.button.secondary} hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <ProductThumb seed={opt.name} variant={variant} />
                  <div className={`text-sm font-medium ${styles.typography.body}`}>{opt.name}</div>
                </div>
                <span className="text-xs px-3 py-2 rounded-xl border border-[#8F7BFF]/20 bg-[#8F7BFF]/10 text-[#8F7BFF] font-medium">
                  Sélectionner
                </span>
              </button>
            ))
          ) : (
            <div className={`text-sm ${styles.typography.subtitle} text-center py-8`}>
              Aucune alternative fournie.
            </div>
          )}
        </div>
        <div className={`px-6 py-4 border-t border-gray-100 dark:border-zinc-800 text-xs ${styles.typography.subtitle}`}>
          Les alternatives sont générées par l'IA selon ton diagnostic et tes préférences.
        </div>
      </div>
    </div>
  );
}
