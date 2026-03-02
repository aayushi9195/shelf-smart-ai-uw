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
  timestamp: string;
  resolved: boolean;
}

export interface CartItem {
  product: Product;
  qty: number;
}

// Simulated backend actions
export function checkInventory(itemName: string): { found: boolean; product?: Product } {
  const product = mockData.products.find(
    (p) => p.name.toLowerCase().includes(itemName.toLowerCase())
  );
  if (product) return { found: true, product: product as Product };
  return { found: false };
}

export function getProducts(): Product[] {
  return mockData.products as Product[];
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
  return (mockData.products as Product[]).filter(
    (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
}
