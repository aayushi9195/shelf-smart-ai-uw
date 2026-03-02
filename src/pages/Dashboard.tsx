import { Header } from "@/components/Header";
import { useStore } from "@/context/StoreContext";
import { getProducts } from "@/data/store";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Package, AlertTriangle, TrendingUp, ShoppingBag, CheckCircle2, Clock, Truck,
} from "lucide-react";
import { SourcingAlertsPanel } from "@/components/SourcingAlertsPanel";

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  preparing: { label: "Preparing", icon: Clock, className: "bg-warning/15 text-warning-foreground border-warning/30" },
  "out-for-delivery": { label: "Out for Delivery", icon: Truck, className: "bg-primary/10 text-primary border-primary/20" },
  delivered: { label: "Delivered", icon: CheckCircle2, className: "bg-success/15 text-success border-success/20" },
};

export default function Dashboard() {
  const { orders, restockAlerts } = useStore();
  const products = getProducts();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const unresolvedAlerts = restockAlerts.filter((a) => !a.resolved);

  const stats = [
    { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-primary" },
    { label: "Revenue", value: `₹${totalRevenue}`, icon: TrendingUp, color: "text-success" },
    { label: "Low Stock Items", value: lowStock.length, icon: Package, color: "text-accent" },
    { label: "Sourcing Alerts", value: unresolvedAlerts.length, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Owner Dashboard</h1>
          <p className="text-muted-foreground">Manage your store at your fingertips</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="mt-1 text-2xl font-bold text-card-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Orders + Inventory */}
          <div className="space-y-8">
            {/* Recent Orders */}
            <div className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <h2 className="font-semibold text-card-foreground">Recent Orders</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const config = statusConfig[order.status] || statusConfig.preparing;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.id}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {order.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                        </TableCell>
                        <TableCell className="font-medium">₹{order.total}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={config.className}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Inventory */}
            <div className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <h2 className="font-semibold text-card-foreground">Inventory Overview</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <span className="mr-2">{product.image}</span>
                        {product.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{product.category}</TableCell>
                      <TableCell>₹{product.price}/{product.unit}</TableCell>
                      <TableCell>{product.stock} {product.unit}s</TableCell>
                      <TableCell>
                        {product.stock === 0 ? (
                          <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                        ) : product.stock <= 10 ? (
                          <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-xs" variant="outline">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-success/15 text-success border-success/20 text-xs" variant="outline">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Sourcing Alerts Panel */}
          <SourcingAlertsPanel />
        </div>
      </div>
    </div>
  );
}
