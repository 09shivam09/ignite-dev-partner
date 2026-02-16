import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Heart, MapPin, Trash2, Send } from "lucide-react";
import { getCityLabel } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const UserSavedVendors = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedVendors, isLoading } = useQuery({
    queryKey: ['saved-vendors-full', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_vendors')
        .select(`
          id, vendor_id, created_at,
          vendors (id, business_name, business_description, city, rating, total_reviews, is_active)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: async (savedId: string) => {
      const { error } = await supabase.from('saved_vendors').delete().eq('id', savedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-vendors-full'] });
      queryClient.invalidateQueries({ queryKey: ['saved-vendors'] });
      toast({ title: "Removed", description: "Vendor removed from saved list" });
    },
  });

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Home
        </Button>

        <div className="flex items-center gap-2 mb-6">
          <Heart className="h-5 w-5 text-destructive" />
          <h1 className="text-2xl font-bold">Saved Vendors</h1>
          <span className="text-sm text-muted-foreground">({savedVendors?.length || 0})</span>
        </div>

        {savedVendors && savedVendors.length > 0 ? (
          <div className="space-y-4">
            {savedVendors.map((sv: any) => (
              <Card key={sv.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{sv.vendors?.business_name}</h3>
                      {sv.vendors?.city && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4" />{getCityLabel(sv.vendors.city)}
                        </div>
                      )}
                      {sv.vendors?.business_description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{sv.vendors.business_description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Saved {new Date(sv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => navigate(`/marketplace/vendor/${sv.vendor_id}`)}>
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeMutation.mutate(sv.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No saved vendors</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save vendors while browsing to quickly find them later
              </p>
              <Button onClick={() => navigate('/marketplace/events/create')}>
                Create Event & Browse
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserSavedVendors;
