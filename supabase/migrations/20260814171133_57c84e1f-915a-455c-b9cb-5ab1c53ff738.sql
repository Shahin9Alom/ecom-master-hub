
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','customer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "admin delete profile" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATALOG
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brands TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands public read" ON public.brands FOR SELECT USING (true);
CREATE POLICY "brands admin write" ON public.brands FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  image_url text,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sku text,
  description text,
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  images text[] NOT NULL DEFAULT '{}',
  price numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2),
  stock int NOT NULL DEFAULT 0,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  sold_count int NOT NULL DEFAULT 0,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (is_published OR public.is_admin());
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  button_text text,
  button_link text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners public read" ON public.banners FOR SELECT USING (true);
CREATE POLICY "banners admin write" ON public.banners FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  charge numeric(12,2) NOT NULL DEFAULT 0,
  free_threshold numeric(12,2),
  eta text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.shipping_zones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_zones TO authenticated;
GRANT ALL ON public.shipping_zones TO service_role;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zones public read" ON public.shipping_zones FOR SELECT USING (true);
CREATE POLICY "zones admin write" ON public.shipping_zones FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- COUPONS (never public)
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'percent',
  value numeric(12,2) NOT NULL DEFAULT 0,
  min_order numeric(12,2) NOT NULL DEFAULT 0,
  max_discount numeric(12,2),
  expires_at timestamptz,
  usage_limit int,
  used_count int NOT NULL DEFAULT 0,
  per_user_limit int,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons admin only" ON public.coupons FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _subtotal numeric)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons; d numeric;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(_code) AND is_active LIMIT 1;
  IF c.id IS NULL THEN RETURN jsonb_build_object('valid', false, 'message', 'Coupon not found'); END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RETURN jsonb_build_object('valid', false, 'message', 'Coupon expired'); END IF;
  IF c.usage_limit IS NOT NULL AND c.used_count >= c.usage_limit THEN RETURN jsonb_build_object('valid', false, 'message', 'Coupon usage limit reached'); END IF;
  IF _subtotal < c.min_order THEN RETURN jsonb_build_object('valid', false, 'message', 'Minimum order of ' || c.min_order || ' required'); END IF;
  IF c.type = 'percent' THEN d := _subtotal * c.value / 100.0; ELSE d := c.value; END IF;
  IF c.max_discount IS NOT NULL AND d > c.max_discount THEN d := c.max_discount; END IF;
  IF d > _subtotal THEN d := _subtotal; END IF;
  RETURN jsonb_build_object('valid', true, 'code', c.code, 'discount', round(d, 2), 'message', 'Coupon applied');
END; $$;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated;

-- ADDRESSES / WISHLIST / REVIEWS
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  full_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  area text,
  postal_code text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses own" ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist own" ON public.wishlists FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  status text NOT NULL DEFAULT 'pending',
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "reviews insert own" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews admin write" ON public.reviews FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "reviews delete" ON public.reviews FOR DELETE TO authenticated USING (public.is_admin() OR user_id = auth.uid());

-- ORDERS
CREATE SEQUENCE public.order_number_seq START 1001;
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('SM-' || nextval('public.order_number_seq')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text NOT NULL,
  city text NOT NULL,
  area text,
  postal_code text,
  notes text,
  admin_notes text,
  delivery_method text NOT NULL DEFAULT 'standard',
  delivery_charge numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  coupon_code text,
  payment_method text NOT NULL DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'unpaid',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders own read" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "orders own insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders update" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "orders admin delete" ON public.orders FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  image text,
  variant text,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())));
CREATE POLICY "order items insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "order items admin" ON public.order_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order events read" ON public.order_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())));
CREATE POLICY "order events insert" ON public.order_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())));

CREATE OR REPLACE FUNCTION public.after_order_item_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products
     SET stock = GREATEST(0, stock - NEW.quantity), sold_count = sold_count + NEW.quantity
   WHERE id = NEW.product_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_order_item_stock AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.after_order_item_insert();

CREATE OR REPLACE FUNCTION public.after_order_status_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_events (order_id, status, note) VALUES (NEW.id, NEW.status, 'Status updated');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_order_status BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.after_order_status_change();

CREATE OR REPLACE FUNCTION public.refresh_product_rating() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products p SET
    rating = COALESCE((SELECT round(avg(rating)::numeric, 2) FROM public.reviews r WHERE r.product_id = pid AND r.status = 'approved'), 0),
    review_count = (SELECT count(*) FROM public.reviews r WHERE r.product_id = pid AND r.status = 'approved')
  WHERE p.id = pid;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_review_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

-- SEED
INSERT INTO public.brands (name, slug) VALUES
 ('Nexon','nexon'),('AudioLab','audiolab'),('UrbanFit','urbanfit'),('HomeGlow','homeglow');

INSERT INTO public.categories (name, slug, image_url, sort_order) VALUES
 ('Electronics','electronics','https://picsum.photos/seed/cat-electronics/600/400',1),
 ('Audio','audio','https://picsum.photos/seed/cat-audio/600/400',2),
 ('Fashion','fashion','https://picsum.photos/seed/cat-fashion/600/400',3),
 ('Home & Living','home-living','https://picsum.photos/seed/cat-home/600/400',4);

INSERT INTO public.products (name, slug, sku, description, specs, images, price, sale_price, stock, brand_id, category_id, is_featured, is_new)
SELECT v.name, v.slug, v.sku, v.description, v.specs::jsonb,
       ARRAY['https://picsum.photos/seed/' || v.slug || '/800/800','https://picsum.photos/seed/' || v.slug || '-2/800/800'],
       v.price, v.sale_price, v.stock,
       (SELECT id FROM public.brands WHERE slug = v.brand),
       (SELECT id FROM public.categories WHERE slug = v.cat),
       v.feat, v.isnew
