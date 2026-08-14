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
import { money } from "@/lib/format";

export const Route = createFileRoute("/admin/coupons")({ component: AdminCoupons });

function AdminCoupons() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    code: "",
    discount_type: "percent",
    discount_value: "10",
    min_order: "0",
    usage_limit: "",
    expires_at: "",
  });

  const coupons = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin-coupons"] });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.code.trim()) throw new Error("Coupon code is required");
      const { error } = await supabase.from("coupons").insert({
        code: form.code.trim().toUpperCase(),
        type: form.discount_type,
        value: Number(form.discount_value) || 0,
        min_order: Number(form.min_order) || 0,
        usage_limit: form.usage_limit === "" ? null : Number(form.usage_limit),
        expires_at: form.expires_at === "" ? null : new Date(form.expires_at).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ code: "", discount_type: "percent", discount_value: "10", min_order: "0", usage_limit: "", expires_at: "" });
      invalidate();
      toast.success("Coupon created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase.from("coupons").update(data as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Coupon deleted");
    },
  });

  return (
    <AdminLayout title="Coupons">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-secondary/50 text-left">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min order</th>
                <th className="p-3">Used</th>
                <th className="p-3">Active</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(coupons.data ?? []).map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{c.code}</td>
                  <td className="p-3">
                    {c.type === "percent" ? `${c.value}%` : money(c.value)}
                  </td>
                  <td className="p-3">{money(c.min_order)}</td>
                  <td className="p-3">
                    {c.used_count}
                    {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                  </td>
                  <td className="p-3">
                    <Switch checked={c.is_active} onCheckedChange={(v) => patch.mutate({ id: c.id, data: { is_active: v } })} />
                  </td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(c.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(coupons.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No coupons yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Create coupon</h2>
          <div className="mt-3 space-y-3">
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Minimum order</Label>
              <Input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Usage limit (optional)</Label>
              <Input
                type="number"
                value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Expiry date (optional)</Label>
              <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="mt-1" />
            </div>
            <Button className="w-full" onClick={() => add.mutate()} disabled={add.isPending}>
              <Plus className="mr-1 h-4 w-4" /> Create coupon
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
