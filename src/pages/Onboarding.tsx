import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const slides = [
  {
    title: "Discover Local Vendors",
    description: "Find the best event service providers in your area with just a tap",
    icon: "🔍",
  },
  {
    title: "Book with Confidence",
    description: "Read reviews, compare prices, and book multiple services seamlessly",
    icon: "✅",
  },
  {
    title: "Plan Perfect Events",
    description: "Manage all your bookings in one place with real-time updates",
    icon: "🎉",
  },
];

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/auth/signup");
    }
  };

  const handleSkip = () => {
    navigate("/auth/signup");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex justify-end p-4">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        <div className="text-center animate-fade-in">
          <div className="mb-8 text-8xl">{slides[currentSlide].icon}</div>
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            {slides[currentSlide].title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            {slides[currentSlide].description}
          </p>
        </div>

        <div className="mt-12 flex space-x-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-accent"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6">
        <Button
          onClick={handleNext}
          className="w-full"
          size="lg"
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
