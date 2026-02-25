"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ChefHat, UtensilsCrossed, Leaf, Home, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function AboutSection() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);

  const features = [
    {
      icon: ChefHat,
      title: t.landing.about.features.chefs.title,
      description: t.landing.about.features.chefs.description,
    },
    {
      icon: UtensilsCrossed,
      title: t.landing.about.features.premium.title,
      description: t.landing.about.features.premium.description,
    },
    {
      icon: Leaf,
      title: t.landing.about.features.fresh.title,
      description: t.landing.about.features.fresh.description,
    },
    {
      icon: Home,
      title: t.landing.about.features.cozy.title,
      description: t.landing.about.features.cozy.description,
    },
  ];

  // Scroll animation
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const scale = useTransform(smoothProgress, [0, 1], [1, 1.05]);
  const y = useTransform(smoothProgress, [0, 1], [0, -30]);

  const phoneFloatY = useTransform(smoothProgress, [0, 1], [0, -16]);
  const phoneRotateX = useTransform(smoothProgress, [0, 1], [7, 10]);
  const phoneRotateY = useTransform(smoothProgress, [0, 1], [0, 6]);
  const phoneRotateZ = useTransform(smoothProgress, [0, 1], [2, 4]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative overflow-hidden py-32 bg-background"
    >
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-gold/5 blur-3xl dark:bg-gold/10" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-olive/5 blur-3xl dark:bg-olive/10" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">

          {/* LEFT SIDE — 3D PHONE */}
          <FadeIn direction="left" delay={0.1}>
            <motion.div
              className="relative flex w-full items-center justify-center [perspective:1800px]"
              style={{ scale, y }}
            >
              <motion.div
                className="relative w-[250px] sm:w-[250px]"
                style={{
                  y: phoneFloatY,
                  rotateX: phoneRotateX,
                  rotateY: phoneRotateY,
                  rotateZ: phoneRotateZ,
                  transformStyle: "preserve-3d",
                }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Shadow */}
                <div className="pointer-events-none absolute left-1/2 top-[104%] -z-10 h-12 w-[75%] -translate-x-1/2 rounded-full bg-black/40 blur-xl" />

                <div className="relative aspect-[9/19.5] rounded-[2.8rem] bg-zinc-950 shadow-[0_35px_90px_-25px_rgba(0,0,0,0.85)] overflow-hidden">

                  {/* Metallic border */}
                  <div className="absolute inset-0 rounded-[2.8rem] border border-white/10 pointer-events-none z-30" />

                  {/* Screen */}
                  <div className="absolute inset-[6px] rounded-[2.62rem] overflow-hidden bg-transparent">

                    <video
                      className="absolute inset-0 h-full w-full translate-x-6.5 scale-[1.45] object-cover object-center"
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-label="Restaurant ambiance video"
                    >
                      <source src="/video.mp4" type="video/mp4" />
                    </video>

                    {/* Dynamic island */}
                    <div className="absolute left-1/2 top-0.5 z-20 h-4 w-24 -translate-x-1/2 rounded-full bg-black" />

                    {/* Glass reflection */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-[#f4bf77]/10" />
                    <div className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </FadeIn>

          {/* RIGHT SIDE CONTENT */}
          <div className="space-y-8">
            <FadeIn direction="right" delay={0.2}>
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">
                  {t.landing.about.badge}
                </p>
                <h2 className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
                  {t.landing.about.title}
                </h2>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.3}>
              <p className="text-lg leading-relaxed text-muted-foreground max-w-xl">
                {t.landing.about.description}
              </p>
            </FadeIn>

            {/* Features */}
            <FadeIn direction="right" delay={0.4}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      className="flex gap-4 group"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold transition-colors group-hover:bg-gold/15 dark:bg-gold/20 dark:group-hover:bg-gold/30">
                        <Icon size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1 text-foreground">
                          {feature.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </FadeIn>

            {/* Button */}
            <FadeIn direction="right" delay={0.6}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  size="lg"
                  className="mt-8 h-12 rounded-full bg-gold px-8 text-base font-semibold text-espresso hover:bg-gold/90 shadow-lg"
                >
                  {t.landing.about.readMore}
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </motion.div>
            </FadeIn>
          </div>

        </div>
      </div>
    </section>
  );
}