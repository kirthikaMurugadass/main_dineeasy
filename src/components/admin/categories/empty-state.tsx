"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function CategoriesEmptyState() {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-dashed border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center p-16 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gold/10"
          >
            <FolderOpen size={48} className="text-gold" />
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-2 text-2xl font-semibold"
          >
            {t.admin.categories.emptyTitle}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 max-w-md text-muted-foreground"
          >
            {t.admin.categories.emptyDescription}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/admin/menu/category/new">
              <Button size="lg" className="gap-2 bg-espresso text-warm hover:bg-espresso/90">
                <Plus size={20} />
                {t.admin.categories.emptyButton}
              </Button>
            </Link>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
