import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, money, ORDER_STATUSES, statusLabel } from "@/lib/format";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    let list = (orders.data ?? []).filter((o) =>
      `${o.order_number} ${o.customer_name} ${o.phone}`.toLowerCase().includes(search.toLowerCase()),
    );
    if (status !== "all") list = list.filter((o) => o.status === status);
    if (sort === "amount") list = [...list].sort((a, b) => Number(b.total) - Number(a.total));
    if (sort === "oldest") list = [...list].reverse();
    return list;
  }, [orders.data, search, status, sort]);

  return (
    <AdminLayout title="Orders">
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order ID, customer, phone"
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="amount">Highest amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b bg-secondary/50 text-left">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Date</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{o.order_number}</td>
                <td className="p-3">
                  <p>{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.phone}</p>
                </td>
                <td className="p-3 text-muted-foreground">{formatDate(o.created_at)}</td>
                <td className="p-3">
                  <span className="uppercase">{o.payment_method}</span>
                  <p className="text-xs text-muted-foreground">{o.payment_status}</p>
                </td>
                <td className="p-3">
                  <Badge variant={o.status === "cancelled" ? "destructive" : "secondary"}>{statusLabel(o.status)}</Badge>
                </td>
                <td className="p-3 text-right font-semibold">{money(o.total)}</td>
                <td className="p-3 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/orders/$id" params={{ id: o.id }}>
                      Manage
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No orders match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
