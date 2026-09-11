import { createContext, useContext } from "react";

/* Which light the codex is read by. Kept apart from the provider so the hook
   and the context are plain values — the provider file stays components only. */

export const LAMP_KEY = "codex-lamp";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

export const LampContext = createContext({
  night: false,
  choice: null,
  setLamp: () => {},
  toggle: () => {},
});

export function useLamp() {
  return useContext(LampContext);
}

export function keptChoice() {
  try {
    const v = localStorage.getItem(LAMP_KEY);
    return v === "day" || v === "night" ? v : null;
  } catch {
    return null;
  }
}

export function systemPrefersNight() {
  try {
    return window.matchMedia(DARK_QUERY).matches;
  } catch {
    return false;
  }
}
