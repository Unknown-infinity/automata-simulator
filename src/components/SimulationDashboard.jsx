import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import ComputationTree from "./ComputationTree";

export default function SimulationDashboard({ inputString, simState, states }) {
  if (simState.status === "idle") {
    return null;
  }

  return (
    <section className="z-20 grid h-72 grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)] gap-6 border-t border-slate-200 bg-white p-5 shadow-[0_-4px_10px_-8px_rgba(15,23,42,0.8)] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-w-0 flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              Simulation Tape
              <StatusBadge status={simState.status} />
            </h2>
            {simState.errorMsg && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {simState.errorMsg}
              </p>
            )}
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            step {simState.step}
          </span>
        </div>

        {simState.status !== "error" && (
          <div className="flex flex-1 items-center overflow-x-auto pb-4">
            <div className="mx-auto flex min-w-max gap-2 px-4">
              {inputString.length === 0 ? (
                <div className="text-slate-500 dark:text-slate-400">Empty string (ε)</div>
              ) : (
                inputString.split("").map((char, index) => (
                  <TapeCell
                    key={`${char}-${index}`}
                    char={char}
                    index={index}
                    simState={simState}
                  />
                ))
              )}
              {inputString.length > 0 && (
                <div
                  className={`flex h-16 w-8 items-center justify-center transition ${
                    simState.step === inputString.length && simState.status === "accepted"
                      ? "scale-125 text-green-600 dark:text-green-300"
                      : "text-slate-300 dark:text-slate-700"
                  }`}
                >
                  <CheckCircle2 size={simState.step === inputString.length ? 24 : 16} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ComputationTree paths={simState.paths} states={states} />
    </section>
  );
}

function TapeCell({ char, index, simState }) {
  let className =
    "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";

  if (index < simState.step) {
    className =
      "border-slate-300 bg-slate-200 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500";
  }

  if (index === simState.step && simState.status === "running") {
    className =
      "scale-110 border-yellow-400 bg-yellow-100 text-yellow-800 shadow-md dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-100";
  }

  if (index === simState.step && simState.status === "rejected") {
    className =
      "scale-110 border-red-500 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-100";
  }

  return (
    <div
      className={`flex h-16 w-12 items-center justify-center rounded-lg border-2 font-mono text-2xl font-bold transition-all ${className}`}
    >
      {char}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-green-700 dark:bg-green-950 dark:text-green-200">
        <CheckCircle2 size={14} /> Accepted
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-red-700 dark:bg-red-950 dark:text-red-200">
        <XCircle size={14} /> Rejected
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-orange-700 dark:bg-orange-950 dark:text-orange-200">
        <AlertCircle size={14} /> Error
      </span>
    );
  }

  return (
    <span className="rounded-md bg-yellow-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
      Running
    </span>
  );
}
