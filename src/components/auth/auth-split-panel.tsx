"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const EASE = [0.4, 0, 0.2, 1] as const;

interface AuthSplitPanelProps {
  imageSrc: string;
  imageOnLeft: boolean;
  leftHeading: string;
  leftSubtitle: string;
  leftButtonText: string;
  leftButtonHref: string;
  formTitle: string;
  formSubtitle?: string;
  children: React.ReactNode;
}

export function AuthSplitPanel({
  imageSrc,
  imageOnLeft,
  leftHeading,
  leftSubtitle,
  leftButtonText,
  leftButtonHref,
  formTitle,
  formSubtitle,
  children,
}: AuthSplitPanelProps) {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] w-full items-center justify-center bg-background dark:bg-[#000000] p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[24px] bg-card dark:bg-[#000000] shadow-[0_25px_50px_-12px_rgba(45,58,26,0.18)] ring-1 ring-border md:min-h-[600px] md:flex-row"
      >
        {/* IMAGE PANEL - position swaps via order (mobile: always on top) */}
        <div
          className={`relative flex min-h-[240px] w-full flex-col items-center justify-center p-8 md:min-h-0 md:w-1/2 ${
            imageOnLeft ? "order-1 md:order-1" : "order-1 md:order-2"
          }`}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-auth-zoom"
              style={{ backgroundImage: `url(${imageSrc})` }}
            />
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
              className="font-serif text-3xl font-bold md:text-4xl"
              style={{ color: "#ffffff" }}
            >
              {leftHeading}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
              className="mt-3 text-sm md:text-base"
              style={{ color: "#e5e5e5" }}
            >
              {leftSubtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
              className="mt-8"
            >
              <Link href={leftButtonHref}>
                <motion.span
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center rounded-xl border border-white/50 bg-primary/25 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-primary/35 hover:shadow-[0_0_20px_rgba(255,255,255,0.22)]"
                >
                  {leftButtonText}
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* FORM PANEL */}
        <div
          className={`flex w-full flex-col justify-center bg-card dark:bg-[#000000] p-6 md:w-1/2 md:p-10 ${
            imageOnLeft ? "order-2 md:order-2" : "order-2 md:order-1"
          }`}
        >
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
            className="font-serif text-2xl font-bold text-foreground md:text-3xl"
          >
            {formTitle}
          </motion.h1>
          {formSubtitle && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4, ease: EASE }}
              className="mt-1 text-sm text-muted-foreground"
            >
              {formSubtitle}
            </motion.p>
          )}

          <div className="mt-6">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}