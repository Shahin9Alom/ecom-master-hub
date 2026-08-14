import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string | undefined } => ({
    next: typeof s["next"] === "string" ? (s["next"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In or Create Account — Shahin Mart" },
      { name: "description", content: "Access your Shahin Mart account to track orders, save addresses and manage your wishlist." },
      { property: "og:title", content: "Sign In — Shahin Mart" },
      { property: "og:description", content: "Sign in to your Shahin Mart customer account." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { next } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [signupDone, setSignupDone] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: (next as "/") ?? "/", replace: true });
  }, [user, navigate, next]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.object({ email: emailSchema, password: passwordSchema }).safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z
      .object({ email: emailSchema, password: passwordSchema, name: z.string().trim().min(2, "Enter your name").max(120) })
      .safeParse({ email, password, name });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.name, phone },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setSignupDone(true);
      toast.success("Check your email to confirm your account");
      return;
    }
    toast.success("Account created!");
  };

  const forgot = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent to your email");
  };

  return (
    <StoreLayout>
      <div className="container-page flex justify-center py-12">
        <div className="w-full max-w-md rounded-xl border bg-card p-6">
          <h1 className="text-2xl font-bold">My account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in or create a customer account.</p>

          {signupDone ? (
            <div className="mt-6 rounded-lg bg-secondary p-4 text-sm">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign
              in.
            </div>
          ) : (
            <Tabs defaultValue="signin" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-3">
                  <div>
                    <Label htmlFor="si-email">Email</Label>
                    <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="si-pass">Password</Label>
                    <Input id="si-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                  <button type="button" onClick={forgot} className="w-full text-center text-xs text-muted-foreground underline">
                    Forgot password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-3">
                  <div>
                    <Label htmlFor="su-name">Full name</Label>
                    <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" maxLength={120} />
                  </div>
                  <div>
                    <Label htmlFor="su-phone">Phone</Label>
                    <Input id="su-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" maxLength={30} />
                  </div>
                  <div>
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="su-pass">Password</Label>
                    <Input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Store staff? <Link to="/admin/login" className="underline">Admin sign in</Link>
          </p>
        </div>
      </div>
    </StoreLayout>
  );
}
