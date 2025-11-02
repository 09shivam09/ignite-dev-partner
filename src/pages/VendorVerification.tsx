import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Upload, FileText, Shield, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VendorVerification = () => {
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "rejected">("pending");
  const [documents, setDocuments] = useState<{ [key: string]: File | null }>({
    businessLicense: null,
    taxId: null,
    addressProof: null,
    portfolio: null
  });

  const handleFileUpload = (key: string, file: File | null) => {
    setDocuments(prev => ({ ...prev, [key]: file }));
    if (file) {
      toast({
        description: `${file.name} uploaded successfully`,
      });
    }
  };

  const handleSubmitVerification = () => {
    const allDocumentsUploaded = Object.values(documents).every(doc => doc !== null);
    
    if (!allDocumentsUploaded) {
      toast({
        title: "Incomplete Submission",
        description: "Please upload all required documents",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Verification Submitted! 🎉",
      description: "We'll review your documents within 24-48 hours",
    });
  };

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case "verified":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-4 w-4 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <AppLayout>
      <SEOHead 
        title="Vendor Verification - EVENT-CONNECT"
        description="Complete your vendor verification to build trust and get more bookings on EVENT-CONNECT."
      />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Vendor Verification</h1>
            {getStatusBadge()}
          </div>
          <p className="text-muted-foreground">
            Complete verification to build trust and increase bookings
          </p>
        </div>

        {/* Why Verify Alert */}
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Why verify?</strong> Verified vendors get 3x more bookings and appear higher in search results.
            The verification process typically takes 24-48 hours.
          </AlertDescription>
        </Alert>

        {/* Current Status */}
        {verificationStatus === "verified" && (
          <Card className="p-6 mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Your account is verified! 🎉</h3>
                <p className="text-sm text-muted-foreground">
                  You're all set to receive bookings. Customers will see a verified badge on your profile.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Document Upload Form */}
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Required Documents</h2>
            <Separator className="mb-6" />
            
            <div className="space-y-6">
              {/* Business License */}
              <div>
                <Label htmlFor="businessLicense" className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  Business License/Registration Certificate *
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="businessLicense"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload("businessLicense", e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {documents.businessLicense && (
                    <Badge variant="secondary" className="self-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, or PNG • Max 5MB
                </p>
              </div>

              {/* Tax ID */}
              <div>
                <Label htmlFor="taxId" className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  GST Certificate or PAN Card *
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="taxId"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload("taxId", e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {documents.taxId && (
                    <Badge variant="secondary" className="self-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, or PNG • Max 5MB
                </p>
              </div>

              {/* Address Proof */}
              <div>
                <Label htmlFor="addressProof" className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  Address Proof (Aadhar/Utility Bill) *
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="addressProof"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload("addressProof", e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {documents.addressProof && (
                    <Badge variant="secondary" className="self-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, or PNG • Max 5MB
                </p>
              </div>

              {/* Portfolio */}
              <div>
                <Label htmlFor="portfolio" className="flex items-center gap-2 mb-2">
                  <Upload className="h-4 w-4" />
                  Portfolio/Work Samples *
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="portfolio"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={(e) => handleFileUpload("portfolio", e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {documents.portfolio && (
                    <Badge variant="secondary" className="self-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload up to 10 images of your previous work • JPG or PNG • Max 5MB each
                </p>
              </div>

              {/* Additional Information */}
              <div>
                <Label htmlFor="additionalInfo" className="mb-2 block">
                  Additional Information (Optional)
                </Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Any additional details about your business, awards, certifications, etc."
                  rows={4}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button onClick={handleSubmitVerification} className="flex-1">
              Submit for Verification
            </Button>
            <Button variant="outline" className="flex-1">
              Save Draft
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By submitting, you agree to our verification terms and conditions
          </p>
        </Card>

        {/* Verification Timeline */}
        <Card className="p-6 mt-6">
          <h3 className="font-bold mb-4">Verification Process</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  1
                </div>
                <div className="w-px h-full bg-border mt-2"></div>
              </div>
              <div className="pb-6">
                <h4 className="font-semibold">Submit Documents</h4>
                <p className="text-sm text-muted-foreground">Upload all required documents</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  2
                </div>
                <div className="w-px h-full bg-border mt-2"></div>
              </div>
              <div className="pb-6">
                <h4 className="font-semibold">Document Review</h4>
                <p className="text-sm text-muted-foreground">Our team reviews your submission (24-48 hours)</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Get Verified</h4>
                <p className="text-sm text-muted-foreground">Receive verification badge and start getting more bookings</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default VendorVerification;
