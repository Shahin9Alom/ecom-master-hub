import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { useShippingZones } from "@/lib/data";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Shopping Cart — Shahin Mart" },
      { name: "description", content: "Review the items in your Shahin Mart cart before checkout." },
      { property: "og:title", content: "Your Shopping Cart — Shahin Mart" },
      { property: "og:description", content: "Review your cart and proceed to a secure checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const { data: zones } = useShippingZones();
  const baseCharge = zones?.[0]?.charge ?? 0;
  const freeAt = zones?.[0]?.free_threshold ?? null;
  const delivery = freeAt != null && cart.subtotal >= Number(freeAt) ? 0 : Number(baseCharge);

  if (cart.items.length === 0) {
    return (
      <StoreLayout>
        <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-sm text-muted-foreground">Browse the shop and add something you love.</p>
          <Button asChild>
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container-page py-8">
        <h1 className="text-2xl font-bold">Shopping cart</h1>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {cart.items.map((i) => (
              <div key={`${i.productId}-${i.variant ?? ""}`} className="flex gap-4 rounded-xl border bg-card p-3">
                <img src={i.image ?? ""} alt={i.name} className="h-24 w-24 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to="/product/$slug" params={{ slug: i.slug }} className="font-medium hover:text-primary">
                    {i.name}
                  </Link>
                  {i.variant && <p className="text-xs text-muted-foreground">{i.variant}</p>}
                  <p className="mt-1 text-sm font-semibold">{money(i.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center rounded-md border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => cart.setQuantity(i.productId, i.variant, i.quantity - 1)}
                        aria-label="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{i.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (i.quantity >= i.stock) {
                            toast.error("No more stock available");
                            return;
                          }
                          cart.setQuantity(i.productId, i.variant, i.quantity + 1);
                        }}
                        aria-label="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        cart.remove(i.productId, i.variant);
                        toast.success("Removed from cart");
                      }}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
                <div className="text-right font-semibold">{money(i.price * i.quantity)}</div>
              </div>
            ))}
            <div className="flex justify-between">
              <Button asChild variant="outline">
                <Link to="/shop">Continue shopping</Link>
              </Button>
              <Button variant="ghost" onClick={() => cart.clear()}>
                Clear cart
              </Button>
            </div>
          </div>

          <aside className="h-fit rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{money(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated delivery</span>
                <span>{delivery === 0 ? "Free" : money(delivery)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-3 text-base font-bold">
                <span>Total</span>
                <span>{money(cart.subtotal + delivery)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Coupons are applied at checkout.</p>
            </div>
            <Button asChild className="mt-4 w-full">
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
          </aside>
        </div>
      </div>
    </StoreLayout>
  );
}
