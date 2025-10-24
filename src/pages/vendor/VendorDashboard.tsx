import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Calendar, Star, TrendingUp, Package, MessageSquare } from "lucide-react";

const VendorDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { label: "Today's Revenue", value: "$1,245", icon: DollarSign, trend: "+12%" },
    { label: "Pending Orders", value: "8", icon: Calendar, trend: "+3" },
    { label: "Average Rating", value: "4.8", icon: Star, trend: "0.2" },
    { label: "Total Bookings", value: "142", icon: TrendingUp, trend: "+18%" },
  ];

  const recentOrders = [
    { id: "1", customer: "Sarah Johnson", service: "Wedding Photography", amount: "$2,500", status: "pending" },
    { id: "2", customer: "Michael Chen", service: "Birthday Catering", amount: "$850", status: "accepted" },
    { id: "3", customer: "Emma Davis", service: "Corporate Event", amount: "$1,200", status: "pending" },
  ];

  const recentReviews = [
    { customer: "John Smith", rating: 5, comment: "Excellent service! Highly recommended.", date: "2 days ago" },
    { customer: "Lisa Anderson", rating: 4, comment: "Great quality, very professional.", date: "5 days ago" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-6">
        <h1 className="text-2xl font-bold text-white mb-1">Vendor Dashboard</h1>
        <p className="text-white/80">Welcome back! Here's your business overview</p>
      </div>

      {/* Stats Grid */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Icon className="h-5 w-5 text-accent" />
                  <span className="text-xs text-success font-medium">{stat.trend}</span>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => navigate("/vendor/orders")} variant="outline" className="h-auto py-3 flex-col">
              <Calendar className="h-5 w-5 mb-1" />
              <span className="text-xs">Manage Orders</span>
            </Button>
            <Button onClick={() => navigate("/vendor/services")} variant="outline" className="h-auto py-3 flex-col">
              <Package className="h-5 w-5 mb-1" />
              <span className="text-xs">My Services</span>
            </Button>
            <Button onClick={() => navigate("/chat")} variant="outline" className="h-auto py-3 flex-col">
              <MessageSquare className="h-5 w-5 mb-1" />
              <span className="text-xs">Messages</span>
            </Button>
            <Button onClick={() => navigate("/vendor/analytics")} variant="outline" className="h-auto py-3 flex-col">
              <TrendingUp className="h-5 w-5 mb-1" />
              <span className="text-xs">Analytics</span>
            </Button>
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Orders</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/vendor/orders")}>View All</Button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-card-foreground/5 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{order.customer}</div>
                  <div className="text-xs text-muted-foreground">{order.service}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{order.amount}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === "pending" ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Reviews */}
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Recent Reviews</h2>
          <div className="space-y-3">
            {recentReviews.map((review, index) => (
              <div key={index} className="p-3 bg-card-foreground/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{review.customer}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm">{review.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{review.comment}</p>
                <span className="text-xs text-muted-foreground">{review.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default VendorDashboard;
