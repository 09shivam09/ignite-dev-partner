import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { VotingInterface } from "@/components/dao/VotingInterface";
import { VoteResultsChart } from "@/components/dao/VoteResultsChart";
import { ProposalCommentSection } from "@/components/dao/ProposalCommentSection";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProposalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProposal();
      checkIfVoted();
    }
  }, [id]);

  const fetchProposal = async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select(`
        *,
        profiles!proposals_creator_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq("id", id)
      .single();

    if (!error && data) {
      setProposal(data);
    }
    setLoading(false);
  };

  const checkIfVoted = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("votes")
      .select("id")
      .eq("proposal_id", id)
      .eq("user_id", user.id)
      .single();

    setHasVoted(!!data);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!proposal) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p>Proposal not found</p>
              <Button onClick={() => navigate("/dao/proposals")} className="mt-4">
                Back to Proposals
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const profile = proposal.profiles || {};
  const totalVotes = (proposal.yes_votes || 0) + (proposal.no_votes || 0) + (proposal.abstain_votes || 0);
  const timeLeft = formatDistanceToNow(new Date(proposal.voting_ends_at), { addSuffix: true });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dao/proposals")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Proposals
        </Button>

        {/* Proposal Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>
                      {profile.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{profile.full_name || "Anonymous"}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Ends {timeLeft}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{totalVotes} votes</span>
                    </div>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {proposal.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{proposal.description}</p>
            </div>

            {/* Vote Results Chart */}
            <VoteResultsChart proposal={proposal} />

            {/* Voting Interface */}
            {proposal.status === "active" && (
              <VotingInterface
                proposalId={proposal.id}
                hasVoted={hasVoted}
                onVoteSuccess={() => {
                  fetchProposal();
                  setHasVoted(true);
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Discussion</CardTitle>
          </CardHeader>
          <CardContent>
            <ProposalCommentSection proposalId={proposal.id} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
