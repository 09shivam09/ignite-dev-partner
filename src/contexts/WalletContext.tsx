import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type WalletStatus = "connected" | "disconnected" | "wrong_network";
type NetworkType = "ethereum" | "polygon" | "arbitrum" | null;

interface WalletContextType {
  address: string | null;
  status: WalletStatus;
  network: NetworkType;
  balance: string;
  hasNFT: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: NetworkType) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [network, setNetwork] = useState<NetworkType>(null);
  const [balance, setBalance] = useState("0");
  const [hasNFT, setHasNFT] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load saved wallet state
  useEffect(() => {
    const savedAddress = localStorage.getItem("wallet_address");
    const savedNetwork = localStorage.getItem("wallet_network") as NetworkType;
    const savedHasNFT = localStorage.getItem("has_nft") === "true";

    if (savedAddress && savedNetwork) {
      setAddress(savedAddress);
      setNetwork(savedNetwork);
      setStatus("connected");
      setBalance("1.234"); // Mock balance
      setHasNFT(savedHasNFT);
    }
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    
    // Simulate wallet connection
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Mock wallet address
    const mockAddress = "0x" + Math.random().toString(16).slice(2, 42);
    setAddress(mockAddress);
    setStatus("connected");
    setNetwork("ethereum");
    setBalance("1.234");
    
    localStorage.setItem("wallet_address", mockAddress);
    localStorage.setItem("wallet_network", "ethereum");
    
    setIsConnecting(false);
  };

  const disconnect = () => {
    setAddress(null);
    setStatus("disconnected");
    setNetwork(null);
    setBalance("0");
    setHasNFT(false);
    
    localStorage.removeItem("wallet_address");
    localStorage.removeItem("wallet_network");
    localStorage.removeItem("has_nft");
  };

  const switchNetwork = async (newNetwork: NetworkType) => {
    if (!newNetwork) return;
    
    setStatus("wrong_network");
    
    // Simulate network switch
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setNetwork(newNetwork);
    setStatus("connected");
    localStorage.setItem("wallet_network", newNetwork);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        status,
        network,
        balance,
        hasNFT,
        isConnecting,
        connect,
        disconnect,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
