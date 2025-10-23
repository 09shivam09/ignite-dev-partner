import { Search, MapPin, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CategoryGrid } from "@/components/CategoryGrid";
import { BottomNavigation } from "@/components/BottomNavigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2 flex-1">
            <MapPin className="h-5 w-5 text-accent" />
            <span className="text-sm text-foreground">New York, NY</span>
          </div>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Bell className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search vendors, services..."
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main>
        <section className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Plan Your Perfect Event
          </h2>
          <p className="text-muted-foreground mb-6">
            Browse categories and discover top-rated vendors in your area
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-foreground px-6 mb-2">
            Service Categories
          </h3>
          <CategoryGrid />
        </section>

        <section className="px-6 mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Featured Vendors
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-lg border border-border overflow-hidden"
              >
                <div className="h-40 bg-muted"></div>
                <div className="p-4">
                  <h4 className="font-semibold text-foreground mb-1">
                    Premium Vendor {i}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Top-rated service provider
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-accent font-medium">⭐ 4.9</span>
                    <span className="text-sm text-muted-foreground">
                      Starting at $500
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Index;
