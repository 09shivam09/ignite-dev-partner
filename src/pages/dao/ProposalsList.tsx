import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { ProposalCard } from "@/components/dao/ProposalCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function ProposalsList() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("proposals-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "proposals",
        },
        () => {
          fetchProposals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select(`
        *,
        profiles!proposals_creator_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProposals(data);
    }
    setLoading(false);
  };

  const filterProposals = (status: string) => {
    if (status === "all") return proposals;
    return proposals.filter((p) => p.status === status);
  };

  const renderProposalsList = (status: string) => {
    const filtered = filterProposals(status);

    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={Plus}
          title={`No ${status} proposals`}
          description="Be the first to create a proposal for the community"
          actionLabel="Create Proposal"
          onAction={() => navigate("/dao/proposals/create")}
        />
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 gap-4"
      >
        {filtered.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onUpdate={fetchProposals}
          />
        ))}
      </motion.div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dao")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Proposals</h1>
              <p className="text-muted-foreground">
                Community governance proposals
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/dao/proposals/create")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="passed">Passed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : (
              renderProposalsList("all")
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {renderProposalsList("active")}
          </TabsContent>

          <TabsContent value="passed" className="space-y-4">
            {renderProposalsList("passed")}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {renderProposalsList("rejected")}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
