import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Award, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";

interface NFTPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nftData?: {
    name: string;
    description: string;
    image: string;
    attributes: { trait: string; value: string }[];
  };
}

export const NFTPreviewModal = ({ open, onOpenChange, nftData }: NFTPreviewModalProps) => {
  const defaultNFT = {
    name: "EVENT-CONNECT Profile NFT",
    description: "Exclusive profile NFT for verified EVENT-CONNECT members",
    image: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&h=400&fit=crop",
    attributes: [
      { trait: "Member Since", value: "2024" },
      { trait: "Level", value: "Gold" },
      { trait: "Events", value: "25" },
      { trait: "Rating", value: "4.9/5" },
    ],
  };

  const nft = nftData || defaultNFT;

  const handleShare = () => {
    toast.success("NFT link copied to clipboard!");
  };

  const handleViewOnChain = () => {
    toast.info("Opening blockchain explorer...");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            NFT Profile Badge
          </DialogTitle>
          <DialogDescription>
            Your exclusive EVENT-CONNECT membership NFT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* NFT Image with animated border */}
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-xl"
              animate={{
                background: [
                  "linear-gradient(0deg, #ff00ff, #00ffff)",
                  "linear-gradient(120deg, #00ffff, #ff00ff)",
                  "linear-gradient(240deg, #ff00ff, #00ffff)",
                  "linear-gradient(360deg, #00ffff, #ff00ff)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ padding: "4px" }}
            >
              <div className="bg-background rounded-xl h-full w-full" />
            </motion.div>

            <div className="relative p-4">
              <motion.img
                src={nft.image}
                alt={nft.name}
                className="w-full aspect-square object-cover rounded-xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* NFT Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">{nft.name}</h3>
              <p className="text-sm text-muted-foreground">{nft.description}</p>
            </div>

            {/* Attributes */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Attributes</h4>
              <div className="grid grid-cols-2 gap-2">
                {nft.attributes.map((attr, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-muted/50 rounded-lg p-3"
                  >
                    <p className="text-xs text-muted-foreground">{attr.trait}</p>
                    <p className="font-semibold">{attr.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Status Badge */}
            <Badge className="w-full justify-center" variant="outline">
              <Award className="h-3 w-3 mr-1" />
              Verified Owner
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleViewOnChain}
            >
              <ExternalLink className="h-4 w-4" />
              View on Chain
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
