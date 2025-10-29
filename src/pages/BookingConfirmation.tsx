import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Share2 } from "lucide-react";
import { celebrateBooking } from "@/lib/confetti";
import { motion } from "framer-motion";

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const bookingRef = "EC" + Math.random().toString(36).substring(2, 10).toUpperCase();

  useEffect(() => {
    // Celebrate successful booking with confetti
    celebrateBooking();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="mb-8"
        >
          <CheckCircle2 className="h-24 w-24 text-success mx-auto" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-foreground mb-2"
        >
          Booking Confirmed!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-8 max-w-md"
        >
          Your booking has been successfully confirmed. We've sent the details to your email.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-lg p-6 w-full max-w-md mb-8"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Booking Reference</p>
              <p className="text-xl font-bold text-foreground">{bookingRef}</p>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-foreground mb-3">Booking Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground">Nov 15, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-foreground">5:00 PM - 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Services</span>
                  <span className="text-foreground">2 vendors</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-semibold text-foreground">$1,650.00</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-foreground mb-2">Next Steps</h3>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>✓ Confirmation email sent</li>
                <li>✓ Vendors have been notified</li>
                <li>✓ Event reminders scheduled</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col space-y-3 w-full max-w-md">
          <Button
            size="lg"
            onClick={() => navigate("/bookings")}
            className="w-full"
          >
            View My Bookings
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Book More Services
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
