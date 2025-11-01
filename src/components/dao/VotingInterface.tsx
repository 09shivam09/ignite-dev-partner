import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, Minus, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BlockchainLoader } from "@/components/web3/BlockchainLoader";
import confetti from "canvas-confetti";

interface VotingInterfaceProps {
  proposalId: string;
  hasVoted: boolean;
  onVoteSuccess: () => void;
}

export const VotingInterface = ({
  proposalId,
  hasVoted,
  onVoteSuccess,
}: VotingInterfaceProps) => {
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const voteOptions = [
    { type: "yes", label: "Yes", icon: ThumbsUp, color: "green" },
    { type: "no", label: "No", icon: ThumbsDown, color: "red" },
    { type: "abstain", label: "Abstain", icon: Minus, color: "gray" },
  ];

  const handleVote = async () => {
    if (!selectedVote) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to vote");
      return;
    }

    setIsVoting(true);

    try {
      // Simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Cast vote
      const { error: voteError } = await supabase
        .from("votes")
        .insert({
          proposal_id: proposalId,
          user_id: user.id,
          vote_type: selectedVote,
          voting_power: 1,
        });

      if (voteError) throw voteError;

      // Update proposal counts
      const { data: currentProposal } = await supabase
        .from("proposals")
        .select("yes_votes, no_votes, abstain_votes")
        .eq("id", proposalId)
        .single();

      if (currentProposal) {
        const updates: any = {};
        if (selectedVote === "yes") updates.yes_votes = (currentProposal.yes_votes || 0) + 1;
        if (selectedVote === "no") updates.no_votes = (currentProposal.no_votes || 0) + 1;
        if (selectedVote === "abstain") updates.abstain_votes = (currentProposal.abstain_votes || 0) + 1;

        await supabase
          .from("proposals")
          .update(updates)
          .eq("id", proposalId);
      }

      // Show success animation
      setShowSuccess(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      setTimeout(() => {
        toast.success("Vote cast successfully!");
        onVoteSuccess();
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to cast vote");
      setIsVoting(false);
    }
  };

  if (hasVoted && !isVoting && !showSuccess) {
    return (
      <Card className="p-6 text-center bg-muted/50">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
        <p className="font-semibold">You've already voted on this proposal</p>
      </Card>
    );
  }

  if (isVoting) {
    return (
      <Card className="p-6">
        <BlockchainLoader message="Casting your vote..." step={1} totalSteps={2} />
      </Card>
    );
  }

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
          </motion.div>
          <h3 className="text-xl font-bold mb-2">Vote Cast Successfully!</h3>
          <p className="text-muted-foreground">
            Your vote has been recorded on the blockchain
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-2">Cast Your Vote</h3>
        <p className="text-sm text-muted-foreground">
          Select your voting position
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {voteOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedVote === option.type;

          return (
            <motion.button
              key={option.type}
              onClick={() => setSelectedVote(option.type)}
              className={`relative p-6 rounded-lg border-2 transition-all ${
                isSelected
                  ? `border-${option.color}-500 bg-${option.color}-500/10`
                  : "border-border hover:border-${option.color}-500/50"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon
                  className={`h-8 w-8 ${
                    isSelected ? `text-${option.color}-500` : "text-muted-foreground"
                  }`}
                />
                <span className="font-semibold">{option.label}</span>
              </div>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2 right-2"
                  >
                    <CheckCircle2 className={`h-5 w-5 text-${option.color}-500`} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <Button
        onClick={handleVote}
        disabled={!selectedVote || isVoting}
        className="w-full"
        size="lg"
      >
        Submit Vote
      </Button>
    </Card>
  );
};
