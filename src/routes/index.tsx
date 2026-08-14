import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BadgePercent, Headphones, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Rating } from "@/components/store/Rating";
import { useBanners, useCategories, useProducts, useStoreSettings } from "@/lib/data";
import { money } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shahin Mart — Online Shopping for Electronics, Fashion & Home" },
      {
        name: "description",
        content:
          "Shop electronics, audio, fashion and home essentials at Shahin Mart. Fast delivery, secure checkout, cash on delivery and easy returns.",
      },
      { property: "og:title", content: "Shahin Mart — Everyday essentials, delivered fast" },
      {
        property: "og:description",
        content: "Browse featured deals, new arrivals and top-rated products at Shahin Mart.",
      },
    ],
  }),
  component: Home,
});

function Section({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="container-page py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Grid({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

function Home() {
  const { data: banners } = useBanners();
  const { data: categories } = useCategories();
  const { data: store } = useStoreSettings();
  const featured = useProducts({ featured: true, limit: 8 });
  const arrivals = useProducts({ isNew: true, sort: "latest", limit: 8 });
  const popular = useProducts({ sort: "popular", limit: 4 });
  const [slide, setSlide] = useState(0);
  const [email, setEmail] = useState("");

  const active = (banners ?? []).filter((b) => b.is_active);
  const current = active[slide % Math.max(active.length, 1)];
  const deals = (featured.data ?? []).filter((p) => p.sale_price != null).slice(0, 4);

  return (
    <StoreLayout>
      <h1 className="sr-only">{store?.name ?? "Shahin Mart"} online store</h1>

      {/* Hero */}
      <section className="container-page pt-6">
        <div className="relative overflow-hidden rounded-2xl bg-ink text-ink-foreground">
          {current?.image_url && (
            <img
              src={current.image_url}
              alt={current.title}
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
          )}
          <div className="relative px-6 py-14 sm:px-12 sm:py-20 lg:max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              {store?.name ?? "Shahin Mart"}
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-5xl">{current?.title ?? "Shop smarter today"}</h2>
            <p className="mt-3 max-w-lg text-sm opacity-90 sm:text-base">
              {current?.subtitle ?? store?.tagline ?? "Great products at honest prices."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/shop">{current?.button_text ?? "Shop now"}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/track">Track my order</Link>
              </Button>
            </div>
          </div>
          {active.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              {active.map((b, i) => (
                <button
                  key={b.id}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setSlide(i)}
                  className={`h-2 w-6 rounded-full transition-colors ${
                    i === slide % active.length ? "bg-primary" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Value props */}
      <section className="container-page grid grid-cols-2 gap-3 pt-8 lg:grid-cols-4">
        {[
          { icon: Truck, title: "Fast delivery", text: "1-5 days nationwide" },
          { icon: ShieldCheck, title: "Secure checkout", text: "Your data stays safe" },
          { icon: BadgePercent, title: "Best prices", text: "Deals updated daily" },
          { icon: Headphones, title: "Real support", text: "We answer quickly" },
        ].map((f) => (
          <div key={f.title} className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <f.icon className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <Section title="Shop by category" subtitle="Find what you need faster">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(categories ?? [])
            .filter((c) => c.is_active)
            .map((c) => (
              <Link
                key={c.id}
                to="/shop"
                search={{ category: c.id }}
                className="group overflow-hidden rounded-xl border bg-card"
              >
                <img
                  src={c.image_url ?? `https://picsum.photos/seed/${c.slug}/600/400`}
                  alt={`${c.name} category`}
                  loading="lazy"
                  className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-40"
                />
                <div className="p-3 text-sm font-semibold">{c.name}</div>
              </Link>
            ))}
        </div>
      </Section>

      {/* Featured */}
      <Section
        title="Featured products"
        subtitle="Hand-picked by our team"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/shop">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
      >
        <Grid loading={featured.isLoading}>
          {(featured.data ?? []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </Grid>
      </Section>

      {/* Flash deals */}
      {deals.length > 0 && (
        <section className="bg-ink py-12 text-ink-foreground">
          <div className="container-page">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">Flash deals</h2>
                <p className="text-sm opacity-80">Discounted while stock lasts</p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link to="/shop" search={{ sort: "price_asc" }}>
                  All deals
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {deals.map((p) => (
                <Link
                  key={p.id}
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  className="rounded-xl bg-card p-3 text-card-foreground"
                >
                  <img
                    src={p.images?.[0] ?? ""}
                    alt={p.name}
                    loading="lazy"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                  <p className="mt-2 line-clamp-1 text-sm font-medium">{p.name}</p>
                  <p className="text-sm font-bold text-primary">{money(p.sale_price)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New arrivals */}
      <Section title="New arrivals" subtitle="Fresh in store">
        <Grid loading={arrivals.isLoading}>
          {(arrivals.data ?? []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </Grid>
      </Section>

      {/* Popular */}
      <Section title="Most popular" subtitle="What customers buy the most">
        <Grid loading={popular.isLoading}>
          {(popular.data ?? []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </Grid>
      </Section>

      {/* Testimonials */}
      <Section title="What customers say">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: "Rifat H.", text: "Ordered in the evening, delivered next morning. Packaging was solid." },
            { name: "Nusrat J.", text: "Prices are fair and the product matched the description exactly." },
            { name: "Tanvir A.", text: "Support helped me swap a size without any hassle." },
          ].map((t) => (
            <div key={t.name} className="rounded-xl border bg-card p-5">
              <Rating value={5} />
              <p className="mt-3 text-sm text-muted-foreground">"{t.text}"</p>
              <p className="mt-3 text-sm font-semibold">{t.name}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Newsletter */}
      <section className="container-page pb-4">
        <div className="rounded-2xl border bg-accent p-8 text-accent-foreground">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-xl font-bold">Get deals in your inbox</h2>
            <p className="text-sm">Offers, new arrivals and restock alerts. No spam.</p>
            <form
              className="flex w-full max-w-md gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                  toast.error("Enter a valid email address");
                  return;
                }
                setEmail("");
                toast.success("Subscribed! We'll keep you posted.");
              }}
            >
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                maxLength={255}
                placeholder="you@example.com"
                aria-label="Email address"
                className="bg-card"
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
