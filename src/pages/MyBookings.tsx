import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, MessageCircle } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ReviewSubmission } from "@/components/ReviewSubmission";

const mockBookings = {
  upcoming: [
    {
      id: "1",
      ref: "EC1234ABCD",
      vendorName: "Elite Catering Co",
      vendor: "vendor-123",
      service: "Premium Package",
      date: "Nov 15, 2025",
      time: "5:00 PM",
      status: "confirmed",
      amount: 1000,
    },
    {
      id: "2",
      ref: "EC5678EFGH",
      vendorName: "Perfect Moments Photo",
      vendor: "vendor-456",
      service: "Basic Package",
      date: "Nov 15, 2025",
      time: "3:00 PM",
      status: "confirmed",
      amount: 500,
    },
  ],
  completed: [
    {
      id: "3",
      ref: "EC9012IJKL",
      vendorName: "Grand Event Hall",
      vendor: "vendor-789",
      service: "Deluxe Venue",
      date: "Oct 5, 2025",
      time: "6:00 PM",
      status: "completed",
      amount: 1500,
    },
  ],
  cancelled: [],
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success/10 text-success border-success/20";
      case "pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "completed":
        return "bg-muted text-muted-foreground border-border";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const BookingCard = ({ booking }: { booking: any }) => (
    <div
      onClick={() => navigate(`/booking-details/${booking.id}`)}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer transition-transform hover:scale-[1.02]"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-foreground">{booking.vendorName}</h3>
          <p className="text-sm text-muted-foreground mt-1">{booking.service}</p>
        </div>
        <Badge variant="outline" className={getStatusColor(booking.status)}>
          {booking.status}
        </Badge>
      </div>

      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>{booking.date}</span>
        </div>
        <span>•</span>
        <span>{booking.time}</span>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-border">
        <span className="text-sm text-muted-foreground">Ref: {booking.ref}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">${booking.amount}</span>
          {booking.status === "completed" && (
            <ReviewSubmission 
              bookingId={booking.id} 
              vendorId={booking.vendor}
              trigger={<Button size="sm" variant="outline">Review</Button>}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-foreground mb-4">My Bookings</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by reference or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="p-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upcoming">
              Upcoming ({mockBookings.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({mockBookings.completed.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({mockBookings.cancelled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {mockBookings.upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {mockBookings.completed.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </TabsContent>

          <TabsContent value="cancelled">
            <div className="text-center py-12">
              <p className="text-muted-foreground">No cancelled bookings</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default MyBookings;
