import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const WalletStatus = () => {
  const { address, status, network, balance, connect, disconnect, isConnecting } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "wrong_network":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "border-green-500/50 bg-green-500/10";
      case "wrong_network":
        return "border-yellow-500/50 bg-yellow-500/10";
      default:
        return "";
    }
  };

  if (status === "disconnected") {
    return (
      <Button onClick={connect} disabled={isConnecting} variant="outline" className="gap-2">
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`gap-2 ${getStatusColor()}`}>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            {getStatusIcon()}
          </motion.div>
          <span className="hidden sm:inline">{address && formatAddress(address)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Wallet Details</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address</span>
            <code className="text-xs">{address && formatAddress(address)}</code>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Network</span>
            <Badge variant="outline" className="capitalize">
              {network}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="text-sm font-semibold">{balance} ETH</span>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="text-red-500">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
