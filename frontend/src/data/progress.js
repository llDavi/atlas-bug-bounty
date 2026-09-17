import { PLACES, ROADS } from "./world";

/* ==========================================================================
   PROGRESS — the map and the sheet, read off the quests a hunter discharged
   ==========================================================================
   Nothing here is stored: every state is derived from the quest list the
   register returns (each quest carrying its status for this reader), so the
   map and the sheet can never disagree with what was actually done.
   ========================================================================== */

/* Mirrors backend/sources/realm.py ATTRIBUTES. */
export const ATTRIBUTES = [
  { id: "recon", name: "Recon", note: "Finds the door nobody drew on the plan" },
  { id: "exploitation", name: "Exploitation", note: "Turns a curiosity into a proof" },
  { id: "logic", name: "Logic", note: "Asks what the builder assumed" },
  { id: "patience", name: "Patience", note: "Reads the whole ledger, twice" },
  { id: "reporting", name: "Reporting", note: "Writes so the fix is obvious" },
  { id: "restraint", name: "Restraint", note: "Stops at proof, never at profit" },
];

/* Mirrors backend DISCIPLINES. The subclass is the name a hunter earns in the
   discipline they have practised most. The first six are the classes chosen
   on 2 September; the rest are provisional names. */
export const DISCIPLINES = [
  { id: "http", name: "HTTP", subclass: "Adept" },
  { id: "recon", name: "Recon", subclass: "Scout" },
  { id: "xss", name: "XSS", subclass: "Illusionist" },
  { id: "idor", name: "IDOR", subclass: "Rogue" },
  { id: "ssrf", name: "SSRF", subclass: "Warlock" },
  { id: "sqli", name: "SQL injection", subclass: "Necromancer" },
  { id: "auth", name: "Auth & sessions", subclass: "Keybreaker" },
  { id: "csrf", name: "CSRF", subclass: "Forger" },
  { id: "open-redirect", name: "Open redirect", subclass: "Wayfinder" },
  { id: "logic", name: "Business logic", subclass: "Sophist" },
  { id: "deserialisation", name: "Deserialisation", subclass: "Binder" },
];

/* Quests discharged in a discipline → its standing on the sheet. */
const STANDINGS = [
  [5, "Mastered"],
  [3, "Advanced"],
  [1, "Practised"],
  [0, "Not yet met"],
];

/* Three grades of subclass, rising with the quests discharged in it. */
const GRADES = [
  [6, 3, (name) => `Master ${name}`],
  [3, 2, (name) => name],
  [1, 1, (name) => `Apprentice ${name}`],
];

const START = "wanderers-rest";

/* The drawn map is the Web Realm. A place is
     charted   — every quest written there is discharged
     current   — where the next unclaimed quest waits ("you stand here")
     rumoured  — a road leads to it from ground already walked
     unknown   — no road reaches it yet
   Roads are ways, so they run both directions. */
export function deriveRealm(quests) {
  const byPlace = {};
  for (const q of quests || []) (byPlace[q.place] ||= []).push(q);

  const charted = new Set(
    PLACES.filter((p) => byPlace[p.id]?.length && byPlace[p.id].every((q) => q.status === "completed")).map((p) => p.id)
  );
  const next = (quests || []).find((q) => q.kingdom === "web" && q.status === "available");
  const current = next ? next.place : charted.size ? null : START;

  const walked = new Set([START, ...charted, ...(current ? [current] : [])]);
  const heard = new Set();
  for (const road of ROADS) {
    if (walked.has(road.from)) heard.add(road.to);
    if (walked.has(road.to)) heard.add(road.from);
  }

  const states = {};
  for (const p of PLACES) {
    if (charted.has(p.id)) states[p.id] = "charted";
    else if (p.id === current) states[p.id] = "current";
    else if (walked.has(p.id) || heard.has(p.id)) states[p.id] = "rumoured";
    else states[p.id] = "unknown";
  }
  return { states, current, byPlace };
}

/* Attributes, skills and subclass, summed over the quests discharged. */
export function deriveSheet(quests, completedSlugs) {
  const done = (quests || []).filter((q) => completedSlugs.has(q.slug));

  const points = Object.fromEntries(ATTRIBUTES.map((a) => [a.id, 0]));
  const counts = Object.fromEntries(DISCIPLINES.map((d) => [d.id, 0]));
  for (const q of done) {
    for (const [id, n] of Object.entries(q.attributes || {})) if (id in points) points[id] += n;
    for (const id of q.skills || []) if (id in counts) counts[id] += 1;
  }

  const attributes = ATTRIBUTES.map((a) => ({ ...a, value: Math.min(10, points[a.id]) }));
  const skills = DISCIPLINES.map((d) => ({
    ...d,
    count: counts[d.id],
    standing: STANDINGS.find(([n]) => counts[d.id] >= n)[1],
  }));

  // Only the best discipline is shown; ties go to the first in the list.
  const best = skills.reduce((a, b) => (b.count > a.count ? b : a), skills[0]);
  const grade = GRADES.find(([n]) => best.count >= n);
  const subclass = grade ? { discipline: best, grade: grade[1], title: grade[2](best.subclass) } : null;

  const weakest = attributes.reduce((a, b) => (b.value < a.value ? b : a), attributes[0]);
  return { attributes, skills, subclass, weakest, discharged: done.length };
}

/* Achievements are facts about the record, never claims. */
export function deriveAchievements(quests, completedSlugs, realm) {
  const done = (quests || []).filter((q) => completedSlugs.has(q.slug));
  const practised = (skill) => done.some((q) => (q.skills || []).includes(skill));
  const charted = Object.values(realm.states).filter((s) => s === "charted").length;
  return [
    { name: "Signed the Register", note: "Your name entered in the book", won: true },
    { name: "First Blood", note: "A first quest discharged", won: done.length >= 1 },
    { name: "The Mirror Answered", note: "A quest of the Serpent's Tongue discharged", won: practised("xss") },
    { name: "Counter of Numbers", note: "A quest of the Gate That Counts discharged", won: practised("idor") },
    { name: "Surveyor", note: "Five places of a realm charted", won: charted >= 5 },
    { name: "Breaker of Scales", note: "A logic flaw nobody scans for", won: practised("logic") },
  ];
}
