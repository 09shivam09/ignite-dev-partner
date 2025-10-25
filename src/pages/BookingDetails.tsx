import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronLeft, Calendar, Clock, MapPin, Phone, Mail, MessageCircle, Download, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showReview, setShowReview] = useState(false);

  const booking = {
    ref: "EC1234ABCD",
    status: "confirmed",
    vendorName: "Elite Catering Co",
    service: "Premium Package",
    date: "Nov 15, 2025",
    time: "5:00 PM - 10:00 PM",
    location: "123 Event Street, New York, NY",
    amount: 1000,
    tax: 100,
    total: 1100,
    eventType: "Wedding Reception",
    guestCount: "150",
    specialRequirements: "Vegetarian menu preferred",
    vendorContact: {
      phone: "+1 (555) 123-4567",
      email: "contact@elitecatering.com",
    },
  };

  const handleCancelBooking = () => {
    toast({
      title: "Booking cancelled",
      description: "Your booking has been cancelled successfully",
    });
    navigate("/bookings");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/bookings")}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Booking Details</h1>
              <p className="text-sm text-muted-foreground">Ref: {booking.ref}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            {booking.status}
          </Badge>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-semibold text-foreground mb-4">Service Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Vendor</p>
              <p className="font-medium text-foreground">{booking.vendorName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="font-medium text-foreground">{booking.service}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-semibold text-foreground mb-4">Event Details</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium text-foreground">{booking.date}</p>
                <p className="text-sm text-foreground">{booking.time}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">{booking.location}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Event Type</p>
              <p className="font-medium text-foreground">{booking.eventType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Guest Count</p>
              <p className="font-medium text-foreground">{booking.guestCount} guests</p>
            </div>
            {booking.specialRequirements && (
              <div>
                <p className="text-sm text-muted-foreground">Special Requirements</p>
                <p className="font-medium text-foreground">{booking.specialRequirements}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-semibold text-foreground mb-4">Vendor Contact</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{booking.vendorContact.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{booking.vendorContact.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-semibold text-foreground mb-4">Payment Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Amount</span>
              <span className="text-foreground">${booking.amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="text-foreground">${booking.tax}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total Paid</span>
              <span className="font-bold text-foreground text-lg">${booking.total}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate(`/chat/1`)}
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Message Vendor
          </Button>

          <Button variant="outline" size="lg" className="w-full">
            <Download className="mr-2 h-5 w-5" />
            Download Invoice
          </Button>

          {booking.status === "completed" && (
            <Button size="lg" className="w-full" onClick={() => setShowReview(true)}>
              <Star className="mr-2 h-5 w-5" />
              Rate & Review
            </Button>
          )}

          {booking.status === "confirmed" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" className="w-full">
                  Cancel Booking
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this booking? This action cannot be undone.
                    Cancellation fees may apply.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelBooking}>
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookingDetails;
