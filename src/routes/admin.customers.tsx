import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, money } from "@/lib/format";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomers });

function AdminCustomers() {
  const [search, setSearch] = useState("");

  const customers = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const [{ data: profiles }, { data: orders }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id, total, created_at"),
      ]);
      return (profiles ?? []).map((p) => {
        const own = (orders ?? []).filter((o) => o.user_id === p.id);
        return {
          ...p,
          orderCount: own.length,
          spent: own.reduce((s, o) => s + Number(o.total), 0),
          last: own.map((o) => o.created_at).sort().at(-1) ?? null,
        };
      });
    },
  });

  const rows = useMemo(
    () =>
      (customers.data ?? []).filter((c) =>
        `${c.full_name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [customers.data, search],
  );

  return (
    <AdminLayout title="Customers">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, email or phone"
        className="mb-4 max-w-xs"
      />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="border-b bg-secondary/50 text-left">
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Joined</th>
              <th className="p-3 text-center">Orders</th>
              <th className="p-3 text-right">Total spent</th>
              <th className="p-3">Last order</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{c.full_name ?? "Guest user"}</td>
                <td className="p-3">
                  <p>{c.email}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                </td>
                <td className="p-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                <td className="p-3 text-center">{c.orderCount}</td>
                <td className="p-3 text-right font-semibold">{money(c.spent)}</td>
                <td className="p-3 text-muted-foreground">{c.last ? formatDate(c.last) : "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
