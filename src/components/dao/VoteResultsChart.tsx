import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface VoteResultsChartProps {
  proposal: any;
}

export const VoteResultsChart = ({ proposal }: VoteResultsChartProps) => {
  const yesVotes = proposal.yes_votes || 0;
  const noVotes = proposal.no_votes || 0;
  const abstainVotes = proposal.abstain_votes || 0;
  const totalVotes = yesVotes + noVotes + abstainVotes;

  const yesPercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0;

  const quorumPercentage = (totalVotes / proposal.quorum_required) * 100;
  const quorumMet = totalVotes >= proposal.quorum_required;

  const pieData = [
    { name: "Yes", value: yesVotes, color: "#10b981" },
    { name: "No", value: noVotes, color: "#ef4444" },
    { name: "Abstain", value: abstainVotes, color: "#6b7280" },
  ].filter((item) => item.value > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vote Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Yes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="font-medium text-green-500">Yes</span>
              <span>
                {yesVotes} votes ({yesPercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={yesPercentage} className="h-3">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${yesPercentage}%` }}
              />
            </Progress>
          </motion.div>

          {/* No */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="font-medium text-red-500">No</span>
              <span>
                {noVotes} votes ({noPercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={noPercentage} className="h-3">
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${noPercentage}%` }}
              />
            </Progress>
          </motion.div>

          {/* Abstain */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-500">Abstain</span>
              <span>
                {abstainVotes} votes ({abstainPercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={abstainPercentage} className="h-3">
              <div
                className="h-full bg-gray-500 transition-all duration-500"
                style={{ width: `${abstainPercentage}%` }}
              />
            </Progress>
          </motion.div>

          {/* Quorum */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Quorum Progress</span>
              <span className={quorumMet ? "text-green-500" : "text-muted-foreground"}>
                {totalVotes} / {proposal.quorum_required} ({Math.min(quorumPercentage, 100).toFixed(1)}%)
              </span>
            </div>
            <Progress value={Math.min(quorumPercentage, 100)} className="h-3">
              <div
                className={`h-full transition-all duration-500 ${
                  quorumMet ? "bg-green-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(quorumPercentage, 100)}%` }}
              />
            </Progress>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vote Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {totalVotes === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No votes yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
