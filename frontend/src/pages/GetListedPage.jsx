import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const EMPTY_FORM = {
  program_name: "",
  platform: "HackerOne",
  program_url: "",
  contact_email: "",
  notes: "",
};

export default function GetListedPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    fetch(`${API_URL}/api/get-listed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => { throw new Error(d.detail || "Request failed"); });
        return r.json();
      })
      .then(() => {
        setStatus("success");
        setForm(EMPTY_FORM);
      })
      .catch((e) => {
        setStatus("error");
        setError(e.message);
      });
  };

  return (
    <main className="px-4 py-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-slate-900 dark:text-blue-slate-100">
        Get Listed
      </h1>
      <p className="text-sm text-blue-slate-500 dark:text-blue-slate-400 mt-1">
        Want your bug bounty program to show up on Atlas? Send us the information below and we'll add it as soon as possible.
      </p>

      {status === "success" ? (
        <div
          className="mt-4 rounded-lg border border-evergreen-200 bg-evergreen-50 dark:border-evergreen-800 dark:bg-evergreen-950 p-4 text-sm text-evergreen-700 dark:text-evergreen-300"
          style={{ borderWidth: "0.5px" }}
        >
          Request received — thanks! We'll review it and add the program soon.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-lg border border-blue-slate-200 dark:border-blue-slate-600 dark:bg-blue-slate-800/70 p-4 flex flex-col gap-4"
          style={{ borderWidth: "0.5px" }}
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-blue-slate-500 dark:text-blue-slate-400 uppercase tracking-wide">
              Program name
            </label>
            <input
              type="text"
              required
              value={form.program_name}
              onChange={update("program_name")}
              placeholder="E.g. Acme Corp"
              className="px-3 py-2 rounded text-sm bg-transparent border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 focus:outline-none focus:border-evergreen-400 dark:focus:border-evergreen-500"
              style={{ borderWidth: "0.5px" }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-blue-slate-500 dark:text-blue-slate-400 uppercase tracking-wide">
              Platform
            </label>
            <select
              value={form.platform}
              onChange={update("platform")}
              className="px-3 py-2 rounded text-sm bg-transparent border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 focus:outline-none focus:border-evergreen-400 dark:focus:border-evergreen-500"
              style={{ borderWidth: "0.5px" }}
            >
              <option>HackerOne</option>
              <option>Bugcrowd</option>
              <option>Intigriti</option>
              <option>YesWeHack</option>
              <option>Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-blue-slate-500 dark:text-blue-slate-400 uppercase tracking-wide">
              Program URL
            </label>
            <input
              type="url"
              required
              value={form.program_url}
              onChange={update("program_url")}
              placeholder="https://..."
              className="px-3 py-2 rounded text-sm bg-transparent border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 focus:outline-none focus:border-evergreen-400 dark:focus:border-evergreen-500"
              style={{ borderWidth: "0.5px" }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-blue-slate-500 dark:text-blue-slate-400 uppercase tracking-wide">
              Contact email
            </label>
            <input
              type="email"
              required
              value={form.contact_email}
              onChange={update("contact_email")}
              placeholder="name@example.com"
              className="px-3 py-2 rounded text-sm bg-transparent border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 focus:outline-none focus:border-evergreen-400 dark:focus:border-evergreen-500"
              style={{ borderWidth: "0.5px" }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-blue-slate-500 dark:text-blue-slate-400 uppercase tracking-wide">
              Additional notes
            </label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={update("notes")}
              placeholder="Any useful details about the program..."
              className="px-3 py-2 rounded text-sm bg-transparent border border-blue-slate-200 dark:border-blue-slate-700 text-blue-slate-700 dark:text-blue-slate-300 focus:outline-none focus:border-evergreen-400 dark:focus:border-evergreen-500 resize-none"
              style={{ borderWidth: "0.5px" }}
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="self-start px-4 py-2 rounded text-sm font-medium border border-evergreen-200 bg-evergreen-50 text-evergreen-700 dark:border-evergreen-800 dark:bg-evergreen-950 dark:text-evergreen-300 hover:border-evergreen-400 dark:hover:border-evergreen-500 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderWidth: "0.5px" }}
          >
            {status === "submitting" ? "Submitting..." : "Submit request"}
          </button>
        </form>
      )}
    </main>
  );
}
