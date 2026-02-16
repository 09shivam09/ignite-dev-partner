import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { INQUIRY_STATUS } from "@/lib/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, LayoutDashboard, HelpCircle, User, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import type { VendorInquiryWithRelations, VendorService } from "@/types/marketplace";

// Import vendor dashboard components
import { VendorMetricsCards } from "@/components/marketplace/vendor/VendorMetricsCards";
import { ProfileCompletionCard } from "@/components/marketplace/vendor/ProfileCompletionCard";
import { AvailabilityToggle } from "@/components/marketplace/vendor/AvailabilityToggle";
import { VendorServicesList } from "@/components/marketplace/vendor/VendorServicesList";
import { VendorInquiryList } from "@/components/marketplace/vendor/VendorInquiryList";
import { InquiryActionDialog } from "@/components/marketplace/vendor/InquiryActionDialog";
import { InquiryDetailView } from "@/components/marketplace/vendor/InquiryDetailView";
import { VendorHealthIndicator } from "@/components/marketplace/vendor/VendorHealthIndicator";
import { VendorHelpSection } from "@/components/marketplace/vendor/VendorHelpSection";
import { ServiceHighlights } from "@/components/marketplace/vendor/ServiceHighlights";
import { ProfilePreviewMode } from "@/components/marketplace/vendor/ProfilePreviewMode";

// Import profile management components
import {
  VendorProfileEditForm,
  VendorServicesManager,
  VendorPortfolioManager,
  VendorAvailabilityManager,
  VendorAccountSettings,
} from "@/components/marketplace/vendor/profile";

const VendorDashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { vendor, loading: authLoading, signOut } = useAuth();

  const [selectedInquiry, setSelectedInquiry] = useState<VendorInquiryWithRelations | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const [detailViewInquiry, setDetailViewInquiry] = useState<VendorInquiryWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch vendor's full data (for profile completion)
  const { data: vendorData, refetch: refetchVendor } = useQuery({
    queryKey: ['vendor-full', vendor?.id],
    queryFn: async () => {
      if (!vendor) return null;
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendor.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!vendor,
  });

  // Fetch vendor's inquiries
  const { data: inquiries, isLoading: inquiriesLoading, refetch: refetchInquiries } = useQuery({
    queryKey: ['vendor-inquiries', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      
      const { data: inquiriesData, error: inquiriesError } = await supabase
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
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (inquiriesError) throw inquiriesError;
      if (!inquiriesData || inquiriesData.length === 0) return [];

      // Fetch profiles for each inquiry
      const userIds = [...new Set(inquiriesData.map(i => i.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      return inquiriesData.map(inquiry => ({
        ...inquiry,
        profiles: profilesMap.get(inquiry.user_id) || null,
      })) as VendorInquiryWithRelations[];
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
          services (id, name, slug, icon)
        `)
        .eq('vendor_id', vendor.id);

      if (error) throw error;
      return (data || []) as VendorService[];
    },
    enabled: !!vendor,
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!inquiries) {
      return {
        newCount: 0,
        pendingCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        totalInquiries: 0,
        lastInquiryTime: null,
      };
    }

    const now = new Date();
    const newInquiries = inquiries.filter(i => {
      if (i.status !== 'pending') return false;
      const createdAt = new Date(i.created_at);
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      return hoursDiff < 24;
    });

    return {
      newCount: newInquiries.length,
      pendingCount: inquiries.filter(i => i.status === 'pending').length,
      acceptedCount: inquiries.filter(i => i.status === 'accepted').length,
      rejectedCount: inquiries.filter(i => i.status === 'rejected').length,
      totalInquiries: inquiries.length,
      lastInquiryTime: inquiries[0]?.created_at || null,
    };
  }, [inquiries]);

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
        title: actionType === 'accept' ? "Inquiry Accepted!" : "Inquiry Rejected",
        description: actionType === 'accept' 
          ? "The client can now see your contact details" 
          : "The client has been notified",
      });
      handleCloseDialog();
      setDetailViewInquiry(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAction = (inquiry: VendorInquiryWithRelations, action: 'accept' | 'reject') => {
    setSelectedInquiry(inquiry);
    setActionType(action);
  };

  const handleCloseDialog = () => {
    setSelectedInquiry(null);
    setActionType(null);
    setResponseMessage("");
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

  const handleRefresh = () => {
    refetchInquiries();
    refetchVendor();
  };

  const handleViewDetails = (inquiry: VendorInquiryWithRelations) => {
    setDetailViewInquiry(inquiry);
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!vendor) {
    navigate('/marketplace/vendor/onboarding');
    return null;
  }

  return (
    <AppLayout>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 md:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Vendor Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {vendorData && vendorServices && (
              <ProfilePreviewMode vendor={vendorData} vendorServices={vendorServices} />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab row with Health & Service Highlights beside tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Shield className="h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="help" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                Help
              </TabsTrigger>
            </TabsList>

            {/* Health & Services Highlights - beside tabs */}
            <div className="flex flex-wrap items-stretch gap-3">
              {vendorData && vendorServices && (
                <VendorHealthIndicator
                  vendor={vendorData}
                  vendorServices={vendorServices}
                  inquiryStats={{
                    total: metrics.totalInquiries,
                    accepted: metrics.acceptedCount,
                    rejected: metrics.rejectedCount,
                    pending: metrics.pendingCount,
                  }}
                />
              )}
              {vendorServices && vendorServices.length > 0 && (
                <ServiceHighlights services={vendorServices} />
              )}
            </div>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Availability Toggle */}
            {vendorData && (
              <AvailabilityToggle 
                vendor={vendorData} 
                onUpdate={() => refetchVendor()} 
              />
            )}

            {/* Metrics Cards */}
            <VendorMetricsCards {...metrics} inquiries={inquiries} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile */}
              <div className="lg:col-span-1 space-y-6">
                {vendorData && vendorServices && (
                  <ProfileCompletionCard 
                    vendor={vendorData} 
                    vendorServices={vendorServices}
                    onEditProfile={() => setActiveTab("profile")}
                  />
                )}
                
                {/* Services List */}
                {vendorServices && (
                  <VendorServicesList services={vendorServices} />
                )}
              </div>

              {/* Right Column - Inquiries */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Inquiries</h2>
                  {metrics.pendingCount > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {metrics.pendingCount} need{metrics.pendingCount === 1 ? 's' : ''} response
                    </span>
                  )}
                </div>
                
                {inquiriesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <VendorInquiryList 
                    inquiries={inquiries || []}
                    onAccept={(inquiry) => handleAction(inquiry, 'accept')}
                    onReject={(inquiry) => handleAction(inquiry, 'reject')}
                    onViewDetails={handleViewDetails}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {vendorData && (
              <>
                <VendorProfileEditForm 
                  vendor={vendorData} 
                  onUpdate={() => refetchVendor()} 
                />
                <VendorServicesManager 
                  vendorId={vendorData.id} 
                  services={vendorServices || []} 
                  onUpdate={() => {
                    refetchVendor();
                    queryClient.invalidateQueries({ queryKey: ['vendor-services'] });
                  }} 
                />
                <VendorPortfolioManager vendorId={vendorData.id} />
                <VendorAvailabilityManager 
                  vendor={vendorData} 
                  onUpdate={() => refetchVendor()} 
                />
              </>
            )}
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="settings" className="space-y-6">
            <VendorAccountSettings onSignOut={handleSignOut} />
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="space-y-6">
            <div className="max-w-2xl">
              <VendorHelpSection />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Action Dialog */}
      <InquiryActionDialog
        inquiry={selectedInquiry}
        actionType={actionType}
        responseMessage={responseMessage}
        onResponseChange={setResponseMessage}
        onConfirm={confirmAction}
        onClose={handleCloseDialog}
        isSubmitting={updateInquiryMutation.isPending}
      />

      {/* Detail View Dialog */}
      <Dialog open={!!detailViewInquiry} onOpenChange={() => setDetailViewInquiry(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {detailViewInquiry && (
            <InquiryDetailView
              inquiry={detailViewInquiry}
              onAccept={() => handleAction(detailViewInquiry, 'accept')}
              onReject={() => handleAction(detailViewInquiry, 'reject')}
              onClose={() => setDetailViewInquiry(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
    </AppLayout>
  );
};

export default VendorDashboardPage;
