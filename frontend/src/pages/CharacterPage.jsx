import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { RuleHead, Stamp, Measure, Pips, Mark, Fleuron, Leader, CheckMark, LockMark, Device } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { HUNTER, RANKS, rankOf, BEASTS, MASTERY } from "../data/journal";
import { placeById } from "../data/world";

/* ==========================================================================
   THE CHARACTER SHEET
   ==========================================================================
   A page from the hunter's own journal: name, title, level, class, then the
   attributes in roman numerals and the skills ruled as an index. Not a
   profile card — a sheet, ruled top and bottom.
   ========================================================================== */

function Crest() {
  const { level, rank, next, pct } = rankOf(HUNTER.xp);
  const { user } = useUser();
  const sworn = user?.publicMetadata?.is_pro === true;

  return (
    <div className="text-center">
      <div className="flex justify-center mb-3" style={{ color: "var(--ink-strong)" }}>
        <Device size={54} />
      </div>

      <h1 className="t-roman text-3xl sm:text-4xl" style={{ letterSpacing: "0.22em" }}>
        {user?.firstName?.toUpperCase() || HUNTER.shortName.toUpperCase()}
      </h1>
      <p className="t-title text-xl mt-1">{HUNTER.title}</p>
      <p className="t-caps mt-2">{HUNTER.class}</p>

      <Fleuron width={150} className="ornament--center" />

      <p className="t-roman text-lg">Level {roman(level)} · {rank.title}</p>

      <div className="mx-auto mt-4" style={{ maxWidth: "22rem" }}>
        <p className="t-caps mb-1.5">Experience</p>
        <Measure pct={pct} cells={20} rubric />
        <p className="t-tech t-faint mt-1.5">
          {HUNTER.xp.toLocaleString("en-US")} / {(next?.xpReq ?? HUNTER.xp).toLocaleString("en-US")}
          {next && ` — ${(next.xpReq - HUNTER.xp).toLocaleString("en-US")} to ${next.title}`}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-5">
        <Stamp tone="green">{HUNTER.finds} finds accepted</Stamp>
        <Stamp>{HUNTER.vigil}-day vigil</Stamp>
        {sworn ? <Stamp tone="rubric" pressed>Oath sworn</Stamp> : <Stamp tone="faint">Unsworn</Stamp>}
      </div>

      <p className="t-hand mt-4">{HUNTER.standing}</p>
    </div>
  );
}

