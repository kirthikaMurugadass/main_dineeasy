"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Pencil, Trash2, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageTitle } from "@/components/ui/page-title";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/contexts/subscription-context";

interface RestaurantTable {
  id: string;
  table_name: string;
  capacity: number;
  section: string | null;
  is_active: boolean;
}

export default function TablesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { isPro, loading: subscriptionLoading } = useSubscription();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<RestaurantTable[]>([]);

  // Add form state
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState<string>("2");
  const [section, setSection] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [adding, setAdding] = useState(false);

  // Edit form state
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCapacity, setEditingCapacity] = useState<string>("");
  const [editingSection, setEditingSection] = useState("");
  const [editingActive, setEditingActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTables = useCallback(
    async (currentRestaurantId: string) => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("restaurant_tables")
          .select("id, table_name, capacity, section, is_active")
          .eq("restaurant_id", currentRestaurantId)
          .order("table_name");

        if (error) throw error;

        setTables(data || []);
      } catch (error: any) {
        console.error("Error loading tables:", error);
        toast.error(error?.message || "Failed to load tables");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    async function init() {
      if (!isPro) return;
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) {
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);
      await loadTables(restaurant.id);
    }

    init();
  }, [loadTables, router, isPro]);

  useEffect(() => {
    if (!subscriptionLoading && !isPro) {
      toast.error("Table management is available on the Pro plan.");
      router.replace("/admin");
    }
  }, [isPro, subscriptionLoading, router]);

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantId) return;

    if (!tableName.trim()) {
      toast.error("Please enter a table name.");
      return;
    }

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap <= 0) {
      toast.error("Capacity must be a positive number.");
      return;
    }

    setAdding(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("restaurant_tables").insert({
        restaurant_id: restaurantId,
        table_name: tableName.trim(),
        capacity: cap,
        section: section.trim() || null,
        is_active: isActive,
      });

      if (error) throw error;

      toast.success("Table added.");
      setTableName("");
      setCapacity("2");
      setSection("");
      setIsActive(true);
      await loadTables(restaurantId);
    } catch (error: any) {
      console.error("Error adding table:", error, error?.message);
      toast.error(error?.message || "Failed to add table");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(table: RestaurantTable) {
    setEditingTable(table);
    setEditingName(table.table_name);
    setEditingCapacity(String(table.capacity));
    setEditingSection(table.section || "");
    setEditingActive(table.is_active);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTable || !restaurantId) return;

    if (!editingName.trim()) {
      toast.error("Please enter a table name.");
      return;
    }

    const cap = parseInt(editingCapacity, 10);
    if (isNaN(cap) || cap <= 0) {
      toast.error("Capacity must be a positive number.");
      return;
    }

    setSavingEdit(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("restaurant_tables")
        .update({
          table_name: editingName.trim(),
          capacity: cap,
          section: editingSection.trim() || null,
          is_active: editingActive,
        })
        .eq("id", editingTable.id)
        .eq("restaurant_id", restaurantId);

      if (error) throw error;

      toast.success("Table updated.");
      setEditingTable(null);
      await loadTables(restaurantId);
    } catch (error: any) {
      console.error("Error updating table:", error);
      toast.error(error?.message || "Failed to update table");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: string) {
    if (!restaurantId) return;

    if (!confirm("Are you sure you want to delete this table? This cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("restaurant_tables")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", restaurantId);

      if (error) throw error;

      toast.success("Table deleted.");
      await loadTables(restaurantId);
    } catch (error: any) {
      console.error("Error deleting table:", error);
      toast.error(error?.message || "Failed to delete table");
    } finally {
      setDeletingId(null);
    }
  }

  if (!isPro) {
    return null;
  }

  const numericCapacity = Math.max(1, Math.min(12, parseInt(capacity, 10) || 0));
  const numericEditingCapacity = Math.max(1, Math.min(12, parseInt(editingCapacity, 10) || 0));

  const previewDraftName = (editingTable ? editingName : tableName).trim();
  const previewDraftCapacity = editingTable ? numericEditingCapacity : numericCapacity;

  const previewTables = useCallback(() => {
    // Merge "draft" inputs into the existing tables list for instant live preview.
    // This is UI-only and does not affect DB or form behavior.
    const base = [...tables];

    // If editing, overlay the edited values on that table id
    if (editingTable) {
      return base.map((t) =>
        t.id === editingTable.id
          ? { ...t, table_name: previewDraftName || t.table_name, capacity: previewDraftCapacity }
          : t
      );
    }

    // If creating, only add a draft card when a name is provided
    if (!previewDraftName) return base;

    const lower = (s: string) => s.trim().toLowerCase();
    const existingIdx = base.findIndex((t) => lower(t.table_name) === lower(previewDraftName));
    if (existingIdx >= 0) {
      // If the name matches an existing table, preview the capacity change on that card
      base[existingIdx] = { ...base[existingIdx], capacity: previewDraftCapacity };
      return base;
    }

    return [
      ...base,
      {
        id: "__draft__",
        table_name: previewDraftName,
        capacity: previewDraftCapacity,
        section: null,
        is_active: isActive,
      },
    ];
  }, [
    editingTable,
    editingName,
    isActive,
    previewDraftCapacity,
    previewDraftName,
    tables,
  ]);

  const sortedPreviewTables = useCallback(() => {
    return previewTables().sort((a, b) => {
      const aMatch = a.table_name.match(/T-(\d+)/i);
      const bMatch = b.table_name.match(/T-(\d+)/i);
      if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1]);
      return a.table_name.localeCompare(b.table_name, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [previewTables]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <FadeIn>
        <div className="flex items-center justify-between rounded-2xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/60 px-4 py-4 shadow-sm dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/60">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#DCFCE7] to-[#BBF7D0] p-2.5 shadow-sm dark:from-[#3D4F2A] dark:to-[#4A5B33]">
              <Table2 className="h-5 w-5 text-[#22C55E]" />
            </div>
            <div>
              <PageTitle>Create Table</PageTitle>
              <p className="text-sm text-[#6B7B5A] dark:text-[#9CA88A] mt-0.5">
                Add and manage restaurant tables
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Create Table + Preview */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
        {/* Create Table Form Card */}
        <FadeIn delay={0.05}>
          <Card className="rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-br from-[#FAFAF5] via-[#F8F6EE] to-[#F0EDE4] shadow-xl dark:border-[#3D4F2A]/60 dark:from-[#1A2212] dark:via-[#1F2914] dark:to-[#243019]">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                Create Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTable} className="space-y-6">
                {/* Table Information */}
                <div className="space-y-3 rounded-2xl bg-white/70 p-4 shadow-sm dark:bg-[#111827]/40">
                  <div className="flex items-center gap-2 pb-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A] text-xs font-semibold">
                      1
                    </span>
                    <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Table Information
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Table Name
                    </label>
                    <Input
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      placeholder="e.g. T1, Window 3, Booth A"
                      disabled={adding}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/20 dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Section <span className="text-xs text-[#9CA88A]">(optional)</span>
                    </label>
                    <Input
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      placeholder="e.g. Terrace, Window, Garden"
                      disabled={adding}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/20 dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60"
                    />
                  </div>
                </div>

                {/* Seating Details */}
                <div className="space-y-3 rounded-2xl bg-white/70 p-4 shadow-sm dark:bg-[#111827]/40">
                  <div className="flex items-center gap-2 pb-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A] text-xs font-semibold">
                      2
                    </span>
                    <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Seating Details
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Seating Capacity
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      disabled={adding}
                      className="h-11 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/20 dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60"
                    />
                    <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                      Choose how many guests this table can comfortably seat.
                    </p>
                  </div>
                </div>

                {/* Table Settings */}
                <div className="space-y-3 rounded-2xl bg-white/70 p-4 shadow-sm dark:bg-[#111827]/40">
                  <div className="flex items-center gap-2 pb-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A] text-xs font-semibold">
                      3
                    </span>
                    <p className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Table Settings
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#1F2914]">
                    <div className="space-y-0.5">
                      <p className="font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                        Active status
                      </p>
                      <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                        {isActive ? "Table will be available for bookings and walk-ins." : "Table will be hidden from booking options."}
                      </p>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      disabled={adding}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full border-[#D6D2C4]/70 bg-white/70 text-[#2D3A1A] hover:bg-[#E8E4D9]/70 sm:w-auto dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60 dark:text-[#E8E4D9] dark:hover:bg-[#1F2914]"
                    disabled={adding}
                    onClick={() => {
                      setTableName("");
                      setCapacity("2");
                      setSection("");
                      setIsActive(true);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="w-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg transition-all hover:shadow-xl hover:from-[#16A34A] hover:to-[#15803D] disabled:opacity-60 sm:w-auto"
                    disabled={adding || !restaurantId}
                  >
                    {adding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Create Table"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Live Table Preview - Visual Layout */}
        <FadeIn delay={0.1}>
          <Card className="rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4] shadow-xl dark:border-[#3D4F2A]/60 dark:from-[#1A2212] dark:to-[#243019]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9] flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
                  <Table2 className="h-4 w-4" />
                </span>
                Table Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Match the customer-facing booking UI table grid */}
              <div className="mx-auto w-full max-w-2xl">
                <div className="grid grid-cols-4 gap-2">
                  {sortedPreviewTables().map((table) => {
                    // Admin preview is purely visual (no real-time booking status),
                    // so we render all active tables as "Available" (green).
                    const isInactive = !table.is_active;
                    const cardClasses = isInactive
                      ? "bg-gray-100 border-gray-300 text-gray-500 opacity-70"
                      : "bg-white border-[#22C55E] text-[#2D3A1A]";
                    const dotClasses = isInactive ? "bg-gray-400" : "bg-[#22C55E]";

                    return (
                      <div
                        key={table.id}
                        className={`relative flex h-20 flex-col items-center justify-center rounded-md border-2 px-1 py-1 shadow-sm ${cardClasses}`}
                      >
                        {/* Table name (top) */}
                        <div className="text-[13px] font-bold">{table.table_name}</div>
                        {/* Status dot (middle) */}
                        <div className={`mt-1 h-1.5 w-1.5 rounded-full ${dotClasses}`} />
                        {/* Capacity (bottom) */}
                        <div className="mt-auto text-[10px] font-medium leading-tight text-[#6B7B5A]">
                          Capacity: {table.capacity}{" "}
                          {table.capacity === 1 ? "Person" : "Persons"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend (same as booking page) */}
              <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-[#D6D2C4]/60 bg-gradient-to-b from-white to-[#F7F4EA] px-6 py-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
                  <span className="text-sm text-[#6B7B5A]">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#F97316]" />
                  <span className="text-sm text-[#6B7B5A]">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                  <span className="text-sm text-[#6B7B5A]">Reserved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Edit Table Form */}
      {editingTable && (
        <FadeIn delay={0.15}>
          <Card className="rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4] shadow-md dark:border-[#3D4F2A]/60 dark:from-[#1A2212] dark:to-[#243019]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                Edit Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveEdit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Table Name
                    </label>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      disabled={savingEdit}
                      className="h-10 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/20 dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Capacity
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={editingCapacity}
                      onChange={(e) => setEditingCapacity(e.target.value)}
                      disabled={savingEdit}
                      className="h-10 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/20 dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] items-center">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Section <span className="text-xs text-[#9CA88A]">(optional)</span>
                    </label>
                    <Input
                      value={editingSection}
                      onChange={(e) => setEditingSection(e.target.value)}
                      disabled={savingEdit}
                      className="h-10 rounded-xl border-2 border-[#D6D2C4]/70 bg-white/80 text-sm shadow-sm transition-all focus-visible:border-[#22C55E] focus-visible:ring-[#22C55E]/20 dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#F6F4EA] px-3 py-2.5 text-sm dark:bg-[#1F2914]">
                    <span className="text-sm font-medium text-[#2D3A1A] dark:text-[#E8E4D9]">
                      Active
                    </span>
                    <Switch
                      checked={editingActive}
                      onCheckedChange={setEditingActive}
                      disabled={savingEdit}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTable(null)}
                    disabled={savingEdit}
                    className="rounded-full border-[#D6D2C4]/70 bg-white/70 hover:bg-[#E8E4D9]/70 dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60 dark:hover:bg-[#1F2914]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingEdit}
                    className="rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg hover:shadow-xl hover:from-[#16A34A] hover:to-[#15803D] disabled:opacity-60"
                  >
                    {savingEdit ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Table List */}
      <FadeIn delay={0.1}>
        <Card className="rounded-3xl border border-[#D6D2C4]/60 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4] shadow-md dark:border-[#3D4F2A]/60 dark:from-[#1A2212] dark:to-[#243019]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
              All Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#5B7A2F] dark:text-[#7A9E4A]" />
              </div>
            ) : tables.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <p className="text-sm font-medium text-[#2D3A1A] dark:text-[#E5E7EB]">
                  No tables yet
                </p>
                <p className="max-w-md text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                  Start by creating your first table using the form above to organize your floor layout.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className="flex items-center justify-between rounded-2xl border border-[#D6D2C4]/70 bg-white/80 px-4 py-3 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#22C55E]/60 hover:shadow-md dark:border-[#3D4F2A]/70 dark:bg-[#111827]/70"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#2D3A1A] dark:text-[#E5E7EB]">
                          {table.table_name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            table.is_active
                              ? "bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#BBF7D0]"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {table.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-[#6B7280] dark:text-[#9CA88A]">
                        <span>Capacity: {table.capacity} seats</span>
                        {table.section && <span>Section: {table.section}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => startEdit(table)}
                        className="rounded-full border-[#D6D2C4]/70 bg-white/70 hover:bg-[#E8E4D9]/70 dark:border-[#3D4F2A]/70 dark:bg-[#111827]/60 dark:hover:bg-[#1F2914]"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(table.id)}
                        disabled={deletingId === table.id}
                        className="rounded-full border-[#D6D2C4]/70 bg-white/70 hover:bg-red-50 dark:border-[#3F1F1F] dark:bg-[#111827]/60 dark:hover:bg-[#1F2933]"
                      >
                        {deletingId === table.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

