import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/context/StoreContext";
import { checkInventory, getOrderById, searchProducts } from "@/data/store";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type PendingAction =
  | { type: "waitlist_prompt"; productId: string; productName: string }
  | { type: "waitlist_name_prompt"; productId: string; productName: string }
  | null;

export function AIChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'm your ShelfSmart AI assistant. I can help you:\n\n• **Check availability** — \"Do you have sourdough?\"\n• **Add to cart** — \"Add 2kg of rice to my cart\"\n• **Track orders** — \"Where is ORD-002?\"\n\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [knownUserName, setKnownUserName] = useState<string | null>(null);
  const [notificationsShown, setNotificationsShown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addToCart, addRestockAlert, addToWaitlist, notifications, markNotificationRead } = useStore();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Show notifications when chat opens
  useEffect(() => {
    if (!open || !knownUserName || notificationsShown) return;

    const userNotifs = notifications.filter(
      (n) => n.userName.toLowerCase() === knownUserName.toLowerCase() && !n.read
    );

    if (userNotifs.length > 0) {
      const notifMessages: Message[] = userNotifs.map((n) => ({
        id: `notif-${n.id}`,
        role: "assistant" as const,
        content: `🔔 **Notification:** ${n.message}`,
      }));
      setMessages((prev) => [...prev, ...notifMessages]);
      userNotifs.forEach((n) => markNotificationRead(n.id));
      setNotificationsShown(true);
    }
  }, [open, knownUserName, notifications, notificationsShown, markNotificationRead]);

  // Reset notification shown flag when new notifications arrive
  useEffect(() => {
    if (knownUserName) {
      const hasUnread = notifications.some(
        (n) => n.userName.toLowerCase() === knownUserName.toLowerCase() && !n.read
      );
      if (hasUnread) setNotificationsShown(false);
    }
  }, [notifications, knownUserName]);

  const processMessage = useCallback(
    (text: string): string => {
      const lower = text.toLowerCase().trim();

      // Handle pending actions (conversation state machine)
      if (pendingAction) {
        if (pendingAction.type === "waitlist_prompt") {
          // User is responding to "Would you like to be notified?"
          const affirmative = /^(yes|yeah|yep|sure|ok|okay|notify me|please|yea|y|absolutely|definitely)/.test(lower);
          const negative = /^(no|nah|nope|n|never mind|skip|cancel)/.test(lower);

          if (affirmative) {
            if (knownUserName) {
              // Already know the name, add directly
              addToWaitlist(pendingAction.productId, pendingAction.productName, knownUserName);
              const productName = pendingAction.productName;
              setPendingAction(null);
              return `Got it, **${knownUserName}**! 🔔 You'll be notified when **${productName}** is back in stock.\n\nIs there anything else I can help you with?`;
            }
            const saved = { ...pendingAction };
            setPendingAction({ type: "waitlist_name_prompt", productId: saved.productId, productName: saved.productName });
            return "Sure! What's your name so we can notify you when it's back in stock?";
          }

          if (negative) {
            setPendingAction(null);
            return "No problem! Let me know if you need anything else. 😊";
          }

          // Not a clear yes/no — treat as a new query, clear pending
          setPendingAction(null);
          // Fall through to normal processing
        }

        if (pendingAction.type === "waitlist_name_prompt") {
          // User is providing their name
          const userName = text.trim();
          if (userName.length < 1 || userName.length > 50) {
            return "Please provide a valid name so we can notify you.";
          }
          addToWaitlist(pendingAction.productId, pendingAction.productName, userName);
          setKnownUserName(userName);
          const productName = pendingAction.productName;
          setPendingAction(null);
          return `Got it, **${userName}**! 🔔 We'll notify you as soon as **${productName}** is back in stock.\n\nIs there anything else I can help you with?`;
        }
      }

      // Intent 3: Order Tracking
      const orderMatch = lower.match(/ord-?\d{3}/i);
      if (orderMatch) {
        const order = getOrderById(orderMatch[0].toUpperCase());
        if (order) {
          return `📦 **Order ${order.id}**\n\n• **Customer:** ${order.customer}\n• **Status:** ${order.status.replace(/-/g, " ")}\n• **Items:** ${order.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}\n• **Total:** ₹${order.total}\n• **Date:** ${order.date}`;
        }
        return `I couldn't find an order with that ID. Please check the order number and try again.`;
      }

      // Intent 1: Smart Ordering (add to cart)
      const addMatch = lower.match(/add\s+(\d+)\s*(?:kg|kgs|pcs?|pieces?|packs?|bottles?|loaf|loaves|dozen|cups?|litres?|bunch|jar|jars)?\s*(?:of\s+)?(.+?)(?:\s+to\s+(?:my\s+)?cart)?$/i);
      if (addMatch) {
        const qty = parseInt(addMatch[1]);
        const itemName = addMatch[2].trim();
        const result = checkInventory(itemName);

        if (!result.found || !result.product) {
          return `I couldn't find "${itemName}" in our catalog. Try browsing our products or ask me about specific items!`;
        }

        if (result.product.stock <= 0) {
          addRestockAlert(result.product.id, result.product.name, "AI Chat Customer", qty);
          setPendingAction({ type: "waitlist_prompt", productId: result.product.id, productName: result.product.name });
          return `😔 Sorry, **${result.product.name}** is currently **out of stock**.\n\nI've notified the store owner to restock it. Would you like to be notified when it's back?`;
        }

        if (qty > result.product.stock) {
          return `We only have **${result.product.stock} ${result.product.unit}(s)** of ${result.product.name} in stock. Would you like me to add ${result.product.stock} instead?`;
        }

        addToCart(result.product, qty);
        return `✅ Added **${qty} ${result.product.unit}(s) of ${result.product.name}** to your cart!\n\n💰 Price: ₹${result.product.price * qty} (₹${result.product.price}/${result.product.unit})`;
      }

      // Intent 2: Inventory Inquiry
      const inquiryPatterns = [
        /(?:do you have|is there|got any|have any|stock of|availability of|check)\s+(.+?)(?:\s+today|\s+available|\s+in stock|\?|$)/i,
        /(?:how much|how many)\s+(.+?)(?:\s+do you have|\s+left|\s+in stock|\?|$)/i,
      ];

      for (const pattern of inquiryPatterns) {
        const match = lower.match(pattern);
        if (match) {
          const itemName = match[1].replace(/\?/g, "").trim();
          const result = checkInventory(itemName);

          if (!result.found || !result.product) {
            const suggestions = searchProducts(itemName);
            if (suggestions.length > 0) {
              return `I couldn't find an exact match for "${itemName}", but here are some similar items:\n\n${suggestions.slice(0, 3).map((p) => `• **${p.name}** — ₹${p.price}/${p.unit} (${p.stock > 0 ? `${p.stock} in stock` : "out of stock"})`).join("\n")}`;
            }
            return `I couldn't find "${itemName}" in our catalog. Would you like to browse our products?`;
          }

          if (result.product.stock <= 0) {
            addRestockAlert(result.product.id, result.product.name, "AI Chat Customer");
            setPendingAction({ type: "waitlist_prompt", productId: result.product.id, productName: result.product.name });
            return `😔 **${result.product.name}** is currently **out of stock**.\n\nI've generated a restock alert for the store owner. Would you like to be notified when it's available again?`;
          }

          return `✅ Yes! **${result.product.name}** is in stock.\n\n• **Price:** ₹${result.product.price}/${result.product.unit}\n• **Available:** ${result.product.stock} ${result.product.unit}(s)\n\nWould you like me to add some to your cart?`;
        }
      }

      // Fallback
      if (lower.includes("help") || lower.includes("what can you do")) {
        return "I can help you with:\n\n1. 🔍 **Check stock** — \"Do you have milk?\"\n2. 🛒 **Add to cart** — \"Add 3 packs of pasta\"\n3. 📦 **Track orders** — \"Status of ORD-001\"\n\nJust type naturally and I'll understand!";
      }

      return `I'm not sure I understood that. Try asking me:\n\n• "Do you have [item]?"\n• "Add [qty] of [item] to my cart"\n• "Track order ORD-001"\n\nOr type **help** for more info!`;
    },
    [addToCart, addRestockAlert, addToWaitlist, pendingAction, knownUserName]
  );

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    setTimeout(() => {
      const reply = processMessage(currentInput);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: reply },
      ]);
    }, 500);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border bg-card shadow-2xl animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-xl bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary-foreground" />
              <div>
                <h3 className="text-sm font-semibold text-primary-foreground">AI Shop Assistant</h3>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-[10px] text-primary-foreground/80">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary-foreground/15 text-primary-foreground text-[10px] border-0">
                <Zap className="mr-0.5 h-3 w-3" /> Agentforce
              </Badge>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "400px", minHeight: "300px" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-fresh text-fresh-foreground"
                  }`}
                >
                  {msg.content.split("\n").map((line, i) => (
                    <span key={i}>
                      {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <strong key={j}>{part.slice(2, -2)}</strong>
                        ) : (
                          part
                        )
                      )}
                      {i < msg.content.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 text-sm"
              />
              <Button type="submit" size="sm" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              Powered by <strong>Agentforce</strong> ⚡
            </p>
          </div>
        </div>
      )}
    </>
  );
}
