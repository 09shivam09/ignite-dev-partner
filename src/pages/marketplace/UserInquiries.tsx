import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { CITIES, EVENT_TYPES } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Calendar, MapPin, MessageSquare } from "lucide-react";

const UserInquiries = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['user-all-inquiries', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          vendors (
            id,
            business_name,
            city,
            business_phone
          ),
          events (
            id,
            title,
            event_type,
            event_date
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const getCityLabel = (cityValue: string) => {
    return CITIES.find(c => c.value === cityValue)?.label || cityValue;
  };

  const getEventTypeLabel = (typeValue: string) => {
    return EVENT_TYPES.find(t => t.value === typeValue)?.label || typeValue;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/marketplace')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <h1 className="text-2xl font-bold mb-6">My Inquiries</h1>

        {inquiries && inquiries.length > 0 ? (
          <div className="space-y-4">
            {inquiries.map((inquiry: any) => (
              <Card key={inquiry.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{inquiry.vendors?.business_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          For: {inquiry.events?.title}
                        </p>
                      </div>
                      <Badge variant={
                        inquiry.status === 'accepted' ? 'default' :
                        inquiry.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {inquiry.events?.event_date 
                          ? new Date(inquiry.events.event_date).toLocaleDateString() 
                          : 'Date TBD'}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {getCityLabel(inquiry.vendors?.city || '')}
                      </div>
                    </div>

                    {inquiry.message && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-1 text-xs font-medium mb-1">
                          <MessageSquare className="h-3 w-3" />
                          Your Message
                        </div>
                        <p className="text-sm">{inquiry.message}</p>
                      </div>
                    )}

                    {inquiry.vendor_response && (
                      <div className={`p-3 rounded-lg border ${
                        inquiry.status === 'accepted' 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                          : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                      }`}>
                        <div className="text-xs font-medium mb-1">Vendor Response</div>
                        <p className="text-sm">{inquiry.vendor_response}</p>
                      </div>
                    )}

                    {inquiry.status === 'accepted' && inquiry.vendors?.business_phone && (
                      <div className="pt-2 border-t">
                        <p className="text-sm">
                          <span className="font-medium">Contact:</span> {inquiry.vendors.business_phone}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/marketplace/vendor/${inquiry.vendors?.id}`)}
                      >
                        View Vendor
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
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No inquiries yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create an event and send inquiries to vendors
              </p>
              <Button onClick={() => navigate('/marketplace/events/create')}>
                Create Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserInquiries;
