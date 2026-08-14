import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { Rating } from "@/components/store/Rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProduct, useProducts } from "@/lib/data";
import { effectivePrice, money } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const title = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      meta: [
        { title: `${title} — Shahin Mart` },
        { name: "description", content: `Buy ${title} at Shahin Mart with fast delivery and secure checkout.` },
        { property: "og:title", content: `${title} — Shahin Mart` },
        { property: "og:description", content: `Buy ${title} at Shahin Mart with fast delivery.` },
        { property: "og:type", content: "product" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useProduct(slug);
  const cart = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const wishlist = useWishlist();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [variant, setVariant] = useState<Record<string, string>>({});
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  const related = useProducts({ category: product?.category_id ?? undefined, limit: 4 });

  const reviews = useQuery({
    queryKey: ["reviews", product?.id],
    enabled: Boolean(product?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", product!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in to write a review");
      if (comment.trim().length < 5) throw new Error("Please write at least 5 characters");
      const { data: purchased } = await supabase
        .from("order_items")
        .select("id, orders!inner(user_id)")
        .eq("product_id", product!.id)
        .limit(1);
      const { error } = await supabase.from("reviews").insert({
        product_id: product!.id,
        user_id: user.id,
        author_name: user.email?.split("@")[0] ?? "Customer",
        rating: Number(rating),
        comment: comment.trim().slice(0, 1000),
        is_verified: (purchased?.length ?? 0) > 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      toast.success("Review submitted — it will appear after approval");
      void qc.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container-page grid gap-8 py-10 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product || !product.is_published) {
    return (
      <StoreLayout>
        <div className="container-page py-20 text-center">
          <h1 className="text-2xl font-bold">Product not available</h1>
          <p className="mt-2 text-sm text-muted-foreground">This product may have been removed.</p>
          <Button asChild className="mt-6">
            <Link to="/shop">Back to shop</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const price = effectivePrice(product);
  const hasDiscount = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  const variantLabel =
    Object.keys(variant).length > 0
      ? Object.entries(variant)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : null;

  const addToCart = () => {
    const missing = (product.variations ?? []).filter((v) => !variant[v.name]);
    if (missing.length > 0) {
      toast.error(`Please select ${missing.map((m) => m.name).join(", ")}`);
      return false;
    }
    cart.add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images?.[0] ?? null,
        price,
        stock: product.stock,
        variant: variantLabel,
      },
      qty,
    );
    return true;
  };

  const approved = (reviews.data ?? []).filter((r) => r.status === "approved");

  return (
    <StoreLayout>
      <div className="container-page py-8">
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">
            Home
          </Link>{" "}
          / <Link to="/shop" className="hover:underline">Shop</Link> / <span>{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <img
              src={product.images?.[img] ?? product.images?.[0] ?? ""}
              alt={product.name}
              className="aspect-square w-full rounded-xl border object-cover"
            />
            {product.images?.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setImg(i)}
                    className={`overflow-hidden rounded-lg border-2 ${i === img ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={src} alt={`${product.name} view ${i + 1}`} className="h-20 w-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Rating value={Number(product.rating)} count={product.review_count} />
              <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>
                {product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}
              </Badge>
              {product.sku && <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>}
            </div>

            <div className="mt-4 flex items-end gap-3">
              <span className="text-3xl font-bold">{money(price)}</span>
              {hasDiscount && (
                <span className="pb-1 text-lg text-muted-foreground line-through">{money(product.price)}</span>
              )}
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>

            {(product.variations ?? []).map((v) => (
              <div key={v.name} className="mt-4">
                <p className="mb-1 text-sm font-medium">{v.name}</p>
                <Select value={variant[v.name] ?? ""} onValueChange={(val) => setVariant((s) => ({ ...s, [v.name]: val }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={`Select ${v.name.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {v.options.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-md border">
                <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                disabled={product.stock <= 0}
                onClick={() => {
                  if (addToCart()) toast.success("Added to cart");
                }}
              >
                Add to cart
              </Button>
              <Button
                variant="secondary"
                disabled={product.stock <= 0}
                onClick={() => {
                  if (addToCart()) void navigate({ to: "/checkout" });
                }}
              >
                Buy now
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Add to wishlist"
                onClick={() =>
                  wishlist.toggle.mutate(product.id, {
                    onSuccess: (r) => toast.success(r === "added" ? "Added to wishlist" : "Removed from wishlist"),
                    onError: (e) => toast.error(e.message),
                  })
                }
              >
                <Heart className={wishlist.has(product.id) ? "h-4 w-4 fill-destructive text-destructive" : "h-4 w-4"} />
              </Button>
            </div>

            <div className="mt-6 grid gap-2 rounded-xl border bg-card p-4 text-sm">
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> Delivery in 1-5 days depending on your area
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> 7-day return policy on unused items
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="specs" className="mt-12">
          <TabsList>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({approved.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="specs" className="rounded-xl border bg-card p-5">
            {(product.specs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No specifications added yet.</p>
            ) : (
              <dl className="grid gap-2 sm:grid-cols-2">
                {product.specs.map((s) => (
                  <div key={s.label} className="flex justify-between gap-4 border-b py-2 text-sm">
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd className="font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </TabsContent>
          <TabsContent value="reviews" className="space-y-4 rounded-xl border bg-card p-5">
            {approved.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>}
            {approved.map((r) => (
              <div key={r.id} className="border-b pb-3 last:border-0">
                <div className="flex items-center gap-2">
                  <Rating value={r.rating} />
                  <span className="text-sm font-medium">{r.author_name ?? "Customer"}</span>
                  {r.is_verified && <Badge variant="secondary">Verified purchase</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
              </div>
            ))}

            <div className="pt-2">
              <h3 className="text-sm font-semibold">Write a review</h3>
              {user ? (
                <div className="mt-2 space-y-2">
                  <Select value={rating} onValueChange={setRating}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} star{n > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={comment}
                    maxLength={1000}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product"
                  />
                  <Button onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>
                    {submitReview.isPending ? "Submitting…" : "Submit review"}
                  </Button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  <Link to="/auth" className="text-primary underline">
                    Sign in
                  </Link>{" "}
                  to write a review.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Related products</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(related.data ?? [])
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      </div>
    </StoreLayout>
  );
}
