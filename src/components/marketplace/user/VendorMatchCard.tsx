/**
 * Enhanced Vendor Card with Match Score, "Why Recommended?", and Activity Indicators.
 * Used in the VendorDiscovery page.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star, MapPin, Send, Check, Heart, GitCompareArrows,
  ChevronDown, ChevronUp, Clock, Zap, Shield
} from "lucide-react";
import { getCityLabel, formatPriceRange } from "@/lib/constants";
import type { MatchScoreResult } from "@/lib/budget-intelligence";

export interface VendorCardData {
  id: string;
  business_name: string;
  business_description: string | null;
  city: string;
  rating: number | null;
  total_reviews: number | null;
  matchedServices: { name: string; price_min: number; price_max: number }[];
  matchScore: MatchScoreResult;
  responseTimeHours: number | null;
  verificationStatus: string | null;
  lastActiveLabel: string;
  acceptanceRate: number | null;
}

interface VendorMatchCardProps {
  vendor: VendorCardData;
  isInquirySent: boolean;
  isSaved: boolean;
  isComparing: boolean;
  onSendInquiry: () => void;
  onToggleSave: () => void;
  onToggleCompare: () => void;
}

const VendorMatchCard = ({
  vendor, isInquirySent, isSaved, isComparing,
  onSendInquiry, onToggleSave, onToggleCompare,
}: VendorMatchCardProps) => {
  const navigate = useNavigate();
  const [showReasons, setShowReasons] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-secondary';
    return 'text-muted-foreground';
  };

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            {/* Header with match score */}
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{vendor.business_name}</h3>
              <Badge variant="outline" className={`font-bold ${getScoreColor(vendor.matchScore.score)}`}>
                {vendor.matchScore.score}% Match
              </Badge>
              {vendor.verificationStatus === 'verified' && (
                <Shield className="h-4 w-4 text-primary" />
              )}
            </div>

            {/* Location & Rating */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />{getCityLabel(vendor.city)}
              </span>
              {vendor.rating && vendor.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {Number(vendor.rating).toFixed(1)} ({vendor.total_reviews})
                </span>
              )}
            </div>

            {/* Activity Indicators */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
              {vendor.responseTimeHours !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {vendor.responseTimeHours <= 4 ? 'Replies in <4h' :
                   vendor.responseTimeHours <= 12 ? 'Replies in <12h' :
                   vendor.responseTimeHours <= 24 ? 'Replies in <24h' : `~${vendor.responseTimeHours}h response`}
                </span>
              )}
              {vendor.acceptanceRate !== null && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {vendor.acceptanceRate}% acceptance
                </span>
              )}
              <span className="flex items-center gap-1 opacity-70">
                {vendor.lastActiveLabel}
              </span>
            </div>

            {vendor.business_description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{vendor.business_description}</p>
            )}

            {/* Services & Pricing */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Services & Pricing:</p>
              <div className="flex flex-wrap gap-2">
                {vendor.matchedServices.map((s, idx) => (
                  <Badge key={idx} variant="outline">
                    {s.name} <span className="text-muted-foreground ml-1">{formatPriceRange(s.price_min, s.price_max)}</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Why Recommended? */}
            {vendor.matchScore.reasons.length > 0 && (
              <button
                onClick={() => setShowReasons(!showReasons)}
                className="flex items-center gap-1 mt-3 text-xs text-primary hover:underline"
              >
                Why recommended?
                {showReasons ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            {showReasons && (
              <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <ul className="space-y-1">
                  {vendor.matchScore.reasons.map((reason, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {isInquirySent ? (
              <Button variant="outline" disabled><Check className="h-4 w-4 mr-1" />Inquiry Sent</Button>
            ) : (
              <Button onClick={onSendInquiry}><Send className="h-4 w-4 mr-1" />Send Inquiry</Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/marketplace/vendor/${vendor.id}`)}>View Profile</Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onToggleSave}
                className={isSaved ? 'text-destructive' : 'text-muted-foreground'}>
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggleCompare}
                className={isComparing ? 'text-primary' : 'text-muted-foreground'}>
                <GitCompareArrows className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorMatchCard;
