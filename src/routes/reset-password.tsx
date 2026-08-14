import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Your Password — Shahin Mart" },
      { name: "description", content: "Choose a new password for your Shahin Mart account." },
      { property: "og:title", content: "Reset Password — Shahin Mart" },
      { property: "og:description", content: "Set a new password for your Shahin Mart account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    void navigate({ to: "/account" });
  };

  return (
    <StoreLayout>
      <div className="container-page flex justify-center py-12">
        <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6">
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <div>
            <Label htmlFor="np">New password</Label>
            <Input id="np" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="cp">Confirm password</Label>
            <Input id="cp" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1" />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : "Update password"}
          </Button>
        </form>
      </div>
    </StoreLayout>
  );
}
