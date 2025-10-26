import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/onboarding");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float [animation-delay:1s]"></div>
      </div>
      
      <div className="text-center animate-fade-in-up relative z-10">
        <div className="mb-8 flex items-center justify-center">
          <div className="text-7xl font-bold text-gradient-primary animate-pulse-glow">
            EVENT-CONNECT
          </div>
        </div>
        <p className="text-lg text-muted-foreground mb-8 animate-fade-in [animation-delay:0.3s]">
          Your Premium Event Planning Solution
        </p>
        <div className="flex justify-center space-x-3">
          <div className="h-4 w-4 bg-gradient-to-r from-primary to-accent rounded-full animate-bounce shadow-glow"></div>
          <div className="h-4 w-4 bg-gradient-to-r from-accent to-primary rounded-full animate-bounce [animation-delay:0.2s] shadow-glow"></div>
          <div className="h-4 w-4 bg-gradient-to-r from-primary to-accent rounded-full animate-bounce [animation-delay:0.4s] shadow-glow"></div>
        </div>
        <p className="mt-12 text-xs text-muted-foreground/60">v1.0.0</p>
      </div>
    </div>
  );
};

export default Splash;
