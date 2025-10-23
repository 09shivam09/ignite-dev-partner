import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Calendar as CalendarIcon, Minus, Plus } from "lucide-react";
import { format } from "date-fns";

const services = [
  { id: 1, name: "Basic Package", price: 500 },
  { id: 2, name: "Premium Package", price: 1000 },
  { id: 3, name: "Deluxe Package", price: 1500 },
];

const Booking = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  const [selectedService, setSelectedService] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [timeSlot, setTimeSlot] = useState("");
  const [eventDetails, setEventDetails] = useState({
    eventType: "",
    guestCount: "",
    specialRequirements: "",
  });

  const selectedServiceData = services.find((s) => s.id.toString() === selectedService);
  const subtotal = (selectedServiceData?.price || 0) * quantity;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-foreground ml-2">Book Service</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-semibold text-foreground mb-1">Elite Catering Co</h2>
          <p className="text-sm text-muted-foreground">Premium catering services</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="service">Select Service</Label>
            <Select value={selectedService} onValueChange={setSelectedService} required>
              <SelectTrigger id="service">
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} - ${service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity</Label>
            <div className="flex items-center space-x-4 mt-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold text-foreground w-12 text-center">
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Event Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal mt-2"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="timeSlot">Time Slot</Label>
            <Select value={timeSlot} onValueChange={setTimeSlot} required>
              <SelectTrigger id="timeSlot">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                <SelectItem value="evening">Evening (5 PM - 10 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="eventType">Event Type</Label>
            <Input
              id="eventType"
              placeholder="e.g., Wedding, Birthday, Corporate"
              value={eventDetails.eventType}
              onChange={(e) =>
                setEventDetails({ ...eventDetails, eventType: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="guestCount">Number of Guests</Label>
            <Input
              id="guestCount"
              type="number"
              placeholder="Expected number of guests"
              value={eventDetails.guestCount}
              onChange={(e) =>
                setEventDetails({ ...eventDetails, guestCount: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="requirements">Special Requirements</Label>
            <Textarea
              id="requirements"
              placeholder="Any specific needs or preferences..."
              value={eventDetails.specialRequirements}
              onChange={(e) =>
                setEventDetails({ ...eventDetails, specialRequirements: e.target.value })
              }
              rows={4}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-foreground mb-3">Price Breakdown</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">${subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (10%)</span>
            <span className="text-foreground">${tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-foreground text-lg">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="flex space-x-3">
          <Button type="button" variant="outline" size="lg" className="flex-1">
            Save for Later
          </Button>
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            onClick={handleSubmit}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Booking;
