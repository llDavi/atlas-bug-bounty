import { useEffect } from "react";
import { Routes, Route, Navigate, useParams, useLocation, Link } from "react-router-dom";
import { CodexHeader, Colophon, Fleuron } from "./components/ms/Codex";
import MapPage from "./pages/MapPage";
import QuestsPage from "./pages/QuestsPage";
import DungeonsPage from "./pages/DungeonsPage";
import DungeonPage from "./pages/DungeonPage";
import BestiaryPage from "./pages/BestiaryPage";
import JournalsPage from "./pages/JournalsPage";
import JournalPage from "./pages/JournalPage";
import CharacterPage from "./pages/CharacterPage";
import RollPage from "./pages/RollPage";
import OathPage from "./pages/OathPage";
import OathSwornPage from "./pages/OathSwornPage";
import CharterPage from "./pages/CharterPage";
import QuestionsPage from "./pages/QuestionsPage";
import QuestPage from "./pages/QuestPage";
import KingdomPage from "./pages/KingdomPage";
import ChapterPage from "./pages/ChapterPage";
import RegisterPage from "./pages/RegisterPage";
import RequireHunter from "./RequireHunter";
import HunterProvider from "./HunterProvider";

/* Old links, kept honest: the paths this book used to be bound under. */
function MovedTo({ to, param }) {
  const params = useParams();
  return <Navigate to={param ? `${to}/${params[param]}` : to} replace />;
}

function TurnToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="leaf leaf--ruled quire mx-auto" style={{ maxWidth: "34rem" }}>
      <div className="leaf-field text-center">
        <p className="t-caps">The keeper turns the whole book over</p>
        <h1 className="t-title text-4xl mt-2 mb-2">This folio was never bound.</h1>
        <Fleuron width={150} className="ornament--center" />
        <p className="column mx-auto">
          Either the page was cut out, or the road you followed here was drawn wrong. The survey
          is still where it was.
        </p>
        <Link to="/" className="ink-btn ink-btn--filled mt-6">Back to the survey</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HunterProvider>
    <div className="codex">
      <TurnToTop />
      <CodexHeader />

      <main className="codex-main max-w-6xl mx-auto px-4 sm:px-8" style={{ paddingBlock: "2.5rem" }}>
        <Routes>
          <Route path="/" element={<MapPage />} />

          <Route path="/register" element={<RegisterPage />} />
          <Route path="/kingdoms/:id" element={<KingdomPage />} />
          <Route path="/kingdoms/:id/:place" element={<ChapterPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/quests/:slug" element={<RequireHunter what="this quest"><QuestPage /></RequireHunter>} />
          <Route path="/dungeons" element={<DungeonsPage />} />
          <Route path="/dungeons/:slug" element={<DungeonPage />} />
          <Route path="/bestiary" element={<BestiaryPage />} />

          <Route path="/journals" element={<JournalsPage />} />
          <Route path="/journals/:slug" element={<JournalPage />} />

          <Route path="/character" element={<CharacterPage />} />
          <Route path="/roll" element={<RollPage />} />

          <Route path="/oath" element={<OathPage />} />
          <Route path="/oath/sworn" element={<OathSwornPage />} />

          <Route path="/charter" element={<CharterPage />} />
          <Route path="/questions" element={<QuestionsPage />} />

          {/* --- where the book was bound before --- */}
          <Route path="/pro" element={<OathPage />} />
          <Route path="/pro/success" element={<OathSwornPage />} />
          <Route path="/registry" element={<MovedTo to="/" />} />
          <Route path="/registry/:id" element={<MovedTo to="/" />} />
          <Route path="/programs" element={<MovedTo to="/" />} />
          <Route path="/walkthroughs" element={<MovedTo to="/journals" />} />
          <Route path="/walkthroughs/:slug" element={<MovedTo to="/journals" param="slug" />} />
          <Route path="/academy" element={<MovedTo to="/bestiary" />} />
          <Route path="/missions" element={<MovedTo to="/quests" />} />
          <Route path="/hunter" element={<MovedTo to="/character" />} />
          <Route path="/hall" element={<MovedTo to="/roll" />} />
          <Route path="/about" element={<MovedTo to="/charter" />} />
          <Route path="/faq" element={<MovedTo to="/questions" />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Colophon />
    </div>
    </HunterProvider>
  );
}
