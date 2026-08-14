import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageX, ShoppingBag, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, money, statusLabel } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Stat({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: "default" | "warning" | "destructive";
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <Icon
          className={`h-4 w-4 ${tone === "warning" ? "text-warning" : tone === "destructive" ? "text-destructive" : "text-primary"}`}
        />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Dashboard() {
  const stats = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const [orders, products, customers] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, stock, sold_count, price, sale_price"),
        supabase.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
      ]);
      return {
        orders: orders.data ?? [],
        products: products.data ?? [],
        customers: customers.data ?? [],
      };
    },
  });

  const orders = stats.data?.orders ?? [];
  const products = stats.data?.products ?? [];
  const customers = stats.data?.customers ?? [];

  const paidOrders = orders.filter((o) => o.status !== "cancelled");
  const totalSales = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const today = new Date().toDateString();
  const todaySales = paidOrders
    .filter((o) => new Date(o.created_at).toDateString() === today)
    .reduce((s, o) => s + Number(o.total), 0);

  const byStatus = ["pending", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"].map(
    (s) => ({ name: statusLabel(s), value: orders.filter((o) => o.status === s).length }),
  );

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    return {
      day: d.toLocaleDateString("en-GB", { weekday: "short" }),
      sales: paidOrders.filter((o) => new Date(o.created_at).toDateString() === key).reduce((s, o) => s + Number(o.total), 0),
    };
  });

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const outOfStock = products.filter((p) => p.stock <= 0);
  const topProducts = [...products].sort((a, b) => b.sold_count - a.sold_count).slice(0, 5);

  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total sales" value={money(totalSales)} icon={TrendingUp} />
        <Stat label="Today's sales" value={money(todaySales)} icon={TrendingUp} />
        <Stat label="Total orders" value={orders.length} icon={ShoppingBag} />
        <Stat label="Customers" value={customers.length} icon={Users} />
        <Stat label="Pending orders" value={orders.filter((o) => o.status === "pending").length} icon={ShoppingBag} tone="warning" />
        <Stat label="Delivered" value={orders.filter((o) => o.status === "delivered").length} icon={ShoppingBag} />
        <Stat label="Cancelled" value={orders.filter((o) => o.status === "cancelled").length} icon={ShoppingBag} tone="destructive" />
        <Stat label="Products" value={products.length} icon={PackageX} />
      </div>

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span>
            {lowStock.length} product(s) low on stock, {outOfStock.length} out of stock.
          </span>
          <Link to="/admin/products" className="ml-auto underline">
            Manage inventory
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 font-semibold">Sales — last 7 days</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="sales" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 font-semibold">Orders by status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus.filter((s) => s.value > 0)} dataKey="value" nameKey="name" outerRadius={90} label>
                  {byStatus.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Recent orders</h2>
          <div className="space-y-2">
            {orders.slice(0, 6).map((o) => (
              <Link
                key={o.id}
                to="/admin/orders/$id"
                params={{ id: o.id }}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm hover:bg-secondary"
              >
                <span className="font-medium">{o.order_number}</span>
                <span className="text-muted-foreground">{o.customer_name}</span>
                <Badge variant="secondary">{statusLabel(o.status)}</Badge>
                <span className="ml-auto font-semibold">{money(o.total)}</span>
                <span className="w-full text-xs text-muted-foreground">{formatDate(o.created_at)}</span>
              </Link>
            ))}
            {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 font-semibold">Top products</h2>
            {topProducts.map((p) => (
              <div key={p.id} className="flex justify-between border-b py-2 text-sm last:border-0">
                <span className="truncate pr-2">{p.name}</span>
                <span className="font-medium">{p.sold_count} sold</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 font-semibold">Recent customers</h2>
            {customers.slice(0, 5).map((c) => (
              <div key={c.id} className="border-b py-2 text-sm last:border-0">
                <p className="font-medium">{c.full_name ?? "Customer"}</p>
                <p className="text-xs text-muted-foreground">{c.email}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
