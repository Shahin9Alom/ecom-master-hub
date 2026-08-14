import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

const TEXT_FIELDS = [
  ["store_name", "Store name"],
  ["logo_url", "Logo URL"],
  ["contact_email", "Contact email"],
  ["contact_phone", "Contact phone"],
  ["address", "Store address"],
  ["currency", "Currency symbol"],
  ["facebook_url", "Facebook URL"],
  ["instagram_url", "Instagram URL"],
  ["whatsapp", "WhatsApp number"],
] as const;

const TOGGLES = [
  ["cod_enabled", "Cash on delivery"],
  ["bkash_enabled", "bKash / mobile banking"],
  ["card_enabled", "Card payment"],
] as const;

function AdminSettings() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [about, setAbout] = useState("");

  const settings = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!settings.data) return;
    const text: Record<string, string> = {};
    const bool: Record<string, boolean> = {};
    for (const row of settings.data) {
      const v = row.value as unknown;
      if (typeof v === "boolean") bool[row.key] = v;
      else text[row.key] = typeof v === "string" ? v : JSON.stringify(v ?? "");
    }
    setValues(text);
    setFlags(bool);
    setAbout(text["about_text"] ?? "");
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = [
        ...Object.entries({ ...values, about_text: about }).map(([key, value]) => ({ key, value: value as never })),
        ...Object.entries(flags).map(([key, value]) => ({ key, value: value as never })),
      ];
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-settings"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminLayout title="Store settings">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Store information</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {TEXT_FIELDS.map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  value={values[key] ?? ""}
                  onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                  className="mt-1"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label>About text</Label>
              <Textarea value={about} onChange={(e) => setAbout(e.target.value)} className="mt-1" rows={5} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Payment methods</h2>
          <div className="mt-3 space-y-3">
            {TOGGLES.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between text-sm">
                {label}
                <Switch checked={flags[key] ?? false} onCheckedChange={(v) => setFlags({ ...flags, [key]: v })} />
              </label>
            ))}
          </div>
        </div>
      </div>

      <Button className="mt-6" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save settings"}
      </Button>
    </AdminLayout>
  );
}
