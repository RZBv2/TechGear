import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readJSON, writeJSON } from "@/lib/storage";
import type { Product } from "@/data/catalog";

type StoreValue = {
  cart: Product[];
  wishlist: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  toggleWishlist: (product: Product) => void;
  isWishlisted: (id: string) => boolean;
  clearCart: () => void;
};

const CART_KEY = "techgear_cart";
const WISHLIST_KEY = "techgear_wishlist";
const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  useEffect(() => {
    setCart(readJSON<Product[]>(CART_KEY, []));
    setWishlist(readJSON<Product[]>(WISHLIST_KEY, []));
  }, []);
  useEffect(() => {
    writeJSON(CART_KEY, cart);
  }, [cart]);
  useEffect(() => {
    writeJSON(WISHLIST_KEY, wishlist);
  }, [wishlist]);
  const addToCart = useCallback(
    (product: Product) =>
      setCart((items) =>
        items.some((item) => item.id === product.id)
          ? items
          : [...items, product],
      ),
    [],
  );
  const removeFromCart = useCallback(
    (id: string) => setCart((items) => items.filter((item) => item.id !== id)),
    [],
  );
  const toggleWishlist = useCallback(
    (product: Product) =>
      setWishlist((items) =>
        items.some((item) => item.id === product.id)
          ? items.filter((item) => item.id !== product.id)
          : [...items, product],
      ),
    [],
  );
  const isWishlisted = useCallback(
    (id: string) => wishlist.some((item) => item.id === id),
    [wishlist],
  );
  const clearCart = useCallback(() => setCart([]), []);
  const value = useMemo(
    () => ({
      cart,
      wishlist,
      addToCart,
      removeFromCart,
      toggleWishlist,
      isWishlisted,
      clearCart,
    }),
    [
      cart,
      wishlist,
      addToCart,
      removeFromCart,
      toggleWishlist,
      isWishlisted,
      clearCart,
    ],
  );
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used within StoreProvider");
  return value;
}
