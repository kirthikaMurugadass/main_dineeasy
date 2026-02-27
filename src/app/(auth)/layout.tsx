"use client";

import { motion } from "framer-motion";
import { AuthNavbar } from "@/components/auth/auth-navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Animated gradient mesh */}
      <div className="fixed inset-0 -z-20 overflow-hidden">
        <motion.div
          className="absolute -left-1/4 -top-1/4 h-[80vh] w-[80vh] rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 h-[70vh] w-[70vh] rounded-full bg-primary/5 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80")',
          }}
        />
      </div>

      <AuthNavbar />
      <div className="pt-20">{children}</div>
    </div>
  );
}
