import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export function CartPanel() {
  const { cart, removeFromCart, cartTotal, placeOrder } = useStore();

  if (cart.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">Your cart is empty</p>
        <p className="text-xs text-muted-foreground">Try asking the AI assistant to add items!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 font-semibold text-card-foreground">Your Cart</h3>
      <div className="space-y-2">
        {cart.map((item) => (
          <div key={item.product.id} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{item.product.name}</span>
              <span className="text-muted-foreground"> × {item.qty}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">₹{item.product.price * item.qty}</span>
              <button
                onClick={() => removeFromCart(item.product.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t pt-3">
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-primary">₹{cartTotal}</span>
        </div>
        <Button
          className="mt-3 w-full"
          onClick={() => {
            placeOrder("Guest Customer");
            toast.success("Order placed successfully!");
          }}
        >
          Place Order
        </Button>
      </div>
    </div>
  );
}
