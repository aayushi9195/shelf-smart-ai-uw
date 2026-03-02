import type { Product } from "@/data/store";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useStore();
  const inStock = product.stock > 0;

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:shadow-lg hover:-translate-y-0.5">
      <div className="mb-3 flex h-20 items-center justify-center rounded-md bg-fresh text-4xl">
        {product.image}
      </div>

      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight text-card-foreground">
            {product.name}
          </h3>
          {!inStock && (
            <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">
              <AlertTriangle className="mr-0.5 h-3 w-3" />
              Out
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{product.description}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="font-bold text-primary">
            ₹{product.price}<span className="text-xs font-normal text-muted-foreground">/{product.unit}</span>
          </span>
          <Button
            size="sm"
            disabled={!inStock}
            onClick={() => addToCart(product, 1)}
            className="h-8 gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        {inStock && (
          <p className="text-[10px] text-muted-foreground">
            {product.stock} {product.unit}s in stock
          </p>
        )}
      </div>
    </div>
  );
}
