export default function ToolButton({ icon, label, active, onClick, danger = false }) {
  let colorClass = active
    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";

  if (danger) {
    colorClass = active
      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
      : "text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${colorClass}`}
      aria-label={label}
    >
      {icon}
      <span className="pointer-events-none absolute left-14 z-50 rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
        {label}
      </span>
    </button>
  );
}
