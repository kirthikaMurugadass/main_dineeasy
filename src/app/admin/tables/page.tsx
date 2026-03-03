"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageTitle } from "@/components/ui/page-title";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
  }, [loadTables, router]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle>Tables</PageTitle>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Table Form */}
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle>Add Table</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTable} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Table Name</label>
                  <Input
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="e.g. T1, Window 3, Booth A"
                    disabled={adding}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Capacity</label>
                  <Input
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    disabled={adding}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Section <span className="text-xs text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. Terrace, Window, Garden"
                    disabled={adding}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active</span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={adding}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={adding || !restaurantId}>
                  {adding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Table"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Edit Table Form */}
        {editingTable && (
          <FadeIn delay={0.05}>
            <Card>
              <CardHeader>
                <CardTitle>Edit Table</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Table Name</label>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      disabled={savingEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Capacity</label>
                    <Input
                      type="number"
                      min={1}
                      value={editingCapacity}
                      onChange={(e) => setEditingCapacity(e.target.value)}
                      disabled={savingEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Section <span className="text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <Input
                      value={editingSection}
                      onChange={(e) => setEditingSection(e.target.value)}
                      disabled={savingEdit}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active</span>
                    <Switch
                      checked={editingActive}
                      onCheckedChange={setEditingActive}
                      disabled={savingEdit}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingTable(null)}
                      disabled={savingEdit}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={savingEdit}>
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
      </div>

      {/* Table List */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>All Tables</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : tables.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tables have been created yet. Use the form above to add your first table.
              </p>
            ) : (
              <div className="space-y-2">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{table.table_name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            table.is_active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"
                          }`}
                        >
                          {table.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>Capacity: {table.capacity}</span>
                        {table.section && <span>Section: {table.section}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => startEdit(table)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(table.id)}
                        disabled={deletingId === table.id}
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

