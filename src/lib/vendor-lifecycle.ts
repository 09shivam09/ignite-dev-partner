/**
 * Vendor Lifecycle Tracking — Client-side (localStorage)
 * Tracks vendor status per event: shortlisted, negotiating, confirmed, rejected
 */

export type VendorLifecycleStatus = 'shortlisted' | 'negotiating' | 'confirmed' | 'rejected';

export const VENDOR_LIFECYCLE_LABELS: Record<VendorLifecycleStatus, string> = {
  shortlisted: 'Shortlisted',
  negotiating: 'Negotiating',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
};

export const VENDOR_LIFECYCLE_COLORS: Record<VendorLifecycleStatus, string> = {
  shortlisted: 'bg-gold/10 text-gold-foreground border-gold/30',
  negotiating: 'bg-warning/10 text-warning-foreground border-warning/30',
  confirmed: 'bg-success/10 text-success-foreground border-success/30',
  rejected: 'bg-destructive/10 text-destructive-foreground border-destructive/30',
};

const STORAGE_KEY = 'vendor_lifecycle';

interface LifecycleStore {
  [eventId: string]: {
    [vendorId: string]: {
      status: VendorLifecycleStatus;
      updatedAt: string;
      vendorName?: string;
    };
  };
}

function getStore(): LifecycleStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(store: LifecycleStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getVendorLifecycle(eventId: string, vendorId: string): VendorLifecycleStatus | null {
  const store = getStore();
  return store[eventId]?.[vendorId]?.status ?? null;
}

export function setVendorLifecycle(
  eventId: string,
  vendorId: string,
  status: VendorLifecycleStatus,
  vendorName?: string
) {
  const store = getStore();
  if (!store[eventId]) store[eventId] = {};
  store[eventId][vendorId] = { status, updatedAt: new Date().toISOString(), vendorName };
  saveStore(store);
}

export function removeVendorLifecycle(eventId: string, vendorId: string) {
  const store = getStore();
  if (store[eventId]) {
    delete store[eventId][vendorId];
    if (Object.keys(store[eventId]).length === 0) delete store[eventId];
  }
  saveStore(store);
}

export function getEventVendorLifecycles(eventId: string): Record<string, { status: VendorLifecycleStatus; vendorName?: string }> {
  const store = getStore();
  const result: Record<string, { status: VendorLifecycleStatus; vendorName?: string }> = {};
  const eventData = store[eventId];
  if (eventData) {
    for (const [vendorId, data] of Object.entries(eventData)) {
      result[vendorId] = { status: data.status, vendorName: data.vendorName };
    }
  }
  return result;
}

export function getLifecycleCounts(eventId: string): Record<VendorLifecycleStatus, number> {
  const lifecycles = getEventVendorLifecycles(eventId);
  const counts: Record<VendorLifecycleStatus, number> = {
    shortlisted: 0,
    negotiating: 0,
    confirmed: 0,
    rejected: 0,
  };
  for (const data of Object.values(lifecycles)) {
    counts[data.status]++;
  }
  return counts;
}
