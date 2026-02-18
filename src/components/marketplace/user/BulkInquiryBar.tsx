/**
 * Bulk Inquiry Bar — Floating action bar for multi-vendor inquiry.
 */
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BulkInquiryBarProps {
  selectedCount: number;
  onSendAll: () => void;
  onClear: () => void;
  isSending: boolean;
}

const BulkInquiryBar = ({ selectedCount, onSendAll, onClear, isSending }: BulkInquiryBarProps) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border shadow-xl shadow-primary/10">
            <span className="text-sm font-medium">
              {selectedCount} vendor{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button size="sm" onClick={onSendAll} disabled={isSending}>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {isSending ? 'Sending…' : 'Send Inquiry to All'}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkInquiryBar;
