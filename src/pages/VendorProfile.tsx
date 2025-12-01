import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Star, MapPin, Phone, Mail, Globe, Heart, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const VendorProfile = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchVendorData();
    logProfileView();
  }, [vendorId]);

  const fetchVendorData = async () => {
    try {
      const [vendorRes, portfolioRes, reviewsRes, servicesRes] = await Promise.all([
        supabase.from("vendors").select("*").eq("id", vendorId).single(),
        supabase.from("vendor_portfolio").select("*").eq("vendor_id", vendorId).order("display_order"),
        supabase.from("reviews").select("*, consumer_id(full_name, avatar_url)").eq("vendor_id", vendorId).eq("is_published", true).order("created_at", { ascending: false }).limit(10),
        supabase.from("vendor_services").select("*").eq("vendor_id", vendorId).eq("is_available", true),
      ]);

      if (vendorRes.error) throw vendorRes.error;
      setVendor(vendorRes.data);
      setPortfolio(portfolioRes.data || []);
      setReviews(reviewsRes.data || []);
      setServices(servicesRes.data || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("saved_vendors").select("id").eq("user_id", user.id).eq("vendor_id", vendorId).single();
        setIsSaved(!!data);
      }
    } catch (error: any) {
      toast.error("Error loading vendor profile");
    } finally {
      setLoading(false);
    }
  };

  const logProfileView = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("profile_views").insert({
        vendor_id: vendorId,
        viewer_id: user?.id || null,
      });
    } catch (error) {
      console.error("Error logging view:", error);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to save vendors");
        return;
      }

      if (isSaved) {
        await supabase.from("saved_vendors").delete().eq("user_id", user.id).eq("vendor_id", vendorId);
        setIsSaved(false);
        toast.success("Removed from favorites");
      } else {
        await supabase.from("saved_vendors").insert({ user_id: user.id, vendor_id: vendorId });
        setIsSaved(true);
        toast.success("Saved to favorites");
      }
    } catch (error: any) {
      toast.error("Error saving vendor");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vendor) return <div>Vendor not found</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSave}>
              <Heart className={`h-5 w-5 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {vendor.cover_image_url && (
        <div className="h-48 bg-muted">
          <img src={vendor.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-20 w-20 border-4 border-background -mt-10">
            <AvatarImage src={vendor.logo_url} />
            <AvatarFallback>{vendor.business_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{vendor.business_name}</h1>
            {vendor.tagline && <p className="text-muted-foreground">{vendor.tagline}</p>}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="ml-1 font-semibold">{vendor.rating || "New"}</span>
              </div>
              <span className="text-muted-foreground">• {vendor.total_reviews || 0} reviews</span>
              {vendor.price_range && <Badge variant="outline">{vendor.price_range}</Badge>}
            </div>
          </div>
        </div>

        {vendor.business_description && (
          <p className="text-foreground mb-4">{vendor.business_description}</p>
        )}

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {vendor.business_address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{vendor.business_address}</span>
            </div>
          )}
          {vendor.business_phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{vendor.business_phone}</span>
            </div>
          )}
          {vendor.business_email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{vendor.business_email}</span>
            </div>
          )}
        </div>

        {/* Service Tags */}
        {vendor.service_tags && vendor.service_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {vendor.service_tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <Button className="flex-1" onClick={() => navigate(`/booking?vendor=${vendorId}`)}>
            Book Now
          </Button>
          <Button variant="outline" onClick={() => navigate(`/chat/${vendorId}`)}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="portfolio" className="flex-1">Portfolio</TabsTrigger>
            <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {portfolio.map((item) => (
                <Card key={item.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                  <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
                  {item.title && (
                    <div className="p-2">
                      <p className="font-semibold text-sm">{item.title}</p>
                      {item.caption && <p className="text-xs text-muted-foreground">{item.caption}</p>}
                    </div>
                  )}
                </Card>
              ))}
            </div>
            {portfolio.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No portfolio items yet</p>
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-4">
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="font-bold text-primary">₹{service.base_price}</p>
                  </div>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                  )}
                  {service.duration_minutes && (
                    <p className="text-xs text-muted-foreground">{service.duration_minutes} minutes</p>
                  )}
                </Card>
              ))}
            </div>
            {services.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No services listed</p>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.consumer_id?.avatar_url} />
                      <AvatarFallback>{review.consumer_id?.full_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{review.consumer_id?.full_name || "Anonymous"}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted"}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm">{review.comment}</p>}
                </Card>
              ))}
            </div>
            {reviews.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No reviews yet</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorProfile;