import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Plus, TrendingUp, Users, Vote, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { NFTGatedFeature } from "@/components/web3/NFTGatedFeature";

export default function DAODashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProposals: 0,
    activeProposals: 0,
    totalVotes: 0,
    participation: "0%",
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: proposals } = await supabase
      .from("proposals")
      .select("*, votes(count)")
      .order("created_at", { ascending: false });

    if (proposals) {
      const active = proposals.filter((p) => p.status === "active").length;
      const totalVotes = proposals.reduce((sum, p) => 
        sum + (p.yes_votes || 0) + (p.no_votes || 0) + (p.abstain_votes || 0), 0
      );

      setStats({
        totalProposals: proposals.length,
        activeProposals: active,
        totalVotes,
        participation: proposals.length > 0 
          ? `${Math.round((totalVotes / (proposals.length * 100)) * 100)}%`
          : "0%",
      });
    }
  };

  const statsCards = [
    {
      title: "Total Proposals",
      value: stats.totalProposals,
      icon: Vote,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Proposals",
      value: stats.activeProposals,
      icon: Clock,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Votes",
      value: stats.totalVotes,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Participation",
      value: stats.participation,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <AppLayout>
      <NFTGatedFeature featureName="DAO Governance" showPreview={true}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">DAO Governance</h1>
              <p className="text-muted-foreground">
                Community-driven decision making
              </p>
            </div>
            <Button
              onClick={() => navigate("/dao/proposals/create")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Proposal
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold mt-2">{stat.value}</p>
                      </div>
                      <div className={`${stat.bgColor} p-3 rounded-full`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Participate in governance activities
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-6"
                onClick={() => navigate("/dao/proposals")}
              >
                <Vote className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="font-semibold">View Proposals</p>
                  <p className="text-xs text-muted-foreground">
                    Browse and vote on proposals
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-6"
                onClick={() => navigate("/dao/proposals/create")}
              >
                <Plus className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="font-semibold">Create Proposal</p>
                  <p className="text-xs text-muted-foreground">
                    Submit new governance proposal
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-6"
                onClick={() => navigate("/dao/delegate")}
              >
                <Users className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="font-semibold">Delegate Voting</p>
                  <p className="text-xs text-muted-foreground">
                    Assign your voting power
                  </p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </NFTGatedFeature>
    </AppLayout>
  );
}
