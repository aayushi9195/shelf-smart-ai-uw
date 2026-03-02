import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { CartItem, Product, RestockAlert, Order } from "@/data/store";
import { getOrders } from "@/data/store";

interface StoreContextType {
  cart: CartItem[];
  addToCart: (product: Product, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  restockAlerts: RestockAlert[];
  addRestockAlert: (productId: string, productName: string, requestedBy: string) => void;
  resolveAlert: (alertId: string) => void;
  orders: Order[];
  placeOrder: (customer: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restockAlerts, setRestockAlerts] = useState<RestockAlert[]>([]);
  const [orders, setOrders] = useState<Order[]>(getOrders());

  const addToCart = useCallback((product: Product, qty: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { product, qty }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const addRestockAlert = useCallback(
    (productId: string, productName: string, requestedBy: string) => {
      const alert: RestockAlert = {
        id: `RSA-${Date.now()}`,
        productId,
        productName,
        requestedBy,
        timestamp: new Date().toISOString(),
        resolved: false,
      };
      setRestockAlerts((prev) => [alert, ...prev]);
    },
    []
  );

  const resolveAlert = useCallback((alertId: string) => {
    setRestockAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
  }, []);

  const placeOrder = useCallback(
    (customer: string) => {
      if (cart.length === 0) return;
      const newOrder: Order = {
        id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
        customer,
        items: cart.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          qty: i.qty,
        })),
        total: cartTotal,
        status: "preparing",
        date: new Date().toISOString().split("T")[0],
      };
      setOrders((prev) => [newOrder, ...prev]);
      clearCart();
    },
    [cart, cartTotal, orders.length, clearCart]
  );

  return (
    <StoreContext.Provider
      value={{
        cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount,
        restockAlerts, addRestockAlert, resolveAlert,
        orders, placeOrder,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
