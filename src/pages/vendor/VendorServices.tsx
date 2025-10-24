import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";

const VendorServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([
    { id: "1", name: "Wedding Photography", price: "$2,500", description: "Full day coverage with 2 photographers", availability: "Available" },
    { id: "2", name: "Birthday Catering", price: "$850", description: "Complete catering service for 50 guests", availability: "Available" },
    { id: "3", name: "Corporate Event", price: "$1,200", description: "Professional event photography", availability: "Limited" },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    description: "",
  });

  const handleAddService = () => {
    if (!newService.name || !newService.price || !newService.description) {
      toast.error("Please fill all fields");
      return;
    }
    
    const service = {
      id: String(services.length + 1),
      ...newService,
      availability: "Available",
    };
    
    setServices([...services, service]);
    setNewService({ name: "", price: "", description: "" });
    setIsAddDialogOpen(false);
    toast.success("Service added successfully!");
  };

  const handleDeleteService = (id: string, name: string) => {
    setServices(services.filter(s => s.id !== id));
    toast.success(`${name} deleted`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">My Services</h1>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="serviceName">Service Name</Label>
                  <Input
                    id="serviceName"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="e.g., Wedding Photography"
                  />
                </div>
                <div>
                  <Label htmlFor="servicePrice">Price</Label>
                  <Input
                    id="servicePrice"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    placeholder="e.g., $2,500"
                  />
                </div>
                <div>
                  <Label htmlFor="serviceDescription">Description</Label>
                  <Textarea
                    id="serviceDescription"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Describe your service..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleAddService} className="w-full">
                  Add Service
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Services List */}
      <div className="p-4 space-y-3">
        {services.map((service) => (
          <Card key={service.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{service.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-accent">{service.price}</span>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${
                service.availability === "Available" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
              }`}>
                {service.availability}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteService(service.id, service.name)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default VendorServices;
