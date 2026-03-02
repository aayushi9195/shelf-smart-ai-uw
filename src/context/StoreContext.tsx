import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { CartItem, Product, RestockAlert, Order, WaitlistEntry, Notification } from "@/data/store";
import { getOrders, updateProductStock } from "@/data/store";

interface StoreContextType {
  cart: CartItem[];
  addToCart: (product: Product, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  restockAlerts: RestockAlert[];
  addRestockAlert: (productId: string, productName: string, requestedBy: string, requestedQty?: number) => void;
  resolveAlert: (alertId: string) => void;
  orders: Order[];
  placeOrder: (customer: string) => void;
  waitlist: WaitlistEntry[];
  addToWaitlist: (productId: string, productName: string, userName: string) => void;
  notifications: Notification[];
  addNotification: (userName: string, productName: string, message: string) => void;
  markNotificationRead: (notificationId: string) => void;
  restockProduct: (productId: string, qty: number) => number;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restockAlerts, setRestockAlerts] = useState<RestockAlert[]>([]);
  const [orders, setOrders] = useState<Order[]>(getOrders());
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
    (productId: string, productName: string, requestedBy: string, requestedQty: number = 1) => {
      const alert: RestockAlert = {
        id: `RSA-${Date.now()}`,
        productId,
        productName,
        requestedBy,
        requestedQty,
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

  const addToWaitlist = useCallback(
    (productId: string, productName: string, userName: string) => {
      const entry: WaitlistEntry = {
        id: `WL-${Date.now()}`,
        productId,
        productName,
        userName,
        timestamp: new Date().toISOString(),
      };
      setWaitlist((prev) => [entry, ...prev]);
    },
    []
  );

  const addNotification = useCallback(
    (userName: string, productName: string, message: string) => {
      const notif: Notification = {
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userName,
        productName,
        message,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    },
    []
  );

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const restockProduct = useCallback(
    (productId: string, qty: number): number => {
      // Update product stock in memory
      updateProductStock(productId, qty);

      // Resolve all unresolved alerts for this product
      setRestockAlerts((prev) =>
        prev.map((a) =>
          a.productId === productId && !a.resolved ? { ...a, resolved: true } : a
        )
      );

      // Find waitlisted users for this product and notify them
      let notifiedCount = 0;
      setWaitlist((prev) => {
        const waiting = prev.filter((w) => w.productId === productId);
        notifiedCount = waiting.length;

        // Generate notifications for each waiting user
        waiting.forEach((w) => {
          const notif: Notification = {
            id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userName: w.userName,
            productName: w.productName,
            message: `Great news! ${w.productName} is back in stock. Would you like to add some to your cart?`,
            timestamp: new Date().toISOString(),
            read: false,
          };
          setNotifications((n) => [notif, ...n]);
        });

        // Remove fulfilled waitlist entries
        return prev.filter((w) => w.productId !== productId);
      });

      return notifiedCount;
    },
    []
  );

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
        waitlist, addToWaitlist,
        notifications, addNotification, markNotificationRead,
        restockProduct,
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
