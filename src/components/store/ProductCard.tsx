import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/store/Rating";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { effectivePrice, money } from "@/lib/format";
import type { Product } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const price = effectivePrice(product);
  const hasDiscount = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  const off = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.sale_price)) / Number(product.price)) * 100)
    : 0;
  const soldOut = product.stock <= 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-[var(--shadow-card)]">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="relative block overflow-hidden">
        <img
          src={product.images?.[0] ?? "https://picsum.photos/seed/placeholder/600/600"}
          alt={product.name}
          loading="lazy"
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasDiscount && <Badge className="bg-destructive text-destructive-foreground">-{off}%</Badge>}
          {product.is_new && <Badge variant="secondary">New</Badge>}
        </div>
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="rounded-md bg-ink px-3 py-1 text-sm font-medium text-ink-foreground">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      <button
        type="button"
        aria-label="Add to wishlist"
        onClick={() =>
          wishlist.toggle.mutate(product.id, {
            onSuccess: (r) => toast.success(r === "added" ? "Added to wishlist" : "Removed from wishlist"),
            onError: (e) => toast.error(e.message),
          })
        }
        className="absolute right-2 top-2 rounded-full bg-card/90 p-2 shadow-sm transition-colors hover:bg-card"
      >
        <Heart
          className={cn("h-4 w-4", wishlist.has(product.id) ? "fill-destructive text-destructive" : "text-muted-foreground")}
        />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
        >
          {product.name}
        </Link>
        <Rating value={Number(product.rating)} count={product.review_count} />
        <div className="mt-auto flex items-center gap-2">
          <span className="text-base font-semibold">{money(price)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">{money(product.price)}</span>
          )}
        </div>
        <Button
          size="sm"
          className="w-full"
          disabled={soldOut}
          onClick={() => {
            cart.add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image: product.images?.[0] ?? null,
              price,
              stock: product.stock,
              variant: null,
            });
            toast.success("Added to cart");
          }}
        >
          <ShoppingCart className="mr-1 h-4 w-4" /> Add to cart
        </Button>
      </div>
    </div>
  );
}
