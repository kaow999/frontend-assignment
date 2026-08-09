"use client";

import { useEffect, useState } from "react";

/**
 * Holds a value back until it stops changing. Typing in the search box writes
 * to the URL, and without this every keystroke would be a history entry and a
 * request.
 */
export const useDebouncedValue = <T>(value: T, delay = 350): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
