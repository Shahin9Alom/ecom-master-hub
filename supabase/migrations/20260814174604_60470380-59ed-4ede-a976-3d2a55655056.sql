REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.after_order_item_insert() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.after_order_status_change() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.refresh_product_rating() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated;