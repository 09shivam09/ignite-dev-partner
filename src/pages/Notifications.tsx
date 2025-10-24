import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Star, MessageCircle, Tag, Trash2 } from "lucide-react";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([
    { 
      id: "1", 
      type: "booking", 
      title: "Booking Confirmed", 
      message: "Your booking with Elite Photography has been confirmed for March 15th", 
      timestamp: "2 hours ago",
      read: false,
      icon: Calendar
    },
    { 
      id: "2", 
      type: "review", 
      title: "New Review", 
      message: "You received a 5-star review from Sarah Johnson", 
      timestamp: "5 hours ago",
      read: false,
      icon: Star
    },
    { 
      id: "3", 
      type: "message", 
      title: "New Message", 
      message: "Gourmet Catering Co. sent you a message", 
      timestamp: "1 day ago",
      read: true,
      icon: MessageCircle
    },
    { 
      id: "4", 
      type: "promotion", 
      title: "Special Offer", 
      message: "20% off on all catering services this weekend!", 
      timestamp: "2 days ago",
      read: true,
      icon: Tag
    },
  ]);

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const renderNotification = (notification: typeof notifications[0]) => {
    const Icon = notification.icon;
    return (
      <Card 
        key={notification.id} 
        className={`p-4 ${!notification.read ? "bg-accent/5 border-accent/20" : ""}`}
        onClick={() => handleMarkAsRead(notification.id)}
      >
        <div className="flex gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            notification.type === "booking" ? "bg-success/20" :
            notification.type === "review" ? "bg-warning/20" :
            notification.type === "message" ? "bg-accent/20" :
            "bg-primary/20"
          }`}>
            <Icon className={`h-5 w-5 ${
              notification.type === "booking" ? "text-success" :
              notification.type === "review" ? "text-warning" :
              notification.type === "message" ? "text-accent" :
              "text-primary"
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-sm">{notification.title}</h3>
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-accent flex-shrink-0 ml-2 mt-1" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
            <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(notification.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </Card>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
          >
            Mark all read
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="booking">Bookings</TabsTrigger>
            <TabsTrigger value="message">Messages</TabsTrigger>
            <TabsTrigger value="promotion">Offers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4 space-y-3">
            {notifications.map(renderNotification)}
          </TabsContent>
          
          <TabsContent value="booking" className="mt-4 space-y-3">
            {notifications.filter(n => n.type === "booking").map(renderNotification)}
          </TabsContent>
          
          <TabsContent value="message" className="mt-4 space-y-3">
            {notifications.filter(n => n.type === "message").map(renderNotification)}
          </TabsContent>
          
          <TabsContent value="promotion" className="mt-4 space-y-3">
            {notifications.filter(n => n.type === "promotion").map(renderNotification)}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Notifications;
