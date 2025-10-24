import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, DollarSign, Calendar, Star } from "lucide-react";

const VendorAnalytics = () => {
  const navigate = useNavigate();

  const monthlyRevenue = [
    { month: "Jan", revenue: 12500 },
    { month: "Feb", revenue: 15200 },
    { month: "Mar", revenue: 18900 },
  ];

  const topServices = [
    { name: "Wedding Photography", bookings: 45, revenue: "$112,500" },
    { name: "Birthday Catering", bookings: 32, revenue: "$27,200" },
    { name: "Corporate Events", bookings: 28, revenue: "$33,600" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Business Analytics</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Revenue Overview */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-accent" />
            <h2 className="font-semibold">Revenue Overview</h2>
          </div>
          <div className="space-y-3">
            {monthlyRevenue.map((item) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.month}</span>
                <div className="flex items-center gap-3 flex-1 mx-4">
                  <div className="flex-1 bg-card-foreground/10 rounded-full h-2">
                    <div
                      className="bg-accent rounded-full h-2"
                      style={{ width: `${(item.revenue / 20000) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">${item.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total (Q1)</span>
            <span className="text-lg font-bold text-accent">$46,600</span>
          </div>
        </Card>

        {/* Booking Trends */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-success" />
            <h2 className="font-semibold">Booking Trends</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-card-foreground/5 rounded-lg">
              <div className="text-2xl font-bold mb-1">142</div>
              <div className="text-xs text-muted-foreground">Total Bookings</div>
              <div className="text-xs text-success mt-1">+18% this month</div>
            </div>
            <div className="p-3 bg-card-foreground/5 rounded-lg">
              <div className="text-2xl font-bold mb-1">12</div>
              <div className="text-xs text-muted-foreground">Avg per Week</div>
              <div className="text-xs text-success mt-1">+2 from last week</div>
            </div>
          </div>
        </Card>

        {/* Top Services */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-warning" />
            <h2 className="font-semibold">Top Services</h2>
          </div>
          <div className="space-y-3">
            {topServices.map((service, index) => (
              <div key={service.name} className="flex items-center gap-3 p-3 bg-card-foreground/5 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-xs text-muted-foreground">{service.bookings} bookings</div>
                </div>
                <div className="font-semibold text-accent">{service.revenue}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Customer Satisfaction */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-warning" />
            <h2 className="font-semibold">Customer Satisfaction</h2>
          </div>
          <div className="text-center py-4">
            <div className="text-5xl font-bold mb-2">4.8</div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 fill-warning text-warning" />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">Based on 127 reviews</div>
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default VendorAnalytics;
