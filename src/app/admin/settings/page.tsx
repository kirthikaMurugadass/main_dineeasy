"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { FadeIn } from "@/components/motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";

export default function SettingsPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, name, slug")
        .eq("owner_id", user.id)
        .single();

      if (restaurant) {
        setRestaurantId(restaurant.id);
        setName(restaurant.name);
        setSlug(restaurant.slug);
        setOriginalSlug(restaurant.slug);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("restaurants")
        .update({ name, slug })
        .eq("id", restaurantId);

      if (error) throw error;

      // Bust cache for the old slug (in case slug changed)
      if (originalSlug) {
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantSlug: originalSlug }),
        }).catch(() => {});
      }
      // Also bust cache for the new slug
      if (slug && slug !== originalSlug) {
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantSlug: slug }),
        }).catch(() => {});
      }

      setOriginalSlug(slug);
      toast.success(t.admin.settings.saved);
    } catch {
      toast.error(t.admin.settings.error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex items-center justify-between">
          <PageTitle description={t.admin.settings.description}>
            {t.admin.settings.title}
          </PageTitle>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-espresso text-warm hover:bg-espresso/90"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t.admin.settings.save}
          </Button>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.1}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t.admin.settings.restaurantProfile}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t.admin.settings.restaurantName}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.admin.settings.restaurantNamePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.admin.settings.urlSlug}</Label>
                <Input
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                  }
                  placeholder={t.admin.settings.urlSlugPlaceholder}
                />
                <p className="text-xs text-muted-foreground">
                  {t.admin.settings.urlDescription}<strong>{slug}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{t.admin.settings.account}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t.admin.settings.email}</Label>
                <Input value={email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  {t.admin.settings.emailDescription}
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
