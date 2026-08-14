GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.after_order_item_insert() TO authenticated;
GRANT EXECUTE ON FUNCTION public.after_order_status_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_product_rating() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.refresh_product_rating() TO anon;