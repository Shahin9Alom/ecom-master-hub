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
import { money } from "@/lib/format";

export const Route = createFileRoute("/admin/shipping")({ component: AdminShipping });

function AdminShipping() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", charge: "0", eta: "" });

  const zones = useQuery({
    queryKey: ["admin-shipping"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipping_zones").select("*").order("charge");
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-shipping"] });
    void qc.invalidateQueries({ queryKey: ["shipping-zones"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Zone name is required");
      const { error } = await supabase.from("shipping_zones").insert({
        name: form.name.trim(),
        charge: Number(form.charge) || 0,
        eta: form.eta || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ name: "", charge: "0", eta: "" });
      invalidate();
      toast.success("Shipping zone added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase.from("shipping_zones").update(data as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Zone deleted");
    },
  });

  return (
    <AdminLayout title="Shipping">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="border-b bg-secondary/50 text-left">
              <tr>
                <th className="p-3">Zone</th>
                <th className="p-3">Charge</th>
                <th className="p-3">Delivery time</th>
                <th className="p-3">Active</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(zones.data ?? []).map((z) => (
                <tr key={z.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{z.name}</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      defaultValue={z.charge}
                      className="h-8 w-24"
                      onBlur={(e) => patch.mutate({ id: z.id, data: { charge: Number(e.target.value) } })}
                    />
                    <span className="ml-2 text-xs text-muted-foreground">{money(z.charge)}</span>
                  </td>
                  <td className="p-3">
                    <Input
                      defaultValue={z.eta ?? ""}
                      className="h-8 w-32"
                      onBlur={(e) => patch.mutate({ id: z.id, data: { eta: e.target.value } })}
                    />
                  </td>
                  <td className="p-3">
                    <Switch checked={z.is_active} onCheckedChange={(v) => patch.mutate({ id: z.id, data: { is_active: v } })} />
                  </td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(z.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Add zone</h2>
          <div className="mt-3 space-y-3">
            <div>
              <Label>Zone name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Delivery charge</Label>
              <Input type="number" value={form.charge} onChange={(e) => setForm({ ...form, charge: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Estimated time</Label>
              <Input value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} placeholder="2-3 days" className="mt-1" />
            </div>
            <Button className="w-full" onClick={() => add.mutate()}>
              <Plus className="mr-1 h-4 w-4" /> Add zone
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
