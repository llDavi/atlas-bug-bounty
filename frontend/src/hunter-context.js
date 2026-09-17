import { createContext, useContext } from "react";

/* Who is reading the book. Kept apart from the provider so this file holds
   plain values and the provider file holds components only.

   status: "loading" | "anon" | "unregistered" | "ready" | "error" */
export const HunterContext = createContext({
  status: "anon",
  hunter: null,
  refresh: () => {},
  setHunter: () => {},
});

export function useHunter() {
  return useContext(HunterContext);
}
