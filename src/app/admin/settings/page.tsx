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
  const settingsT = t.settings;
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [closingHours, setClosingHours] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [currency, setCurrency] = useState("");
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [maxGuestsPerTable, setMaxGuestsPerTable] = useState("");
  const [minGuestsPerTable, setMinGuestsPerTable] = useState("");
  const [defaultTableCapacity, setDefaultTableCapacity] = useState("");
  const [autoConfirmBooking, setAutoConfirmBooking] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [cancellationTimeLimit, setCancellationTimeLimit] = useState("");
  const [emailNotifyNewBookings, setEmailNotifyNewBookings] = useState(true);
  const [smsNotifyNewBookings, setSmsNotifyNewBookings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState("");
  const [themeConfig, setThemeConfig] = useState<any>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const userEmail = user.email ?? "";
      setOwnerEmail(userEmail);

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, name, slug, theme_config")
        .eq("owner_id", user.id)
        .single();

      if (restaurant) {
        setRestaurantId(restaurant.id);
        setName(restaurant.name);
        setSlug(restaurant.slug);
        setOriginalSlug(restaurant.slug);
        const cfg = (restaurant as any).theme_config ?? {};
        setThemeConfig(cfg);
        const settings = cfg.settings ?? {};
        setDescription(settings.description ?? "");
        setContactPhone(settings.contactPhone ?? "");
        setContactEmail(settings.contactEmail ?? userEmail);
        const addr = settings.address ?? {};
        setStreet(addr.street ?? "");
        setCity(addr.city ?? "");
        setStateRegion(addr.state ?? "");
        setCountry(addr.country ?? "");
        setPostalCode(addr.postalCode ?? "");
        const business = settings.business ?? {};
        setOpeningHours(business.openingHours ?? "");
        setClosingHours(business.closingHours ?? "");
        setTimeZone(business.timeZone ?? "");
        setCurrency(business.currency ?? "");
        const booking = settings.booking ?? {};
        setBookingEnabled(
          booking.enabled === undefined ? true : Boolean(booking.enabled),
        );
        setMaxGuestsPerTable(
          booking.maxGuestsPerTable != null
            ? String(booking.maxGuestsPerTable)
            : "",
        );
        setMinGuestsPerTable(
          booking.minGuestsPerTable != null
            ? String(booking.minGuestsPerTable)
            : "",
        );
        setDefaultTableCapacity(
          booking.defaultTableCapacity != null
            ? String(booking.defaultTableCapacity)
            : "",
        );
        setAutoConfirmBooking(booking.autoConfirm ?? false);
        setRequireApproval(
          booking.requireApproval === undefined
            ? true
            : Boolean(booking.requireApproval),
        );
        setCancellationTimeLimit(
          booking.cancellationTimeLimitMinutes != null
            ? String(booking.cancellationTimeLimitMinutes)
            : "",
        );
        const notifications = settings.notifications ?? {};
        setEmailNotifyNewBookings(
          notifications.emailNewBookings === undefined
            ? true
            : Boolean(notifications.emailNewBookings),
        );
        setSmsNotifyNewBookings(Boolean(notifications.smsNewBookings));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const updatedThemeConfig = {
        ...themeConfig,
        settings: {
          ...(themeConfig.settings ?? {}),
          description,
          contactPhone,
          contactEmail,
          address: {
            street,
            city,
            state: stateRegion,
            country,
            postalCode,
          },
          business: {
            openingHours,
            closingHours,
            timeZone,
            currency,
          },
          booking: {
            enabled: bookingEnabled,
            maxGuestsPerTable: maxGuestsPerTable
              ? Number(maxGuestsPerTable)
              : null,
            minGuestsPerTable: minGuestsPerTable
              ? Number(minGuestsPerTable)
              : null,
            defaultTableCapacity: defaultTableCapacity
              ? Number(defaultTableCapacity)
              : null,
            autoConfirm: autoConfirmBooking,
            requireApproval,
            cancellationTimeLimitMinutes: cancellationTimeLimit
              ? Number(cancellationTimeLimit)
              : null,
          },
          notifications: {
            emailNewBookings: emailNotifyNewBookings,
            smsNewBookings: smsNotifyNewBookings,
          },
        },
      };

      const { error } = await supabase
        .from("restaurants")
        .update({ name, slug, theme_config: updatedThemeConfig })
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
      toast.success(settingsT?.saved || "Settings saved!");
    } catch {
      toast.error(settingsT?.error || "Failed to save settings");
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
          <PageTitle description={settingsT?.description || "Manage your restaurant profile and account"}>
            {settingsT?.title || "Settings"}
          </PageTitle>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:from-primary hover:to-primary/90 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {settingsT?.save || "Save"}
          </Button>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Restaurant Settings */}
        <FadeIn delay={0.08}>
          <Card className="rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-br from-[#FAFAF5] via-[#F8F6EE] to-[#F0EDE4] shadow-xl dark:border-[#1f1f1f] dark:!bg-[#000000] dark:from-transparent dark:via-transparent dark:to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary">
                  <Store className="h-4 w-4" />
                </span>
                {settingsT?.page?.sections?.restaurantSettings || "Restaurant Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Restaurant Basic Info */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#000000]">
                <div className="mb-3 flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    {settingsT?.page?.sections?.restaurantBasicInfo || "Restaurant Basic Info"}
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>{settingsT?.restaurantName || "Restaurant Name"}</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={settingsT?.restaurantNamePlaceholder || "My Cafe or Restaurant"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{settingsT?.page?.fields?.restaurantDescription || "Restaurant Description"}</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.restaurantDescription || "Add a short description for your restaurant"}
                      className="min-h-[90px] rounded-xl border-2 border-[#D6D2C4]/70 bg-white/60 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{settingsT?.page?.fields?.contactPhone || "Contact Phone"}</Label>
                      <Input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder={settingsT?.page?.placeholders?.contactPhone || "+41 79 000 00 00"}
                        className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{settingsT?.page?.fields?.contactEmail || "Contact Email"}</Label>
                      <Input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder={ownerEmail || settingsT?.page?.placeholders?.contactEmail || "you@example.com"}
                        className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                      />
                      <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                        {settingsT?.page?.labels?.defaultEmailFromOwner || "Default email from your owner account:"}{" "}
                        <span className="font-medium">{ownerEmail}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{settingsT?.urlSlug || "URL Slug"}</Label>
                    <Input
                      value={slug}
                      onChange={(e) =>
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                      }
                      placeholder={settingsT?.urlSlugPlaceholder || "my-cafe"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                    <p className="text-xs text-muted-foreground">
                      {settingsT?.urlDescription || "Your menu will be at: dineeasy.app/"}
                      <strong>{slug}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Restaurant Address */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#000000]">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    {settingsT?.page?.sections?.restaurantAddress || "Restaurant Address"}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{settingsT?.page?.fields?.streetAddress || "Street Address"}</Label>
                    <Input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.streetAddress || "Street and number"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{settingsT?.page?.fields?.city || "City"}</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.city || "City"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{settingsT?.page?.fields?.state || "State"}</Label>
                    <Input
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.state || "State / Region"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{settingsT?.page?.fields?.country || "Country"}</Label>
                    <Input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.country || "Country"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{settingsT?.page?.fields?.postalCode || "Postal Code"}</Label>
                    <Input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.postalCode || "ZIP / Postal Code"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#000000]">
                <div className="mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    {settingsT?.page?.sections?.businessDetails || "Business Details"}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{settingsT?.page?.fields?.openingHours || "Opening Hours"}</Label>
                    <Input
                      value={openingHours}
                      onChange={(e) => setOpeningHours(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.openingHours || "e.g. 09:00"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{settingsT?.page?.fields?.closingHours || "Closing Hours"}</Label>
                    <Input
                      value={closingHours}
                      onChange={(e) => setClosingHours(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.closingHours || "e.g. 22:00"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{settingsT?.page?.fields?.timeZone || "Time Zone"}</Label>
                    <Input
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.timeZone || "e.g. Europe/Zurich"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{settingsT?.page?.fields?.currency || "Currency"}</Label>
                    <Input
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.currency || "e.g. CHF"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </FadeIn>

        {/* Book a Table Settings */}
        <FadeIn delay={0.12}>
          <Card className="rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-br from-[#FAFAF5] via-[#F8F6EE] to-[#F0EDE4] shadow-xl dark:border-[#1f1f1f] dark:!bg-[#000000] dark:from-transparent dark:via-transparent dark:to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary">
                  <CalendarDays className="h-4 w-4" />
                </span>
                {settingsT?.page?.sections?.bookATableSettings || "Book a Table Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reservation Settings */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#000000]">
                <div className="mb-3 flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    {settingsT?.page?.sections?.reservationSettings || "Reservation Settings"}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#000000] dark:border dark:border-[#1f1f1f]">
                    <div className="space-y-0.5">
                      <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                        {settingsT?.page?.toggles?.enableDisableTableBooking || "Enable / Disable Table Booking"}
                      </p>
                      <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                        {settingsT?.page?.toggles?.enableDisableTableBookingHint || "Turn online table booking on or off for your restaurant."}
                      </p>
                    </div>
                    <Switch
                      checked={bookingEnabled}
                      onCheckedChange={setBookingEnabled}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{settingsT?.page?.fields?.maxGuestsPerTable || "Maximum Guests per Table"}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={maxGuestsPerTable}
                        onChange={(e) => setMaxGuestsPerTable(e.target.value)}
                        placeholder={settingsT?.page?.placeholders?.maxGuestsPerTable || "e.g. 8"}
                        className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{settingsT?.page?.fields?.minGuestsPerTable || "Minimum Guests per Table"}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={minGuestsPerTable}
                        onChange={(e) => setMinGuestsPerTable(e.target.value)}
                        placeholder={settingsT?.page?.placeholders?.minGuestsPerTable || "e.g. 1"}
                        className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Management */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#000000]">
                <div className="mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    {settingsT?.page?.sections?.tableManagement || "Table Management"}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{settingsT?.page?.fields?.defaultTableCapacity || "Default Table Capacity"}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={defaultTableCapacity}
                      onChange={(e) => setDefaultTableCapacity(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.defaultTableCapacity || "e.g. 4"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Rules */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#000000]">
                <div className="mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    {settingsT?.page?.sections?.bookingRules || "Booking Rules"}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#000000] dark:border dark:border-[#1f1f1f]">
                    <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      {settingsT?.page?.toggles?.autoConfirmBooking || "Auto Confirm Booking"}
                    </p>
                    <Switch
                      checked={autoConfirmBooking}
                      onCheckedChange={setAutoConfirmBooking}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#000000] dark:border dark:border-[#1f1f1f]">
                    <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      {settingsT?.page?.toggles?.requireApprovalBeforeConfirmation || "Require Approval Before Confirmation"}
                    </p>
                    <Switch
                      checked={requireApproval}
                      onCheckedChange={setRequireApproval}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{settingsT?.page?.fields?.cancellationTimeLimit || "Cancellation Time Limit (minutes)"}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={cancellationTimeLimit}
                      onChange={(e) => setCancellationTimeLimit(e.target.value)}
                      placeholder={settingsT?.page?.placeholders?.cancellationTimeLimit || "e.g. 120"}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 dark:border-[#1f1f1f] dark:bg-[#0f0f0f] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#000000]">
                <div className="mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    {settingsT?.page?.sections?.notificationSettings || "Notification Settings"}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#000000] dark:border dark:border-[#1f1f1f]">
                    <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      {settingsT?.page?.toggles?.emailNotificationNewBookings || "Email Notification for New Bookings"}
                    </p>
                    <Switch
                      checked={emailNotifyNewBookings}
                      onCheckedChange={setEmailNotifyNewBookings}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#000000] dark:border dark:border-[#1f1f1f]">
                    <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      {settingsT?.page?.toggles?.smsNotificationNewBookings || "SMS Notification for New Bookings"}
                    </p>
                    <Switch
                      checked={smsNotifyNewBookings}
                      onCheckedChange={setSmsNotifyNewBookings}
                    />
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
