import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Trash2, Tag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const mockCartItems = [
  {
    id: "1",
    vendorId: "1",
    vendorName: "Elite Catering Co",
    serviceName: "Premium Package",
    price: 1000,
    quantity: 1,
    date: new Date("2025-11-15"),
    timeSlot: "evening",
  },
  {
    id: "2",
    vendorId: "2",
    vendorName: "Perfect Moments Photo",
    serviceName: "Basic Package",
    price: 500,
    quantity: 1,
    date: new Date("2025-11-15"),
    timeSlot: "afternoon",
  },
];

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState(mockCartItems);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax - discount;

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    toast({
      title: "Item removed",
      description: "Service has been removed from cart",
    });
  };

  const handleApplyCoupon = () => {
    if (couponCode === "EVENT10") {
      setDiscount(subtotal * 0.1);
      toast({
        title: "Coupon applied!",
        description: "You saved 10% on your order",
      });
    } else {
      toast({
        title: "Invalid coupon",
        description: "Please check your coupon code",
        variant: "destructive",
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="flex items-center p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold text-foreground ml-2">Cart</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some services to get started</p>
          <Button onClick={() => navigate("/")}>Browse Services</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-foreground ml-2">
            Cart ({items.length})
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-lg p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{item.vendorName}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.serviceName}</p>
                {item.date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.date.toLocaleDateString()} • {item.timeSlot}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(item.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                >
                  -
                </Button>
                <span className="font-medium text-foreground">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                >
                  +
                </Button>
              </div>
              <span className="font-bold text-foreground">
                ${item.price * item.quantity}
              </span>
            </div>
          </div>
        ))}

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleApplyCoupon} variant="outline">
              Apply
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">${subtotal}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-success">Discount</span>
              <span className="text-success">-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (10%)</span>
            <span className="text-foreground">${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-foreground text-xl">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => navigate("/payment")}
        >
          Continue Shopping
        </Button>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted-foreground">Total Amount</span>
          <span className="text-2xl font-bold text-foreground">
            ${total.toFixed(2)}
          </span>
        </div>
        <Button size="lg" className="w-full" onClick={() => navigate("/payment")}>
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
};

export default Cart;
