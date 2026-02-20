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
    <div className="flex min-h-[calc(100vh-5rem)] w-full items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[24px] bg-[#0f0f0f] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] md:min-h-[600px] md:flex-row"
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
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
              className="font-serif text-3xl font-bold text-white md:text-4xl"
            >
              {leftHeading}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
              className="mt-3 text-sm text-gray-300 md:text-base"
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
                  className="inline-flex items-center justify-center rounded-xl border-2 border-white px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  {leftButtonText}
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* FORM PANEL */}
        <div
          className={`flex w-full flex-col justify-center bg-[#0f0f0f] p-6 md:w-1/2 md:p-10 ${
            imageOnLeft ? "order-2 md:order-2" : "order-2 md:order-1"
          }`}
        >
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
            className="font-serif text-2xl font-bold text-white md:text-3xl"
          >
            {formTitle}
          </motion.h1>
          {formSubtitle && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4, ease: EASE }}
              className="mt-1 text-sm text-gray-400"
            >
              {formSubtitle}
            </motion.p>
          )}

          {/* Social buttons - decorative */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
            className="mt-6 flex gap-3"
          >
            <button
              type="button"
              disabled
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-gray-400 transition-all duration-300 hover:border-gold/30 hover:bg-gold/10 hover:text-gold/80 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Google"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </button>
            <button
              type="button"
              disabled
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-gray-400 transition-all duration-300 hover:border-gold/30 hover:bg-gold/10 hover:text-gold/80 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Facebook"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              type="button"
              disabled
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-gray-400 transition-all duration-300 hover:border-gold/30 hover:bg-gold/10 hover:text-gold/80 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </button>
          </motion.div>

          <div className="mt-6">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}