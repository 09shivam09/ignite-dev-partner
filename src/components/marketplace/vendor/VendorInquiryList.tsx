import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, 
  MapPin, 
  MessageSquare, 
  Check, 
  X, 
  Sparkles,
  Clock,
  IndianRupee,
  PartyPopper,
  Zap,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { 
  getCityLabel, 
  getEventTypeLabel, 
  formatPriceRange,
  INQUIRY_STATUS,
  EVENT_TYPES,
} from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import type { VendorInquiryWithRelations } from "@/types/marketplace";

interface VendorInquiryListProps {
  inquiries: VendorInquiryWithRelations[];
  onAccept: (inquiry: VendorInquiryWithRelations) => void;
  onReject: (inquiry: VendorInquiryWithRelations) => void;
  onViewDetails?: (inquiry: VendorInquiryWithRelations) => void;
}

const ITEMS_PER_PAGE = 10;

const getInquiryIntent = (inquiry: VendorInquiryWithRelations): 'high' | 'medium' => {
  const hasBudget = (inquiry.events?.budget_min ?? 0) > 0 || (inquiry.events?.budget_max ?? 0) > 0;
  const hasDate = !!inquiry.events?.event_date;
  if (hasBudget && hasDate) return 'high';
  return 'medium';
};

const isNewInquiry = (inquiry: VendorInquiryWithRelations): boolean => {
  if (inquiry.status !== 'pending') return false;
  const createdAt = new Date(inquiry.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 24;
};

const getStatusConfig = (inquiry: VendorInquiryWithRelations) => {
  const isNew = isNewInquiry(inquiry);
  if (isNew) {
    return { variant: 'default' as const, label: 'NEW', icon: Sparkles, className: 'bg-primary' };
  }
  switch (inquiry.status) {
    case INQUIRY_STATUS.PENDING:
      return { variant: 'secondary' as const, label: 'Pending', icon: Clock, className: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' };
    case INQUIRY_STATUS.ACCEPTED:
      return { variant: 'default' as const, label: 'Accepted', icon: Check, className: 'bg-green-500/20 text-green-700 dark:text-green-400' };
    case INQUIRY_STATUS.REJECTED:
      return { variant: 'destructive' as const, label: 'Rejected', icon: X, className: 'bg-red-500/20 text-red-700 dark:text-red-400' };
    default:
      return { variant: 'secondary' as const, label: inquiry.status, icon: Clock, className: '' };
  }
};

export const VendorInquiryList = ({ 
  inquiries, 
  onAccept, 
  onReject,
  onViewDetails,
}: VendorInquiryListProps) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and sort
  const filteredInquiries = useMemo(() => {
    let result = [...inquiries];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(i => i.status === statusFilter);
    }

    // Event type filter
    if (eventTypeFilter !== "all") {
      result = result.filter(i => i.events?.event_type === eventTypeFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "budget-high": {
          const aMax = a.events?.budget_max ?? 0;
          const bMax = b.events?.budget_max ?? 0;
          return bMax - aMax;
        }
        case "budget-low": {
          const aMin = a.events?.budget_min ?? 0;
          const bMin = b.events?.budget_min ?? 0;
          return aMin - bMin;
        }
        case "date-upcoming": {
          const aDate = a.events?.event_date ? new Date(a.events.event_date).getTime() : Infinity;
          const bDate = b.events?.event_date ? new Date(b.events.event_date).getTime() : Infinity;
          return aDate - bDate;
        }
        case "newest":
        default: {
          // NEW first, then pending, then by date
          const aIsNew = isNewInquiry(a);
          const bIsNew = isNewInquiry(b);
          if (aIsNew && !bIsNew) return -1;
          if (!aIsNew && bIsNew) return 1;
          const aIsPending = a.status === 'pending';
          const bIsPending = b.status === 'pending';
          if (aIsPending && !bIsPending) return -1;
          if (!aIsPending && bIsPending) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      }
    });

    return result;
  }, [inquiries, statusFilter, eventTypeFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredInquiries.length / ITEMS_PER_PAGE);
  const paginatedInquiries = filteredInquiries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  // Unique event types present in inquiries
  const availableEventTypes = useMemo(() => {
    const types = new Set(inquiries.map(i => i.events?.event_type).filter(Boolean) as string[]);
    return EVENT_TYPES.filter(et => types.has(et.value));
  }, [inquiries]);

  if (inquiries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No inquiries yet</h3>
          <p className="text-sm text-muted-foreground">
            When clients send you inquiries, they'll appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {availableEventTypes.length > 1 && (
          <Select value={eventTypeFilter} onValueChange={handleFilterChange(setEventTypeFilter)}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {availableEventTypes.map(et => (
                <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={handleFilterChange(setSortBy)}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <ArrowUpDown className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="budget-high">Budget: High → Low</SelectItem>
            <SelectItem value="budget-low">Budget: Low → High</SelectItem>
            <SelectItem value="date-upcoming">Event Date: Soonest</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground ml-auto">
          {filteredInquiries.length} of {inquiries.length} inquiries
        </span>
      </div>

      {/* Inquiry Cards */}
      {paginatedInquiries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Filter className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No inquiries match your filters</p>
          </CardContent>
        </Card>
      ) : (
        paginatedInquiries.map((inquiry) => {
          const statusConfig = getStatusConfig(inquiry);
          const StatusIcon = statusConfig.icon;
          const isPending = inquiry.status === 'pending';
          const isNew = isNewInquiry(inquiry);
          const intent = getInquiryIntent(inquiry);

          return (
            <Card 
              key={inquiry.id} 
              className={`transition-all ${
                isNew 
                  ? 'border-primary shadow-md ring-1 ring-primary/20' 
                  : isPending 
                    ? 'border-yellow-500/50' 
                    : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-lg">{inquiry.events?.title}</h3>
                      <Badge className={statusConfig.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      {isPending && (
                        <Badge 
                          variant="outline"
                          className={intent === 'high' 
                            ? 'border-green-500/50 text-green-700 dark:text-green-400' 
                            : 'border-amber-500/50 text-amber-700 dark:text-amber-400'
                          }
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          {intent === 'high' ? 'High Intent' : 'Medium Intent'}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <PartyPopper className="h-4 w-4 flex-shrink-0" />
                        <span>{getEventTypeLabel(inquiry.events?.event_type || '')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{getCityLabel(inquiry.events?.city || '')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {inquiry.events?.event_date 
                            ? new Date(inquiry.events.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Date TBD'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <IndianRupee className="h-4 w-4 flex-shrink-0" />
                        <span>{formatPriceRange(inquiry.events?.budget_min, inquiry.events?.budget_max)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm">
                        <span className="font-medium">From:</span>{' '}
                        {inquiry.profiles?.full_name || 'Client'}
                        {inquiry.status === 'accepted' && inquiry.profiles?.email && (
                          <span className="text-muted-foreground ml-2">({inquiry.profiles.email})</span>
                        )}
                      </p>
                    </div>

                    {inquiry.message && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                          <MessageSquare className="h-3 w-3" />
                          Client Message
                        </div>
                        <p className="text-sm line-clamp-2">{inquiry.message}</p>
                      </div>
                    )}

                    {inquiry.vendor_response && (
                      <div className={`p-3 rounded-lg border ${
                        inquiry.status === 'accepted'
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-red-500/5 border-red-500/20'
                      }`}>
                        <div className="text-xs font-medium mb-1">Your Response</div>
                        <p className="text-sm line-clamp-2">{inquiry.vendor_response}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex lg:flex-col gap-2 lg:min-w-[120px]">
                    {onViewDetails && (
                      <Button size="sm" variant="ghost" onClick={() => onViewDetails(inquiry)} className="flex-1 lg:flex-none flex items-center justify-center gap-1">
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
                    )}
                    {isPending && (
                      <>
                        <Button size="sm" onClick={() => onAccept(inquiry)} className="flex-1 lg:flex-none flex items-center justify-center gap-1">
                          <Check className="h-4 w-4" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onReject(inquiry)} className="flex-1 lg:flex-none flex items-center justify-center gap-1">
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
