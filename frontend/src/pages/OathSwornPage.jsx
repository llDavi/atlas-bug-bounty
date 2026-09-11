import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Fleuron, Seal, Stamp } from "../components/ms/Codex";

/* The wax is pressed a moment after the clerk is paid — the page waits for
   the register to catch up rather than asking the hunter to reload. */
export default function OathSwornPage() {
  const { user } = useUser();
  const [sworn, setSworn] = useState(user?.publicMetadata?.is_pro === true);

  useEffect(() => {
    if (sworn || !user) return;
    let tries = 0;
    const t = setInterval(async () => {
      tries += 1;
      await user.reload();
      if (user.publicMetadata?.is_pro === true) {
        setSworn(true);
        clearInterval(t);
      }
      if (tries >= 8) clearInterval(t);
    }, 1500);
    return () => clearInterval(t);
  }, [sworn, user]);

  return (
    <div className="mx-auto" style={{ maxWidth: "40rem" }}>
      <div className="leaf leaf--ruled quire">
        <div className="leaf-field text-center">
          <div className="flex justify-center">
            <Seal size={110} broken={!sworn} label={sworn ? "Sworn and sealed" : "The wax is warming"} />
          </div>

          <h1 className="t-title text-4xl mt-5 mb-1">
            {sworn ? "The oath is sworn." : "The clerk has your coin."}
          </h1>
          <Fleuron width={170} className="ornament--center" />

          <p className="column mx-auto text-[1.05rem]">
            {sworn
              ? "Your name is entered in the guild register and the wax is pressed. Every sealed folio and barred ground in this book is open to you from this line onward."
              : "The register is being written up — this takes a few seconds, and the page will notice when it is done."}
          </p>

          <div className="flex justify-center mt-5">
            <Stamp tone={sworn ? "rubric" : "faint"} pressed>
              {sworn ? "Sworn" : "Awaiting the register"}
            </Stamp>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-7">
            <Link to="/journals" className="ink-btn ink-btn--filled">Open the archive</Link>
            <Link to="/" className="ink-btn">Back to the survey</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
