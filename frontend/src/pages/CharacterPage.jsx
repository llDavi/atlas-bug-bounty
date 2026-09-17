import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { useHunter } from "../hunter-context";
import { alignmentById, kingdomById } from "../data/realm";
import { RuleHead, Stamp, Measure, Pips, Mark, Fleuron, Leader, CheckMark, LockMark, Seal } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { HUNTER, RANKS, rankOf, BEASTS } from "../data/journal";
import { placeById } from "../data/world";
import { useQuests } from "../useQuests";
import { deriveRealm, deriveSheet, deriveAchievements } from "../data/progress";

/* ==========================================================================
   THE CHARACTER SHEET
   ==========================================================================
   A page from the hunter's own journal: name, title, level, class, then the
   attributes in roman numerals and the skills ruled as an index. Not a
   profile card — a sheet, ruled top and bottom.
   ========================================================================== */

function Crest({ sheet }) {
  const { status, hunter } = useHunter();
  const { user } = useUser();
  const sworn = user?.publicMetadata?.is_pro === true;

  if (status !== "ready") {
    return (
      <div className="text-center">
        <p className="t-eyebrow">An unsigned sheet</p>
        <h1 className="t-chapter mt-3">No hunter is written here yet</h1>
        <Fleuron width={150} className="ornament--center" />
        {status === "unregistered" ? (
          <Link to="/register" className="ink-btn ink-btn--filled">Sign the register</Link>
        ) : (
          <SignInButton mode="modal">
            <button type="button" className="ink-btn ink-btn--filled">Sign the register</button>
          </SignInButton>
        )}
        <p className="t-small mt-6">Your sheet fills in from the quests you discharge.</p>
      </div>
    );
  }

  const { level, rank, next, pct } = rankOf(hunter.xp);
  const alignment = alignmentById(hunter.alignment);

  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <Seal size={66} color={alignment?.seal} label={alignment?.en} />
      </div>

      <h1 className="t-roman text-3xl sm:text-4xl" style={{ letterSpacing: "0.22em" }}>
        {hunter.name.toUpperCase()}
      </h1>
      <p className="t-title text-xl mt-2">{alignment?.archetype}</p>
      <p className="t-caps mt-2">{alignment?.en}</p>
      {sheet?.subclass && (
        <p className="t-hand mt-3">
          Subclass · {sheet.subclass.title} <span className="t-caps">({sheet.subclass.discipline.name})</span>
        </p>
      )}

      <Fleuron width={150} className="ornament--center" />

      <p className="t-roman text-lg">Level {roman(level)} · {rank.title}</p>

      <div className="mx-auto mt-5" style={{ maxWidth: "22rem" }}>
        <span className="t-caps label-gap">Experience</span>
        <Measure pct={pct} cells={20} rubric />
        <p className="t-tech t-faint mt-2">
          {hunter.xp.toLocaleString("en-US")} / {(next?.xpReq ?? hunter.xp).toLocaleString("en-US")}
          {next && ` — ${(next.xpReq - hunter.xp).toLocaleString("en-US")} to ${next.title}`}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-6">
        {hunter.kingdoms.map((k) => (
          <Stamp key={k}>
            {kingdomById(k)?.name} · Grade {roman(rankOf(hunter.kingdom_xp[k] || 0).level)}
          </Stamp>
        ))}
        <Stamp tone="green">{hunter.completed_quests.length} quests discharged</Stamp>
        {sworn && <Stamp tone="rubric" pressed>Oath sworn</Stamp>}
      </div>

      <p className="t-hand mt-5">{alignment?.note}</p>
      <p className="t-small mt-4">Everything below is read off the quests you have discharged; the equipment is the kit every hunter carries.</p>
    </div>
  );
}

/* The sheet read off the record — or null for a reader with no record yet,
   who is shown the example sheet instead. */
function useSheet() {
  const { status, hunter } = useHunter();
  const { quests } = useQuests();
  return useMemo(() => {
    if (status !== "ready" || !quests) return null;
    const done = new Set(hunter.completed_quests);
    const realm = deriveRealm(quests);
    return { ...deriveSheet(quests, done), achievements: deriveAchievements(quests, done, realm), realm, hunter };
  }, [status, hunter, quests]);
}

