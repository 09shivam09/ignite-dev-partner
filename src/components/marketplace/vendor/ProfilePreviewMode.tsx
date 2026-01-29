import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  X, 
  MapPin, 
  Star, 
  IndianRupee,
  Building2,
  Phone,
  Mail
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatPriceRange, getCityLabel } from "@/lib/constants";
import type { Vendor, VendorService } from "@/types/marketplace";

interface ProfilePreviewModeProps {
  vendor: Vendor;
  vendorServices: VendorService[];
}

/**
 * Profile Preview Mode
 * Shows vendors how their profile appears to customers
 * Read-only preview - no editing capability in this mode
 */
export const ProfilePreviewMode = ({
  vendor,
  vendorServices,
}: ProfilePreviewModeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Eye className="h-4 w-4" />
        Preview as Customer
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Customer View Preview
            </DialogTitle>
            <DialogDescription>
              This is how customers see your profile when browsing vendors.
            </DialogDescription>
          </DialogHeader>

          {/* Preview Banner */}
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400 text-center">
            👁️ Preview Mode - This is read-only
          </div>

          {/* Vendor Card Preview */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{vendor.business_name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{getCityLabel(vendor.city || '')}</span>
                  </div>
                </div>
                {vendor.rating && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {vendor.rating.toFixed(1)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Description */}
              {vendor.business_description ? (
                <p className="text-sm text-muted-foreground">
                  {vendor.business_description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">
                  No description added yet
                </p>
              )}

              {/* Services */}
              <div>
                <h4 className="text-sm font-medium mb-2">Services Offered</h4>
                {vendorServices.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {vendorServices.map((service) => (
                      <Badge key={service.id} variant="outline" className="gap-1">
                        {service.services?.name || service.name}
                        <span className="text-muted-foreground">
                          {formatPriceRange(service.price_min, service.price_max)}
                        </span>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">
                    No services added yet
                  </p>
                )}
              </div>

              {/* Contact Info (shown after inquiry acceptance) */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Contact info (shown after inquiry acceptance)
                </p>
                <div className="space-y-1 text-sm">
                  {vendor.business_email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{vendor.business_email}</span>
                    </div>
                  )}
                  {vendor.business_phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{vendor.business_phone}</span>
                    </div>
                  )}
                  {!vendor.business_email && !vendor.business_phone && (
                    <p className="text-muted-foreground/50 italic text-xs">
                      No contact info added
                    </p>
                  )}
                </div>
              </div>

              {/* Inquiry Button (disabled in preview) */}
              <Button className="w-full" disabled>
                <Building2 className="h-4 w-4 mr-2" />
                Send Inquiry (Preview Only)
              </Button>
            </CardContent>
          </Card>

          {/* Improvement Tips */}
          {(!vendor.business_description || vendorServices.length === 0) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                💡 Tips to improve your profile
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {!vendor.business_description && (
                  <li>• Add a detailed business description</li>
                )}
                {vendorServices.length === 0 && (
                  <li>• Add your services with pricing</li>
                )}
                {!vendor.business_email && (
                  <li>• Add your business email</li>
                )}
                {!vendor.business_phone && (
                  <li>• Add your business phone</li>
                )}
              </ul>
            </div>
          )}

          <Button variant="outline" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            Close Preview
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
