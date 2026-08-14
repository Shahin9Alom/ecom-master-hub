import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Product } from "@/lib/data";

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlists")
        .select("id, product_id, products(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; product_id: string; products: Product | null }[];
    },
  });

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Please sign in to use your wishlist");
      const existing = list.data?.find((w) => w.product_id === productId);
      if (existing) {
        const { error } = await supabase.from("wishlists").delete().eq("id", existing.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const has = (productId: string) => Boolean(list.data?.some((w) => w.product_id === productId));

  return { list, toggle, has };
}
