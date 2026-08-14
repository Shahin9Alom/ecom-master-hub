import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, money, ORDER_STATUSES, statusLabel } from "@/lib/format";

export const Route = createFileRoute("/admin/orders/$id")({ component: AdminOrderDetail });

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [customer, setCustomer] = useState({ customer_name: "", phone: "", address: "", city: "" });
  const [adminNotes, setAdminNotes] = useState("");

  const order = useQuery({
    queryKey: ["admin-order", id],
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

  useEffect(() => {
    if (order.data) {
      setCustomer({
        customer_name: order.data.customer_name,
        phone: order.data.phone,
        address: order.data.address,
        city: order.data.city,
      });
      setAdminNotes(order.data.admin_notes ?? "");
    }
  }, [order.data]);

  const patch = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { error } = await supabase.from("orders").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-order", id] });
      void qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (order.isLoading) return <AdminLayout title="Order">Loading…</AdminLayout>;
  if (!order.data)
    return (
      <AdminLayout title="Order">
        <p>Order not found.</p>
        <Button asChild className="mt-4">
          <Link to="/admin/orders">Back to orders</Link>
        </Button>
      </AdminLayout>
    );

  const o = order.data;
  const items = (o.order_items ?? []) as { id: string; name: string; quantity: number; unit_price: number; variant: string | null }[];
  const events = ((o.order_events ?? []) as { id: string; status: string; note: string | null; created_at: string }[]).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return (
    <AdminLayout title={`Order ${o.order_number}`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{o.order_number}</h2>
                <p className="text-sm text-muted-foreground">{formatDate(o.created_at)}</p>
              </div>
              <Badge variant={o.status === "cancelled" ? "destructive" : "secondary"}>{statusLabel(o.status)}</Badge>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="no-print">
                <Printer className="mr-1 h-4 w-4" /> Invoice
              </Button>
            </div>

            <table className="mt-5 w-full text-sm">
              <thead className="border-y text-left">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit</th>
                  <th className="py-2 text-right">Total</th>
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
                <span className="text-muted-foreground">Delivery ({o.delivery_method})</span>
                <span>{money(o.delivery_charge)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Total</span>
                <span>{money(o.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Customer information</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["customer_name", "Name"],
                  ["phone", "Phone"],
                  ["city", "City"],
                ] as const
              ).map(([k, label]) => (
                <div key={k}>
                  <Label>{label}</Label>
                  <Input value={customer[k]} onChange={(e) => setCustomer({ ...customer, [k]: e.target.value })} className="mt-1" />
                </div>
              ))}
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Input
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <Button className="mt-3" size="sm" onClick={() => patch.mutate(customer)}>
              Save customer info
            </Button>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Order timeline</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex justify-between border-b py-1 last:border-0">
                  <span>{statusLabel(e.status)}</span>
                  <span className="text-muted-foreground">{formatDate(e.created_at)}</span>
                </li>
              ))}
              {events.length === 0 && <li className="text-muted-foreground">No events yet.</li>}
            </ol>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <Label>Order status</Label>
            <Select value={o.status} onValueChange={(v) => patch.mutate({ status: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label className="mt-4 block">Payment status</Label>
            <Select value={o.payment_status} onValueChange={(v) => patch.mutate({ payment_status: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["unpaid", "pending", "paid", "refunded"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-4 flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => patch.mutate({ status: "cancelled" })}>
                Cancel order
              </Button>
              <Button variant="outline" size="sm" onClick={() => patch.mutate({ status: "returned", payment_status: "refunded" })}>
                Process return
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <Label>Internal notes</Label>
            <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="mt-1" maxLength={1000} />
            <Button size="sm" className="mt-2" onClick={() => patch.mutate({ admin_notes: adminNotes })}>
              Save note
            </Button>
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}
