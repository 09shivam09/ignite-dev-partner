import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Award } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface NFTGatedFeatureProps {
  children: ReactNode;
  featureName: string;
  showPreview?: boolean;
}

export const NFTGatedFeature = ({
  children,
  featureName,
  showPreview = false,
}: NFTGatedFeatureProps) => {
  const { hasNFT, status } = useWallet();
  const navigate = useNavigate();

  if (hasNFT) {
    return <>{children}</>;
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Blurred preview */}
      {showPreview && (
        <div className="blur-sm opacity-50 pointer-events-none">
          {children}
        </div>
      )}

      {/* Lock overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      >
        <CardContent className="text-center space-y-4 max-w-md">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="flex justify-center"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold">NFT Required</h3>
            <p className="text-sm text-muted-foreground">
              {featureName} is exclusive to EVENT-CONNECT NFT holders
            </p>
          </div>

          <Button
            onClick={() => navigate("/mint-nft")}
            className="gap-2"
            size="lg"
          >
            <Award className="h-4 w-4" />
            Mint Your NFT
          </Button>

          {status !== "connected" && (
            <p className="text-xs text-muted-foreground">
              Connect your wallet to get started
            </p>
          )}
        </CardContent>
      </motion.div>
    </Card>
  );
};