FROM (VALUES
 ('Nexon Pulse Smartphone','nexon-pulse-smartphone','SM-PH-001','A fast, bright 6.7" smartphone with all-day battery.','[{"label":"Display","value":"6.7\" AMOLED"},{"label":"Battery","value":"5000mAh"}]',45990,42990,25,'nexon','electronics',true,true),
 ('Nexon Tab 11','nexon-tab-11','SM-TB-002','Lightweight tablet for work and streaming.','[{"label":"Screen","value":"11 inch"},{"label":"Storage","value":"128GB"}]',32990,null,14,'nexon','electronics',true,false),
 ('AudioLab Wave Headphones','audiolab-wave-headphones','SM-AU-003','Over-ear noise cancelling headphones with 40h playback.','[{"label":"Battery","value":"40 hours"},{"label":"ANC","value":"Yes"}]',8990,6990,40,'audiolab','audio',true,true),
 ('AudioLab Bud Pro','audiolab-bud-pro','SM-AU-004','True wireless earbuds with deep bass.','[{"label":"Type","value":"TWS"},{"label":"Water","value":"IPX5"}]',3490,2790,60,'audiolab','audio',false,true),
 ('AudioLab Boom Speaker','audiolab-boom-speaker','SM-AU-005','Portable bluetooth speaker, 20W output.','[{"label":"Power","value":"20W"}]',4590,null,18,'audiolab','audio',false,false),
 ('UrbanFit Everyday Tee','urbanfit-everyday-tee','SM-FA-006','Soft cotton t-shirt for daily wear.','[{"label":"Material","value":"100% Cotton"}]',890,690,120,'urbanfit','fashion',true,false),
 ('UrbanFit Denim Jacket','urbanfit-denim-jacket','SM-FA-007','Classic denim jacket with a modern cut.','[{"label":"Material","value":"Denim"}]',3290,2690,22,'urbanfit','fashion',false,true),
 ('UrbanFit Runner Shoes','urbanfit-runner-shoes','SM-FA-008','Breathable running shoes with cushioned sole.','[{"label":"Sole","value":"EVA"}]',4290,3590,0,'urbanfit','fashion',false,false),
 ('HomeGlow Table Lamp','homeglow-table-lamp','SM-HM-009','Warm LED lamp with touch dimmer.','[{"label":"Bulb","value":"LED 9W"}]',1890,1490,35,'homeglow','home-living',true,false),
 ('HomeGlow Ceramic Mug Set','homeglow-ceramic-mug-set','SM-HM-010','Set of 4 handmade ceramic mugs.','[{"label":"Pieces","value":"4"}]',1290,null,50,'homeglow','home-living',false,true),
 ('HomeGlow Cotton Throw','homeglow-cotton-throw','SM-HM-011','Cozy woven throw blanket.','[{"label":"Size","value":"130x170cm"}]',2190,1790,12,'homeglow','home-living',false,false),
 ('Nexon Smart Watch S2','nexon-smart-watch-s2','SM-EL-012','Fitness tracking smartwatch with AMOLED display.','[{"label":"Battery","value":"7 days"}]',6990,5490,8,'nexon','electronics',true,true)
) AS v(name, slug, sku, description, specs, price, sale_price, stock, brand, cat, feat, isnew);

UPDATE public.products SET variations = '[{"name":"Size","options":["S","M","L","XL"]},{"name":"Color","options":["Black","White","Navy"]}]'::jsonb
WHERE category_id = (SELECT id FROM public.categories WHERE slug='fashion');

INSERT INTO public.banners (title, subtitle, image_url, button_text, button_link, sort_order) VALUES
 ('Big Season Sale','Up to 40% off on electronics, audio and more.','https://picsum.photos/seed/banner-one/1600/700','Shop deals','/shop',1),
 ('New Arrivals Are Here','Fresh picks added every week.','https://picsum.photos/seed/banner-two/1600/700','Explore new','/shop?sort=latest',2);

INSERT INTO public.coupons (code, type, value, min_order, max_discount, is_active) VALUES
 ('WELCOME10','percent',10,1000,1500,true),
 ('FLAT500','fixed',500,3000,null,true);

INSERT INTO public.shipping_zones (name, charge, free_threshold, eta, sort_order) VALUES
 ('Inside City',60,5000,'1-2 days',1),
 ('Outside City',120,8000,'3-5 days',2);

INSERT INTO public.site_settings (key, value) VALUES
 ('store', '{"name":"Shahin Mart","tagline":"Everyday essentials, delivered fast.","logo_url":"","currency":"BDT","currency_symbol":"৳","phone":"+880 1700-000000","email":"support@shahinmart.com","address":"House 12, Road 5, Dhaka 1207","facebook":"https://facebook.com","instagram":"https://instagram.com","twitter":"https://twitter.com"}'::jsonb),
 ('payments', '{"cod":true,"online":true,"card":true,"mobile":true}'::jsonb),
 ('content', '{"about":"Shahin Mart is an online store built for fast, reliable everyday shopping.","faq":[{"q":"How long does delivery take?","a":"1-2 days inside the city and 3-5 days outside the city."},{"q":"Can I return a product?","a":"Yes, within 7 days of delivery if unused and in original packaging."}],"return_policy":"Returns accepted within 7 days of delivery for unused items in original packaging.","privacy_policy":"We only collect information required to process your orders and never sell your data.","terms":"By using this site you agree to our ordering, delivery and return terms.","shipping_info":"Orders are dispatched within 24 hours of confirmation."}'::jsonb);
