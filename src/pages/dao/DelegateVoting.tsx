import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BlockchainLoader } from "@/components/web3/BlockchainLoader";

export default function DelegateVoting() {
  const navigate = useNavigate();
  const [delegations, setDelegations] = useState<any[]>([]);
  const [votingPower, setVotingPower] = useState(100);
  const [delegateAddress, setDelegateAddress] = useState("");
  const [delegatePower, setDelegatePower] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDelegations();
  }, []);

  const fetchDelegations = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("delegates")
      .select(`
        *,
        profiles!delegates_delegate_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq("delegator_id", user.id);

    if (data) {
      setDelegations(data);
      const totalDelegated = data.reduce((sum, d) => sum + d.voting_power, 0);
      setVotingPower(100 - totalDelegated);
    }
    setLoading(false);
  };

  const handleDelegate = async () => {
    if (!delegateAddress || delegatePower <= 0 || delegatePower > votingPower) {
      toast.error("Invalid delegation parameters");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to delegate voting power");
      return;
    }

    setProcessing(true);

    try {
      // Simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock: In real implementation, validate delegate address
      const { error } = await supabase
        .from("delegates")
        .insert({
          delegator_id: user.id,
          delegate_id: delegateAddress,
          voting_power: delegatePower,
        });

      if (error) throw error;

      toast.success("Voting power delegated successfully!");
      setDelegateAddress("");
      setDelegatePower(0);
      fetchDelegations();
    } catch (error: any) {
      toast.error(error.message || "Failed to delegate voting power");
    } finally {
      setProcessing(false);
    }
  };

  const handleRevoke = async (delegationId: string, power: number) => {
    setProcessing(true);

    try {
      // Simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { error } = await supabase
        .from("delegates")
        .delete()
        .eq("id", delegationId);

      if (error) throw error;

      toast.success("Delegation revoked successfully!");
      fetchDelegations();
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke delegation");
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Card className="p-6">
            <BlockchainLoader
              message="Processing delegation transaction..."
              step={1}
              totalSteps={2}
            />
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dao")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Voting Power Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Voting Power</CardTitle>
              <CardDescription>
                Your available voting power for governance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-4xl font-bold">{votingPower}</p>
                </div>
                <Users className="h-12 w-12 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delegate Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Delegate Voting Power</CardTitle>
              <CardDescription>
                Assign your voting power to another address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Delegate Address</Label>
                <Input
                  id="address"
                  placeholder="0x..."
                  value={delegateAddress}
                  onChange={(e) => setDelegateAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="power">Voting Power</Label>
                <Input
                  id="power"
                  type="number"
                  min="1"
                  max={votingPower}
                  value={delegatePower}
                  onChange={(e) => setDelegatePower(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Available: {votingPower} voting power
                </p>
              </div>

              <Button
                onClick={handleDelegate}
                disabled={!delegateAddress || delegatePower <= 0 || delegatePower > votingPower}
                className="w-full"
              >
                Delegate Voting Power
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Delegations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Active Delegations</CardTitle>
              <CardDescription>
                Your current voting power delegations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading...
                  </div>
                ) : delegations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active delegations
                  </div>
                ) : (
                  <div className="space-y-3">
                    {delegations.map((delegation, index) => (
                      <motion.div
                        key={delegation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar>
                            <AvatarImage src={delegation.profiles?.avatar_url} />
                            <AvatarFallback>
                              {delegation.profiles?.full_name?.charAt(0) || "D"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {delegation.profiles?.full_name || "Delegate"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {delegation.delegate_id.slice(0, 8)}...
                              {delegation.delegate_id.slice(-6)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {delegation.voting_power} power
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevoke(delegation.id, delegation.voting_power)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
