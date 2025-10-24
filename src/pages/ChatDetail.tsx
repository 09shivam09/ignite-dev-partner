import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, MoreVertical, Phone } from "lucide-react";

const ChatDetail = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: "1", text: "Hi! I'm interested in your photography service.", sender: "user", timestamp: "10:30 AM" },
    { id: "2", text: "Hello! Thank you for reaching out. We'd love to help with your event.", sender: "vendor", timestamp: "10:32 AM" },
    { id: "3", text: "What dates are you available in March?", sender: "user", timestamp: "10:33 AM" },
    { id: "4", text: "We have availability on March 15th, 20th, and 25th. What type of event is it?", sender: "vendor", timestamp: "10:35 AM" },
  ]);

  const vendorInfo = {
    name: "Elite Photography",
    avatar: "EP",
  };

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: String(messages.length + 1),
      text: message,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, newMessage]);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {vendorInfo.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{vendorInfo.name}</h2>
              <p className="text-xs text-success">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                msg.sender === "user"
                  ? "bg-accent text-white"
                  : "bg-card-foreground/10"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <span className={`text-xs ${msg.sender === "user" ? "text-white/70" : "text-muted-foreground"} mt-1 block`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-card border-t border-border p-4">
        <div className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatDetail;
