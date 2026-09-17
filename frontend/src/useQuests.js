import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { api } from "./api";
import { useHunter } from "./hunter-context";

/* The quest list as the register sees it for this reader — each quest with
   its status for them. Fetched again whenever the hunter discharges a quest,
   so the map and the sheet follow along without a reload. */
export function useQuests() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { hunter } = useHunter();
  const [state, setState] = useState({ quests: null, error: null });
  const discharged = hunter?.completed_quests?.length ?? 0;

  useEffect(() => {
    if (!isLoaded) return;
    let dropped = false;
    api("/api/quests", { getToken: isSignedIn ? getToken : undefined })
      .then((quests) => {
        if (!dropped) setState({ quests, error: null });
      })
      .catch((err) => {
        if (!dropped) setState({ quests: [], error: err.message });
      });
    return () => {
      dropped = true;
    };
  }, [isLoaded, isSignedIn, getToken, discharged]);

  return state;
}
