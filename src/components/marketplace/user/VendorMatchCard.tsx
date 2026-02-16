/**
 * Premium Vendor Card with Match Score, "Why Recommended?", and Activity Indicators.
 * Clean Luxury Light design — large visual header, spacious layout.
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
import { motion, AnimatePresence } from "framer-motion";
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

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg group">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left: Content */}
          <div className="flex-1 p-6 space-y-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold leading-tight">{vendor.business_name}</h3>
                  {vendor.verificationStatus === 'verified' && (
                    <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{getCityLabel(vendor.city)}
                  </span>
                  {vendor.rating && vendor.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      {Number(vendor.rating).toFixed(1)}
                      <span className="opacity-60">({vendor.total_reviews})</span>
                    </span>
                  )}
                </div>
              </div>
              {/* Match Score Pill */}
              <div className="flex-shrink-0">
                <Badge className="bg-primary text-primary-foreground font-bold text-sm px-3.5 py-1.5 rounded-full shadow-sm">
                  {vendor.matchScore.score}% match
                </Badge>
              </div>
            </div>

            {/* Activity indicators */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {vendor.responseTimeHours !== null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {vendor.responseTimeHours <= 4 ? '<4h reply' :
                   vendor.responseTimeHours <= 12 ? '<12h reply' :
                   vendor.responseTimeHours <= 24 ? '<24h reply' : `~${vendor.responseTimeHours}h`}
                </span>
              )}
              {vendor.acceptanceRate !== null && (
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  {vendor.acceptanceRate}% accept
                </span>
              )}
              <span className="opacity-50">{vendor.lastActiveLabel}</span>
            </div>

            {vendor.business_description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{vendor.business_description}</p>
            )}

            {/* Services */}
            <div className="flex flex-wrap gap-1.5">
              {vendor.matchedServices.map((s, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-normal bg-card">
                  {s.name} · {formatPriceRange(s.price_min, s.price_max)}
                </Badge>
              ))}
            </div>

            {/* Why Recommended */}
            {vendor.matchScore.reasons.length > 0 && (
              <div>
                <button
                  onClick={() => setShowReasons(!showReasons)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  Why recommended?
                  {showReasons ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                <AnimatePresence>
                  {showReasons && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-3 rounded-xl bg-accent/40">
                        <ul className="space-y-1.5">
                          {vendor.matchScore.reasons.map((reason, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex md:flex-col items-center md:items-stretch justify-center gap-2.5 p-5 md:w-44 border-t md:border-t-0 md:border-l border-border/30 bg-muted/30">
            {isInquirySent ? (
              <Button variant="outline" disabled className="flex-1 md:w-full text-xs h-9">
                <Check className="h-3.5 w-3.5 mr-1.5" />Sent
              </Button>
            ) : (
              <Button onClick={onSendInquiry} className="flex-1 md:w-full text-xs h-9">
                <Send className="h-3.5 w-3.5 mr-1.5" />Inquire
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-xs h-9"
              onClick={() => navigate(`/marketplace/vendor/${vendor.id}`)}>
              View Profile
            </Button>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleSave}>
                <Heart className={`h-4 w-4 transition-colors ${isSaved ? 'fill-love text-love' : 'text-muted-foreground'}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleCompare}>
                <GitCompareArrows className={`h-4 w-4 transition-colors ${isComparing ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorMatchCard;
