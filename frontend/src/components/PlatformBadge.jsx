const PLATFORM_STYLES = {
  hackerone: "text-dusty-grape-700 bg-dusty-grape-50 border-dusty-grape-200 dark:text-dusty-grape-300 dark:bg-dusty-grape-950 dark:border-dusty-grape-800",
  yeswehack: "text-amethyst-smoke-700 bg-amethyst-smoke-50 border-amethyst-smoke-200 dark:text-amethyst-smoke-300 dark:bg-amethyst-smoke-950 dark:border-amethyst-smoke-800",
  intigriti: "text-dark-slate-grey-700 bg-dark-slate-grey-50 border-dark-slate-grey-200 dark:text-dark-slate-grey-300 dark:bg-dark-slate-grey-950 dark:border-dark-slate-grey-800",
  bugcrowd: "text-evergreen-700 bg-evergreen-50 border-evergreen-200 dark:text-evergreen-300 dark:bg-evergreen-950 dark:border-evergreen-800",
  immunefi: "text-blue-slate-700 bg-blue-slate-50 border-blue-slate-200 dark:text-blue-slate-300 dark:bg-blue-slate-950 dark:border-blue-slate-800",
  sherlock: "text-dusty-grape-700 bg-dusty-grape-50 border-dusty-grape-200 dark:text-dusty-grape-300 dark:bg-dusty-grape-950 dark:border-dusty-grape-800",
};

export const PLATFORM_LABELS = {
  hackerone: "HackerOne",
  yeswehack: "YesWeHack",
  intigriti: "Intigriti",
  bugcrowd: "Bugcrowd",
  immunefi: "Immunefi",
  sherlock: "Sherlock",
};

export const PLATFORM_LOGO_STYLES = {
  hackerone: "bg-dusty-grape-100 text-dusty-grape-700 dark:bg-dusty-grape-900 dark:text-dusty-grape-300",
  yeswehack: "bg-amethyst-smoke-100 text-amethyst-smoke-700 dark:bg-amethyst-smoke-900 dark:text-amethyst-smoke-300",
  intigriti: "bg-dark-slate-grey-100 text-dark-slate-grey-700 dark:bg-dark-slate-grey-900 dark:text-dark-slate-grey-300",
  bugcrowd: "bg-evergreen-100 text-evergreen-700 dark:bg-evergreen-900 dark:text-evergreen-300",
  immunefi: "bg-blue-slate-100 text-blue-slate-700 dark:bg-blue-slate-900 dark:text-blue-slate-300",
  sherlock: "bg-dusty-grape-100 text-dusty-grape-700 dark:bg-dusty-grape-900 dark:text-dusty-grape-300",
};

export const PLATFORM_URLS = {
  hackerone: "https://hackerone.com",
  yeswehack: "https://yeswehack.com",
  intigriti: "https://www.intigriti.com",
  bugcrowd: "https://www.bugcrowd.com",
  immunefi: "https://immunefi.com",
  sherlock: "https://audits.sherlock.xyz",
};

export default function PlatformBadge({ platform }) {
  const style = PLATFORM_STYLES[platform] || "text-gray-700 bg-gray-50 border-gray-200";
  const label = PLATFORM_LABELS[platform] || platform;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}
      style={{ borderWidth: "0.5px" }}
    >
      {label}
    </span>
  );
}
