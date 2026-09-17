import React, { useState } from "react";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: "xs" | "sm" | "md" | "lg";
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  className?: string;
}

const sizeClasses = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  interactive = false,
  onRatingChange,
  size = "md",
  showValue = false,
  showCount = false,
  count,
  className = "",
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = activeRating >= starNumber;
          const isHalf = !isFilled && activeRating >= starNumber - 0.5;

          return (
            <button
              key={starNumber}
              type={interactive ? "button" : undefined}
              disabled={!interactive}
              onClick={() => interactive && onRatingChange?.(starNumber)}
              onMouseEnter={() => interactive && setHoverRating(starNumber)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`${
                interactive
                  ? "cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                  : "cursor-default pointer-events-none"
              }`}
              aria-label={interactive ? `${starNumber} de ${maxRating} estrellas` : undefined}
            >
              <svg
                className={`${sizeClasses[size]} transition-colors duration-150 ${
                  isFilled
                    ? "text-amber-400 fill-amber-400"
                    : isHalf
                    ? "text-amber-400 fill-amber-400/50"
                    : "text-slate-200 fill-slate-200"
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-semibold text-slate-800 ml-1">
          {rating > 0 ? rating.toFixed(1) : "0.0"}
        </span>
      )}

      {showCount && typeof count === "number" && (
        <span className="text-xs text-slate-500">
          ({count} {count === 1 ? "reseña" : "reseñas"})
        </span>
      )}
    </div>
  );
};
