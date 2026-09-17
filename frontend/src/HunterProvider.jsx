import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { api } from "./api";
import { HunterContext } from "./hunter-context";

/* ==========================================================================
   The hunter behind the Clerk session.
     loading       Clerk, or the register, is still answering
     anon          nobody is signed in
     unregistered  signed in, but has not signed the register yet
     ready         a hunter, with their progress
     error         the register could not be reached
   Status is derived for the first three, so nothing is set synchronously
   inside an effect; only the fetched answer is stored, keyed by user so a
   sign-out/sign-in never shows the previous reader's page.
   ========================================================================== */

export default function HunterProvider({ children }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const [fetched, setFetched] = useState(null); // { userId, status, hunter }

  const load = useCallback(
    (forUser) =>
      api("/api/hunter/me", { getToken })
        .then((hunter) => ({ userId: forUser, status: "ready", hunter }))
        .catch((err) => ({ userId: forUser, status: err.status === 404 ? "unregistered" : "error", hunter: null })),
    [getToken]
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let dropped = false;
    load(userId).then((result) => {
      if (!dropped) setFetched(result);
    });
    return () => {
      dropped = true;
    };
  }, [isLoaded, isSignedIn, userId, load]);

  const refresh = useCallback(() => load(userId).then(setFetched), [load, userId]);
  const setHunter = useCallback((hunter) => setFetched({ userId, status: "ready", hunter }), [userId]);

  let status = "loading";
  let hunter = null;
  if (isLoaded && !isSignedIn) status = "anon";
  else if (isLoaded && fetched && fetched.userId === userId) ({ status, hunter } = fetched);

  return (
    <HunterContext.Provider value={{ status, hunter, refresh, setHunter }}>
      {children}
    </HunterContext.Provider>
  );
}
