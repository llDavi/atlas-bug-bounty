import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser, useAuth, useClerk, SignInButton } from "@clerk/clerk-react";
import { SearchIcon, SunIcon, MoonIcon, XIcon, RadarIcon, MenuIcon, CloseIcon } from "./icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const NAV_LINKS = [
  { label: "Programs", to: "/programs" },
  { label: "Walkthroughs", to: "/walkthroughs" },
  { label: "Platforms", to: "/platforms" },
  { label: "Get Listed", to: "/get-listed" },
  { label: "About", to: "/about" },
  { label: "FAQ", to: "/faq" },
];

function UserMenu() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut, openUserProfile } = useClerk();
  const [open, setOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const isPro = user?.publicMetadata?.is_pro === true;

  const handleManageSubscription = async () => {
    setOpen(false);
    setPortalLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/billing/portal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not open billing portal");
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setPortalLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded border border-blue-slate-200 dark:border-blue-slate-700 hover:border-evergreen-400 dark:hover:border-evergreen-500 transition-colors"
        style={{ borderWidth: "0.5px" }}
      >
        <img
          src={user.imageUrl}
          alt={user.firstName ?? "User"}
          className="w-5 h-5 rounded-full"
        />
        <span className="hidden sm:inline text-sm text-blue-slate-700 dark:text-blue-slate-300 max-w-[100px] truncate">
          {user.firstName ?? user.emailAddresses[0]?.emailAddress}
        </span>
        {isPro && (
          <span className="hidden sm:inline text-xs font-medium text-evergreen-600 dark:text-evergreen-400">
            Pro
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-blue-slate-200 dark:border-blue-slate-700 bg-white dark:bg-blue-slate-900 shadow-xl py-1 z-50 text-sm"
          onMouseLeave={() => setOpen(false)}
        >
          {isPro ? (
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-blue-slate-700 dark:text-blue-slate-300 hover:bg-blue-slate-50 dark:hover:bg-blue-slate-800 disabled:opacity-50"
            >
              {portalLoading ? "Opening..." : "Manage subscription"}
            </button>
          ) : (
            <Link
              to="/pro"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-evergreen-600 dark:text-evergreen-400 hover:bg-blue-slate-50 dark:hover:bg-blue-slate-800"
            >
              Upgrade to Pro
            </Link>
          )}
          <button
            type="button"
            onClick={() => { setOpen(false); openUserProfile(); }}
            className="w-full text-left px-3 py-2 text-blue-slate-700 dark:text-blue-slate-300 hover:bg-blue-slate-50 dark:hover:bg-blue-slate-800"
          >
            Manage account
          </button>
          <div className="border-t border-blue-slate-100 dark:border-blue-slate-800 my-1" style={{ borderWidth: "0.5px" }} />
          <button
            type="button"
            onClick={() => { setOpen(false); signOut(); }}
            className="w-full text-left px-3 py-2 text-blue-slate-500 dark:text-blue-slate-400 hover:bg-blue-slate-50 dark:hover:bg-blue-slate-800"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ search, onSearchChange, dark, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn } = useUser();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-blue-slate-200 dark:border-blue-slate-800 backdrop-blur transition-colors ${
        scrolled
          ? "bg-blue-slate-50/95 dark:bg-blue-slate-950/95"
          : "bg-blue-slate-50/70 dark:bg-blue-slate-950/70"
      }`}
      style={{ borderBottomWidth: "0.5px" }}
    >
      <div className="flex items-center gap-3 px-4 py-3 max-w-7xl mx-auto lg:px-8">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <RadarIcon className="w-5 h-5 text-blue-slate-900 dark:text-blue-slate-100" />
          <span className="font-semibold text-base text-blue-slate-900 dark:text-blue-slate-100">
            Atlas
          </span>
        </Link>

        <Link
          to="/pro"
          className="hidden sm:inline-flex items-center px-2 py-1 rounded text-xs font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300"
          style={{ borderWidth: "0.5px" }}
        >
          Pro
        </Link>

        <div className="flex-1 flex items-center max-w-md">
          <div className="relative w-full">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search programs..."
              className="w-full pl-8 pr-2 py-1.5 rounded text-sm bg-transparent border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 focus:outline-none focus:border-evergreen-400 dark:focus:border-evergreen-500"
              style={{ borderWidth: "0.5px" }}
            />
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-4 shrink-0">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm text-blue-slate-600 dark:text-blue-slate-300 hover:text-blue-slate-900 dark:hover:text-blue-slate-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div
          className="flex items-center gap-2 shrink-0 pl-3 ml-1 border-l border-blue-slate-200 dark:border-blue-slate-800"
          style={{ borderLeftWidth: "0.5px" }}
        >
          <a
            href="#"
            aria-label="X"
            className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded text-blue-slate-500 dark:text-blue-slate-400 hover:text-blue-slate-900 dark:hover:text-blue-slate-100"
          >
            <XIcon className="w-4 h-4" />
          </a>

          {isSignedIn ? (
            <UserMenu />
          ) : (
            <SignInButton mode="modal">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 hover:border-evergreen-400 dark:hover:border-evergreen-500 transition-colors"
                style={{ borderWidth: "0.5px" }}
              >
                Sign in
              </button>
            </SignInButton>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="inline-flex items-center justify-center w-8 h-8 rounded border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-600 dark:text-blue-slate-300"
            style={{ borderWidth: "0.5px" }}
          >
            {dark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-600 dark:text-blue-slate-300"
            style={{ borderWidth: "0.5px" }}
          >
            {mobileOpen ? <CloseIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="lg:hidden flex flex-col px-4 pb-3 max-w-7xl mx-auto lg:px-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm text-blue-slate-600 dark:text-blue-slate-300 hover:text-blue-slate-900 dark:hover:text-blue-slate-100 border-b border-blue-slate-100 dark:border-blue-slate-800 last:border-b-0"
              style={{ borderBottomWidth: "0.5px" }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/pro"
            onClick={() => setMobileOpen(false)}
            className="py-2 text-sm font-medium text-evergreen-600 dark:text-evergreen-400"
          >
            Pro
          </Link>
        </nav>
      )}
    </header>
  );
}
