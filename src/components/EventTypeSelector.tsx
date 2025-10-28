import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface EventType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const eventTypes: EventType[] = [
  { id: "wedding", name: "Wedding", icon: "💒", color: "from-pink-500/20 to-rose-500/20" },
  { id: "birthday", name: "Birthday", icon: "🎂", color: "from-blue-500/20 to-cyan-500/20" },
  { id: "corporate", name: "Corporate", icon: "💼", color: "from-purple-500/20 to-indigo-500/20" },
  { id: "kitty", name: "Kitty Party", icon: "☕", color: "from-orange-500/20 to-amber-500/20" },
  { id: "anniversary", name: "Anniversary", icon: "💕", color: "from-red-500/20 to-pink-500/20" },
  { id: "engagement", name: "Engagement", icon: "💍", color: "from-violet-500/20 to-purple-500/20" },
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
        {eventTypes.map((event, index) => (
          <Card
            key={event.id}
            onClick={() => navigate(`/search?eventType=${event.id}`)}
            className={`glass glass-hover cursor-pointer p-6 border-0 bg-gradient-to-br ${event.color} animate-fade-in group`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                {event.icon}
              </div>
              <span className="font-semibold group-hover:text-primary transition-colors">
                {event.name}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
