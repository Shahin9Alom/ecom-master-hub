import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Printer } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, money, statusLabel, TRACK_FLOW } from "@/lib/format";
import { useStoreSettings } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/order/$id")({
  head: () => ({
    meta: [
      { title: "Order Details & Invoice — Shahin Mart" },
      { name: "description", content: "View your Shahin Mart order details, delivery progress and printable invoice." },
      { property: "og:title", content: "Order Details — Shahin Mart" },
      { property: "og:description", content: "Track your order and download the invoice." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const { data: store } = useStoreSettings();

  const order = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), order_events(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (order.isLoading) {
    return (
      <StoreLayout>
        <div className="container-page py-16 text-center text-sm text-muted-foreground">Loading order…</div>
      </StoreLayout>
    );
  }

  if (!order.data) {
    return (
      <StoreLayout>
        <div className="container-page py-20 text-center">
          <h1 className="text-2xl font-bold">Order not found</h1>
          <Button asChild className="mt-6">
            <Link to="/account">Back to my account</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const o = order.data;
  const items = (o.order_items ?? []) as { id: string; name: string; unit_price: number; quantity: number; variant: string | null }[];
  const stepIndex = TRACK_FLOW.indexOf(o.status as (typeof TRACK_FLOW)[number]);
  const cancelled = o.status === "cancelled" || o.status === "returned";

  return (
    <StoreLayout>
      <div className="container-page max-w-4xl py-8">
        <div className="no-print mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Order {o.order_number}</h1>
            <p className="text-sm text-muted-foreground">Placed {formatDate(o.created_at)}</p>
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / download invoice
          </Button>
        </div>

        {!cancelled && (
          <ol className="no-print mb-8 flex flex-wrap gap-3 rounded-xl border bg-card p-4">
            {TRACK_FLOW.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-[10px]",
                    i <= stepIndex ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {i <= stepIndex ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={cn("text-xs", i <= stepIndex ? "font-medium" : "text-muted-foreground")}>
                  {statusLabel(s)}
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="rounded-xl border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
            <div>
              <p className="text-lg font-bold">{store?.name ?? "Shahin Mart"}</p>
              <p className="text-xs text-muted-foreground">{store?.address}</p>
              <p className="text-xs text-muted-foreground">{store?.phone}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">Invoice {o.order_number}</p>
              <p className="text-muted-foreground">{formatDate(o.created_at)}</p>
              <Badge className="mt-1" variant={cancelled ? "destructive" : "secondary"}>
                {statusLabel(o.status)}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 py-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold">Billed to</p>
              <p>{o.customer_name}</p>
              <p className="text-muted-foreground">{o.phone}</p>
              <p className="text-muted-foreground">
                {o.address}, {o.area ? `${o.area}, ` : ""}
                {o.city} {o.postal_code ?? ""}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="font-semibold">Payment</p>
              <p className="uppercase">{o.payment_method}</p>
              <p className="text-muted-foreground">Status: {o.payment_status}</p>
              <p className="text-muted-foreground">Delivery: {o.delivery_method}</p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left">
                <th className="py-2">Product</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Unit</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b">
                  <td className="py-2">
                    {i.name}
                    {i.variant && <span className="block text-xs text-muted-foreground">{i.variant}</span>}
                  </td>
                  <td className="py-2 text-center">{i.quantity}</td>
                  <td className="py-2 text-right">{money(i.unit_price)}</td>
                  <td className="py-2 text-right">{money(Number(i.unit_price) * i.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{money(o.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount {o.coupon_code ? `(${o.coupon_code})` : ""}</span>
              <span>−{money(o.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{money(o.delivery_charge)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>{money(o.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
