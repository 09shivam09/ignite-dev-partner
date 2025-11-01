import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, TrendingUp, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface ProposalCardProps {
  proposal: any;
  onUpdate: () => void;
}

export const ProposalCard = ({ proposal, onUpdate }: ProposalCardProps) => {
  const navigate = useNavigate();
  
  const profile = proposal.profiles || {};
  const totalVotes = (proposal.yes_votes || 0) + (proposal.no_votes || 0) + (proposal.abstain_votes || 0);
  const yesPercentage = totalVotes > 0 ? (proposal.yes_votes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (proposal.no_votes / totalVotes) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500";
      case "passed":
        return "bg-blue-500/10 text-blue-500";
      case "rejected":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const timeLeft = formatDistanceToNow(new Date(proposal.voting_ends_at), {
    addSuffix: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate(`/dao/proposals/${proposal.id}`)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>
                  {profile.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg line-clamp-1">
                  {proposal.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  by {profile.full_name || "Anonymous"}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(proposal.status)}>
              {proposal.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {proposal.description}
          </p>

          {/* Voting Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Voting Progress</span>
              <span className="font-medium">{totalVotes} votes</span>
            </div>

            {/* Yes votes */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-green-500">Yes</span>
                <span>{proposal.yes_votes} ({yesPercentage.toFixed(1)}%)</span>
              </div>
              <Progress value={yesPercentage} className="h-2 bg-muted">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${yesPercentage}%` }}
                />
              </Progress>
            </div>

            {/* No votes */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-red-500">No</span>
                <span>{proposal.no_votes} ({noPercentage.toFixed(1)}%)</span>
              </div>
              <Progress value={noPercentage} className="h-2 bg-muted">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${noPercentage}%` }}
                />
              </Progress>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Ends {timeLeft}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Quorum: {proposal.quorum_required}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>
              {totalVotes >= proposal.quorum_required ? "Met" : "Pending"}
            </span>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
