import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface BlockchainLoaderProps {
  message?: string;
  step?: number;
  totalSteps?: number;
}

export const BlockchainLoader = ({ message = "Processing transaction...", step, totalSteps }: BlockchainLoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      {/* Animated blockchain icon */}
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        className="relative"
      >
        <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary" />
        
        {/* Center icon */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
      </motion.div>

      {/* Progress text */}
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">{message}</p>
        {step !== undefined && totalSteps !== undefined && (
          <p className="text-xs text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex items-center space-x-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="h-2 w-2 rounded-full bg-primary"
          />
        ))}
      </div>
    </div>
  );
};
