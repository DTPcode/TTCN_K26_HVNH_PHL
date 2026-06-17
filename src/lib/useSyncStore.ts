import { useEffect, useState } from "react";
import { subscribe } from "@/data/mockData";

/** Re-renders the component whenever the shared mock store emits a change. */
export function useSyncStore(): number {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  return 0;
}
