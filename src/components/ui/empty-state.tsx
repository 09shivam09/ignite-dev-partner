import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {/* Icon Container */}
      <div className="relative mb-6 animate-scale-bounce">
        <div className="absolute inset-0 bg-muted/50 rounded-full blur-2xl" />
        <div className="relative bg-muted/30 p-6 rounded-full">
          <Icon className="h-16 w-16 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 max-w-md animate-fade-in-up [animation-delay:0.1s]">
        <h3 className="text-2xl font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-8 animate-fade-in-up [animation-delay:0.2s] tap-effect"
          size="lg"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
