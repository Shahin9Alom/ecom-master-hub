export const CURRENCY = "৳";

export function money(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `${CURRENCY}${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const TRACK_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function statusTone(status: string): "success" | "destructive" | "warning" | "muted" {
  if (status === "delivered") return "success";
  if (status === "cancelled" || status === "returned") return "destructive";
  if (status === "pending") return "warning";
  return "muted";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function effectivePrice(p: { price: number | string; sale_price?: number | string | null }) {
  const sale = p.sale_price == null ? null : Number(p.sale_price);
  return sale && sale > 0 ? sale : Number(p.price);
}
