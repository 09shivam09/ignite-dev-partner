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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <div className="mb-8 flex items-center justify-center">
          <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            EVENT-CONNECT
          </div>
        </div>
        <div className="flex justify-center space-x-2">
          <div className="h-3 w-3 bg-accent rounded-full animate-bounce"></div>
          <div className="h-3 w-3 bg-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="h-3 w-3 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">v1.0.0</p>
      </div>
    </div>
  );
};

export default Splash;
