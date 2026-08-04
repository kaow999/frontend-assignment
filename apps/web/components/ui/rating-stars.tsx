import { Star } from "lucide-react";

import { formatRating } from "../../lib/format";

const STARS = [0, 1, 2, 3, 4];

const Row = ({ className }: { className: string }) => (
  <div className={className}>
    {STARS.map((index) => (
      <Star key={index} className="size-[17px] shrink-0 fill-current" />
    ))}
  </div>
);

/**
 * Ratings land on halves, so a filled row is clipped to a percentage rather
 * than rounded to whole stars — 3.5/5 has to look like three and a half.
 */
export const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-2">
    <div
      className="relative"
      role="img"
      aria-label={`Rated ${formatRating(rating)} out of 5`}
    >
      <Row className="flex gap-1 text-surface-strong" />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${(Math.max(0, Math.min(rating, 5)) / 5) * 100}%` }}
      >
        <Row className="flex gap-1 text-star" />
      </div>
    </div>
    <span className="text-sm text-ink" aria-hidden>
      {formatRating(rating)}
      <span className="text-ink-faint">/5</span>
    </span>
  </div>
);
