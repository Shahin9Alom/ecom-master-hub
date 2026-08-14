import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useCategories, useStoreSettings } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/track", label: "Track order" },
  { to: "/pages/about", label: "About" },
  { to: "/pages/contact", label: "Contact" },
] as const;

export function Header() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const cart = useCart();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { data: store } = useStoreSettings();
  const { data: categories } = useCategories();
  const qc = useQueryClient();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    void navigate({ to: "/shop", search: { q: q || undefined } });
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="bg-ink text-ink-foreground">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <span>{store?.tagline ?? "Fast delivery across the country"}</span>
          <span className="hidden sm:block">{store?.phone}</span>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <nav className="flex flex-col gap-1 p-4 pt-10">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
                >
                  {n.label}
                </Link>
              ))}
              <div className="mt-3 px-3 text-xs font-semibold uppercase text-muted-foreground">Categories</div>
              {categories
                ?.filter((c) => c.is_active)
                .map((c) => (
                  <Link
                    key={c.id}
                    to="/shop"
                    search={{ category: c.id }}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm hover:bg-secondary"
                  >
                    {c.name}
                  </Link>
                ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2">
          <span className="rounded-md bg-primary px-2 py-1 text-sm font-bold text-primary-foreground">SM</span>
          <span className="hidden text-lg font-bold sm:block">{store?.name ?? "Shahin Mart"}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submit} className="ml-auto hidden max-w-sm flex-1 items-center gap-2 md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, SKU, brand…"
              className="pl-9"
              aria-label="Search products"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
            <Link to="/wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative" aria-label="Cart">
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cart.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {cart.count}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> My account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account" search={{ tab: "orders" }}>
                    <Package className="mr-2 h-4 w-4" /> My orders
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="ml-1">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="container-page pb-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
      </form>
    </header>
  );
}
