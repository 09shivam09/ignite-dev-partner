import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, CreditCard, Wallet, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Payment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [processing, setProcessing] = useState(false);

  const orderTotal = 1650.00;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      navigate("/booking-confirmation");
      toast({
        title: "Payment successful!",
        description: "Your booking has been confirmed",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cart")}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-foreground ml-2">Payment</h1>
        </div>
      </header>

      <form onSubmit={handlePayment} className="p-4 space-y-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-4">Select Payment Method</h3>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg mb-3">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer flex-1">
                <CreditCard className="h-5 w-5" />
                <span>Credit/Debit Card</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg mb-3">
              <RadioGroupItem value="wallet" id="wallet" />
              <Label htmlFor="wallet" className="flex items-center space-x-2 cursor-pointer flex-1">
                <Wallet className="h-5 w-5" />
                <span>Digital Wallet</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <RadioGroupItem value="upi" id="upi" />
              <Label htmlFor="upi" className="flex items-center space-x-2 cursor-pointer flex-1">
                <Smartphone className="h-5 w-5" />
                <span>UPI</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {paymentMethod === "card" && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-foreground mb-4">Card Details</h3>
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input id="expiry" placeholder="MM/YY" maxLength={5} required />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" placeholder="123" maxLength={3} required />
              </div>
            </div>
            <div>
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input id="cardName" placeholder="Name on card" required />
            </div>
          </div>
        )}

        {paymentMethod === "wallet" && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-foreground mb-4">Choose Wallet</h3>
            <Button type="button" variant="outline" className="w-full justify-start">
              PayPal
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start">
              Google Pay
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start">
              Apple Pay
            </Button>
          </div>
        )}

        {paymentMethod === "upi" && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-4">UPI ID</h3>
            <Input placeholder="username@upi" required />
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-4">Billing Address</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" placeholder="123 Main St" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="New York" required />
              </div>
              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" placeholder="10001" required />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">$1,500.00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="text-foreground">$150.00</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-foreground text-xl">
              ${orderTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-start space-x-2 text-xs text-muted-foreground">
          <input type="checkbox" required className="mt-1" />
          <span>
            By proceeding, I agree to the Terms of Service and Privacy Policy
          </span>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={processing}
          onClick={handlePayment}
        >
          {processing ? "Processing..." : `Pay $${orderTotal.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
};

export default Payment;
