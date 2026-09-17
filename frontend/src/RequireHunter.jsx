import { Link } from "react-router-dom";
import { SignInButton } from "@clerk/clerk-react";
import { useHunter } from "./hunter-context";
import { Fleuron, Seal } from "./components/ms/Codex";

/* ==========================================================================
   A door only hunters walk through
   ==========================================================================
   Quests, lessons, dungeons, field journals, the character sheet and the
   programme registry belong to hunters. A visitor sees the door and what it
   takes to open it — never the room. (The API refuses them too.)
   ========================================================================== */

export default function RequireHunter({ children, what = "this folio" }) {
  const { status } = useHunter();

  if (status === "ready") return children;

  // Signed in but not yet registered: RegisterGate sends them to /register.
  if (status === "loading" || status === "unregistered") {
    return (
      <div className="leaf" style={{ padding: "3rem", textAlign: "center" }}>
        <p className="t-entry">The clerk is checking the register…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="leaf" style={{ padding: "2.6rem" }}>
        <p className="t-eyebrow">The register is not answering</p>
        <p className="t-entry mt-3">Try again in a moment.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ maxWidth: "42rem" }}>
      <div className="quire">
        <div className="leaf leaf--chapter leaf--ruled">
          <div className="leaf-field text-center">
            <div className="flex justify-center"><Seal size={80} broken label="Sealed" /></div>
            <p className="t-eyebrow mt-6">Sealed to the unsigned</p>
            <h1 className="t-chapter mt-3">Only hunters walk past this door</h1>
            <Fleuron width={150} className="ornament--center" />
            <p className="t-body column mx-auto">
              Sign the register to open {what}. It costs nothing, and the book keeps your progress from then on.
            </p>
            <SignInButton mode="modal">
              <button type="button" className="ink-btn ink-btn--filled mt-8">Sign the register</button>
            </SignInButton>
            <p className="t-small mt-8">
              Meanwhile: <Link to="/" className="ink-link">the kingdoms</Link> ·{" "}
              <Link to="/roll" className="ink-link">the roll</Link> ·{" "}
              <Link to="/bestiary" className="ink-link">the bestiary</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
