import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { Rating } from "@/components/store/Rating";

export const Route = createFileRoute("/admin/reviews")({ component: AdminReviews });

function AdminReviews() {
  const qc = useQueryClient();

  const reviews = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin-reviews"] });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").update({ status: "approved" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Review approved");
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Review deleted");
    },
  });

  return (
    <AdminLayout title="Reviews">
      <div className="space-y-3">
        {(reviews.data ?? []).map((r) => (
          <div key={r.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Rating value={r.rating} />
              <span className="font-medium">{(r.products as { name: string } | null)?.name ?? "Product"}</span>
              {r.status === "approved" ? <Badge variant="secondary">Approved</Badge> : <Badge>Pending</Badge>}
              <span className="ml-auto text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
            <div className="mt-3 flex gap-2">
              {r.status !== "approved" && (
                <Button size="sm" onClick={() => approve.mutate(r.id)}>
                  <Check className="mr-1 h-4 w-4" /> Approve
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => remove.mutate(r.id)}>
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        ))}
        {(reviews.data ?? []).length === 0 && (
          <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No reviews yet.</p>
        )}
      </div>
    </AdminLayout>
  );
}
