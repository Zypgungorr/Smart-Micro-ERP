"use client";

import { useState, useEffect } from "react";

export function useHydration() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

export function useClientOnly<T>(value: T, defaultValue: T): T {
  const mounted = useHydration();
  return mounted ? value : defaultValue;
} 