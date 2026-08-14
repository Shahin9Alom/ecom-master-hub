import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { effectivePrice, money } from "@/lib/format";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "My Wishlist — Shahin Mart" },
      { name: "description", content: "Save products you love and move them to your cart when you are ready." },
      { property: "og:title", content: "My Wishlist — Shahin Mart" },
      { property: "og:description", content: "Your saved Shahin Mart products in one place." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const { list, toggle } = useWishlist();
  const cart = useCart();

  return (
    <StoreLayout>
      <div className="container-page py-8">
        <h1 className="text-2xl font-bold">My wishlist</h1>

        {!user ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border bg-card p-12 text-center">
            <Heart className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Sign in to save products to your wishlist.</p>
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        ) : list.isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : (list.data?.length ?? 0) === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border bg-card p-12 text-center">
            <Heart className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your wishlist is empty.</p>
            <Button asChild>
              <Link to="/shop">Browse products</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {list.data!.map((w) =>
              w.products ? (
                <div key={w.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-3">
                  <img src={w.products.images?.[0] ?? ""} alt={w.products.name} className="h-20 w-20 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to="/product/$slug" params={{ slug: w.products.slug }} className="font-medium hover:text-primary">
                      {w.products.name}
                    </Link>
                    <p className="text-sm font-semibold">{money(effectivePrice(w.products))}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={w.products.stock <= 0}
                    onClick={() => {
                      cart.add({
                        productId: w.products!.id,
                        slug: w.products!.slug,
                        name: w.products!.name,
                        image: w.products!.images?.[0] ?? null,
                        price: effectivePrice(w.products!),
                        stock: w.products!.stock,
                        variant: null,
                      });
                      toggle.mutate(w.product_id);
                      toast.success("Moved to cart");
                    }}
                  >
                    <ShoppingCart className="mr-1 h-4 w-4" /> Move to cart
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle.mutate(w.product_id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
