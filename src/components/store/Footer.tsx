import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { useCategories, useStoreSettings } from "@/lib/data";

export function Footer() {
  const { data: store } = useStoreSettings();
  const { data: categories } = useCategories();

  return (
    <footer className="mt-16 bg-ink text-ink-foreground">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="text-lg font-bold">{store?.name ?? "Shahin Mart"}</h2>
          <p className="mt-2 text-sm opacity-80">{store?.tagline}</p>
          <div className="mt-4 space-y-2 text-sm opacity-80">
            {store?.phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {store.phone}
              </p>
            )}
            {store?.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> {store.email}
              </p>
            )}
            {store?.address && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {store.address}
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm opacity-80">
            {categories
              ?.filter((c) => c.is_active)
              .slice(0, 6)
              .map((c) => (
                <li key={c.id}>
                  <Link to="/shop" search={{ category: c.id }} className="hover:opacity-100 hover:underline">
                    {c.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Help</h3>
          <ul className="mt-3 space-y-2 text-sm opacity-80">
            <li>
              <Link to="/track" className="hover:underline">
                Track order
              </Link>
            </li>
            <li>
              <Link to="/pages/$slug" params={{ slug: "faq" }} className="hover:underline">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/pages/$slug" params={{ slug: "shipping" }} className="hover:underline">
                Shipping information
              </Link>
            </li>
            <li>
              <Link to="/pages/$slug" params={{ slug: "returns" }} className="hover:underline">
                Return policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Company</h3>
          <ul className="mt-3 space-y-2 text-sm opacity-80">
            <li>
              <Link to="/pages/about" className="hover:underline">
                About us
              </Link>
            </li>
            <li>
              <Link to="/pages/contact" className="hover:underline">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/pages/$slug" params={{ slug: "privacy" }} className="hover:underline">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link to="/pages/$slug" params={{ slug: "terms" }} className="hover:underline">
                Terms &amp; conditions
              </Link>
            </li>
          </ul>
          <div className="mt-4 flex gap-3 opacity-80">
            {store?.facebook && (
              <a href={store.facebook} aria-label="Facebook" target="_blank" rel="noreferrer">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {store?.instagram && (
              <a href={store.instagram} aria-label="Instagram" target="_blank" rel="noreferrer">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {store?.twitter && (
              <a href={store.twitter} aria-label="Twitter" target="_blank" rel="noreferrer">
                <Twitter className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} {store?.name ?? "Shahin Mart"}. All rights reserved.
      </div>
    </footer>
  );
}
