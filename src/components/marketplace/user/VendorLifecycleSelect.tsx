/**
 * Vendor Lifecycle Status Selector — Dropdown to mark vendor status per event.
 */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  type VendorLifecycleStatus,
  VENDOR_LIFECYCLE_LABELS,
  getVendorLifecycle,
  setVendorLifecycle,
  removeVendorLifecycle,
} from "@/lib/vendor-lifecycle";
import { useState, useCallback } from "react";
import { Star, MessageCircle, CheckCircle2, XCircle } from "lucide-react";

interface VendorLifecycleSelectProps {
  eventId: string;
  vendorId: string;
  vendorName?: string;
  onStatusChange?: (status: VendorLifecycleStatus | null) => void;
  compact?: boolean;
}

const STATUS_ICONS: Record<VendorLifecycleStatus, typeof Star> = {
  shortlisted: Star,
  negotiating: MessageCircle,
  confirmed: CheckCircle2,
  rejected: XCircle,
};

const STATUS_BADGE_VARIANTS: Record<VendorLifecycleStatus, string> = {
  shortlisted: 'bg-gold/15 text-gold-foreground border-gold/30 hover:bg-gold/20',
  negotiating: 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15',
  confirmed: 'bg-success/15 text-success border-success/30 hover:bg-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15',
};

const VendorLifecycleSelect = ({
  eventId, vendorId, vendorName, onStatusChange, compact = false,
}: VendorLifecycleSelectProps) => {
  const [status, setStatus] = useState<VendorLifecycleStatus | null>(
    () => getVendorLifecycle(eventId, vendorId)
  );

  const handleChange = useCallback((value: string) => {
    if (value === 'clear') {
      removeVendorLifecycle(eventId, vendorId);
      setStatus(null);
      onStatusChange?.(null);
    } else {
      const newStatus = value as VendorLifecycleStatus;
      setVendorLifecycle(eventId, vendorId, newStatus, vendorName);
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    }
  }, [eventId, vendorId, vendorName, onStatusChange]);

  if (compact && status) {
    const Icon = STATUS_ICONS[status];
    return (
      <Select value={status} onValueChange={handleChange}>
        <SelectTrigger className="h-7 w-auto border-0 p-0">
          <Badge className={`text-[10px] cursor-pointer ${STATUS_BADGE_VARIANTS[status]}`}>
            <Icon className="h-3 w-3 mr-1" />
            {VENDOR_LIFECYCLE_LABELS[status]}
          </Badge>
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(VENDOR_LIFECYCLE_LABELS) as [VendorLifecycleStatus, string][]).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
          <SelectItem value="clear">Clear Status</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={status || ''} onValueChange={handleChange}>
      <SelectTrigger className={compact ? "h-7 w-28 text-[10px]" : "h-8 w-36 text-xs"}>
        <SelectValue placeholder="Track status…" />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(VENDOR_LIFECYCLE_LABELS) as [VendorLifecycleStatus, string][]).map(([key, label]) => {
          const Icon = STATUS_ICONS[key];
          return (
            <SelectItem key={key} value={key}>
              <span className="flex items-center gap-1.5">
                <Icon className="h-3 w-3" />
                {label}
              </span>
            </SelectItem>
          );
        })}
        {status && <SelectItem value="clear">Clear Status</SelectItem>}
      </SelectContent>
    </Select>
  );
};

export default VendorLifecycleSelect;
