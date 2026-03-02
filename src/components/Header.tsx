import { ShoppingCart, Leaf, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "@/context/StoreContext";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

export function Header() {
  const { cartCount, notifications, markNotificationRead } = useStore();
  const location = useLocation();
  const isOwner = location.pathname === "/dashboard";

  const unreadNotifs = notifications.filter((n) => !n.read);

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

          {/* Notification Bell */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative">
                <Bell className="h-5 w-5 text-foreground" />
                {unreadNotifs.length > 0 && (
                  <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive p-0 text-[10px] text-destructive-foreground">
                    {unreadNotifs.length}
                  </Badge>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <h4 className="mb-2 text-sm font-semibold text-foreground">Notifications</h4>
              {notifications.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No notifications yet</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={`rounded-md border p-2 text-xs cursor-pointer transition-colors ${
                        notif.read ? "bg-muted/50 opacity-60" : "bg-accent/10 border-accent/30"
                      }`}
                      onClick={() => !notif.read && markNotificationRead(notif.id)}
                    >
                      <p className="font-medium text-foreground">🔔 {notif.productName} is back!</p>
                      <p className="text-muted-foreground mt-0.5">For: {notif.userName}</p>
                    </div>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

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
