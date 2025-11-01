import { motion } from "framer-motion";
import { Award, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NFTBadgeProps {
  hasNFT: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  showLabel?: boolean;
}

export const NFTBadge = ({ hasNFT, size = "md", onClick, showLabel = true }: NFTBadgeProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  if (!hasNFT) {
    return showLabel ? (
      <Badge variant="outline" className="gap-1">
        <Lock className="h-3 w-3" />
        No NFT
      </Badge>
    ) : null;
  }

  return (
    <div className="relative inline-flex" onClick={onClick}>
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-full"
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
        style={{
          padding: "3px",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      
      {/* Badge content */}
      <div
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
      >
        <Award className="h-1/2 w-1/2 text-white" />
      </div>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full blur-md opacity-50"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "linear-gradient(45deg, #ff00ff, #00ffff)",
        }}
      />
    </div>
  );
};
