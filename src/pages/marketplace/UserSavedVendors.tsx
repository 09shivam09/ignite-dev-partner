import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MapPin, Trash2 } from "lucide-react";
import { getCityLabel } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";

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
    return (
      <AppLayout>
        <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto space-y-6">
        <div>
          <p className="section-label mb-1">Shortlist</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Saved Vendors</h1>
            <span className="text-sm text-muted-foreground">({savedVendors?.length || 0})</span>
          </div>
        </div>

        {savedVendors && savedVendors.length > 0 ? (
          <div className="space-y-3">
            {savedVendors.map((sv: any) => (
              <Card key={sv.id} className="hover-lift">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="h-4 w-4 fill-love text-love flex-shrink-0" />
                        <h3 className="font-semibold">{sv.vendors?.business_name}</h3>
                      </div>
                      {sv.vendors?.city && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{getCityLabel(sv.vendors.city)}
                        </div>
                      )}
                      {sv.vendors?.business_description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{sv.vendors.business_description}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        Saved {new Date(sv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="text-xs" onClick={() => navigate(`/marketplace/vendor/${sv.vendor_id}`)}>
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive text-xs"
                        onClick={() => removeMutation.mutate(sv.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-love/10 mb-4">
                <Heart className="h-8 w-8 text-love" />
              </div>
              <h3 className="font-semibold mb-1">No saved vendors</h3>
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
    </AppLayout>
  );
};

export default UserSavedVendors;
