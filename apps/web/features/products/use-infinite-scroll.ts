"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /** How far ahead of the sentinel to start loading. */
  rootMargin?: string;
};

/**
 * Returns a ref callback for a sentinel element placed after the last card.
 * When it comes into view the next page is requested — no numbered pagination
 * and no button in the primary path.
 *
 * The sentinel is tracked in state rather than a ref so that the observer is
 * re-attached when the element mounts or unmounts. The observer is torn down
 * once the catalogue is exhausted, rather than firing into a no-op forever.
 */
export const useInfiniteScroll = ({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = "400px",
}: Options) => {
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);

  // Held in a ref so a new function identity each render does not rebuild the
  // observer mid-scroll.
  const onIntersect = useRef(fetchNextPage);
  onIntersect.current = fetchNextPage;

  const canFetch = hasNextPage && !isFetchingNextPage;

  useEffect(() => {
    if (!sentinel || !canFetch) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onIntersect.current();
      },
      { rootMargin },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [sentinel, canFetch, rootMargin]);

  return setSentinel;
};
