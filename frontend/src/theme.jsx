import { useCallback, useEffect, useState } from "react";
import { DARK_QUERY, LAMP_KEY, LampContext, keptChoice, systemPrefersNight } from "./lamp";

/* ==========================================================================
   THE LAMP — three states, one of which is "whatever the room is doing":
     "day"   parchment by a window
     "night" the same book by candlelight
     null    follow the reader's own system setting
   The chosen light is stamped on <html> as data-theme, which is all the
   stylesheet needs; index.html stamps it again before first paint so the
   page never flashes the wrong light.
   ========================================================================== */

export function LampProvider({ children }) {
  const [choice, setChoice] = useState(keptChoice);
  const [systemNight, setSystemNight] = useState(systemPrefersNight);

  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = (e) => setSystemNight(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const night = choice ? choice === "night" : systemNight;

  useEffect(() => {
    document.documentElement.dataset.theme = night ? "night" : "day";
  }, [night]);

  const setLamp = useCallback((value) => {
    setChoice(value);
    try {
      if (value) localStorage.setItem(LAMP_KEY, value);
      else localStorage.removeItem(LAMP_KEY);
    } catch {
      /* a reader with nowhere to keep the choice; the session still works */
    }
  }, []);

  const toggle = useCallback(() => setLamp(night ? "day" : "night"), [night, setLamp]);

  return (
    <LampContext.Provider value={{ night, choice, setLamp, toggle }}>
      {children}
    </LampContext.Provider>
  );
}
