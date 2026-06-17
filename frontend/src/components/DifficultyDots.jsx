export default function DifficultyDots({ level }) {
  return (
    <div className="flex items-center gap-1" title={`Difficulty ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full border ${
            i <= level
              ? "bg-evergreen-600 border-evergreen-600 dark:bg-evergreen-400 dark:border-evergreen-400"
              : "bg-transparent border-blue-slate-300 dark:border-blue-slate-600"
          }`}
          style={{ borderWidth: "0.5px" }}
        />
      ))}
    </div>
  );
}
