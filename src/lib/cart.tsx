import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  variant?: string | null;
  stock: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, variant: string | null | undefined, quantity: number) => void;
  remove: (productId: string, variant?: string | null) => void;
  clear: () => void;
};

const KEY = "shahinmart.cart.v1";
const CartContext = createContext<CartContextValue | null>(null);

function sameLine(a: CartItem, productId: string, variant?: string | null) {
  return a.productId === productId && (a.variant ?? "") === (variant ?? "");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add: CartContextValue["add"] = useCallback((item, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => sameLine(i, item.productId, item.variant));
      if (idx >= 0) {
        const next = [...prev];
        const line = next[idx]!;
        const max = item.stock > 0 ? item.stock : 99;
        next[idx] = { ...line, quantity: Math.min(max, line.quantity + quantity) };
        return next;
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const setQuantity: CartContextValue["setQuantity"] = useCallback((productId, variant, quantity) => {
    setItems((prev) =>
      prev
        .map((i) => (sameLine(i, productId, variant) ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const remove: CartContextValue["remove"] = useCallback((productId, variant) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, productId, variant)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, count, subtotal, add, setQuantity, remove, clear };
  }, [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
