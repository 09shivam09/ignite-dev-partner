import { createContext, useContext, useEffect, useState } from "react";

interface AccessibilityContextType {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: React.ReactNode }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  useEffect(() => {
    // Check system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(prefersReducedMotion.matches);

    // Load saved preferences
    const savedReducedMotion = localStorage.getItem('reducedMotion');
    const savedHighContrast = localStorage.getItem('highContrast');
    const savedFontSize = localStorage.getItem('fontSize');

    if (savedReducedMotion) setReducedMotion(savedReducedMotion === 'true');
    if (savedHighContrast) setHighContrast(savedHighContrast === 'true');
    if (savedFontSize) setFontSize(savedFontSize as any);
  }, []);

  useEffect(() => {
    // Apply accessibility settings
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.setAttribute('data-font-size', fontSize);

    // Save preferences
    localStorage.setItem('reducedMotion', String(reducedMotion));
    localStorage.setItem('highContrast', String(highContrast));
    localStorage.setItem('fontSize', fontSize);
  }, [reducedMotion, highContrast, fontSize]);

  const toggleReducedMotion = () => setReducedMotion(!reducedMotion);
  const toggleHighContrast = () => setHighContrast(!highContrast);

  return (
    <AccessibilityContext.Provider
      value={{
        reducedMotion,
        highContrast,
        fontSize,
        toggleReducedMotion,
        toggleHighContrast,
        setFontSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
