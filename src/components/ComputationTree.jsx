import { CheckCircle2, GitBranch, XCircle } from "lucide-react";
import { getStateLabel } from "../lib/automata";

const statusStyles = {
  active:
    "border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-100",
  dead:
    "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
  accepted:
    "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
  rejected:
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
};

export default function ComputationTree({ paths, states }) {
  if (paths.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Start a simulation to see NFA branches.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <GitBranch size={16} />
        Computation Tree
      </div>
      <div className="space-y-2">
        {paths.map((path, index) => (
          <div
            key={path.id}
            className={`rounded-lg border p-3 text-sm ${statusStyles[path.status]}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">Branch {index + 1}</span>
              <PathStatus status={path.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1 font-mono text-xs leading-6">
              {path.trace.map((entry, entryIndex) => (
                <span key={`${path.id}-${entryIndex}`} className="inline-flex items-center gap-1">
                  {entryIndex > 0 && (
                    <span className="text-slate-500 dark:text-slate-400">
                      --{entry.symbol}--&gt;
                    </span>
                  )}
                  <span className="rounded-md bg-white px-2 py-0.5 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white">
                    {getStateLabel(states, entry.stateId)}
                  </span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Consumed:{" "}
              <span className="font-mono">{path.consumed.length > 0 ? path.consumed : "ε"}</span>
              {path.reason ? ` · ${path.reason}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PathStatus({ status }) {
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white dark:bg-green-400 dark:text-slate-950">
        <CheckCircle2 size={13} /> Accept
      </span>
    );
  }

  if (status === "dead") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white dark:bg-red-400 dark:text-slate-950">
        <XCircle size={13} /> Dead
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white dark:bg-slate-300 dark:text-slate-950">
        <XCircle size={13} /> Reject
      </span>
    );
  }

  return (
    <span className="rounded-md bg-yellow-500 px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-950">
      Active
    </span>
  );
}
