import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  specs: { label: string; value: string }[];
  variations: { name: string; options: string[] }[];
  images: string[];
  price: number;
  sale_price: number | null;
  stock: number;
  brand_id: string | null;
  category_id: string | null;
  is_published: boolean;
  is_featured: boolean;
  is_new: boolean;
  sold_count: number;
  rating: number;
  review_count: number;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Brand = { id: string; name: string; slug: string; is_active: boolean };

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ShippingZone = {
  id: string;
  name: string;
  charge: number;
  free_threshold: number | null;
  eta: string | null;
  is_active: boolean;
  sort_order: number;
};

export type StoreSettings = {
  name: string;
  tagline?: string;
  logo_url?: string;
  currency_symbol?: string;
  phone?: string;
  email?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
};

export type ContentSettings = {
  about?: string;
  faq?: { q: string; a: string }[];
  return_policy?: string;
  privacy_policy?: string;
  terms?: string;
  shipping_info?: string;
};

export type PaymentSettings = { cod: boolean; online: boolean; card: boolean; mobile: boolean };

async function setting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return ((data?.value as T) ?? fallback) as T;
}

export const useStoreSettings = () =>
  useQuery({
    queryKey: ["settings", "store"],
    queryFn: () => setting<StoreSettings>("store", { name: "Shahin Mart" }),
  });

export const useContentSettings = () =>
  useQuery({ queryKey: ["settings", "content"], queryFn: () => setting<ContentSettings>("content", {}) });

export const usePaymentSettings = () =>
  useQuery({
    queryKey: ["settings", "payments"],
    queryFn: () => setting<PaymentSettings>("payments", { cod: true, online: false, card: false, mobile: false }),
  });

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Category[];
    },
  });

export const useBrands = () =>
  useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Brand[];
    },
  });

export const useBanners = () =>
  useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as Banner[];
    },
  });

export const useShippingZones = () =>
  useQuery({
    queryKey: ["shipping_zones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipping_zones").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as ShippingZone[];
    },
  });

export type ProductFilters = {
  search?: string | undefined;
  category?: string | undefined;
  brand?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  inStock?: boolean | undefined;
  minRating?: number | undefined;
  sort?: string | undefined;
  featured?: boolean | undefined;
  isNew?: boolean | undefined;
  limit?: number | undefined;
};

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      let q = supabase.from("products").select("*").eq("is_published", true);
      if (filters.search) {
        const s = `%${filters.search}%`;
        q = q.or(`name.ilike.${s},sku.ilike.${s},description.ilike.${s}`);
      }
      if (filters.category) q = q.eq("category_id", filters.category);
      if (filters.brand) q = q.eq("brand_id", filters.brand);
      if (filters.minPrice != null) q = q.gte("price", filters.minPrice);
      if (filters.maxPrice != null) q = q.lte("price", filters.maxPrice);
      if (filters.inStock) q = q.gt("stock", 0);
      if (filters.minRating) q = q.gte("rating", filters.minRating);
      if (filters.featured) q = q.eq("is_featured", true);
      if (filters.isNew) q = q.eq("is_new", true);

      switch (filters.sort) {
        case "price_asc":
          q = q.order("price", { ascending: true });
          break;
        case "price_desc":
          q = q.order("price", { ascending: false });
          break;
        case "popular":
          q = q.order("sold_count", { ascending: false });
          break;
        case "rating":
          q = q.order("rating", { ascending: false });
          break;
        default:
          q = q.order("created_at", { ascending: false });
      }
      if (filters.limit) q = q.limit(filters.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return (data as unknown as Product) ?? null;
    },
  });
}
