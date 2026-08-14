import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, MapPin, Package, User } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, money, statusLabel } from "@/lib/format";

export const Route = createFileRoute("/account")({
  validateSearch: (s: Record<string, unknown>): { tab?: string | undefined } => ({
    tab: typeof s["tab"] === "string" ? (s["tab"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "My Account — Shahin Mart" },
      { name: "description", content: "Manage your Shahin Mart profile, orders, saved addresses and password." },
      { property: "og:title", content: "My Account — Shahin Mart" },
      { property: "og:description", content: "Your Shahin Mart customer dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, profile, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPass, setNewPass] = useState("");
  const [addr, setAddr] = useState({ label: "Home", full_name: "", phone: "", address: "", city: "", area: "", postal_code: "" });

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", search: { next: "/account" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addresses = useQuery({
    queryKey: ["my-addresses", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user!.id);
      if (error) throw error;
      await refresh();
    },
    onSuccess: () => toast.success("Profile updated"),
    onError: (e: Error) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPass.length < 6) throw new Error("Password must be at least 6 characters");
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPass("");
      toast.success("Password changed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addAddress = useMutation({
    mutationFn: async () => {
      if (!addr.full_name || !addr.phone || !addr.address || !addr.city)
        throw new Error("Name, phone, address and city are required");
      const { error } = await supabase.from("addresses").insert({ ...addr, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      setAddr({ label: "Home", full_name: "", phone: "", address: "", city: "", area: "", postal_code: "" });
      void qc.invalidateQueries({ queryKey: ["my-addresses"] });
      toast.success("Address saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Order cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) return null;

  const totalSpent = (orders.data ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);

  return (
    <StoreLayout>
      <div className="container-page py-8">
        <h1 className="text-2xl font-bold">My account</h1>
        <p className="text-sm text-muted-foreground">{profile?.email ?? user.email}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <Package className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-bold">{orders.data?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total orders</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <User className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-bold">{money(totalSpent)}</p>
            <p className="text-xs text-muted-foreground">Total spent</p>
          </div>
          <Link to="/wishlist" className="rounded-xl border bg-card p-4 hover:shadow-[var(--shadow-card)]">
            <Heart className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-bold">Wishlist</p>
            <p className="text-xs text-muted-foreground">View saved products</p>
          </Link>
        </div>

        <Tabs defaultValue={search.tab === "orders" ? "orders" : "orders"} className="mt-8">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-3">
            {orders.isLoading && <p className="text-sm text-muted-foreground">Loading orders…</p>}
            {!orders.isLoading && (orders.data?.length ?? 0) === 0 && (
              <div className="rounded-xl border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground">You have not placed any orders yet.</p>
                <Button asChild className="mt-4">
                  <Link to="/shop">Start shopping</Link>
                </Button>
              </div>
            )}
            {(orders.data ?? []).map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                </div>
                <Badge variant={o.status === "cancelled" ? "destructive" : "secondary"}>{statusLabel(o.status)}</Badge>
                <span className="font-semibold">{money(o.total)}</span>
                <Button asChild size="sm" variant="outline">
                  <Link to="/order/$id" params={{ id: o.id }}>
                    View
                  </Link>
                </Button>
                {["pending", "confirmed"].includes(o.status) && (
                  <Button size="sm" variant="ghost" onClick={() => cancelOrder.mutate(o.id)}>
                    Cancel
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="addresses" className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              {(addresses.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
              )}
              {(addresses.data ?? []).map((a) => (
                <div key={a.id} className="rounded-xl border bg-card p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold">
                    <MapPin className="h-4 w-4 text-primary" /> {a.label ?? "Address"}
                  </p>
                  <p className="mt-1">{a.full_name} · {a.phone}</p>
                  <p className="text-muted-foreground">
                    {a.address}, {a.area ? `${a.area}, ` : ""}
                    {a.city} {a.postal_code ?? ""}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={async () => {
                      await supabase.from("addresses").delete().eq("id", a.id);
                      void qc.invalidateQueries({ queryKey: ["my-addresses"] });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold">Add a new address</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["label", "Label"],
                    ["full_name", "Full name"],
                    ["phone", "Phone"],
                    ["city", "City"],
                    ["area", "Area"],
                    ["postal_code", "Postal code"],
                  ] as const
                ).map(([k, label]) => (
                  <div key={k}>
                    <Label htmlFor={k}>{label}</Label>
                    <Input
                      id={k}
                      value={addr[k]}
                      maxLength={120}
                      onChange={(e) => setAddr((s) => ({ ...s, [k]: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={addr.address}
                    maxLength={400}
                    onChange={(e) => setAddr((s) => ({ ...s, address: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button className="mt-4" onClick={() => addAddress.mutate()} disabled={addAddress.isPending}>
                Save address
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold">Profile details</h2>
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="pname">Full name</Label>
                  <Input id="pname" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="pphone">Phone</Label>
                  <Input id="pphone" value={phone} maxLength={30} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
                </div>
                <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
                  Save changes
                </Button>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold">Change password</h2>
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="npass">New password</Label>
                  <Input
                    id="npass"
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button onClick={() => changePassword.mutate()} disabled={changePassword.isPending}>
                  Update password
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </StoreLayout>
  );
}
