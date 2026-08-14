import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ensureAdminAccount } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — Shahin Mart" },
      { name: "description", content: "Secure sign in for Shahin Mart store administrators." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (user && isAdmin) void navigate({ to: "/admin", replace: true });
  }, [user, isAdmin, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Enter your username and password");
      return;
    }
    setLoading(true);
    try {
      const result = await ensureAdminAccount({ data: { username: username.trim(), password } });
      if (!result.ok || !result.email) {
        toast.error("Invalid credentials");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: result.email, password });
      if (error) {
        toast.error("Invalid credentials");
        return;
      }
      toast.success("Welcome back, admin");
      void navigate({ to: "/admin", replace: true });
    } catch {
      toast.error("Could not sign in right now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-card p-6 shadow-[var(--shadow-pop)]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Admin sign in</h1>
        </div>
        <p className="text-sm text-muted-foreground">Restricted area. Store staff only.</p>
        <div>
          <Label htmlFor="au">Username</Label>
          <Input id="au" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" autoComplete="username" />
        </div>
        <div>
          <Label htmlFor="ap">Password</Label>
          <Input
            id="ap"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
