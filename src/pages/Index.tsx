import { useState } from "react";
import { getProducts, type Product } from "@/data/store";
import { ProductCard } from "@/components/ProductCard";
import { CartPanel } from "@/components/CartPanel";
import { Header } from "@/components/Header";
import { AIChatAssistant } from "@/components/AIChatAssistant";
import { Search, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const categories = ["All", "Fruits & Vegetables", "Dairy", "Grains & Staples", "Bakery", "Meat & Poultry", "Pantry"];

const Index = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const products = getProducts();

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="border-b bg-fresh">
        <div className="container py-12 md:py-16">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-primary/10 text-primary border-0 font-medium">
              <Leaf className="mr-1 h-3 w-3" /> Local & Fresh
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Your Neighbourhood
              <br />
              <span className="text-primary">Grocery Store</span>
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Fresh produce, fair prices, zero aggregator fees. Ask our AI assistant for help!
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Main content */}
          <div>
            {/* Search + filters */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product grid */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No products found. Try a different search term.
              </div>
            )}
          </div>

          {/* Sidebar cart */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <CartPanel />
            </div>
          </aside>
        </div>
      </div>

      <AIChatAssistant />
    </div>
  );
};

export default Index;
