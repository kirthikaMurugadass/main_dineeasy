"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ChefHat, UtensilsCrossed, Leaf, Home } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const features = [
  {
    icon: ChefHat,
    title: "Specialist Chefs",
    description: "Our expert culinary team brings years of experience and passion to every dish.",
  },
  {
    icon: UtensilsCrossed,
    title: "Premium Restaurant",
    description: "Experience fine dining in an elegant atmosphere designed for memorable occasions.",
  },
  {
    icon: Leaf,
    title: "Fresh Ingredients",
    description: "We source only the finest, locally-sourced ingredients for exceptional flavor.",
  },
  {
    icon: Home,
    title: "Cozy Atmosphere",
    description: "Enjoy warm hospitality and a welcoming ambiance that makes you feel at home.",
  },
];

export function AboutSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll-based animations for 3D effect
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Smooth spring animations
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Transform values for 3D effect
  const scale = useTransform(smoothProgress, [0, 1], [1, 1.05]);
  const y = useTransform(smoothProgress, [0, 1], [0, -30]);
  const rotateX = useTransform(smoothProgress, [0, 1], [0, 2]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative overflow-hidden py-32 bg-background"
    >
      {/* Subtle background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-gold/5 blur-3xl dark:bg-gold/10" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-olive/5 blur-3xl dark:bg-olive/10" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Video with 3D scroll animation */}
          <FadeIn direction="left" delay={0.1}>
            <motion.div
              className="relative w-full"
              style={{
                scale,
                y,
                rotateX,
              }}
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" },
              }}
            >
              <video
                ref={videoRef}
                className="w-full h-auto aspect-[4/5] object-cover bg-transparent"
                style={{
                  backgroundColor: "transparent",
                }}
                autoPlay
                muted
                loop
                playsInline
                aria-label="Restaurant ambiance video"
              >
                <source src="/video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </FadeIn>

          {/* Right: Content */}
          <div className="space-y-8">
            <FadeIn direction="right" delay={0.2}>
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">
                  About Us
                </p>
                <h2 className="font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
                  Enjoy An Exceptional Journey of Taste
                </h2>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.3}>
              <p className="text-lg leading-relaxed text-muted-foreground max-w-xl">
                Experience the perfect blend of culinary artistry and warm hospitality. 
                Our expert chefs craft each dish with passion, using only the freshest 
                ingredients to deliver an unforgettable dining experience. From the elegant 
                ambiance to the attentive service, every detail is designed to make your 
                visit exceptional.
              </p>
            </FadeIn>

            {/* Feature List */}
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
                      <div className="flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold transition-colors group-hover:bg-gold/15 dark:bg-gold/20 dark:group-hover:bg-gold/30">
                          <Icon size={22} />
                        </div>
                      </div>
                      <div className="flex-1">
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

            {/* Primary Button */}
            <FadeIn direction="right" delay={0.6}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  size="lg"
                  className="mt-8 h-12 rounded-full bg-gold px-8 text-base font-semibold text-espresso hover:bg-gold/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Read More
                  <ArrowRight
                    size={18}
                    className="ml-2 transition-transform group-hover:translate-x-1"
                  />
                </Button>
              </motion.div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
