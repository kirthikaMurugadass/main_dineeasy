"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Language } from "@/types/database";

const demoCategories = ["Coffee", "Pastries", "Lunch", "Drinks"];
const demoItems: Record<
  string,
  Array<{ name: Record<string, string>; desc: Record<string, string>; price: string }>
> = {
  Coffee: [
    {
      name: { en: "Espresso", de: "Espresso", fr: "Espresso", it: "Espresso" },
      desc: { en: "Rich & bold single shot", de: "Kräftiger einzelner Shot", fr: "Shot simple riche & corsé", it: "Shot singolo ricco e deciso" },
      price: "4.50",
    },
    {
      name: { en: "Flat White", de: "Flat White", fr: "Flat White", it: "Flat White" },
      desc: { en: "Velvety microfoam", de: "Samtiger Mikroschaum", fr: "Micro-mousse veloutée", it: "Microschiuma vellutata" },
      price: "5.80",
    },
    {
      name: { en: "Cappuccino", de: "Cappuccino", fr: "Cappuccino", it: "Cappuccino" },
      desc: { en: "Classic Italian perfection", de: "Klassische italienische Perfektion", fr: "Perfection classique italienne", it: "Perfezione classica italiana" },
      price: "5.50",
    },
  ],
  Pastries: [
    {
      name: { en: "Croissant", de: "Croissant", fr: "Croissant", it: "Cornetto" },
      desc: { en: "Buttery & flaky", de: "Buttrig & blättrig", fr: "Beurré & feuilleté", it: "Burroso e sfogliato" },
      price: "3.90",
    },
    {
      name: { en: "Pain au Chocolat", de: "Schokoladencroissant", fr: "Pain au chocolat", it: "Pain au chocolat" },
      desc: { en: "Dark chocolate filled", de: "Mit Zartbitterschokolade gefüllt", fr: "Fourré au chocolat noir", it: "Ripieno di cioccolato fondente" },
      price: "4.20",
    },
  ],
  Lunch: [
    {
      name: { en: "Avocado Toast", de: "Avocado Toast", fr: "Toast à l'avocat", it: "Toast con avocado" },
      desc: { en: "Sourdough, poached egg", de: "Sauerteig, pochiertes Ei", fr: "Pain au levain, œuf poché", it: "Lievito madre, uovo in camicia" },
      price: "16.50",
    },
    {
      name: { en: "Caesar Salad", de: "Caesar Salat", fr: "Salade César", it: "Insalata Caesar" },
      desc: { en: "Romaine, parmesan, croutons", de: "Romanasalat, Parmesan, Croutons", fr: "Romaine, parmesan, croûtons", it: "Lattuga romana, parmigiano, crostini" },
      price: "14.80",
    },
  ],
  Drinks: [
    {
      name: { en: "Fresh Orange Juice", de: "Frischer Orangensaft", fr: "Jus d'orange frais", it: "Spremuta d'arancia" },
      desc: { en: "Freshly squeezed", de: "Frisch gepresst", fr: "Pressé à la minute", it: "Appena spremuta" },
      price: "6.50",
    },
    {
      name: { en: "Sparkling Water", de: "Sprudelwasser", fr: "Eau pétillante", it: "Acqua frizzante" },
      desc: { en: "Swiss alpine source", de: "Schweizer Alpenquelle", fr: "Source alpine suisse", it: "Sorgente alpina svizzera" },
      price: "3.50",
    },
  ],
};

const langFlags: Record<string, string> = { de: "🇩🇪", en: "🇬🇧", fr: "🇫🇷", it: "🇮🇹" };

interface PhoneMockupProps {
  className?: string;
  withFloating?: boolean;
  withParallax?: boolean;
}

export function PhoneMockup({ className = "", withFloating = false, withParallax = false }: PhoneMockupProps) {
  const [activeCategory, setActiveCategory] = useState("Coffee");
  const [demoLang, setDemoLang] = useState<Language>("en");

  return (
    <motion.div
      className={`relative ${className}`}
      animate={withFloating ? { y: [0, -10, 0] } : undefined}
      transition={withFloating ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {/* Phone frame */}
      <div className="rounded-[2.8rem] border-[10px] border-foreground/10 bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15),0_10px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_10px_30px_-10px_rgba(0,0,0,0.2)] overflow-hidden">
        {/* Header image */}
        <div className="relative h-40 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80")',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-espresso flex items-center justify-center text-warm text-xs font-semibold font-sans">
                C
              </div>
              <div>
                <h3 className="text-sm font-bold text-white drop-shadow-lg">Café Helvetia</h3>
                <p className="text-[10px] text-white/80 drop-shadow">Zürich, Switzerland</p>
              </div>
            </div>
          </div>
        </div>

        {/* Language switcher */}
        <div className="flex items-center justify-center gap-1 border-b border-border/50 px-4 py-2">
          {(["de", "en", "fr", "it"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setDemoLang(lang)}
              className={`rounded-full px-3 py-1 text-[10px] font-medium transition-all ${
                demoLang === lang
                  ? "bg-espresso text-warm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {langFlags[lang]} {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Category nav */}
        <div className="flex gap-1 overflow-x-auto px-4 py-3 scrollbar-hide">
          {demoCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-espresso text-warm shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu items */}
        <div className="max-h-64 overflow-y-auto px-4 pb-4">
          <AnimatePresence mode="wait" initial={false}>
            {demoItems[activeCategory] && (
              <motion.div
                key={activeCategory + demoLang}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                {demoItems[activeCategory].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start justify-between rounded-xl border border-border/30 p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex-1 pr-3">
                      <h4 className="text-xs font-semibold">{item.name[demoLang]}</h4>
                      <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                        {item.desc[demoLang]}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-semibold text-gold">
                      CHF {item.price}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 px-4 py-2 text-center">
          <span className="text-[8px] text-muted-foreground/60">Powered by DineEasy</span>
        </div>
      </div>
    </motion.div>
  );
}
