"use client";

import { X } from "lucide-react";
import { useState } from "react";

export const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-ink text-white">
      <div className="container-page relative flex min-h-9 items-center justify-center py-2">
        <p className="text-center text-xs sm:text-sm">
          Sign up and get 20% off to your first order.{" "}
          <button className="font-medium underline underline-offset-2">
            Sign Up Now
          </button>
        </p>

        <button
          onClick={() => setIsVisible(false)}
          aria-label="Dismiss announcement"
          className="absolute right-4 hidden text-white/80 transition-colors hover:text-white sm:block"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
};
