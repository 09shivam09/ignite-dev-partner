import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { motion } from "framer-motion";

export const NetworkSwitchPrompt = () => {
  const { status, network, switchNetwork } = useWallet();

  if (status !== "wrong_network") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
    >
      <Alert variant="destructive" className="border-yellow-500 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Wrong Network</AlertTitle>
        <AlertDescription className="flex items-center justify-between mt-2">
          <span>Please switch to Ethereum Mainnet to continue</span>
          <Button
            size="sm"
            onClick={() => switchNetwork("ethereum")}
            className="ml-4"
          >
            Switch Network
          </Button>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};
