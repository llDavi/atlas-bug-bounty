const GEO_STYLES = {
  ok: "text-evergreen-700 bg-evergreen-50 border-evergreen-200 dark:text-evergreen-300 dark:bg-evergreen-950 dark:border-evergreen-800",
  vpn: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-950 dark:border-yellow-900",
  blocked: "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950 dark:border-red-900",
};

export default function GeoFlag({ geoAccess, geoNote }) {
  const style = GEO_STYLES[geoAccess] || "text-gray-700 bg-gray-50 border-gray-200";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}
      style={{ borderWidth: "0.5px" }}
    >
      {geoNote}
    </span>
  );
}
