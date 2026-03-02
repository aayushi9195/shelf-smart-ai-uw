import mockData from "@/data/mockData.json";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  image: string;
  description: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
}

export interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  total: number;
  status: string;
  date: string;
}

export interface RestockAlert {
  id: string;
  productId: string;
  productName: string;
  requestedBy: string;
  requestedQty: number;
  timestamp: string;
  resolved: boolean;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface WaitlistEntry {
  id: string;
  productId: string;
  productName: string;
  userName: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userName: string;
  productName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Mutable products array for in-memory stock updates
let productsData: Product[] = [...(mockData.products as Product[])];

export function checkInventory(itemName: string): { found: boolean; product?: Product } {
  const product = productsData.find(
    (p) => p.name.toLowerCase().includes(itemName.toLowerCase())
  );
  if (product) return { found: true, product };
  return { found: false };
}

export function getProducts(): Product[] {
  return productsData;
}

export function updateProductStock(productId: string, newStock: number) {
  productsData = productsData.map((p) =>
    p.id === productId ? { ...p, stock: newStock } : p
  );
}

export function getOrders(): Order[] {
  return mockData.orders as Order[];
}

export function getOrderById(orderId: string): Order | undefined {
  return (mockData.orders as Order[]).find(
    (o) => o.id.toLowerCase() === orderId.toLowerCase()
  );
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return productsData.filter(
    (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
}
