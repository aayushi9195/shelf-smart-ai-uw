import { ShoppingCart, Leaf } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "@/context/StoreContext";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { cartCount } = useStore();
  const location = useLocation();
  const isOwner = location.pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            ShelfSmart<span className="text-primary"> AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              !isOwner ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Shop
          </Link>
          <Link
            to="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isOwner ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Owner Dashboard
          </Link>
          {!isOwner && (
            <Link to="/" className="relative">
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {cartCount > 0 && (
                <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent p-0 text-[10px] text-accent-foreground">
                  {cartCount}
                </Badge>
              )}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
