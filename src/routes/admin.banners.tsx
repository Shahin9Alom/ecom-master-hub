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
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/banners")({ component: AdminBanners });

function AdminBanners() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", subtitle: "", image_url: "", link_url: "", sort_order: "0" });

  const banners = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-banners"] });
    void qc.invalidateQueries({ queryKey: ["banners"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      if (!form.image_url.trim()) throw new Error("Banner image URL is required");
      const { error } = await supabase.from("banners").insert({
        title: form.title || null,
        subtitle: form.subtitle || null,
        image_url: form.image_url.trim(),
        link_url: form.link_url || null,
        sort_order: Number(form.sort_order) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ title: "", subtitle: "", image_url: "", link_url: "", sort_order: "0" });
      invalidate();
      toast.success("Banner added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase.from("banners").update(data as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Banner deleted");
    },
  });

  return (
    <AdminLayout title="Banners">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {(banners.data ?? []).map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-3">
              <img src={b.image_url} alt={b.title ?? "Banner"} className="h-16 w-28 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{b.title ?? "Untitled banner"}</p>
                <p className="truncate text-xs text-muted-foreground">{b.link_url ?? "No link"}</p>
              </div>
              <Input
                type="number"
                defaultValue={b.sort_order}
                className="h-8 w-16"
                onBlur={(e) => patch.mutate({ id: b.id, data: { sort_order: Number(e.target.value) } })}
              />
              <Switch checked={b.is_active} onCheckedChange={(v) => patch.mutate({ id: b.id, data: { is_active: v } })} />
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(b.id)} aria-label="Delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {(banners.data ?? []).length === 0 && (
            <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No banners yet.</p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Add banner</h2>
          <div className="mt-3 space-y-3">
            {(
              [
                ["title", "Title"],
                ["subtitle", "Subtitle"],
                ["image_url", "Image URL"],
                ["link_url", "Link URL"],
                ["sort_order", "Display order"],
              ] as const
            ).map(([k, label]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1" />
              </div>
            ))}
            <Button className="w-full" onClick={() => add.mutate()} disabled={add.isPending}>
              <Plus className="mr-1 h-4 w-4" /> Add banner
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
