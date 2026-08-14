import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/lib/data";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategories });

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function AdminCategories() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", image_url: "", parent_id: "none", sort_order: "0" });
  const [brandName, setBrandName] = useState("");

  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as Category[];
    },
  });

  const brands = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-categories"] });
    void qc.invalidateQueries({ queryKey: ["categories"] });
    void qc.invalidateQueries({ queryKey: ["admin-brands"] });
    void qc.invalidateQueries({ queryKey: ["brands"] });
  };

  const addCategory = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Category name is required");
      const { error } = await supabase.from("categories").insert({
        name: form.name.trim(),
        slug: slugify(form.name),
        image_url: form.image_url || null,
        parent_id: form.parent_id === "none" ? null : form.parent_id,
        sort_order: Number(form.sort_order) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ name: "", image_url: "", parent_id: "none", sort_order: "0" });
      invalidate();
      toast.success("Category added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase.from("categories").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Category deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addBrand = useMutation({
    mutationFn: async () => {
      if (!brandName.trim()) throw new Error("Brand name is required");
      const { error } = await supabase.from("brands").insert({ name: brandName.trim(), slug: slugify(brandName) });
      if (error) throw error;
    },
    onSuccess: () => {
      setBrandName("");
      invalidate();
      toast.success("Brand added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const parents = (categories.data ?? []).filter((c) => !c.parent_id);

  return (
    <AdminLayout title="Categories & brands">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b bg-secondary/50 text-left">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Parent</th>
                <th className="p-3">Order</th>
                <th className="p-3">Active</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(categories.data ?? []).map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {c.image_url && <img src={c.image_url} alt={c.name} className="h-9 w-9 rounded object-cover" />}
                      <Input
                        defaultValue={c.name}
                        className="h-8 w-40"
                        onBlur={(e) => e.target.value !== c.name && patch.mutate({ id: c.id, data: { name: e.target.value } })}
                      />
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {parents.find((p) => p.id === c.parent_id)?.name ?? "—"}
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      defaultValue={c.sort_order}
                      className="h-8 w-16"
                      onBlur={(e) => patch.mutate({ id: c.id, data: { sort_order: Number(e.target.value) } })}
                    />
                  </td>
                  <td className="p-3">
                    <Switch checked={c.is_active} onCheckedChange={(v) => patch.mutate({ id: c.id, data: { is_active: v } })} />
                  </td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => removeCategory.mutate(c.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold">Add category</h2>
            <div className="mt-3 space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Parent (for subcategory)</Label>
                <Select value={form.parent_id} onValueChange={(v) => setForm({ ...form, parent_id: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent</SelectItem>
                    {parents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Display order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  className="mt-1"
                />
              </div>
              <Button className="w-full" onClick={() => addCategory.mutate()} disabled={addCategory.isPending}>
                <Plus className="mr-1 h-4 w-4" /> Add category
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold">Brands</h2>
            <div className="mt-3 space-y-2 text-sm">
              {(brands.data ?? []).map((b) => (
                <div key={b.id} className="flex items-center justify-between border-b py-1 last:border-0">
                  <span>{b.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      await supabase.from("brands").delete().eq("id", b.id);
                      invalidate();
                    }}
                    aria-label="Delete brand"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="New brand" />
              <Button onClick={() => addBrand.mutate()}>Add</Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
