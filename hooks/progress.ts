"use client";

import { useState, useCallback } from "react";

export function useProgress() {
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(false);

  const start = useCallback((totalItems: number) => {
    setTotal(totalItems);
    setCurrent(0);
    setActive(true);
  }, []);

  const update = useCallback((currentItem: number) => {
    setCurrent(currentItem);
  }, []);

  const complete = useCallback(() => {
    setActive(false);
    setCurrent(0);
    setTotal(0);
  }, []);

  const progress = total > 0 ? Math.round((current / total) * 100) : 0;

  return { current, total, progress, active, start, update, complete };
}
