import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Calculator, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BudgetBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export const BudgetPlanner = () => {
  const [eventType, setEventType] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [budget, setBudget] = useState("");
  const [breakdown, setBreakdown] = useState<BudgetBreakdown[]>([]);
  const [open, setOpen] = useState(false);

  const calculateBudget = () => {
    if (!eventType || !guestCount || !budget) return;

    const totalBudget = parseFloat(budget);
    
    // Budget allocation based on event type
    const allocations: { [key: string]: { [category: string]: number } } = {
      wedding: {
        "Venue": 30,
        "Catering": 25,
        "Photography": 15,
        "Decoration": 15,
        "Entertainment": 10,
        "Others": 5,
      },
      birthday: {
        "Venue": 25,
        "Catering": 30,
        "Decoration": 20,
        "Entertainment": 15,
        "Photography": 5,
        "Others": 5,
      },
      corporate: {
        "Venue": 35,
        "Catering": 25,
        "Technology": 15,
        "Decoration": 10,
        "Photography": 10,
        "Others": 5,
      },
    };

    const allocation = allocations[eventType] || allocations.wedding;
    
    const calculatedBreakdown = Object.entries(allocation).map(([category, percentage]) => ({
      category,
      amount: (totalBudget * percentage) / 100,
      percentage,
    }));

    setBreakdown(calculatedBreakdown);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="h-4 w-4" />
          Budget Planner
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Event Budget Planner
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Input Form */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="corporate">Corporate Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestCount">Number of Guests</Label>
              <Input
                id="guestCount"
                type="number"
                placeholder="e.g., 100"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Total Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="e.g., 500000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            <Button onClick={calculateBudget} className="w-full">
              Calculate Budget Breakdown
            </Button>
          </div>

          {/* Budget Breakdown */}
          {breakdown.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Recommended Budget Allocation</h3>
              <div className="space-y-3">
                {breakdown.map((item) => (
                  <Card key={item.category} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold text-primary">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </Card>
                ))}
              </div>

              <div className="glass p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Total Budget</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{parseFloat(budget).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  For {guestCount} guests at your {eventType}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
