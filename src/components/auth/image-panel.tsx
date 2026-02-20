"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ImagePanelProps {
  imagePath: string;
  heading: string;
  subtitle: string;
  buttonText: string;
  buttonHref: string;
  position: "left" | "right";
}

export function ImagePanel({
  imagePath,
  heading,
  subtitle,
  buttonText,
  buttonHref,
  position,
}: ImagePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: position === "left" ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: position === "left" ? -50 : 50 }}
      transition={{
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1], // cubic-bezier(0.4, 0, 0.2, 1)
      }}
      className="relative hidden lg:flex lg:w-[55%] h-screen overflow-hidden"
    >
      {/* Background Image with Zoom Animation */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0"
      >
        <Image
          src={imagePath}
          alt="Restaurant ambiance"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </motion.div>

      {/* Semi-transparent Dark Brown Card Overlay */}
      <div className="relative z-10 flex items-center justify-center h-full px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#3E2723]/80 backdrop-blur-sm rounded-2xl p-10 max-w-md text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white font-serif mb-4">
            {heading}
          </h2>
          <p className="text-lg text-white/90 mb-8">
            {subtitle}
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Link href={buttonHref}>
              <Button
                variant="outline"
                className="border-2 border-white/50 bg-transparent text-white hover:bg-white/10 hover:border-white/70 px-8 py-6 text-base font-semibold rounded-xl"
              >
                {buttonText}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
