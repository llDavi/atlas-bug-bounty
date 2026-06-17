import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ProgramsPage from "./pages/ProgramsPage";
import ProgramDetailPage from "./pages/ProgramDetailPage";
import LatestTargetsPage from "./pages/LatestTargetsPage";
import PlatformsPage from "./pages/PlatformsPage";
import GetListedPage from "./pages/GetListedPage";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import ProPage from "./pages/ProPage";
import ProSuccessPage from "./pages/ProSuccessPage";
import WalkthroughsPage from "./pages/WalkthroughsPage";
import WalkthroughDetailPage from "./pages/WalkthroughDetailPage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App({ dark, onToggleTheme }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/programs`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load programs");
        return res.json();
      })
      .then((data) => setPrograms(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-blue-slate-50 dark:bg-blue-slate-950 text-blue-slate-900 dark:text-blue-slate-100">
      <Navbar
        search={search}
        onSearchChange={setSearch}
        dark={dark}
        onToggleTheme={onToggleTheme}
      />

      <Routes>
        <Route path="/" element={<HomePage programs={programs} />} />
        <Route
          path="/programs"
          element={
            <ProgramsPage
              programs={programs}
              loading={loading}
              error={error}
              search={search}
            />
          }
        />
        <Route
          path="/programs/:id"
          element={<ProgramDetailPage programs={programs} loading={loading} />}
        />
        <Route path="/latest-targets" element={<LatestTargetsPage />} />
        <Route path="/platforms" element={<PlatformsPage />} />
        <Route path="/get-listed" element={<GetListedPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/pro" element={<ProPage />} />
        <Route path="/pro/success" element={<ProSuccessPage />} />
        <Route path="/walkthroughs" element={<WalkthroughsPage />} />
        <Route path="/walkthroughs/:slug" element={<WalkthroughDetailPage />} />
      </Routes>
    </div>
  );
}