function Attributes() {
  return (
    <section>
      <RuleHead>Attributes</RuleHead>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
        {HUNTER.attributes.map((a) => (
          <div key={a.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="t-title text-xl">{a.name}</span>
              <span className="t-roman text-[0.95rem]">{roman(a.value)}</span>
            </div>
            <div className="mt-1"><Pips value={a.value} of={10} /></div>
            <p className="t-soft text-[0.9rem] mt-1" style={{ fontStyle: "italic" }}>{a.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section>
      <RuleHead>Skills</RuleHead>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1">
        {HUNTER.skills.map((s) => (
          <div key={s.name} className="flex items-baseline gap-2">
            <span style={{ color: s.standing === "Sealed" ? "var(--ink-faint)" : "var(--gold-leaf)" }}>✦</span>
            <span className="flex-1">
              <Leader label={s.name} value={s.standing} struck={false} />
            </span>
          </div>
        ))}
      </div>
      <p className="margin-note mt-4">two sealed — the oath opens both</p>
    </section>
  );
}

function Equipment() {
  return (
    <section>
      <RuleHead>Equipment &amp; tools</RuleHead>
      <div className="overflow-x-auto">
      <table className="ledger">
        <thead>
          <tr>
            <th style={{ width: "3rem" }} />
            <th>Carried as</th>
            <th>Which is to say</th>
            <th style={{ width: "7rem" }}>Slot</th>
            <th style={{ width: "6rem" }}>State</th>
          </tr>
        </thead>
        <tbody>
          {HUNTER.equipment.map((e) => (
            <tr key={e.slot} className={e.carried ? "" : "is-locked"}>
              <td style={{ color: e.carried ? "var(--ink-strong)" : "var(--ink-faint)" }}>
                <Mark name={e.mark} size={26} />
              </td>
              <td className="t-title text-[1.15rem]">{e.name}</td>
              <td className="t-tech t-soft">{e.real}</td>
              <td className="t-caps">{e.slot}</td>
              <td>
                <Stamp tone={e.carried ? "green" : "faint"}>{e.carried ? "On the belt" : "In the pack"}</Stamp>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}

function Achievements() {
  return (
    <section>
      <RuleHead>Achievements</RuleHead>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
        {HUNTER.achievements.map((a) => (
          <div key={a.name} className="flex gap-3 items-baseline">
            <span style={{ color: a.won ? "var(--verdigris)" : "var(--ink-faint)" }}>
              {a.won ? <CheckMark size={16} /> : <LockMark size={14} />}
            </span>
            <span>
              <span className={`t-title text-lg ${a.won ? "" : "t-faint"}`}>{a.name}</span>
              <span className="block t-soft text-[0.9rem]">{a.note}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BeastsKnown() {
  return (
    <section>
      <RuleHead>Beasts known</RuleHead>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1">
        {BEASTS.map((b) => {
          const place = placeById(b.place);
          return (
            <Link key={b.slug} to="/bestiary" title={place?.name}>
              <Leader label={b.name} value={(MASTERY[b.mastery] || MASTERY.read).label} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Path() {
  const { index } = rankOf(HUNTER.xp);
  return (
    <section>
      <RuleHead>The road so far</RuleHead>
      <ol className="flex flex-col gap-0">
        {RANKS.map((r, i) => (
          <li
            key={r.title}
            className="flex items-baseline gap-4 py-2"
            style={{ borderBottom: i < RANKS.length - 1 ? "1px solid var(--rule-soft)" : "none" }}
          >
            <span
              className="t-roman text-[0.78rem]"
              style={{ minWidth: "2.6rem", color: i <= index ? "var(--ink-strong)" : "var(--ink-faint)" }}
            >
              {roman(i + 1)}
            </span>
            <span className={`t-title text-xl ${i <= index ? "" : "t-faint"}`}>{r.title}</span>
            <span className="leader-fill" />
            <span className="t-caps">
              {i < index ? "Passed" : i === index ? "Held now" : `${r.xpReq.toLocaleString("en-US")} XP`}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function CharacterPage() {
  return (
    <>
      <div className="leaf leaf--ruled quire">
        <div className="leaf-field">
          <hr className="rule rule--double" style={{ marginTop: 0 }} />
          <Crest />
          <hr className="rule rule--double" />

          <div className="spread">
            <div className="flex flex-col gap-2">
              <Attributes />
              <Skills />
              <Achievements />
            </div>
            <aside>
              <div className="slip">
                <p className="t-caps mb-2">Entered in the register</p>
                <div className="flex flex-col gap-1">
                  <Leader label="Hand" value={HUNTER.hand} />
                  <Leader label="Enrolled" value={HUNTER.enrolled} />
                  <Leader label="Whereabouts" value={placeById(HUNTER.whereabouts)?.name || "—"} />
                </div>
              </div>
              <p className="margin-note margin-note--right mt-4">
                reporting is the weakest column — mend it before the next descent
              </p>
              <div className="flex justify-center mt-5" style={{ color: "var(--ink-faint)" }}>
                <Mark name="quill" size={40} />
              </div>
            </aside>
          </div>

          <BeastsKnown />
          <Equipment />
          <Path />

          <hr className="rule rule--double" />
          <p className="t-caps text-center">
            Sheet kept in the hunter&rsquo;s own hand · corrected after each descent
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link to="/quests" className="ink-btn ink-btn--filled">Take up a quest</Link>
        <Link to="/roll" className="ink-btn">The roll of hunters</Link>
      </div>
    </>
  );
}
