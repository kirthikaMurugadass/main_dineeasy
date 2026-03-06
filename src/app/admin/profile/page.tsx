"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Loader2,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type OwnerProfile = {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  role: string;
  createdAt: string;
};

function FieldRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#D6D2C4]/60 bg-white/70 px-4 py-3 shadow-sm transition-all hover:shadow-md dark:border-[#3D4F2A]/60 dark:bg-[#111827]/50">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#16A34A] dark:bg-[#1F2914] dark:text-[#7A9E4A]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9CA88A]">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function EditableFieldRow({
  icon: Icon,
  label,
  value,
  isEditing,
  onChange,
  placeholder,
  disabled,
  inputType = "text",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  isEditing: boolean;
  onChange?: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputType?: React.HTMLInputTypeAttribute;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#D6D2C4]/60 bg-white/70 px-4 py-3 shadow-sm transition-all hover:shadow-md dark:border-[#3D4F2A]/60 dark:bg-[#111827]/50">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#16A34A] dark:bg-[#1F2914] dark:text-[#7A9E4A]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9CA88A]">
          {label}
        </p>
        {isEditing ? (
          <Input
            type={inputType}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="mt-2 h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/20 disabled:opacity-70 dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60"
          />
        ) : (
          <p className="mt-1 truncate text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state (UI)
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>("");
  const [editStreet, setEditStreet] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editPostal, setEditPostal] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const meta = (user.user_metadata ?? {}) as Record<string, any>;

      const fullName =
        meta.full_name ||
        meta.name ||
        user.email?.split("@")[0] ||
        "Owner";

      const avatarUrl =
        meta.avatar_url || meta.picture || meta.profile_picture_url || null;

      const phone = meta.phone || user.phone || "";

      const createdAt = user.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })
        : "";

      setProfile({
        fullName,
        email: user.email ?? "",
        phone,
        avatarUrl,
        streetAddress: meta.street_address || meta.street || "",
        city: meta.city || "",
        state: meta.state || "",
        country: meta.country || "",
        postalCode: meta.postal_code || meta.postalCode || "",
        role: meta.role || "Owner",
        createdAt,
      });
      setLoading(false);
    }

    load();
  }, [router]);

  const initials = useMemo(() => {
    const name = profile?.fullName || "";
    const chars = name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return chars || "OW";
  }, [profile?.fullName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  if (!profile) return null;

  function beginEdit() {
    if (!profile) return;
    setEditFullName(profile.fullName || "");
    setEditPhone(profile.phone || "");
    setEditAvatarUrl(profile.avatarUrl || "");
    setEditStreet(profile.streetAddress || "");
    setEditCity(profile.city || "");
    setEditState(profile.state || "");
    setEditCountry(profile.country || "");
    setEditPostal(profile.postalCode || "");
    setIsEditing(true);
  }

  async function handleSaveProfile() {
    if (!profile) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editFullName.trim(),
          phone: editPhone.trim(),
          avatar_url: editAvatarUrl.trim() || null,
          street_address: editStreet.trim(),
          city: editCity.trim(),
          state: editState.trim(),
          country: editCountry.trim(),
          postal_code: editPostal.trim(),
        },
      });

      if (error) throw error;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: editFullName.trim() || prev.fullName,
              phone: editPhone.trim(),
              avatarUrl: editAvatarUrl.trim() || null,
              streetAddress: editStreet.trim(),
              city: editCity.trim(),
              state: editState.trim(),
              country: editCountry.trim(),
              postalCode: editPostal.trim(),
            }
          : prev
      );

      toast.success("Profile updated");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageTitle description="Owner profile details and account information">
            Owner Profile
          </PageTitle>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              variant="outline"
              className="w-full rounded-full border-[#D6D2C4]/70 bg-white/70 text-[#2D3A1A] hover:bg-[#E8E4D9]/70 sm:w-auto dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60 dark:text-[#E8E4D9] dark:hover:bg-[#1F2914]"
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  return;
                }
                beginEdit();
              }}
              disabled={saving}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              className="w-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg transition-all hover:shadow-xl hover:from-[#16A34A] hover:to-[#15803D] disabled:opacity-60 sm:w-auto"
              onClick={handleSaveProfile}
              disabled={!isEditing || saving || !editFullName.trim()}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.05}>
          <Card className="rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-br from-[#FAFAF5] via-[#F8F6EE] to-[#F0EDE4] shadow-xl dark:border-[#3D4F2A]/60 dark:from-[#1A2212] dark:via-[#1F2914] dark:to-[#243019]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A] dark:bg-[#1F2914] dark:text-[#7A9E4A]">
                  <User className="h-4 w-4" />
                </span>
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-[#D6D2C4]/60 bg-white/70 p-4 shadow-sm dark:border-[#3D4F2A]/60 dark:bg-[#111827]/50">
                <Avatar size="lg" className="size-12 border border-[#D6D2C4]/60">
                  {profile.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
                  ) : null}
                  <AvatarFallback className="bg-[#DCFCE7] text-[#166534] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                    {profile.fullName || "—"}
                  </p>
                  <p className="truncate text-sm text-[#6B7B5A] dark:text-[#9CA88A]">
                    {profile.email || "—"}
                  </p>
                </div>
              </div>

              <EditableFieldRow
                icon={User}
                label="Full Name"
                value={isEditing ? editFullName : profile.fullName}
                isEditing={isEditing}
                onChange={setEditFullName}
                placeholder="Your full name"
              />
              <EditableFieldRow
                icon={Mail}
                label="Email Address"
                value={profile.email}
                isEditing={isEditing}
                disabled
                inputType="email"
              />
              <EditableFieldRow
                icon={Phone}
                label="Phone Number"
                value={isEditing ? editPhone : profile.phone}
                isEditing={isEditing}
                onChange={setEditPhone}
                placeholder="+1 555 000 0000"
                inputType="tel"
              />
              <EditableFieldRow
                icon={User}
                label="Profile Picture URL"
                value={isEditing ? editAvatarUrl : profile.avatarUrl || ""}
                isEditing={isEditing}
                onChange={setEditAvatarUrl}
                placeholder="https://..."
              />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.08}>
          <Card className="rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-br from-[#FAFAF5] via-[#F8F6EE] to-[#F0EDE4] shadow-xl dark:border-[#3D4F2A]/60 dark:from-[#1A2212] dark:via-[#1F2914] dark:to-[#243019]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A] dark:bg-[#1F2914] dark:text-[#7A9E4A]">
                  <MapPin className="h-4 w-4" />
                </span>
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EditableFieldRow
                icon={MapPin}
                label="Street Address"
                value={isEditing ? editStreet : profile.streetAddress}
                isEditing={isEditing}
                onChange={setEditStreet}
                placeholder="Street address"
              />
              <EditableFieldRow
                icon={MapPin}
                label="City"
                value={isEditing ? editCity : profile.city}
                isEditing={isEditing}
                onChange={setEditCity}
                placeholder="City"
              />
              <EditableFieldRow
                icon={MapPin}
                label="State"
                value={isEditing ? editState : profile.state}
                isEditing={isEditing}
                onChange={setEditState}
                placeholder="State"
              />
              <EditableFieldRow
                icon={MapPin}
                label="Country"
                value={isEditing ? editCountry : profile.country}
                isEditing={isEditing}
                onChange={setEditCountry}
                placeholder="Country"
              />
              <EditableFieldRow
                icon={MapPin}
                label="Postal Code"
                value={isEditing ? editPostal : profile.postalCode}
                isEditing={isEditing}
                onChange={setEditPostal}
                placeholder="Postal code"
              />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.12}>
        <Card className="rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-br from-[#FAFAF5] via-[#F8F6EE] to-[#F0EDE4] shadow-xl dark:border-[#3D4F2A]/60 dark:from-[#1A2212] dark:via-[#1F2914] dark:to-[#243019]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A] dark:bg-[#1F2914] dark:text-[#7A9E4A]">
                <Shield className="h-4 w-4" />
              </span>
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FieldRow icon={Shield} label="Role" value={profile.role} />
            <FieldRow icon={Calendar} label="Account Created Date" value={profile.createdAt} />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

