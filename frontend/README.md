# The Hunter's Codex — Atlas frontend

A React + Vite front end built as an **ancient adventurer's codex**: a hand-drawn
survey of the Web Realm, a quest journal, dungeons to descend, a bestiary of
flaws, and a register of live bounty contracts.

## The visual system

Everything visual is defined in [`src/styles/manuscript.css`](src/styles/manuscript.css)
and drawn with the kit in [`src/components/ms/Codex.jsx`](src/components/ms/Codex.jsx).
The rules the system holds to, in order of importance:

- **Paper, not surfaces.** Every word sits on parchment. Depth comes from paper
  tone and ink weight — never from shadow stacks, gradients, glass or glow.
- **Square corners.** Paper is cut, not rounded.
- **Rules, not cards.** Sections are separated by hairline ink rules, ornaments
  and marginalia. There is no card grid anywhere in the book.
- **One accent at a time.** Rubric red for the single live thing on a page;
  muted green for what is done; faded gold for reward; desaturated blue for the
  later hand that wrote the marginal notes.
- **Objects of the world.** Buttons are inked labels, badges are pressed stamps,
  progress is an apothecary's measure, standing is a ruled register, the oath is
  sealed in wax.

Tailwind is used **for layout only** (grid, flex, spacing). If a Tailwind class
is doing skinning work, that is a bug.

Type: IM Fell English (titles), IM Fell English SC (small caps), EB Garamond
(body), Cinzel (inscriptional), Caveat (the marginal hand), Courier Prime
(pasted-in transcripts).

## Structure

```
src/
  components/ms/     the codex kit + the hand-drawn survey (WorldMap)
  data/              world.js (the map), journal.js (character, quests,
                     bestiary, roll), dungeons.js
  pages/             one file per folio of the book
  styles/            manuscript.css — the whole visual system
  utils/             roman numerals, engraving lookup, formatting
```

Routes: `/` the survey · `/quests` · `/dungeons` · `/bestiary` · `/journals`
· `/registry` (live programmes from the API) · `/character` · `/roll` · `/oath`
· `/charter` · `/questions`. The paths the site used to be bound under
(`/programs`, `/walkthroughs`, `/academy`, `/about`, …) redirect; `/pro` and
`/pro/success` are kept as-is because Stripe redirects to them.

## Running it

```bash
npm install
npm run dev      # expects the API on VITE_API_URL (default http://localhost:8000)
npm run build
npm run lint
```

`.env` needs `VITE_CLERK_PUBLISHABLE_KEY`, and `VITE_API_URL` in deployment.
