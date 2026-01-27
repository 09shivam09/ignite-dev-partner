import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CITIES, EVENT_TYPES, INQUIRY_STATUS } from "@/lib/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut, Check, X, Calendar, MapPin, IndianRupee, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const VendorDashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, vendor, profile, loading: authLoading, signOut } = useAuth();

  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);

  // Fetch vendor's inquiries
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['vendor-inquiries', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          events (
            id,
            title,
            event_type,
            event_date,
            city,
            budget_min,
            budget_max
          ),
          profiles:user_id (
            full_name,
            email,
            phone
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!vendor,
  });

  // Fetch vendor's services
  const { data: vendorServices } = useQuery({
    queryKey: ['vendor-services', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      const { data, error } = await supabase
        .from('vendor_services')
        .select(`
          *,
          services (name)
        `)
        .eq('vendor_id', vendor.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!vendor,
  });

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ inquiryId, status, response }: { inquiryId: string; status: string; response?: string }) => {
      const { error } = await supabase
        .from('inquiries')
        .update({
          status,
          vendor_response: response || null,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', inquiryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-inquiries'] });
      toast({
        title: "Success",
        description: `Inquiry ${actionType === 'accept' ? 'accepted' : 'rejected'} successfully`,
      });
      setSelectedInquiry(null);
      setResponseMessage("");
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAction = (inquiry: any, action: 'accept' | 'reject') => {
    setSelectedInquiry(inquiry);
    setActionType(action);
  };

  const confirmAction = () => {
    if (!selectedInquiry || !actionType) return;

    updateInquiryMutation.mutate({
      inquiryId: selectedInquiry.id,
      status: actionType === 'accept' ? INQUIRY_STATUS.ACCEPTED : INQUIRY_STATUS.REJECTED,
      response: responseMessage,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/marketplace/auth");
  };

  const getCityLabel = (cityValue: string) => {
    return CITIES.find(c => c.value === cityValue)?.label || cityValue;
  };

  const getEventTypeLabel = (typeValue: string) => {
    return EVENT_TYPES.find(t => t.value === typeValue)?.label || typeValue;
  };

  const pendingCount = inquiries?.filter(i => i.status === 'pending').length || 0;
  const acceptedCount = inquiries?.filter(i => i.status === 'accepted').length || 0;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendor) {
    navigate('/marketplace/vendor/onboarding');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">🎉 EventConnect</h1>
            <p className="text-sm text-muted-foreground">Vendor Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {vendor.business_name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-sm text-muted-foreground">Pending Inquiries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{acceptedCount}</div>
              <p className="text-sm text-muted-foreground">Accepted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{vendorServices?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Services Offered</p>
            </CardContent>
          </Card>
        </section>

        {/* Services */}
        <section>
          <h2 className="text-xl font-bold mb-4">Your Services</h2>
          <div className="flex flex-wrap gap-2">
            {vendorServices?.map((vs: any) => (
              <Badge key={vs.id} variant="secondary" className="py-2 px-3">
                {vs.services?.name || vs.name}
                <span className="ml-2 text-muted-foreground">
                  ₹{vs.price_min?.toLocaleString() || vs.base_price?.toLocaleString()} - ₹{vs.price_max?.toLocaleString() || vs.base_price?.toLocaleString()}
                </span>
              </Badge>
            ))}
          </div>
        </section>

        {/* Inquiries */}
        <section>
          <h2 className="text-xl font-bold mb-4">Inquiries</h2>
          
          {inquiriesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : inquiries && inquiries.length > 0 ? (
            <div className="space-y-4">
              {inquiries.map((inquiry: any) => (
                <Card key={inquiry.id} className={inquiry.status === 'pending' ? 'border-primary/50' : ''}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{inquiry.events?.title}</h3>
                          <Badge variant={
                            inquiry.status === 'accepted' ? 'default' :
                            inquiry.status === 'rejected' ? 'destructive' :
                            'secondary'
                          }>
                            {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {inquiry.events?.event_date 
                              ? new Date(inquiry.events.event_date).toLocaleDateString() 
                              : 'Date TBD'}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {getCityLabel(inquiry.events?.city || '')}
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            ₹{inquiry.events?.budget_min?.toLocaleString()} - ₹{inquiry.events?.budget_max?.toLocaleString()}
                          </div>
                          <div>
                            {getEventTypeLabel(inquiry.events?.event_type || '')}
                          </div>
                        </div>

                        <div className="text-sm">
                          <p className="font-medium">From: {inquiry.profiles?.full_name || 'User'}</p>
                          {inquiry.profiles?.email && (
                            <p className="text-muted-foreground">{inquiry.profiles.email}</p>
                          )}
                        </div>

                        {inquiry.message && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-1 text-xs font-medium mb-1">
                              <MessageSquare className="h-3 w-3" />
                              Message
                            </div>
                            <p className="text-sm">{inquiry.message}</p>
                          </div>
                        )}

                        {inquiry.vendor_response && (
                          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="text-xs font-medium mb-1">Your Response</div>
                            <p className="text-sm">{inquiry.vendor_response}</p>
                          </div>
                        )}
                      </div>

                      {inquiry.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleAction(inquiry, 'accept')}
                            className="flex items-center gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(inquiry, 'reject')}
                            className="flex items-center gap-1"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}
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
                <p className="text-sm text-muted-foreground">
                  When users send you inquiries, they'll appear here
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      {/* Action Dialog */}
      <Dialog open={!!selectedInquiry && !!actionType} onOpenChange={() => {
        setSelectedInquiry(null);
        setActionType(null);
        setResponseMessage("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' ? 'Accept Inquiry' : 'Reject Inquiry'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'accept' 
                ? 'The user will be notified that you\'ve accepted their inquiry.'
                : 'The user will be notified that you\'ve declined their inquiry.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Response Message (optional)</Label>
              <Textarea
                placeholder={actionType === 'accept' 
                  ? "Great! I'd love to work on your event. Let me share more details..."
                  : "Thank you for your interest. Unfortunately..."
                }
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedInquiry(null);
              setActionType(null);
              setResponseMessage("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAction} 
              disabled={updateInquiryMutation.isPending}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {updateInquiryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : actionType === 'accept' ? (
                "Accept Inquiry"
              ) : (
                "Reject Inquiry"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorDashboardPage;
