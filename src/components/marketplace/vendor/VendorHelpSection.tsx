import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MessageSquare, Search, Star, Zap } from "lucide-react";

/**
 * Self-Serve Help Section
 * Provides answers to common vendor questions
 * No external links or support tickets - purely informational
 */
export const VendorHelpSection = () => {
  const helpTopics = [
    {
      id: "inquiries",
      icon: MessageSquare,
      title: "How do inquiries work?",
      content: `When a customer creates an event and selects services that match yours, they can send you an inquiry. You'll see all inquiries on your dashboard with details about the event, budget, and date.

• NEW inquiries are less than 24 hours old
• PENDING inquiries are awaiting your response
• Accept or Reject inquiries using the action buttons

After accepting, the customer will receive your contact details and can reach out directly to discuss the event.`,
    },
    {
      id: "matching",
      icon: Search,
      title: "How does vendor matching work?",
      content: `You receive inquiries based on three matching criteria:

1. **City Match**: Your city must match the event's city
2. **Service Match**: You must offer at least one service the event needs
3. **Budget Match**: Your price range must overlap with the event's budget

All three conditions must be met for you to receive an inquiry. This ensures you only see relevant leads that match your business.`,
    },
    {
      id: "visibility",
      icon: Star,
      title: "How to improve profile visibility?",
      content: `A complete profile receives more inquiries. Focus on:

• **Description**: Write a detailed business description (50+ words recommended)
• **Services**: Add all services you offer with clear pricing
• **Pricing**: Set accurate price ranges - be competitive but realistic
• **City**: Make sure your city is correctly set

💡 Tip: Vendors with photos receive more inquiries. Keep your portfolio updated with recent work.`,
    },
    {
      id: "intent",
      icon: Zap,
      title: "What do intent tags mean?",
      content: `Intent tags help you prioritize inquiries:

• **High Intent**: Customer has provided budget, event date, and detailed requirements. These leads are more likely to convert.

• **Medium Intent**: Some information is missing but the inquiry is still valid.

Focus on high-intent inquiries first, but don't ignore medium-intent ones - a quick response can still win the booking.`,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          Help & Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {helpTopics.map((topic) => {
            const TopicIcon = topic.icon;
            return (
              <AccordionItem key={topic.id} value={topic.id}>
                <AccordionTrigger className="text-sm hover:no-underline">
                  <span className="flex items-center gap-2">
                    <TopicIcon className="h-4 w-4 text-muted-foreground" />
                    {topic.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-muted-foreground whitespace-pre-line pl-6">
                    {topic.content}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Anonymous Comparison Insight */}
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-primary">💡 Did you know?</span>{' '}
            Vendors with complete profiles and photos receive 3x more inquiries on average.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
