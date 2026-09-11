import { Link } from "react-router-dom";
import { PageHead, RuleHead, Stamp, Fleuron, Mark } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { ROLL } from "../data/journal";

/* ==========================================================================
   THE ROLL OF HUNTERS
   ==========================================================================
   Names cut into the guild's stone, then copied into the register. A ruled
   roll — never a podium, never three glowing cards.
   ========================================================================== */

function StonePlate() {
  const top = ROLL.slice(0, 3);
  return (
    <div className="plate" style={{ padding: "1.8rem 1.6rem" }}>
      <p className="t-caps" style={{ color: "var(--paper-shade)" }}>Cut into the stone above the door</p>
      <hr className="rule rule--tight" style={{ borderColor: "rgba(230,220,192,0.28)" }} />
      <ol className="flex flex-col gap-3">
        {top.map((h) => (
          <li key={h.hand} className="flex items-baseline gap-4">
            <span className="t-roman text-base" style={{ color: "var(--paper-aged)", minWidth: "2.4rem" }}>
              {roman(h.place)}
            </span>
            <span className="flex-1">
              <span className="t-title text-2xl" style={{ color: "var(--paper-lit)" }}>{h.name}</span>
              <span className="block t-caps" style={{ color: "var(--paper-shade)" }}>
                {h.rank} · {h.realm}
              </span>
            </span>
            <span className="t-tech" style={{ color: "var(--paper-aged)" }}>
              {h.xp.toLocaleString("en-US")} XP
            </span>
          </li>
        ))}
      </ol>
      <hr className="rule rule--tight" style={{ borderColor: "rgba(230,220,192,0.28)" }} />
      <p className="t-caps" style={{ color: "var(--paper-shade)" }}>
        Rank is cut for reports accepted, never for pages read
      </p>
    </div>
  );
}

export default function RollPage() {
  const you = ROLL.find((h) => h.isYou);

  return (
    <>
      <PageHead
        folio={7}
        standing="The seventh folio"
        title="The Roll of Hunters"
        gloss="The guild keeps one register of standing, copied from the stone each season. A name moves up it by writing an account somebody could act on — not by reading this book."
      />

      <div className="spread mb-2">
        <StonePlate />
        <aside>
          <div className="slip">
            <p className="t-caps mb-2">Your line in the roll</p>
            <p className="t-title text-2xl">{you?.name}</p>
            <p className="t-hand">{you?.rank} · {you?.realm}</p>
            <hr className="rule rule--tight" />
            <div className="flex items-baseline justify-between">
              <span className="t-caps">Place</span>
              <span className="t-roman text-sm">{roman(you?.place || 0)}</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="t-caps">Finds</span>
              <span className="t-roman text-sm">{roman(you?.finds || 0)}</span>
            </div>
          </div>
          <p className="margin-note margin-note--right mt-4">
            Tomas was two places below you in the spring
          </p>
          <div className="flex justify-center mt-4" style={{ color: "var(--ink-faint)" }}>
            <Mark name="crown" size={34} />
          </div>
        </aside>
      </div>

      <RuleHead>The register, in full</RuleHead>

      <div className="overflow-x-auto">
        <table className="ledger">
          <caption>Copied from the stone · corrected each season</caption>
          <thead>
            <tr>
              <th style={{ width: "3.5rem" }}>Place</th>
              <th>Hunter</th>
              <th>Rank</th>
              <th>Ground walked</th>
              <th style={{ width: "7rem" }}>Experience</th>
              <th style={{ width: "5rem" }}>Finds</th>
            </tr>
          </thead>
          <tbody>
            {ROLL.map((h) => (
              <tr key={h.hand} className={h.isYou ? "is-you" : ""}>
                <td className="ledger-num">{roman(h.place)}</td>
                <td>
                  <span className="t-title text-[1.15rem]">{h.name}</span>
                  {h.isYou && <Stamp tone="rubric" className="ml-2">You</Stamp>}
                  <span className="block t-tech t-faint">{h.hand}</span>
                </td>
                <td className="t-caps">{h.rank}</td>
                <td className="t-soft text-[0.92rem]">{h.realm}</td>
                <td className="t-tech">{h.xp.toLocaleString("en-US")}</td>
                <td className="ledger-num">{roman(h.finds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center mt-12">
        <Fleuron width={150} />
        <p className="t-caps mt-3">The stone has room for more names</p>
        <Link to="/quests" className="ink-btn ink-btn--filled mt-4">Take a quest</Link>
      </div>
    </>
  );
}
