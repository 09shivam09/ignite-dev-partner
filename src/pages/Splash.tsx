import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

const Splash = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 20);

    const timer = setTimeout(() => {
      navigate("/onboarding");
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-accent to-primary relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float [animation-delay:1s]" />
      </div>

      <div className="text-center space-y-12 animate-fade-in relative z-10 px-6">
        {/* Logo Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse-glow" />
            <div className="relative bg-white/10 p-8 rounded-full backdrop-blur-sm animate-scale-bounce">
              <Sparkles className="h-20 w-20 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Brand Name */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold text-white animate-scale-in tracking-tight">
            EVENT-CONNECT
          </h1>
          <p className="text-xl md:text-2xl text-white/90 animate-fade-in [animation-delay:0.3s] font-light">
            Your Perfect Event Awaits
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-xs mx-auto animate-fade-in [animation-delay:0.5s]">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300 ease-out shadow-glow"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Version Tag */}
        <p className="text-white/60 text-sm animate-fade-in [animation-delay:0.7s]">
          Version 1.0.0
        </p>
      </div>
    </div>
  );
};

export default Splash;
