import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { getProducts } from "@/data/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, CheckCircle2, Bell, Users, PackagePlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SourcingAlertsPanel() {
  const { restockAlerts, waitlist, restockProduct } = useStore();
  const { toast } = useToast();
  const [restockQtys, setRestockQtys] = useState<Record<string, string>>({});
  const products = getProducts();

  const unresolvedAlerts = restockAlerts.filter((a) => !a.resolved);

  // Group alerts by productId to aggregate demand
  const alertsByProduct = unresolvedAlerts.reduce<
    Record<string, { productId: string; productName: string; totalQty: number; alertIds: string[]; waitingUsers: string[] }>
  >((acc, alert) => {
    if (!acc[alert.productId]) {
      const waitingForProduct = waitlist.filter((w) => w.productId === alert.productId);
      acc[alert.productId] = {
        productId: alert.productId,
        productName: alert.productName,
        totalQty: 0,
        alertIds: [],
        waitingUsers: waitingForProduct.map((w) => w.userName),
      };
    }
    acc[alert.productId].totalQty += alert.requestedQty;
    acc[alert.productId].alertIds.push(alert.id);
    return acc;
  }, {});

  const aggregatedAlerts = Object.values(alertsByProduct);

  const handleRestock = (productId: string, productName: string) => {
    const qty = parseInt(restockQtys[productId] || "0");
    if (qty <= 0) {
      toast({ title: "Enter a valid quantity", variant: "destructive" });
      return;
    }
    const notifiedCount = restockProduct(productId, qty);
    setRestockQtys((prev) => ({ ...prev, [productId]: "" }));
    toast({
      title: `✅ ${productName} restocked!`,
      description: notifiedCount > 0
        ? `${notifiedCount} customer${notifiedCount > 1 ? "s" : ""} have been notified.`
        : "Stock updated successfully.",
    });
  };

  // Also show resolved alerts
  const resolvedAlerts = restockAlerts.filter((a) => a.resolved);

  return (
    <aside>
      <div className="sticky top-20 rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b p-4">
          <Bell className="h-5 w-5 text-destructive" />
          <h2 className="font-semibold text-card-foreground">Sourcing Alerts</h2>
          {unresolvedAlerts.length > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              {unresolvedAlerts.length}
            </Badge>
          )}
        </div>
        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {restockAlerts.length === 0 ? (
            <div className="py-8 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">No sourcing alerts yet</p>
              <p className="text-xs text-muted-foreground">Alerts appear when customers ask for out-of-stock items via AI chat</p>
            </div>
          ) : (
            <>
              {/* Aggregated unresolved alerts */}
              {aggregatedAlerts.map((group) => {
                const product = products.find((p) => p.id === group.productId);
                const emoji = product?.image || "📦";
                return (
                  <div
                    key={group.productId}
                    className="rounded-lg border bg-destructive/5 border-destructive/20 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          <span className="mr-1.5">{emoji}</span>
                          {group.productName}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {group.waitingUsers.length} waiting
                          </span>
                          <span>•</span>
                          <span>~{group.totalQty} {product?.unit || "unit"}(s) requested</span>
                        </div>
                      </div>
                    </div>

                    {/* Waiting users */}
                    {group.waitingUsers.length > 0 && (
                      <div className="rounded bg-muted/50 px-2 py-1.5">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Waiting customers</p>
                        <div className="flex flex-wrap gap-1">
                          {group.waitingUsers.map((name, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] h-5">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Restock action */}
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={restockQtys[group.productId] || ""}
                        onChange={(e) =>
                          setRestockQtys((prev) => ({ ...prev, [group.productId]: e.target.value }))
                        }
                        className="h-8 w-20 text-xs"
                      />
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={() => handleRestock(group.productId, group.productName)}
                      >
                        <PackagePlus className="h-3.5 w-3.5" />
                        Restock
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Resolved alerts */}
              {resolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border p-3 bg-muted/50 opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{alert.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested by: {alert.requestedBy}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-success/15 text-success border-success/20">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Resolved
                    </Badge>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
