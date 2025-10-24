import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MessageCircle } from "lucide-react";

const Chat = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const conversations = [
    { 
      id: "1", 
      vendorName: "Elite Photography", 
      lastMessage: "Thanks for choosing us!", 
      timestamp: "2 min ago",
      unread: 2,
      avatar: "EP"
    },
    { 
      id: "2", 
      vendorName: "Gourmet Catering Co.", 
      lastMessage: "Menu customization available", 
      timestamp: "1 hour ago",
      unread: 0,
      avatar: "GC"
    },
    { 
      id: "3", 
      vendorName: "Dream Decorators", 
      lastMessage: "We have your booking confirmed", 
      timestamp: "Yesterday",
      unread: 1,
      avatar: "DD"
    },
    { 
      id: "4", 
      vendorName: "Grand Event Venues", 
      lastMessage: "Available dates sent", 
      timestamp: "2 days ago",
      unread: 0,
      avatar: "GV"
    },
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-border">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => navigate(`/chat/${conversation.id}`)}
              className="flex items-center gap-3 p-4 hover:bg-card-foreground/5 cursor-pointer transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {conversation.avatar}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold truncate">{conversation.vendorName}</h3>
                  <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                  {conversation.unread > 0 && (
                    <span className="ml-2 h-5 w-5 rounded-full bg-accent text-white text-xs flex items-center justify-center flex-shrink-0">
                      {conversation.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No conversations found</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Chat;
