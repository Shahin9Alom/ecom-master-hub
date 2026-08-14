import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, LayoutGrid, List, SearchX } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrands, useCategories, useProducts } from "@/lib/data";
import { effectivePrice, money } from "@/lib/format";
import { Link } from "@tanstack/react-router";

type ShopSearch = {
  q?: string | undefined;
  category?: string | undefined;
  brand?: string | undefined;
  sort?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  stock?: boolean | undefined;
  rating?: number | undefined;
};

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
    brand: typeof search["brand"] === "string" ? (search["brand"] as string) : undefined,
    sort: typeof search["sort"] === "string" ? (search["sort"] as string) : undefined,
    min: search["min"] != null ? Number(search["min"]) : undefined,
    max: search["max"] != null ? Number(search["max"]) : undefined,
    stock: search["stock"] === true || search["stock"] === "true" ? true : undefined,
    rating: search["rating"] != null ? Number(search["rating"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All Products — Shahin Mart" },
      {
        name: "description",
        content: "Browse the full Shahin Mart catalog. Filter by category, brand, price, rating and availability.",
      },
      { property: "og:title", content: "Shop All Products — Shahin Mart" },
      { property: "og:description", content: "Filter and sort thousands of products at Shahin Mart." },
    ],
  }),
  component: Shop,
});

const PAGE_SIZE = 8;

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const products = useProducts({
    search: search.q,
    category: search.category,
    brand: search.brand,
    minPrice: search.min,
    maxPrice: search.max,
    inStock: search.stock,
    minRating: search.rating,
    sort: search.sort,
  });

  const shown = useMemo(() => (products.data ?? []).slice(0, page * PAGE_SIZE), [products.data, page]);
  const setSearch = (patch: Partial<ShopSearch>) => {
    setPage(1);
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  const Filters = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Search</Label>
        <Input
          className="mt-2"
          defaultValue={search.q ?? ""}
          placeholder="Product, SKU, keyword"
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearch({ q: (e.target as HTMLInputElement).value || undefined });
          }}
        />
      </div>
      <div>
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Category</Label>
        <div className="mt-2 space-y-1">
          <button
            onClick={() => setSearch({ category: undefined })}
            className={`block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary ${!search.category ? "bg-secondary font-medium" : ""}`}
          >
            All categories
          </button>
          {(categories ?? [])
            .filter((c) => c.is_active)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setSearch({ category: c.id })}
                className={`block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary ${search.category === c.id ? "bg-secondary font-medium" : ""}`}
              >
                {c.name}
              </button>
            ))}
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Brand</Label>
        <Select value={search.brand ?? "all"} onValueChange={(v) => setSearch({ brand: v === "all" ? undefined : v })}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {(brands ?? []).map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Price range</Label>
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            defaultValue={search.min ?? ""}
            onBlur={(e) => setSearch({ min: e.target.value ? Number(e.target.value) : undefined })}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max"
            defaultValue={search.max ?? ""}
            onBlur={(e) => setSearch({ max: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Rating</Label>
        <Select
          value={search.rating ? String(search.rating) : "all"}
          onValueChange={(v) => setSearch({ rating: v === "all" ? undefined : Number(v) })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Any rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any rating</SelectItem>
            <SelectItem value="4">4 stars &amp; up</SelectItem>
            <SelectItem value="3">3 stars &amp; up</SelectItem>
            <SelectItem value="2">2 stars &amp; up</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="instock"
          checked={Boolean(search.stock)}
          onCheckedChange={(c) => setSearch({ stock: c === true ? true : undefined })}
        />
        <Label htmlFor="instock" className="text-sm">
          In stock only
        </Label>
      </div>
      <Button variant="outline" className="w-full" onClick={() => void navigate({ search: {} })}>
        Reset filters
      </Button>
    </div>
  );

  return (
    <StoreLayout>
      <div className="container-page py-8">
        <h1 className="text-2xl font-bold">Shop</h1>
        <p className="text-sm text-muted-foreground">
          {products.isLoading ? "Loading products…" : `${products.data?.length ?? 0} products found`}
          {search.q ? ` for "${search.q}"` : ""}
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <Filters />
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Filter className="mr-1 h-4 w-4" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto p-6 pt-10">
                  <Filters />
                </SheetContent>
              </Sheet>

              <Select value={search.sort ?? "latest"} onValueChange={(v) => setSearch({ sort: v })}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="price_asc">Price: low to high</SelectItem>
                  <SelectItem value="price_desc">Price: high to low</SelectItem>
                  <SelectItem value="popular">Popularity</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-auto hidden gap-1 sm:flex">
                <Button variant={view === "grid" ? "default" : "outline"} size="icon" onClick={() => setView("grid")} aria-label="Grid view">
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant={view === "list" ? "default" : "outline"} size="icon" onClick={() => setView("list")} aria-label="List view">
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {products.isLoading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : shown.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-12 text-center">
                <SearchX className="h-10 w-10 text-muted-foreground" />
                <h2 className="text-lg font-semibold">No products found</h2>
                <p className="text-sm text-muted-foreground">
                  Try a different keyword or reset your filters.
                </p>
                <Button variant="outline" onClick={() => void navigate({ search: {} })}>
                  Reset filters
                </Button>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {shown.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {shown.map((p) => (
                  <Link
                    key={p.id}
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    className="flex gap-4 rounded-xl border bg-card p-3 hover:shadow-[var(--shadow-card)]"
                  >
                    <img src={p.images?.[0] ?? ""} alt={p.name} loading="lazy" className="h-28 w-28 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{p.name}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                      <p className="mt-2 font-semibold">{money(effectivePrice(p))}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {shown.length < (products.data?.length ?? 0) && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                  Load more
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
