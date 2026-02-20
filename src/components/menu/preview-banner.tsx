"use client";

import { X, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface PreviewBannerProps {
  restaurantSlug: string;
  menuId: string;
}

export function PreviewBanner({ restaurantSlug, menuId }: PreviewBannerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  function handleExit() {
    // Close the preview tab/window
    if (window.opener) {
      window.close();
    } else {
      // If opened directly, redirect to appearance page
      router.push("/admin/appearance");
    }
  }

  function handleBackToAppearance() {
    router.push("/admin/appearance");
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Get the preview config from URL
      const urlParams = new URLSearchParams(window.location.search);
      const configParam = urlParams.get("config");

      if (!configParam) {
        toast.error("No preview configuration found");
        return;
      }

      // Decode config
      const previewConfig = JSON.parse(atob(configParam));

      // Save to database via API
      const response = await fetch("/api/appearance/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug,
          themeConfig: previewConfig,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      // Revalidate cache
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantSlug }),
      }).catch(() => {});

      toast.success("Appearance saved successfully!");
      setTimeout(() => {
        router.push("/admin/appearance");
      }, 500);
    } catch (error) {
      console.error("Error saving appearance:", error);
      toast.error("Failed to save appearance. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b border-yellow-400/30 bg-gradient-to-r from-yellow-500/10 via-yellow-400/10 to-yellow-500/10 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-yellow-400/20 px-3 py-1.5">
            <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
              PREVIEW MODE
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            Changes are not saved yet
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToAppearance}
            className="gap-2 text-xs"
          >
            <ArrowLeft size={14} />
            Back to Appearance
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-espresso text-warm hover:bg-espresso/90"
          >
            {saving ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-warm border-t-transparent" />
            ) : (
              <Save size={14} />
            )}
            Save Changes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="gap-2 text-xs"
          >
            <X size={14} />
            Exit Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
