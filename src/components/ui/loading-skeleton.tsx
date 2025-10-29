import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "card" | "text" | "circle" | "button" | "avatar";
}

export const LoadingSkeleton = ({ 
  className, 
  variant = "card" 
}: LoadingSkeletonProps) => {
  const baseClasses = "skeleton rounded-md";
  
  const variantClasses = {
    card: "w-full h-64",
    text: "w-full h-4",
    circle: "w-12 h-12 rounded-full",
    button: "w-32 h-10 rounded-lg",
    avatar: "w-16 h-16 rounded-full",
  };

  return (
    <div 
      className={cn(
        baseClasses, 
        variantClasses[variant], 
        className
      )} 
    />
  );
};

// Pre-composed skeleton layouts
export const VendorCardSkeleton = () => (
  <div className="glass rounded-2xl overflow-hidden space-y-4 p-0 animate-fade-in">
    <LoadingSkeleton className="w-full h-48 rounded-none" />
    <div className="p-5 space-y-3">
      <LoadingSkeleton className="w-3/4 h-6" />
      <LoadingSkeleton className="w-1/2 h-4" />
      <div className="flex justify-between items-center pt-2">
        <LoadingSkeleton className="w-24 h-5" />
        <LoadingSkeleton variant="button" className="w-28" />
      </div>
    </div>
  </div>
);

export const CategoryCardSkeleton = () => (
  <div className="glass rounded-xl overflow-hidden animate-fade-in">
    <LoadingSkeleton className="w-full h-32 rounded-none" />
    <div className="p-4">
      <LoadingSkeleton className="w-3/4 h-5" />
    </div>
  </div>
);

export const BookingCardSkeleton = () => (
  <div className="glass rounded-xl p-4 space-y-4 animate-fade-in">
    <div className="flex items-center gap-3">
      <LoadingSkeleton variant="avatar" className="w-12 h-12" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton className="w-2/3 h-5" />
        <LoadingSkeleton className="w-1/2 h-4" />
      </div>
    </div>
    <LoadingSkeleton className="w-full h-4" />
    <div className="flex justify-between">
      <LoadingSkeleton className="w-24 h-4" />
      <LoadingSkeleton className="w-20 h-6 rounded-full" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="flex items-center gap-4">
      <LoadingSkeleton variant="avatar" className="w-20 h-20" />
      <div className="flex-1 space-y-3">
        <LoadingSkeleton className="w-1/2 h-6" />
        <LoadingSkeleton className="w-2/3 h-4" />
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass rounded-lg p-4 space-y-2">
          <LoadingSkeleton className="w-full h-8" />
          <LoadingSkeleton className="w-3/4 h-3 mx-auto" />
        </div>
      ))}
    </div>

    {/* Content */}
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <LoadingSkeleton key={i} className="w-full h-16 rounded-lg" />
      ))}
    </div>
  </div>
);
