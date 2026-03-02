"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

export function AddCategoryCard() {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Link href="/admin/menu/category/new">
        <Card className="group relative h-full cursor-pointer overflow-hidden border-2 border-dashed border-border/60 bg-card shadow-soft transition-all duration-300 hover:border-primary/40 hover:bg-card/95 hover:shadow-floating">
          <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center p-6 text-center">
            <motion.div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/40 transition-all duration-300 group-hover:bg-muted/70 group-hover:scale-110"
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Plus size={32} className="text-neutral-800 dark:text-neutral-100" />
            </motion.div>
            <h3 className="mb-2 text-lg font-semibold">{t.admin.categories.addCategory}</h3>
            <p className="max-w-xs text-sm text-neutral-700 dark:text-muted-foreground">
              {t.admin.categories.description}
            </p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
