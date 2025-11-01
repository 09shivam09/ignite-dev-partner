import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { BlockchainLoader } from "@/components/web3/BlockchainLoader";
import { NFTBadge } from "@/components/web3/NFTBadge";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Award, CheckCircle2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import confetti from "canvas-confetti";

type MintStage = "preview" | "minting" | "success";

const mintSteps = [
  { id: 1, label: "Preparing NFT" },
  { id: 2, label: "Uploading to IPFS" },
  { id: 3, label: "Creating transaction" },
  { id: 4, label: "Confirming on blockchain" },
  { id: 5, label: "Finalizing" },
];

export default function MintNFT() {
  const navigate = useNavigate();
  const { address, status, hasNFT } = useWallet();
  const [stage, setStage] = useState<MintStage>("preview");
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleMint = async () => {
    if (status !== "connected") {
      toast.error("Please connect your wallet first");
      return;
    }

    setStage("minting");
    
    // Simulate minting process
    for (let i = 0; i < mintSteps.length; i++) {
      setCurrentStep(i + 1);
      setProgress(((i + 1) / mintSteps.length) * 100);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Success
    setStage("success");
    localStorage.setItem("has_nft", "true");
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    
    toast.success("NFT minted successfully!");
  };

  const renderPreview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Mint Your Profile NFT
          </CardTitle>
          <CardDescription>
            Get your exclusive EVENT-CONNECT membership badge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* NFT Preview */}
          <div className="relative aspect-square max-w-sm mx-auto">
            <motion.div
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
              className="absolute inset-0 rounded-2xl p-1"
            >
              <div className="bg-background rounded-xl h-full w-full" />
            </motion.div>
            
            <div className="relative p-4">
              <img
                src="https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&h=400&fit=crop"
                alt="NFT Preview"
                className="w-full aspect-square object-cover rounded-xl"
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h3 className="font-semibold">NFT Benefits</h3>
            <div className="space-y-2">
              {[
                "Verified member badge on profile",
                "Access to exclusive events",
                "Priority booking privileges",
                "Early access to new features",
                "Community voting rights",
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {benefit}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minting Fee</span>
              <span className="font-semibold">0.05 ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas Fee (est.)</span>
              <span className="font-semibold">~0.002 ETH</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-primary">~0.052 ETH</span>
            </div>
          </div>

          {/* Mint Button */}
          <Button
            onClick={handleMint}
            disabled={status !== "connected" || hasNFT}
            className="w-full gap-2"
            size="lg"
          >
            {hasNFT ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Already Minted
              </>
            ) : (
              <>
                <Award className="h-5 w-5" />
                Mint NFT
              </>
            )}
          </Button>

          {status !== "connected" && (
            <p className="text-xs text-center text-muted-foreground">
              Please connect your wallet to mint
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderMinting = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Minting in Progress</CardTitle>
          <CardDescription>
            Please don't close this window
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <BlockchainLoader
            message={mintSteps[currentStep - 1]?.label || "Processing..."}
            step={currentStep}
            totalSteps={mintSteps.length}
          />

          <Progress value={progress} className="h-2" />

          <div className="space-y-2">
            {mintSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  step.id < currentStep
                    ? "bg-green-500/10 text-green-500"
                    : step.id === currentStep
                    ? "bg-primary/10 text-primary"
                    : "bg-muted/30 text-muted-foreground"
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center text-xs">
                    {step.id}
                  </div>
                )}
                <span className="text-sm font-medium">{step.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderSuccess = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <Card>
        <CardContent className="pt-6 space-y-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="flex justify-center"
          >
            <NFTBadge hasNFT={true} size="lg" showLabel={false} />
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Congratulations!</h2>
            <p className="text-muted-foreground">
              Your EVENT-CONNECT Profile NFT has been successfully minted
            </p>
          </div>

          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Verified on Blockchain
          </Badge>

          <div className="space-y-2 pt-4">
            <Button
              onClick={() => navigate("/profile")}
              className="w-full"
              size="lg"
            >
              View on Profile
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <AnimatePresence mode="wait">
          {stage === "preview" && renderPreview()}
          {stage === "minting" && renderMinting()}
          {stage === "success" && renderSuccess()}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
