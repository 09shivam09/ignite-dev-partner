import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Search, 
  Calendar, 
  CreditCard, 
  MessageCircle,
  Star,
  Settings,
  HelpCircle,
  ArrowLeft
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const sections = [
  {
    icon: BookOpen,
    title: "Getting Started",
    items: [
      { title: "Creating Your Account", content: "Sign up with your email or use Google authentication. Verify your email to unlock all features." },
      { title: "Setting Up Your Profile", content: "Add your personal information, preferences, and location to get personalized vendor recommendations." },
      { title: "Understanding the Dashboard", content: "Navigate through home, categories, bookings, messages, and profile sections easily." }
    ]
  },
  {
    icon: Search,
    title: "Finding Vendors",
    items: [
      { title: "Using Search & Filters", content: "Search by category, location, price range, ratings, and availability to find the perfect vendors." },
      { title: "AI Recommendations", content: "Get smart suggestions based on your event type, budget, and previous bookings." },
      { title: "Viewing Vendor Profiles", content: "Explore portfolios, reviews, pricing, and availability before making a decision." }
    ]
  },
  {
    icon: Calendar,
    title: "Booking Services",
    items: [
      { title: "Making a Booking", content: "Select services, choose date and time, add event details, and proceed to payment." },
      { title: "Multi-Vendor Cart", content: "Book services from multiple vendors in one seamless checkout process." },
      { title: "Managing Bookings", content: "Track, modify, or cancel bookings from your bookings dashboard." }
    ]
  },
  {
    icon: CreditCard,
    title: "Payments",
    items: [
      { title: "Payment Methods", content: "We accept credit/debit cards, digital wallets, and UPI payments through our secure gateway." },
      { title: "Applying Coupons", content: "Enter coupon codes at checkout to get discounts on your bookings." },
      { title: "Payment Security", content: "All transactions are encrypted and PCI-DSS compliant for your safety." }
    ]
  },
  {
    icon: MessageCircle,
    title: "Communication",
    items: [
      { title: "Chatting with Vendors", content: "Use real-time chat to discuss your requirements, ask questions, and negotiate services." },
      { title: "Notifications", content: "Receive instant updates on booking confirmations, messages, and event reminders." },
      { title: "Support", content: "Access our AI-powered support chat 24/7 for any questions or issues." }
    ]
  },
  {
    icon: Star,
    title: "Reviews & Ratings",
    items: [
      { title: "Leaving Reviews", content: "Rate and review vendors after your event to help other users make informed decisions." },
      { title: "Review Guidelines", content: "Keep reviews honest, respectful, and relevant to the service provided." },
      { title: "Reporting Issues", content: "Report inappropriate reviews or vendor behavior through the support system." }
    ]
  }
];

const faqs = [
  {
    question: "Is EVENT-CONNECT free to use?",
    answer: "Yes! Creating an account and browsing vendors is completely free. We only charge a small service fee when you complete a booking."
  },
  {
    question: "How do I cancel a booking?",
    answer: "Go to 'My Bookings', select the booking you want to cancel, and click 'Cancel Booking'. Refund policies vary by vendor and timing."
  },
  {
    question: "Are vendors verified?",
    answer: "Yes, all vendors go through a verification process including document checks, background verification, and quality assessment."
  },
  {
    question: "What if I have an issue with a vendor?",
    answer: "Contact our support team immediately through the in-app chat or email. We'll mediate and help resolve the issue."
  },
  {
    question: "Can I book vendors for events outside my city?",
    answer: "Yes! Use the location filter to search for vendors in any city. Some vendors may charge extra for travel."
  },
  {
    question: "How do I become a vendor?",
    answer: "Switch to the vendor app from your profile settings and complete the vendor registration process with your business details."
  }
];

export default function Documentation() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead 
        title="Documentation - EVENT-CONNECT Help Center"
        description="Learn how to use EVENT-CONNECT. Complete guides for finding vendors, booking services, payments, and more."
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Documentation</h1>
              <p className="text-sm text-muted-foreground">
                Everything you need to know about EVENT-CONNECT
              </p>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <HelpCircle className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-3xl font-bold">How can we help you?</h2>
            <p className="text-muted-foreground">
              Browse our guides below or search for specific topics
            </p>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold">{section.title}</h3>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item, itemIndex) => (
                    <AccordionItem key={itemIndex} value={`item-${index}-${itemIndex}`}>
                      <AccordionTrigger className="text-left">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">{item.content}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="bg-background rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Contact Support */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-bold">Still need help?</h2>
            <p className="text-muted-foreground">
              Our support team is available 24/7 to assist you
            </p>
            <Button size="lg" onClick={() => navigate('/')}>
              Contact Support
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
