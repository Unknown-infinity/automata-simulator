import { useMemo } from "react";
import { buildFormalDefinition } from "../lib/automata";

const formatSet = (items) => (items.length > 0 ? `{ ${items.join(", ")} }` : "∅");

export default function FormalDefinitionSidebar({ states, transitions }) {
  const definition = useMemo(
    () => buildFormalDefinition(states, transitions),
    [states, transitions]
  );

  return (
    <aside className="h-full w-full overflow-y-auto bg-white dark:bg-slate-950">
      <div className="border-b border-slate-200 p-5 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          Formal Definition
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
          (Q, Σ, δ, q₀, F)
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          The tuple updates from the automaton currently drawn on the canvas.
        </p>
      </div>

      <div className="space-y-4 p-5">
        <DefinitionLine label="Q" value={formatSet(definition.states)} />
        <DefinitionLine label="Σ" value={formatSet(definition.alphabet)} />
        <DefinitionLine label="q₀" value={formatSet(definition.startStates)} />
        <DefinitionLine label="F" value={formatSet(definition.acceptStates)} />
      </div>

      <div className="border-t border-slate-200 p-5 dark:border-slate-800">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Transition Function
            </p>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              δ Table
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">→ start, * accept</span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <tr>
                <th className="border-b border-slate-200 px-3 py-2 font-semibold dark:border-slate-800">
                  State
                </th>
                {definition.alphabet.length === 0 ? (
                  <th className="border-b border-slate-200 px-3 py-2 font-semibold dark:border-slate-800">
                    No symbols
                  </th>
                ) : (
                  definition.alphabet.map((symbol) => (
                    <th
                      key={symbol}
                      className="border-b border-slate-200 px-3 py-2 font-semibold dark:border-slate-800"
                    >
                      {symbol}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {definition.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(definition.alphabet.length + 1, 2)}
                    className="px-3 py-6 text-center text-slate-500 dark:text-slate-400"
                  >
                    Draw states to build the table.
                  </td>
                </tr>
              ) : (
                definition.rows.map(({ state, cells }) => (
                  <tr key={state.id} className="bg-white dark:bg-slate-950">
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-900 dark:text-white">
                      <span className="mr-1 text-blue-700 dark:text-blue-300">
                        {state.isStart ? "→" : ""}
                        {state.isAccept ? "*" : ""}
                      </span>
                      {state.label}
                    </th>
                    {definition.alphabet.length === 0 ? (
                      <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">
                        ∅
                      </td>
                    ) : (
                      cells.map((cell) => (
                        <td
                          key={`${state.id}-${cell.symbol}`}
                          className="px-3 py-2 font-mono text-slate-700 dark:text-slate-200"
                        >
                          {formatSet(cell.targets)}
                        </td>
                      ))
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </aside>
  );
}

function DefinitionLine({ label, value }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <dt className="font-mono font-bold text-blue-700 dark:text-blue-300">{label}</dt>
      <dd className="break-words font-mono text-sm text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}
