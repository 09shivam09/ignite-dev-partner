import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Phone, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const VendorOrders = () => {
  const navigate = useNavigate();
  const [orders] = useState([
    { id: "1", customer: "Sarah Johnson", service: "Wedding Photography", date: "2024-03-15", time: "2:00 PM", amount: "$2,500", status: "pending", phone: "+1234567890" },
    { id: "2", customer: "Michael Chen", service: "Birthday Catering", date: "2024-03-20", time: "6:00 PM", amount: "$850", status: "accepted", phone: "+1234567891" },
    { id: "3", customer: "Emma Davis", service: "Corporate Event", date: "2024-03-18", time: "10:00 AM", amount: "$1,200", status: "pending", phone: "+1234567892" },
    { id: "4", customer: "David Miller", service: "Anniversary Decor", date: "2024-02-28", time: "4:00 PM", amount: "$650", status: "completed", phone: "+1234567893" },
    { id: "5", customer: "Lisa Brown", service: "Baby Shower Catering", date: "2024-02-25", time: "12:00 PM", amount: "$450", status: "cancelled", phone: "+1234567894" },
  ]);

  const handleAccept = (orderId: string, customerName: string) => {
    toast.success(`Order from ${customerName} accepted!`);
  };

  const handleReject = (orderId: string, customerName: string) => {
    toast.error(`Order from ${customerName} rejected`);
  };

  const renderOrder = (order: typeof orders[0]) => (
    <Card key={order.id} className="p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold">{order.customer}</h3>
          <p className="text-sm text-muted-foreground">{order.service}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${
          order.status === "pending" ? "bg-warning/20 text-warning" :
          order.status === "accepted" ? "bg-success/20 text-success" :
          order.status === "completed" ? "bg-accent/20 text-accent" :
          "bg-destructive/20 text-destructive"
        }`}>
          {order.status}
        </span>
      </div>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date & Time:</span>
          <span className="font-medium">{order.date} at {order.time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount:</span>
          <span className="font-semibold text-accent">{order.amount}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {order.status === "pending" && (
          <>
            <Button onClick={() => handleAccept(order.id, order.customer)} variant="default" size="sm" className="flex-1">
              <CheckCircle className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button onClick={() => handleReject(order.id, order.customer)} variant="destructive" size="sm" className="flex-1">
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={() => navigate(`/chat/${order.id}`)}>
          <MessageSquare className="h-4 w-4 mr-1" />
          Message
        </Button>
        <Button variant="outline" size="sm">
          <Phone className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Order Management</h1>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-4">
            {orders.filter(o => o.status === "pending").map(renderOrder)}
          </TabsContent>
          
          <TabsContent value="accepted" className="mt-4">
            {orders.filter(o => o.status === "accepted").map(renderOrder)}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4">
            {orders.filter(o => o.status === "completed").map(renderOrder)}
          </TabsContent>
          
          <TabsContent value="cancelled" className="mt-4">
            {orders.filter(o => o.status === "cancelled").map(renderOrder)}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default VendorOrders;
