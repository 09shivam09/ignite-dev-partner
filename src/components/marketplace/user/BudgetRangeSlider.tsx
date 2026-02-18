/**
 * Budget Range Slider — Dual-handle slider with real-time display + contextual guidance.
 * Uses Radix Slider under the hood (supports multi-value).
 */
import { useState, useCallback, useEffect } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { IndianRupee, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUDGET_GUIDANCE, getEventTypeLabel } from "@/lib/constants";

interface BudgetRangeSliderProps {
  eventType?: string;
  min?: number;
  max?: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

/** Format INR currency with lakhs/crores notation */
function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

const BudgetRangeSlider = ({
  eventType,
  min: propMin,
  max: propMax,
  step: propStep,
  value,
  onChange,
  className,
}: BudgetRangeSliderProps) => {
  const guide = eventType ? BUDGET_GUIDANCE[eventType] : null;
  
  // Determine slider bounds from guidance or sensible defaults
  const sliderMin = propMin ?? (guide ? Math.floor(guide.min * 0.3) : 5000);
  const sliderMax = propMax ?? (guide ? Math.ceil(guide.max * 1.5) : 5000000);
  const step = propStep ?? Math.max(1000, Math.round((sliderMax - sliderMin) / 200));

  // Ensure value is within bounds
  const safeValue: [number, number] = [
    Math.max(sliderMin, Math.min(value[0], sliderMax)),
    Math.max(sliderMin, Math.min(value[1], sliderMax)),
  ];

  const handleChange = useCallback((newValue: number[]) => {
    onChange([newValue[0], newValue[1]]);
  }, [onChange]);

  return (
    <div className={cn("space-y-5", className)}>
      {/* Budget guidance */}
      {guide && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/15">
          <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Most <span className="font-medium text-foreground">{getEventTypeLabel(eventType || '')}</span> events
            in your city range between{' '}
            <span className="font-medium text-foreground">{formatINR(guide.min)}</span> –{' '}
            <span className="font-medium text-foreground">{formatINR(guide.max)}</span>.
          </p>
        </div>
      )}

      {/* Range display */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <IndianRupee className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold">{formatINR(safeValue[0])}</span>
        </div>
        <span className="text-muted-foreground text-sm">to</span>
        <div className="flex items-center gap-1.5">
          <IndianRupee className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold">{formatINR(safeValue[1])}</span>
        </div>
      </div>

      {/* Dual-handle slider */}
      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center py-2"
        min={sliderMin}
        max={sliderMax}
        step={step}
        value={safeValue}
        onValueChange={handleChange}
        minStepsBetweenThumbs={1}
      >
        <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-primary to-primary-glow rounded-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="block h-6 w-6 rounded-full border-2 border-primary bg-background shadow-lg ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 cursor-grab active:cursor-grabbing"
          aria-label="Minimum budget"
        />
        <SliderPrimitive.Thumb
          className="block h-6 w-6 rounded-full border-2 border-primary bg-background shadow-lg ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 cursor-grab active:cursor-grabbing"
          aria-label="Maximum budget"
        />
      </SliderPrimitive.Root>

      {/* Scale markers */}
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{formatINR(sliderMin)}</span>
        <span>{formatINR(Math.round((sliderMin + sliderMax) / 2))}</span>
        <span>{formatINR(sliderMax)}</span>
      </div>
    </div>
  );
};

export default BudgetRangeSlider;
