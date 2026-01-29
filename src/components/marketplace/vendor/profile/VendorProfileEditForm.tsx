import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CITIES } from "@/lib/constants";
import { Loader2, Save, Building2, User, Phone, MapPin, Quote } from "lucide-react";
import type { Vendor } from "@/types/marketplace";

interface VendorProfileEditFormProps {
  vendor: Vendor;
  onUpdate: () => void;
}

/**
 * Vendor Profile Edit Form
 * Allows editing of basic business information
 */
export const VendorProfileEditForm = ({ vendor, onUpdate }: VendorProfileEditFormProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    business_name: vendor.business_name || "",
    tagline: (vendor as any).tagline || "",
    business_phone: vendor.business_phone || "",
    business_email: vendor.business_email || "",
    city: vendor.city || "",
    business_description: vendor.business_description || "",
    years_experience: (vendor as any).years_experience?.toString() || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.business_name.trim()) {
      newErrors.business_name = "Business name is required";
    } else if (formData.business_name.length < 3) {
      newErrors.business_name = "Business name must be at least 3 characters";
    }

    if (formData.tagline && formData.tagline.length > 100) {
      newErrors.tagline = "Tagline must be under 100 characters";
    }

    if (formData.business_phone && !/^[6-9]\d{9}$/.test(formData.business_phone.replace(/\s/g, ''))) {
      newErrors.business_phone = "Enter a valid 10-digit Indian mobile number";
    }

    if (formData.business_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.business_email)) {
      newErrors.business_email = "Enter a valid email address";
    }

    if (!formData.city) {
      newErrors.city = "Please select your service city";
    }

    if (formData.business_description && formData.business_description.length < 50) {
      newErrors.business_description = "Description should be at least 50 characters for better visibility";
    }

    if (formData.years_experience && (isNaN(Number(formData.years_experience)) || Number(formData.years_experience) < 0)) {
      newErrors.years_experience = "Enter a valid number of years";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          business_name: formData.business_name.trim(),
          tagline: formData.tagline.trim() || null,
          business_phone: formData.business_phone.trim() || null,
          business_email: formData.business_email.trim() || null,
          city: formData.city,
          business_description: formData.business_description.trim() || null,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendor.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your business information has been saved successfully.",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Information
        </CardTitle>
        <CardDescription>
          This information will be displayed on your public profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="business_name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Business / Brand Name *
            </Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => handleChange("business_name", e.target.value)}
              placeholder="e.g., Royal Wedding Photography"
              className={errors.business_name ? "border-destructive" : ""}
            />
            {errors.business_name && (
              <p className="text-xs text-destructive">{errors.business_name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Your business name as you want customers to see it
            </p>
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <Label htmlFor="tagline" className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-muted-foreground" />
              Tagline
            </Label>
            <Input
              id="tagline"
              value={formData.tagline}
              onChange={(e) => handleChange("tagline", e.target.value)}
              placeholder="e.g., Capturing your special moments since 2010"
              maxLength={100}
              className={errors.tagline ? "border-destructive" : ""}
            />
            {errors.tagline && (
              <p className="text-xs text-destructive">{errors.tagline}</p>
            )}
            <p className="text-xs text-muted-foreground">
              A short, memorable line about your business ({formData.tagline.length}/100)
            </p>
          </div>

          {/* Phone & Email Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Business Phone
              </Label>
              <Input
                id="business_phone"
                value={formData.business_phone}
                onChange={(e) => handleChange("business_phone", e.target.value)}
                placeholder="9876543210"
                className={errors.business_phone ? "border-destructive" : ""}
              />
              {errors.business_phone && (
                <p className="text-xs text-destructive">{errors.business_phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_email">Business Email</Label>
              <Input
                id="business_email"
                type="email"
                value={formData.business_email}
                onChange={(e) => handleChange("business_email", e.target.value)}
                placeholder="contact@yourbusiness.com"
                className={errors.business_email ? "border-destructive" : ""}
              />
              {errors.business_email && (
                <p className="text-xs text-destructive">{errors.business_email}</p>
              )}
            </div>
          </div>

          {/* City & Experience Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Service City *
              </Label>
              <Select
                value={formData.city}
                onValueChange={(value) => handleChange("city", value)}
              >
                <SelectTrigger className={errors.city ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city && (
                <p className="text-xs text-destructive">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                min="0"
                max="50"
                value={formData.years_experience}
                onChange={(e) => handleChange("years_experience", e.target.value)}
                placeholder="e.g., 5"
                className={errors.years_experience ? "border-destructive" : ""}
              />
              {errors.years_experience && (
                <p className="text-xs text-destructive">{errors.years_experience}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="business_description">About Your Business</Label>
            <Textarea
              id="business_description"
              value={formData.business_description}
              onChange={(e) => handleChange("business_description", e.target.value)}
              placeholder="Tell customers what makes your service special. Describe your experience with weddings, your team, equipment, and what sets you apart..."
              rows={5}
              className={errors.business_description ? "border-destructive" : ""}
            />
            {errors.business_description && (
              <p className="text-xs text-destructive">{errors.business_description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Describe what makes your service special for weddings and events. 
              Recommended: 150-300 words ({formData.business_description.length} characters)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
