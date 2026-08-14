import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, PackageSearch } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, money, statusLabel, TRACK_FLOW } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Shahin Mart" },
      { name: "description", content: "Enter your order ID to see live delivery progress for your Shahin Mart order." },
      { property: "og:title", content: "Track Your Order — Shahin Mart" },
      { property: "og:description", content: "Live order tracking from confirmation to delivery." },
    ],
  }),
  component: TrackPage,
});

type TrackedOrder = {
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  city: string;
  payment_method: string;
  payment_status: string;
};

function TrackPage() {
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("order_number, status, total, created_at, city, payment_method, payment_status")
      .eq("order_number", code.trim().toUpperCase())
      .maybeSingle();
    setOrder((data as TrackedOrder) ?? null);
    setSearched(true);
    setLoading(false);
  };

  const stepIndex = order ? TRACK_FLOW.indexOf(order.status as (typeof TRACK_FLOW)[number]) : -1;
  const cancelled = order?.status === "cancelled" || order?.status === "returned";

  return (
    <StoreLayout>
      <div className="container-page max-w-3xl py-10">
        <h1 className="text-2xl font-bold">Track your order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your order ID (for example SM-1001). You must be signed in with the account used for the order.
        </p>

        <form onSubmit={search} className="mt-5 flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SM-1001" aria-label="Order ID" />
          <Button type="submit" disabled={loading}>
            {loading ? "Searching…" : "Track"}
          </Button>
        </form>

        {searched && !order && (
          <div className="mt-8 flex flex-col items-center gap-2 rounded-xl border bg-card p-10 text-center">
            <PackageSearch className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No order found</p>
            <p className="text-sm text-muted-foreground">
              Check the order ID, and make sure you are signed in with the account that placed the order.
            </p>
          </div>
        )}

        {order && (
          <div className="mt-8 rounded-xl border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{order.order_number}</p>
                <p className="text-sm text-muted-foreground">Placed {formatDate(order.created_at)}</p>
              </div>
              <div className="text-right">
                <Badge variant={cancelled ? "destructive" : "secondary"}>{statusLabel(order.status)}</Badge>
                <p className="mt-1 text-sm font-semibold">{money(order.total)}</p>
              </div>
            </div>

            {cancelled ? (
              <p className="mt-6 rounded-lg bg-destructive/10 p-4 text-sm">
                This order was {statusLabel(order.status).toLowerCase()}.
              </p>
            ) : (
              <ol className="mt-8 space-y-4">
                {TRACK_FLOW.map((s, i) => {
                  const done = i <= stepIndex;
                  return (
                    <li key={s} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border text-xs",
                          done ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className={cn("text-sm", done ? "font-medium" : "text-muted-foreground")}>
                        {statusLabel(s)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
