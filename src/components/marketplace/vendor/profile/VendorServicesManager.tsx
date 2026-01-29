import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  IndianRupee, 
  AlertCircle,
  Package,
  Star,
  TrendingUp
} from "lucide-react";
import { formatPriceRange } from "@/lib/constants";
import type { VendorService } from "@/types/marketplace";

interface VendorServicesManagerProps {
  vendorId: string;
  services: VendorService[];
  onUpdate: () => void;
}

interface ServiceFormData {
  name: string;
  description: string;
  price_min: string;
  price_max: string;
  is_available: boolean;
}

const defaultFormData: ServiceFormData = {
  name: "",
  description: "",
  price_min: "",
  price_max: "",
  is_available: true,
};

/**
 * Vendor Services Manager
 * Allows adding, editing, and deleting services with pricing
 */
export const VendorServicesManager = ({ 
  vendorId, 
  services, 
  onUpdate 
}: VendorServicesManagerProps) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<VendorService | null>(null);
  const [deleteService, setDeleteService] = useState<VendorService | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, 'popular' | 'value' | null>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Service name is required";
    }

    const minPrice = parseFloat(formData.price_min);
    const maxPrice = parseFloat(formData.price_max);

    if (!formData.price_min || isNaN(minPrice) || minPrice < 0) {
      newErrors.price_min = "Enter a valid minimum price";
    }

    if (!formData.price_max || isNaN(maxPrice) || maxPrice < 0) {
      newErrors.price_max = "Enter a valid maximum price";
    }

    if (!isNaN(minPrice) && !isNaN(maxPrice) && minPrice > maxPrice) {
      newErrors.price_max = "Maximum price must be greater than or equal to minimum price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData(defaultFormData);
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (service: VendorService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price_min: service.price_min?.toString() || "",
      price_max: service.price_max?.toString() || "",
      is_available: service.is_available,
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const serviceData = {
        vendor_id: vendorId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price_min: parseFloat(formData.price_min),
        price_max: parseFloat(formData.price_max),
        base_price: parseFloat(formData.price_min), // Use min as base
        is_available: formData.is_available,
        updated_at: new Date().toISOString(),
      };

      if (editingService) {
        const { error } = await supabase
          .from('vendor_services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;

        toast({
          title: "Service Updated",
          description: `"${formData.name}" has been updated successfully.`,
        });
      } else {
        const { error } = await supabase
          .from('vendor_services')
          .insert(serviceData);

        if (error) throw error;

        toast({
          title: "Service Added",
          description: `"${formData.name}" has been added to your offerings.`,
        });
      }

      setIsDialogOpen(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save service",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteService) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendor_services')
        .delete()
        .eq('id', deleteService.id);

      if (error) throw error;

      toast({
        title: "Service Deleted",
        description: `"${deleteService.name}" has been removed.`,
      });

      setDeleteService(null);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (service: VendorService) => {
    try {
      const { error } = await supabase
        .from('vendor_services')
        .update({ 
          is_available: !service.is_available,
          updated_at: new Date().toISOString(),
        })
        .eq('id', service.id);

      if (error) throw error;

      toast({
        title: service.is_available ? "Service Paused" : "Service Enabled",
        description: `"${service.name}" is now ${service.is_available ? 'paused' : 'available'}.`,
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    }
  };

  const toggleHighlight = (serviceId: string, type: 'popular' | 'value') => {
    const current = highlights[serviceId];
    setHighlights(prev => ({
      ...prev,
      [serviceId]: current === type ? null : type,
    }));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Services & Pricing
              </CardTitle>
              <CardDescription>
                Manage your service offerings with clear pricing
              </CardDescription>
            </div>
            <Button onClick={handleOpenAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                No services added yet. Add your first service to start receiving inquiries.
              </p>
              <Button onClick={handleOpenAdd} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const highlight = highlights[service.id];
                const hasPriceWarning = service.price_min && service.price_max && 
                  service.price_min > service.price_max;

                return (
                  <div
                    key={service.id}
                    className={`p-4 rounded-lg border ${
                      !service.is_available ? 'bg-muted/50 opacity-60' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{service.name}</h4>
                          {!service.is_available && (
                            <Badge variant="secondary" className="text-xs">Paused</Badge>
                          )}
                          {highlight === 'popular' && (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs">
                              <Star className="h-3 w-3 mr-1" fill="currentColor" />
                              Popular
                            </Badge>
                          )}
                          {highlight === 'value' && (
                            <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Best Value
                            </Badge>
                          )}
                        </div>
                        
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm font-medium flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {formatPriceRange(service.price_min, service.price_max)}
                          </span>
                          {hasPriceWarning && (
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Price range inverted
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Highlight toggles */}
                        <button
                          onClick={() => toggleHighlight(service.id, 'popular')}
                          className={`p-1.5 rounded-md transition-colors ${
                            highlight === 'popular'
                              ? 'bg-amber-500/20 text-amber-600'
                              : 'hover:bg-muted text-muted-foreground'
                          }`}
                          title="Mark as Most Popular"
                        >
                          <Star className="h-4 w-4" fill={highlight === 'popular' ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => toggleHighlight(service.id, 'value')}
                          className={`p-1.5 rounded-md transition-colors ${
                            highlight === 'value'
                              ? 'bg-green-500/20 text-green-600'
                              : 'hover:bg-muted text-muted-foreground'
                          }`}
                          title="Mark as Best Value"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </button>

                        {/* Availability toggle */}
                        <Switch
                          checked={service.is_available}
                          onCheckedChange={() => handleToggleAvailability(service)}
                        />

                        {/* Edit button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(service)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteService(service)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <p className="text-xs text-muted-foreground pt-2">
                💡 <strong>Pricing tip:</strong> Clear and competitive pricing helps customers make faster decisions. 
                Services with accurate price ranges receive more inquiries.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="service_name">Service Name *</Label>
              <Input
                id="service_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Wedding Photography Package"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="service_description">Description</Label>
              <Textarea
                id="service_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what's included in this service..."
                rows={3}
              />
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_min">Minimum Price (₹) *</Label>
                <Input
                  id="price_min"
                  type="number"
                  min="0"
                  value={formData.price_min}
                  onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                  placeholder="e.g., 25000"
                  className={errors.price_min ? "border-destructive" : ""}
                />
                {errors.price_min && (
                  <p className="text-xs text-destructive">{errors.price_min}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_max">Maximum Price (₹) *</Label>
                <Input
                  id="price_max"
                  type="number"
                  min="0"
                  value={formData.price_max}
                  onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                  placeholder="e.g., 75000"
                  className={errors.price_max ? "border-destructive" : ""}
                />
                {errors.price_max && (
                  <p className="text-xs text-destructive">{errors.price_max}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Providing accurate pricing helps customers filter and find your services.
            </p>

            {/* Availability */}
            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="is_available">Service Available</Label>
                <p className="text-xs text-muted-foreground">
                  Paused services won't appear in search results
                </p>
              </div>
              <Switch
                id="is_available"
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingService ? "Save Changes" : "Add Service"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteService} onOpenChange={() => setDeleteService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteService?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
