import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { UserInquiryCard } from "@/components/marketplace/InquiryCard";
import type { InquiryWithRelations } from "@/types/marketplace";

const UserInquiries = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { data: inquiries, isLoading, error } = useQuery({
    queryKey: ['user-all-inquiries', user?.id],
    queryFn: async (): Promise<InquiryWithRelations[]> => {
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
      return (data || []) as InquiryWithRelations[];
    },
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
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
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="font-semibold mb-2">Error loading inquiries</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'Something went wrong'}
              </p>
              <Button onClick={() => navigate('/marketplace')}>
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
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
            {inquiries.map((inquiry) => (
              <UserInquiryCard key={inquiry.id} inquiry={inquiry} />
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