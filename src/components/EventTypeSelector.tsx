import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Church, Cake, Briefcase, Coffee, Heart, Gem } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface EventType {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
}

const eventTypes: EventType[] = [
  { id: "wedding", name: "Wedding", icon: Church, color: "from-pink-500/20 to-rose-500/20", iconColor: "text-pink-500" },
  { id: "birthday", name: "Birthday", icon: Cake, color: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-500" },
  { id: "corporate", name: "Corporate", icon: Briefcase, color: "from-purple-500/20 to-indigo-500/20", iconColor: "text-purple-500" },
  { id: "kitty", name: "Kitty Party", icon: Coffee, color: "from-orange-500/20 to-amber-500/20", iconColor: "text-orange-500" },
  { id: "anniversary", name: "Anniversary", icon: Heart, color: "from-red-500/20 to-pink-500/20", iconColor: "text-red-500" },
  { id: "engagement", name: "Engagement", icon: Gem, color: "from-violet-500/20 to-purple-500/20", iconColor: "text-violet-500" },
];

export const EventTypeSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Plan Your Event</h2>
        <div className="h-1 flex-1 ml-4 bg-gradient-to-r from-primary/20 to-transparent rounded-full"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {eventTypes.map((event, index) => {
          const Icon = event.icon;
          return (
            <Card
              key={event.id}
              onClick={() => navigate(`/search?eventType=${event.id}`)}
              className={`glass glass-hover cursor-pointer p-6 border-0 bg-gradient-to-br ${event.color} animate-fade-in group`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`w-14 h-14 rounded-2xl bg-white/80 dark:bg-black/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <Icon className={`h-7 w-7 ${event.iconColor}`} />
                </div>
                <span className="font-semibold group-hover:text-primary transition-colors">
                  {event.name}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
