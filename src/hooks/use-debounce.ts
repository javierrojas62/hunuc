"use client";

import { useEffect, useState } from "react";

/** Devuelve el valor tras `delay` ms sin cambios. Ideal para búsquedas. */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