function Attributes({ sheet }) {
  const rows = sheet.attributes;
  return (
    <section>
      <RuleHead>Attributes</RuleHead>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
        {rows.map((a) => (
          <div key={a.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="t-entry">{a.name}</span>
              <span className="t-roman" style={{ fontSize: "0.95rem" }}>{a.value ? roman(a.value) : "—"}</span>
            </div>
            <div className="mt-1.5"><Pips value={a.value} of={10} /></div>
            <p className="t-small mt-1.5" style={{ fontStyle: "italic" }}>{a.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Skills({ sheet }) {
  const rows = sheet.skills.map((s) => ({ name: s.name, standing: s.standing, faint: s.count === 0 }));
  return (
    <section>
      <RuleHead>Skills</RuleHead>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
        {rows.map((s) => (
          <div key={s.name} className="flex items-baseline gap-2">
            <span style={{ color: s.faint ? "var(--ink-faint)" : "var(--gold-leaf)" }}>✦</span>
            <span className="flex-1">
              <Leader label={s.name} value={s.standing} />
            </span>
          </div>
        ))}
      </div>
      <p className="margin-note mt-5">
        {sheet.subclass
          ? `your best discipline is ${sheet.subclass.discipline.name} — it gives you your subclass`
          : "no discipline practised yet — your first quest gives you a subclass"}
      </p>
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

function Achievements({ sheet }) {
  const rows = sheet.achievements;
  return (
    <section>
      <RuleHead>Achievements</RuleHead>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
        {rows.map((a) => (
          <div key={a.name} className="flex gap-3 items-baseline">
            <span style={{ color: a.won ? "var(--verdigris)" : "var(--ink-faint)" }}>
              {a.won ? <CheckMark size={16} /> : <LockMark size={14} />}
            </span>
            <span>
              <span className={`t-minor ${a.won ? "" : "t-faint"}`}>{a.name}</span>
              <span className="block t-small mt-0.5">{a.note}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BeastsKnown({ sheet }) {
  return (
    <section>
      <RuleHead>Beasts known</RuleHead>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
        {BEASTS.map((b) => {
          const place = placeById(b.place);
          const standing = b.spoor ? sheet.skills.find((s) => s.id === b.slug)?.standing ?? "Not yet met" : "Still being drawn";
          return (
            <Link key={b.slug} to="/bestiary" title={place?.name}>
              <Leader label={b.name} value={standing} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Path({ sheet }) {
  const { index } = rankOf(sheet.hunter.xp);
  return (
    <section>
      <RuleHead>The road so far</RuleHead>
      <ol className="flex flex-col gap-0">
        {RANKS.map((r, i) => (
          <li
            key={r.title}
            className="flex items-baseline gap-4 py-2.5"
            style={{ borderBottom: i < RANKS.length - 1 ? "1px solid var(--rule-soft)" : "none" }}
          >
            <span
              className="t-roman"
              style={{ minWidth: "2.6rem", fontSize: "0.78rem", color: i <= index ? "var(--ink-strong)" : "var(--ink-faint)" }}
            >
              {roman(i + 1)}
            </span>
            <span className={`t-entry ${i <= index ? "" : "t-faint"}`}>{r.title}</span>
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

function enrolled(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function CharacterPage() {
  const sheet = useSheet();
  const { status } = useHunter();
  // A visitor, or somebody who has not signed yet, sees an unsigned sheet;
  // a hunter sees their own record once it has been read.
  if (status !== "ready") {
    return (
      <div className="leaf leaf--ruled quire">
        <div className="leaf-field">
          <Crest sheet={null} />
        </div>
      </div>
    );
  }
  if (!sheet) {
    return (
      <div className="leaf" style={{ padding: "3rem", textAlign: "center" }}>
        <p className="t-entry">The clerk is reading your record…</p>
      </div>
    );
  }
  const whereabouts = placeById(sheet.realm.current)?.name || "On the road";
  const note = sheet.discharged
    ? `${sheet.weakest.name.toLowerCase()} is the weakest column — mend it on the next quest`
    : "the sheet fills in as you discharge quests";

  return (
    <>
      <div className="leaf leaf--ruled quire">
        <div className="leaf-field">
          <hr className="rule rule--double" style={{ marginTop: 0 }} />
          <Crest sheet={sheet} />
          <hr className="rule rule--double" />

          <div className="spread">
            <div className="flex flex-col gap-2">
              <Attributes sheet={sheet} />
              <Skills sheet={sheet} />
              <Achievements sheet={sheet} />
            </div>
            <aside>
              <div className="slip">
                <span className="t-caps label-gap">Entered in the register</span>
                <div className="flex flex-col">
                  <Leader label="Name" value={sheet.hunter.name} />
                  <Leader label="Enrolled" value={enrolled(sheet.hunter.created_at)} />
                  <Leader label="Whereabouts" value={whereabouts} />
                  <Leader label="Quests discharged" value={sheet.discharged ? roman(sheet.discharged) : "—"} />
                </div>
              </div>
              <p className="margin-note margin-note--right mt-5">{note}</p>
              <div className="flex justify-center mt-6" style={{ color: "var(--ink-faint)" }}>
                <Mark name="quill" size={40} />
              </div>
            </aside>
          </div>

          <BeastsKnown sheet={sheet} />
          <Equipment />
          <Path sheet={sheet} />

          <hr className="rule rule--double" />
          <p className="t-caps text-center">
            Sheet kept in the hunter&rsquo;s own hand · corrected after each quest
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-10">
        <Link to="/quests" className="ink-btn ink-btn--filled">Take up a quest</Link>
        <Link to="/roll" className="ink-btn">The roll of hunters</Link>
      </div>
    </>
  );
}
