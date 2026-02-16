/**
 * Cinematic auto-rotating celebration header with crossfade,
 * subtle zoom, blur + dark purple overlay, and vignette effect.
 * Used at top of User Portal only.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Curated celebration images — WebP recommended, <300KB each */
const CELEBRATION_IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=80&auto=format",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80&auto=format",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80&auto=format",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80&auto=format",
];

const ROTATION_INTERVAL = 10_000; // 10 seconds

interface CinematicHeaderProps {
  children?: React.ReactNode;
}

const CinematicHeader = ({ children }: CinematicHeaderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const advance = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % CELEBRATION_IMAGES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, ROTATION_INTERVAL);
    return () => clearInterval(timer);
  }, [advance]);

  return (
    <div className="relative w-full overflow-hidden" style={{ maxHeight: "40vh", minHeight: "280px" }}>
      {/* Rotating background images */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.03 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.5 }, scale: { duration: ROTATION_INTERVAL / 1000, ease: "linear" } }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${CELEBRATION_IMAGES[currentIndex]})`,
              filter: "blur(2px)",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark purple overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: "linear-gradient(to bottom, rgba(91, 61, 245, 0.7), rgba(17, 24, 39, 0.85))",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* Content overlay */}
      <div className="relative z-[3] flex flex-col justify-end h-full px-6 md:px-10 pb-16 pt-10">
        {children}
      </div>

      {/* Bottom fade into white */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 z-[3] pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, hsl(var(--background)))",
        }}
      />
    </div>
  );
};

export default CinematicHeader;
