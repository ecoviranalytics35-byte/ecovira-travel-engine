"use client";

export function SearchPanelSkeleton() {
  return (
    <div className="ec-card mb-20">
      {/* Trip Type Skeleton */}
      <div className="mb-6">
        <div className="h-3 w-24 bg-[rgba(28,140,130,0.1)] rounded mb-3 animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-[rgba(28,140,130,0.1)] rounded-full animate-pulse"></div>
          <div className="h-10 w-32 bg-[rgba(28,140,130,0.1)] rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Row 1: From | To Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="h-3 w-16 bg-[rgba(28,140,130,0.1)] rounded mb-3 animate-pulse"></div>
          <div className="h-[52px] bg-[rgba(28,140,130,0.1)] rounded-ec-md animate-pulse"></div>
        </div>
        <div>
          <div className="h-3 w-12 bg-[rgba(28,140,130,0.1)] rounded mb-3 animate-pulse"></div>
          <div className="h-[52px] bg-[rgba(28,140,130,0.1)] rounded-ec-md animate-pulse"></div>
        </div>
      </div>

      {/* Row 2: Dates Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="h-3 w-20 bg-[rgba(28,140,130,0.1)] rounded mb-3 animate-pulse"></div>
          <div className="h-[52px] bg-[rgba(28,140,130,0.1)] rounded-ec-md animate-pulse"></div>
        </div>
        <div>
          <div className="h-3 w-16 bg-[rgba(28,140,130,0.1)] rounded mb-3 animate-pulse"></div>
          <div className="h-[52px] bg-[rgba(28,140,130,0.1)] rounded-ec-md animate-pulse"></div>
        </div>
      </div>

      {/* Row 3: Passengers | Cabin | Currency Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <div className="h-3 w-24 bg-[rgba(28,140,130,0.1)] rounded mb-3 animate-pulse"></div>
          <div className="h-[52px] bg-[rgba(28,140,130,0.1)] rounded-ec-md animate-pulse"></div>
        </div>
        <div>
          <div className="h-3 w-20 bg-[rgba(28,140,130,0.1)] rounded mb-3 animate-pulse"></div>
          <div className="h-[52px] bg-[rgba(28,140,130,0.1)] rounded-ec-md animate-pulse"></div>
        </div>
        <div>
          <div className="h-3 w-20 bg-[rgba(28,140,130,0.1)] rounded mb-3 animate-pulse"></div>
          <div className="h-[52px] bg-[rgba(28,140,130,0.1)] rounded-ec-md animate-pulse"></div>
        </div>
      </div>

      {/* CTA Button Skeleton */}
      <div className="ec-cta-row">
        <div className="h-[56px] min-w-[320px] bg-[rgba(28,140,130,0.15)] rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}

