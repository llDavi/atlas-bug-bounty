import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import WorldMap from "../components/ms/WorldMap";
import RealmMap from "../components/ms/RealmMap";
import { RuleHead, Stamp, Fleuron, Mark } from "../components/ms/Codex";
import { roman } from "../utils/numerals";
import { kingdomById } from "../data/realm";
import { chaptersOf, chaptersWithBoss } from "../data/chapters";
import { PLACES } from "../data/world";
import { deriveRealm } from "../data/progress";
import { useQuests } from "../useQuests";
import { useHunter } from "../hunter-context";

/* ==========================================================================
   ONE KINGDOM — its own map, and its chapters
   ==========================================================================
   Entered from a kingdom's card on the world map. On a kingdom's map every
   place is one chapter, and every chapter is one quest. The Web Realm uses
   its own survey; the other kingdoms are drawn by RealmMap from their
   definitions. A ledger of the chapters follows the map.
   ========================================================================== */

const STATUS = {
  completed: { word: "Discharged", tone: "green" },
  available: { word: "Open", tone: "rubric" },
  locked: { word: "Further down the road", tone: "faint" },
};

function ChapterLedger({ kingdomId, quests }) {
  const chapters = chaptersWithBoss(kingdomId);
  return (
    <div className="overflow-x-auto">
      <table className="ledger">
        <thead>
          <tr>
            <th style={{ width: "3.4rem" }}>№</th>
            <th style={{ minWidth: "16rem" }}>Chapter</th>
            <th style={{ width: "6rem" }}>Lessons</th>
            <th style={{ width: "13rem" }}>Standing</th>
          </tr>
        </thead>
        <tbody>
          {chapters.map((c, i) => {
            const isBoss = Boolean(c.finalBoss);
            const quest = c.place ? quests.find((q) => q.place === c.place && q.kingdom === kingdomId) : null;
            const st = quest ? STATUS[quest.status] || STATUS.available : null;
            return (
              <tr key={c.id} className={quest || isBoss ? "" : "is-locked"}>
                <td className="ledger-num" style={isBoss ? { color: "var(--rubric)" } : undefined}>
                  {isBoss ? "★" : roman(i + 1)}
                </td>
                <td>
                  <Link to={`/kingdoms/${kingdomId}/${c.place}`} className="t-minor" style={isBoss ? { color: "var(--rubric)" } : undefined}>{c.title}</Link>
                  <span className="block t-small mt-1">{c.real}</span>
                </td>
                <td className="t-hand">{isBoss ? "—" : c.topics.length}</td>
                <td>
                  {isBoss ? (
                    <Stamp tone="rubric">Final Boss</Stamp>
                  ) : st ? (
                    <Stamp tone={st.tone} pressed={quest.status === "completed"}>{st.word}</Stamp>
                  ) : (
                    <Stamp tone="faint">Being written</Stamp>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function KingdomPage() {
  const { id } = useParams();
  const k = kingdomById(id);
  const { quests } = useQuests();
  const { status } = useHunter();

  const realm = useMemo(() => deriveRealm(quests), [quests]);
  const places = useMemo(
    () => PLACES.map((p) => ({ ...p, state: status === "ready" ? realm.states[p.id] : "drawn" })),
    [realm, status]
  );

  if (!k) {
    return (
      <div className="leaf leaf--lit" style={{ padding: "2.6rem" }}>
        <p className="t-eyebrow">The cartographer checks the atlas twice</p>
        <h1 className="t-chapter mt-3 mb-8">No kingdom of that name is on the map.</h1>
        <Link to="/" className="ink-btn">Back to the known world</Link>
      </div>
    );
  }

  const chapters = chaptersOf(k.id);

  return (
    <>
      <Link to="/" className="t-caps" style={{ color: "var(--rubric)" }}>← The known world</Link>

      <header className="mt-6 mb-10">
        <p className="t-eyebrow">A kingdom of the realm · {k.real}</p>
        <div className="flex items-center gap-5 mt-3">
          <span style={{ color: "var(--ink-strong)" }}><Mark name={k.mark} size={52} /></span>
          <h1 className="t-folio">{k.name}</h1>
        </div>
        <Fleuron width={190} className="mt-5" />
        <p className="t-lead column mt-6">{k.gloss}</p>
        <p className="t-caps mt-4">{chapters.length} chapters &amp; a Final Boss · each a place on the map</p>
      </header>

      <RuleHead no={1}>The map of the kingdom</RuleHead>
      {k.id === "web" ? (
        <WorldMap places={places} questsByPlace={realm.byPlace} />
      ) : (
        <RealmMap kingdomId={k.id} quests={quests || []} />
      )}

      <RuleHead no={2}>The chapters of the kingdom</RuleHead>
      <ChapterLedger kingdomId={k.id} quests={quests || []} />

      <div className="flex flex-col items-center mt-16">
        <Fleuron width={150} />
      </div>
    </>
  );
}
