import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Banknote, CreditCard, Loader2, Smartphone, Wallet } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { usePaymentSettings, useShippingZones } from "@/lib/data";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — Shahin Mart" },
      { name: "description", content: "Complete your Shahin Mart order with secure checkout and flexible payment options." },
      { property: "og:title", content: "Secure Checkout — Shahin Mart" },
      { property: "og:description", content: "Fast, secure checkout with cash on delivery and online payment options." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(30),
  email: z.string().trim().email("Enter a valid email").max(255).or(z.literal("")),
  address: z.string().trim().min(5, "Enter your full address").max(400),
  city: z.string().trim().min(2, "Enter your city").max(80),
  area: z.string().trim().max(80),
  postal_code: z.string().trim().max(20),
  notes: z.string().trim().max(500),
});

function Checkout() {
  const { user, profile, loading } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const { data: zones } = useShippingZones();
  const { data: payments } = usePaymentSettings();

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    area: "",
    postal_code: "",
    notes: "",
  });
  const [zoneId, setZoneId] = useState<string>("");
  const [payment, setPayment] = useState("cod");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        customer_name: f.customer_name || profile.full_name || "",
        email: f.email || profile.email || "",
        phone: f.phone || profile.phone || "",
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (!zoneId && zones?.length) setZoneId(zones[0]!.id);
  }, [zones, zoneId]);

  const zone = zones?.find((z) => z.id === zoneId) ?? zones?.[0];
  const freeShip = zone?.free_threshold != null && cart.subtotal >= Number(zone.free_threshold);
  const deliveryCharge = freeShip ? 0 : Number(zone?.charge ?? 0);
  const total = Math.max(0, cart.subtotal - discount) + deliveryCharge;

  if (!loading && !user) {
    return (
      <StoreLayout>
        <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
          <h1 className="text-2xl font-bold">Sign in to checkout</h1>
          <p className="text-sm text-muted-foreground">You need an account so we can track your order.</p>
          <Button asChild>
            <Link to="/auth" search={{ next: "/checkout" }}>
              Sign in or create account
            </Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  if (cart.items.length === 0) {
    return (
      <StoreLayout>
        <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <Button asChild>
            <Link to="/shop">Start shopping</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    const { data, error } = await supabase.rpc("validate_coupon", {
      _code: coupon.trim(),
      _subtotal: cart.subtotal,
    });
    if (error) {
      toast.error("Could not validate coupon");
      return;
    }
    const res = data as unknown as { valid: boolean; discount?: number; message: string; code?: string };
    if (!res.valid) {
      setDiscount(0);
      setAppliedCode(null);
      toast.error(res.message);
      return;
    }
    setDiscount(Number(res.discount ?? 0));
    setAppliedCode(res.code ?? coupon.trim().toUpperCase());
    toast.success(`Coupon applied — you saved ${money(res.discount ?? 0)}`);
  };

  const placeOrder = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setPlacing(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          customer_name: parsed.data.customer_name,
          phone: parsed.data.phone,
          email: parsed.data.email || null,
          address: parsed.data.address,
          city: parsed.data.city,
          area: parsed.data.area || null,
          postal_code: parsed.data.postal_code || null,
          notes: parsed.data.notes || null,
          delivery_method: zone?.name ?? "standard",
          delivery_charge: deliveryCharge,
          subtotal: cart.subtotal,
          discount,
          total,
          coupon_code: appliedCode,
          payment_method: payment,
          payment_status: payment === "cod" ? "unpaid" : "pending",
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;

      const items = cart.items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        name: i.name,
        image: i.image,
        variant: i.variant ?? null,
        unit_price: i.price,
        quantity: i.quantity,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw itemsError;

      await supabase.from("order_events").insert({
        order_id: order.id,
        status: "pending",
        note: "Order placed by customer",
      });

      cart.clear();
      toast.success(`Order ${order.order_number} placed successfully`);
      void navigate({ to: "/order/$id", params: { id: order.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place the order");
    } finally {
      setPlacing(false);
    }
  };

  const field = (name: keyof typeof form, label: string, required = false, type = "text") => (
    <div>
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        value={form[name]}
        maxLength={400}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        className="mt-1"
      />
    </div>
  );

  const methods = [
    { id: "cod", label: "Cash on delivery", icon: Banknote, enabled: payments?.cod },
    { id: "online", label: "Online payment", icon: Wallet, enabled: payments?.online },
    { id: "card", label: "Card payment", icon: CreditCard, enabled: payments?.card },
    { id: "mobile", label: "Mobile banking", icon: Smartphone, enabled: payments?.mobile },
  ].filter((m) => m.enabled);

  return (
    <StoreLayout>
      <div className="container-page py-8">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-lg font-semibold">Customer information</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {field("customer_name", "Full name", true)}
                {field("phone", "Phone number", true, "tel")}
                {field("email", "Email", false, "email")}
                {field("city", "City", true)}
                {field("area", "Area")}
                {field("postal_code", "Postal code")}
              </div>
              <div className="mt-4">
                <Label htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={form.address}
                  maxLength={400}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="notes">Delivery instructions</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  maxLength={500}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </section>

            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-lg font-semibold">Delivery method</h2>
              <RadioGroup value={zoneId} onValueChange={setZoneId} className="mt-3 space-y-2">
                {(zones ?? [])
                  .filter((z) => z.is_active)
                  .map((z) => (
                    <label
                      key={z.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <span className="flex items-center gap-3">
                        <RadioGroupItem value={z.id} />
                        <span>
                          <span className="font-medium">{z.name}</span>
                          {z.eta && <span className="block text-xs text-muted-foreground">{z.eta}</span>}
                        </span>
                      </span>
                      <span className="font-medium">{money(z.charge)}</span>
                    </label>
                  ))}
              </RadioGroup>
              {zone?.free_threshold != null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Free delivery on orders above {money(zone.free_threshold)}.
                </p>
              )}
            </section>

            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-lg font-semibold">Payment method</h2>
              <RadioGroup value={payment} onValueChange={setPayment} className="mt-3 space-y-2">
                {methods.map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm">
                    <RadioGroupItem value={m.id} />
                    <m.icon className="h-4 w-4 text-primary" />
                    <span className="font-medium">{m.label}</span>
                  </label>
                ))}
              </RadioGroup>
              {payment !== "cod" && (
                <p className="mt-3 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
                  Your order will be created with payment status “pending”. Complete the payment using the
                  instructions we send you, and the store will mark it paid.
                </p>
              )}
            </section>
          </div>

          <aside className="h-fit rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <div className="mt-4 space-y-3">
              {cart.items.map((i) => (
                <div key={`${i.productId}-${i.variant ?? ""}`} className="flex gap-3 text-sm">
                  <img src={i.image ?? ""} alt={i.name} className="h-12 w-12 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.quantity} × {money(i.price)}
                      {i.variant ? ` · ${i.variant}` : ""}
                    </p>
                  </div>
                  <span className="font-medium">{money(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Coupon code"
                maxLength={40}
                aria-label="Coupon code"
              />
              <Button variant="outline" onClick={applyCoupon}>
                Apply
              </Button>
            </div>

            <div className="mt-4 space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{money(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount {appliedCode ? `(${appliedCode})` : ""}</span>
                <span className="text-success">−{money(discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{deliveryCharge === 0 ? "Free" : money(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>

            <Button className="mt-4 w-full" onClick={placeOrder} disabled={placing}>
              {placing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing order…
                </>
              ) : (
                "Place order"
              )}
            </Button>
          </aside>
        </div>
      </div>
    </StoreLayout>
  );
}
