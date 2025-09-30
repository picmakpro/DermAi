/**
 * Routine V3 Finale - Variante B (Glow) uniquement
 * 
 * Version production simplifiée :
 * - Variante B (Card Glow) uniquement
 * - Pas de dark mode
 * - Optimisée pour intégration dans /results
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

'use client'

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  CalendarDays,
  ShoppingCart,
  RefreshCcw,
  Hourglass,
  Lightbulb,
  AlertCircle,
  Eye,
  Target,
  X
} from 'lucide-react';

// Types simplifiés pour production
type Slot = "morning" | "evening" | "weekly";

// Localisation des fréquences
const FREQUENCY_FR: Record<string, string> = {
  'daily': 'quotidienne',
  '1x/week': '1×/sem',
  '2x/week': '2×/sem', 
  '3x/week': '3×/sem',
  '3–5x/week': '3–5×/sem',
  '2x/week puis daily': '2×/sem puis quotidien',
  '2x/week puis 3x/week': '2×/sem puis 3×/sem',
  '1x/week puis 2x/week': '1×/sem puis 2×/sem'
};

function localizeFrequency(frequency: string): string {
  return FREQUENCY_FR[frequency] || frequency;
}

interface RoutineItem {
  id: string;
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
  alternatives?: Array<{ id: string; name: string }>;
  image_url?: string;
}

interface RoutinePhase {
  id: string;
  label: string;
  durationLabel: string;
  education?: { title: string; text: string };
  slots: Record<Slot, RoutineItem[]>;
}

interface RoutineData {
  phases: RoutinePhase[];
}

interface RoutineV3FinalProps {
  routine: RoutineData;
  onAnalyticsEvent?: (event: string, data: any) => void;
  coherenceIssues?: string[]; // Avertissements de cohérence optionnels
}

// ===== DESIGN SYSTEM - VARIANTE B (GLOW) =====

const STYLES = {
  container: "bg-gradient-to-br from-[#FDF9F7] to-white",
  card: "bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(143,123,255,0.08)]",
  cardHover: "hover:shadow-[0_12px_40px_rgba(143,123,255,0.15)] hover:border-[#8F7BFF]/20",
  button: {
    primary: "bg-gradient-to-r from-[#8F7BFF] to-[#5A4AE3] text-white shadow-[0_4px_16px_rgba(143,123,255,0.3)] hover:shadow-[0_8px_24px_rgba(143,123,255,0.4)] transition-all duration-300",
    secondary: "bg-white/80 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/90"
  },
  typography: {
    title: "font-semibold text-gray-900",
    subtitle: "text-gray-600",
    body: "text-gray-800"
  }
};

// ===== COMPOSANTS UI =====

function SlotSwitch({ 
  active, 
  onChange,
  availableSlots
}: { 
  active: Slot; 
  onChange: (s: Slot) => void;
  availableSlots: Slot[];
}) {
  const allSlots = [
    { id: "morning" as Slot, label: "Matin", icon: Sun },
    { id: "evening" as Slot, label: "Soir", icon: Moon },
    { id: "weekly" as Slot, label: "Hebdomadaire", icon: CalendarDays }
  ];

  // Filtrer uniquement les slots avec du contenu
  const visibleSlots = allSlots.filter(slot => availableSlots.includes(slot.id));

  return (
    <div className="inline-flex items-center gap-3 w-full overflow-x-auto whitespace-nowrap bg-white/80 backdrop-blur-sm rounded-3xl p-2 border border-gray-100">
      {visibleSlots.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`group shrink-0 inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
            active === id ? STYLES.button.primary : STYLES.button.secondary
          }`}
          aria-pressed={active === id}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function EducationalBadge({ 
  type, 
  text 
}: { 
  type: "observe" | "duration" | "objective"; 
  text: string; 
}) {
  const configs = {
    observe: {
      icon: Eye,
      colors: "bg-blue-50 text-blue-700 border-blue-200"
    },
    duration: {
      icon: Hourglass,
      colors: "bg-amber-50 text-amber-700 border-amber-200"
    },
    objective: {
      icon: Target,
      colors: "bg-emerald-50 text-emerald-700 border-emerald-200"
    }
  };
  
  const config = configs[type];
  const Icon = config.icon;
  
  return (
    <div className={`inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border font-medium ${config.colors}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{text}</span>
    </div>
  );
}

function ProductThumb({ 
  seed, 
  src 
}: { 
  seed?: string; 
  src?: string; 
}) {
  if (src) {
    return (
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm">
        <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
    );
  }
  
  // Gradient basé sur le nom du produit
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

function StepBadge({ n }: { n: number }) {
  return (
    <div className="shrink-0 w-10 h-10 grid place-items-center rounded-2xl bg-gradient-to-br from-[#8F7BFF] to-[#5A4AE3] text-white text-sm font-bold shadow-lg">
      {n}
    </div>
  );
}

function InfoSection({
  tone,
  icon,
  title,
  children,
}: {
  tone: "advice" | "warn" | "meta";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const configs = {
    advice: {
      container: "border-emerald-200 bg-emerald-50/50",
      title: "text-emerald-700",
      content: "text-emerald-800"
    },
    warn: {
      container: "border-rose-200 bg-rose-50/50",
      title: "text-rose-700",
      content: "text-rose-800"
    },
    meta: {
      container: "border-gray-200 bg-gray-50/50",
      title: "text-gray-700",
      content: "text-gray-800"
    }
  };
  
  const config = configs[tone];
  
  return (
    <div className={`border p-4 rounded-xl ${config.container}`}>
      <div className={`flex items-center gap-3 mb-3 ${config.title}`}>
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className={`text-sm leading-relaxed ${config.content}`}>
        {children}
      </div>
    </div>
  );
}

function AlternativesModal({
  open,
  onClose,
  options,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  options: { id: string; name: string }[];
  onSelect: (opt: { id: string; name: string }) => void;
}) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`absolute inset-x-4 sm:inset-x-0 sm:left-1/2 sm:-translate-x-1/2 top-16 sm:top-24 mx-auto w-auto sm:w-[600px] rounded-3xl border shadow-2xl ${STYLES.card}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className={`text-lg font-semibold ${STYLES.typography.title}`}>
            Choisir une alternative
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors" 
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
                className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-300 w-full ${STYLES.button.secondary} hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <ProductThumb seed={opt.name} />
                  <div className={`text-sm font-medium ${STYLES.typography.body}`}>
                    {opt.name}
                  </div>
                </div>
                <span className="text-xs px-3 py-2 rounded-xl border border-[#8F7BFF]/20 bg-[#8F7BFF]/10 text-[#8F7BFF] font-medium">
                  Sélectionner
                </span>
              </button>
            ))
          ) : (
            <div className={`text-sm ${STYLES.typography.subtitle} text-center py-8`}>
              Aucune alternative fournie.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== COMPOSANT PRINCIPAL =====

export default function RoutineV3Final({ 
  routine,
  onAnalyticsEvent,
  coherenceIssues = []
}: RoutineV3FinalProps) {
  const [activePhase, setActivePhase] = useState<string>(routine.phases[0]?.id || "immediate");
  const [slot, setSlot] = useState<Slot>("morning");
  const [overrides, setOverrides] = useState<Record<string, { product: string; imgSrc?: string }>>({});
  const [altOpenFor, setAltOpenFor] = useState<string | null>(null);

  const currentPhase = useMemo(
    () => routine.phases.find((p) => p.id === activePhase) || routine.phases[0],
    [activePhase, routine.phases]
  );

  const currentItems = currentPhase?.slots[slot] || [];

  // Calculer les slots disponibles pour la phase active
  const availableSlots = useMemo(() => {
    if (!currentPhase) return ['morning'] as Slot[];
    
    const slots: Slot[] = [];
    
    if (currentPhase.slots.morning?.length > 0) slots.push('morning');
    if (currentPhase.slots.evening?.length > 0) slots.push('evening');
    if (currentPhase.slots.weekly?.length > 0) slots.push('weekly');
    
    return slots.length > 0 ? slots : ['morning']; // Fallback
  }, [currentPhase]);

  // Auto-switch to first available slot if current slot is empty
  React.useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(slot)) {
      setSlot(availableSlots[0]);
    }
  }, [availableSlots, slot]);

  // Analytics
  const handlePhaseChange = (phaseId: string) => {
    setActivePhase(phaseId);
    onAnalyticsEvent?.('routine:phase_change', { phase: phaseId });
  };

  const handleSlotChange = (newSlot: Slot) => {
    setSlot(newSlot);
    onAnalyticsEvent?.('routine:slot_change', { slot: newSlot });
  };

  // Alternatives
  const openAlt = (id: string) => {
    setAltOpenFor(id);
    onAnalyticsEvent?.('routine:alt_open', { itemId: id });
  };
  
  const closeAlt = () => setAltOpenFor(null);
  
  const onSelectAlt = (opt: { id: string; name: string }) => {
    if (!altOpenFor) return;
    setOverrides((prev) => ({
      ...prev,
      [altOpenFor]: { product: opt.name }
    }));
    onAnalyticsEvent?.('routine:alt_select', { 
      itemId: altOpenFor, 
      newProduct: opt.name 
    });
    closeAlt();
  };

  const altOptions = useMemo(() => {
    if (!currentPhase) return [];
    const allItems = [...currentPhase.slots.morning, ...currentPhase.slots.evening, ...currentPhase.slots.weekly];
    const target = allItems.find((i) => i.id === altOpenFor);
    return target?.alternatives ?? [];
  }, [altOpenFor, currentPhase]);

  if (!routine.phases.length) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-2xl">
        <p className="text-gray-500">Aucune routine disponible</p>
      </div>
    );
  }

  return (
    <div className={`${STYLES.container} transition-colors duration-500`}>
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        
        {/* Header */}
        <header className="mb-10">
          <h2 className={`text-2xl lg:text-3xl font-bold tracking-tight mb-4 ${STYLES.typography.title}`}>
            Routine personnalisée
          </h2>
          <p className={`text-base max-w-3xl leading-relaxed ${STYLES.typography.subtitle}`}>
            Votre routine dermatologique en 3 phases, organisée par horaire pour une application optimale.
          </p>

          {/* Avertissements de cohérence */}
          {coherenceIssues.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-center gap-3 mb-3 text-amber-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Points d'attention</span>
              </div>
              <ul className="text-sm text-amber-800 space-y-1">
                {coherenceIssues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </header>

        {/* Phase Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {routine.phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => handlePhaseChange(phase.id)}
              className={`px-6 py-3 rounded-2xl transition-all duration-300 text-sm font-semibold ${
                phase.id === activePhase ? STYLES.button.primary : STYLES.button.secondary
              }`}
            >
              {phase.label}
            </button>
          ))}
        </div>

        {/* Phase Header */}
        {currentPhase && (
          <div className="mb-10 space-y-6">
            <div className={`text-base ${STYLES.typography.subtitle} mb-3`}>
              Durée indicative : <span className={`font-semibold ${STYLES.typography.title}`}>{currentPhase.durationLabel}</span>
            </div>
            {currentPhase.education && (
              <div className="rounded-2xl border border-[#8F7BFF]/20 bg-gradient-to-r from-[#8F7BFF]/5 to-[#5A4AE3]/5 p-6 text-sm">
                <div className="font-bold text-base mb-3 text-[#8F7BFF]">
                  {currentPhase.education.title}
                </div>
                <div className={`leading-relaxed ${STYLES.typography.body}`}>
                  {currentPhase.education.text}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Slot Switch - STICKY */}
        <div className="mb-10 sticky top-16 sm:top-20 z-50">
          <SlotSwitch active={slot} onChange={handleSlotChange} availableSlots={availableSlots} />
        </div>

        {/* Content */}
        <div className="space-y-8">
          <div className="flex-1 min-w-0">
            <div className="mb-6 flex items-center gap-3">
              <h3 className={`text-xl font-semibold ${STYLES.typography.title}`}>
                Routine {slot === 'morning' ? 'du matin' : slot === 'evening' ? 'du soir' : 'hebdomadaire'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence initial={false}>
                {currentItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm border border-dashed rounded-2xl p-8 text-center lg:col-span-2 ${STYLES.typography.subtitle}`}
                  >
                    Aucun élément pour ce créneau
                  </motion.div>
                ) : (
                  currentItems.map((item, idx) => (
                    <RoutineCard
                      key={item.id}
                      item={item}
                      stepNumber={idx + 1}
                      override={overrides[item.id]}
                      onChooseAlt={openAlt}
                      onBuyClick={(productName) => {
                        onAnalyticsEvent?.('routine:buy_click', { product_name: productName, retailer: 'amazon' });
                        window.open(`https://www.amazon.fr/s?k=${encodeURIComponent(productName)}`, '_blank');
                      }}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Alternatives Modal */}
      <AlternativesModal 
        open={!!altOpenFor} 
        onClose={closeAlt} 
        options={altOptions} 
        onSelect={onSelectAlt} 
      />
    </div>
  );
}

// ===== ROUTINE CARD =====

function RoutineCard({ 
  item, 
  stepNumber, 
  override, 
  onChooseAlt, 
  onBuyClick
}: {
  item: RoutineItem; 
  stepNumber: number; 
  override?: { product: string; imgSrc?: string }; 
  onChooseAlt: (id: string) => void;
  onBuyClick: (productName: string) => void;
}) {
  const displayProduct = override?.product ?? item.product;
  const imgSrc = override?.imgSrc ?? item.image_url;
  const restrictions = (item.restrictions || []).filter(r => r && !/aucune/i.test(r));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`p-6 transition-all duration-300 ${STYLES.card} ${STYLES.cardHover}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="flex items-center gap-4">
          <StepBadge n={stepNumber} />
          <div>
            <div className={`text-xs uppercase tracking-wider ${STYLES.typography.subtitle} font-medium mb-1`}>
              Étape {stepNumber}
            </div>
            <div className={`text-sm ${STYLES.typography.subtitle} mb-2`}>{item.title}</div>
            <div className={`text-lg font-semibold leading-tight ${STYLES.typography.title}`}>
              {displayProduct}
            </div>
          </div>
        </div>
        {item.is_temporary && (
          <span className="text-xs rounded-xl px-3 py-2 border border-amber-300 bg-amber-50 text-amber-700 font-medium">
            Temporaire
          </span>
        )}
      </div>

      {/* Educational Badges */}
      {item.is_temporary && (
        <div className="flex flex-wrap gap-3 mb-6">
          {item.introduce_from_week !== undefined && (
            <EducationalBadge type="observe" text={`Semaine ${Math.max(1, item.introduce_from_week)}`} />
          )}
          {item.application_duration && (
            <EducationalBadge type="duration" text={item.application_duration} />
          )}
        </div>
      )}

      {/* Zones */}
      {item.target_zones?.length && (
        <div className="mb-6">
          <span className="text-xs rounded-xl px-3 py-2 border border-[#8F7BFF]/20 bg-[#8F7BFF]/10 text-[#8F7BFF] font-medium">
            Zones : {item.target_zones.join(", ")}
          </span>
        </div>
      )}

      {/* Product Section */}
      <div className="rounded-2xl border p-5 mb-6 bg-white/50 backdrop-blur-sm border-white/30">
        <div className="grid gap-4 lg:flex lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <ProductThumb seed={displayProduct} src={imgSrc} />
            <div>
              <div className={`text-xs ${STYLES.typography.subtitle} mb-1 font-medium uppercase tracking-wider`}>
                Produit recommandé
              </div>
              <div className={`text-sm font-semibold ${STYLES.typography.title} break-words`}>
                {displayProduct}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onBuyClick(displayProduct)}
              className={`inline-flex items-center justify-center gap-2 text-sm px-6 py-3 rounded-xl font-medium ${STYLES.button.primary}`}
            >
              <ShoppingCart className="w-4 h-4" /> 
              Acheter
            </button>
            {item.alternatives?.length ? (
              <button
                onClick={() => onChooseAlt(item.id)}
                className={`inline-flex items-center justify-center gap-2 text-sm px-6 py-3 rounded-xl font-medium ${STYLES.button.secondary}`}
              >
                <RefreshCcw className="w-4 h-4" />
                <span className="sm:hidden">Alternative</span>
                <span className="hidden sm:inline">Choisir une alternative</span>
              </button>
            ) : null}
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
          >
            <p className="break-words">{item.application_instructions}</p>
          </InfoSection>
        )}

        {(item.frequency || item.application_duration) && (
          <InfoSection 
            tone="meta" 
            icon={<CalendarDays className="w-4 h-4" />} 
            title="Timing & durée"
          >
            <div className="flex flex-wrap gap-3">
              {item.frequency && (
                <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white font-medium">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="opacity-75">Fréquence :</span> {localizeFrequency(item.frequency)}
                </span>
              )}
              {item.application_duration && (
                <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white font-medium">
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
