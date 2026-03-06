"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  Store,
  MapPin,
  Briefcase,
  Palette,
  CalendarDays,
  Settings2,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { FadeIn } from "@/components/motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

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
            className="gap-2 rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg transition-all hover:shadow-xl hover:from-[#16A34A] hover:to-[#15803D] disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t.admin.settings.save}
          </Button>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Restaurant Settings */}
        <FadeIn delay={0.08}>
          <Card className="rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-br from-[#FAFAF5] via-[#F8F6EE] to-[#F0EDE4] shadow-xl dark:border-[#3D4F2A]/60 dark:from-[#1A2212] dark:via-[#1F2914] dark:to-[#243019]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A] dark:bg-[#1F2914] dark:text-[#7A9E4A]">
                  <Store className="h-4 w-4" />
                </span>
                Restaurant Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Restaurant Basic Info */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#3D4F2A]/60 dark:bg-[#111827]/50">
                <div className="mb-3 flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-[#16A34A]" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    Restaurant Basic Info
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>{t.admin.settings.restaurantName}</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.admin.settings.restaurantNamePlaceholder}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/20 dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Restaurant Description</Label>
                    <Textarea
                      disabled
                      placeholder="Add a short description for your restaurant (coming soon)"
                      className="min-h-[90px] rounded-xl border-2 border-[#D6D2C4]/70 bg-white/60 text-sm shadow-sm dark:border-[#3D4F2A]/70 dark:bg-[#111827]/50"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <Input
                        disabled
                        placeholder="Coming soon"
                        className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <Input
                        value={email}
                        disabled
                        className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70"
                      />
                      <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                        Uses your owner account email for now.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.admin.settings.urlSlug}</Label>
                    <Input
                      value={slug}
                      onChange={(e) =>
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                      }
                      placeholder={t.admin.settings.urlSlugPlaceholder}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/20 dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t.admin.settings.urlDescription}
                      <strong>{slug}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Restaurant Address */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#3D4F2A]/60 dark:bg-[#111827]/50">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#16A34A]" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    Restaurant Address
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Street Address</Label>
                    <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#3D4F2A]/60 dark:bg-[#111827]/50">
                <div className="mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#16A34A]" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    Business Details
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Opening Hours</Label>
                    <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                  <div className="space-y-2">
                    <Label>Closing Hours</Label>
                    <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Zone</Label>
                    <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#3D4F2A]/60 dark:bg-[#111827]/50">
                <div className="mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-[#16A34A]" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    Appearance
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Theme Color</Label>
                    <Input disabled placeholder="Managed in Appearance" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                  <div className="space-y-2">
                    <Label>Restaurant Banner Image</Label>
                    <Input disabled placeholder="Managed in Appearance" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                  These visual settings are managed in the Appearance page.
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Book a Table Settings */}
        <FadeIn delay={0.12}>
          <Card className="rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-br from-[#FAFAF5] via-[#F8F6EE] to-[#F0EDE4] shadow-xl dark:border-[#3D4F2A]/60 dark:from-[#1A2212] dark:via-[#1F2914] dark:to-[#243019]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A] dark:bg-[#1F2914] dark:text-[#7A9E4A]">
                  <CalendarDays className="h-4 w-4" />
                </span>
                Book a Table Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reservation Settings */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#3D4F2A]/60 dark:bg-[#111827]/50">
                <div className="mb-3 flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-[#16A34A]" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    Reservation Settings
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#1F2914]">
                    <div className="space-y-0.5">
                      <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                        Enable / Disable Table Booking
                      </p>
                      <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                        Configure availability for online reservations (coming soon).
                      </p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Maximum Guests per Table</Label>
                      <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Guests per Table</Label>
                      <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                    </div>
                    <div className="space-y-2">
                      <Label>Advance Booking Limit</Label>
                      <Input disabled placeholder="e.g. 7 days (coming soon)" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                    </div>
                    <div className="space-y-2">
                      <Label>Booking Time Interval</Label>
                      <Input disabled placeholder="15 / 30 / 60 min (coming soon)" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Management */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#3D4F2A]/60 dark:bg-[#111827]/50">
                <div className="mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#16A34A]" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    Table Management
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Default Table Capacity</Label>
                    <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#1F2914]">
                    <div className="space-y-0.5">
                      <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                        Allow Multiple Reservations
                      </p>
                      <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                        Allow multiple bookings per time slot (coming soon).
                      </p>
                    </div>
                    <Switch checked={false} disabled />
                  </div>
                </div>
              </div>

              {/* Booking Rules */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#3D4F2A]/60 dark:bg-[#111827]/50">
                <div className="mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#16A34A]" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    Booking Rules
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#1F2914]">
                    <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Auto Confirm Booking
                    </p>
                    <Switch checked={false} disabled />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#1F2914]">
                    <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Require Approval Before Confirmation
                    </p>
                    <Switch checked={true} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Cancellation Time Limit</Label>
                    <Input disabled placeholder="Coming soon" className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-muted/40 text-sm shadow-sm dark:border-[#3D4F2A]/70" />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#3D4F2A]/60 dark:bg-[#111827]/50">
                <div className="mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#16A34A]" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    Notification Settings
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#1F2914]">
                    <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Email Notification for new bookings
                    </p>
                    <Switch checked={true} disabled />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#1F2914]">
                    <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      SMS notification (if available)
                    </p>
                    <Switch checked={false} disabled />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
