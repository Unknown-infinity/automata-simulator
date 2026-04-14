import { Plus, Trash2, X } from "lucide-react";
import { generateId, runNfa } from "../lib/automata";

export default function TestSuiteModal({
  open,
  onClose,
  states,
  transitions,
  testCases,
  setTestCases,
  testResults,
  setTestResults
}) {
  if (!open) return null;

  const addTestCase = () => {
    setTestCases((currentCases) => [
      ...currentCases,
      { id: generateId(), input: "", expected: true }
    ]);
  };

  const updateTestCase = (id, patch) => {
    setTestCases((currentCases) =>
      currentCases.map((testCase) =>
        testCase.id === id ? { ...testCase, ...patch } : testCase
      )
    );
  };

  const removeTestCase = (id) => {
    setTestCases((currentCases) => currentCases.filter((testCase) => testCase.id !== id));
    setTestResults((currentResults) =>
      currentResults.filter((result) => result.id !== id)
    );
  };

  const runAll = () => {
    const results = testCases.map((testCase) => {
      const result = runNfa(states, transitions, testCase.input);
      const actual = result.accepted;
      const errored = result.status === "error";

      return {
        id: testCase.id,
        input: testCase.input,
        expected: testCase.expected,
        actual,
        status: errored ? "error" : actual === testCase.expected ? "pass" : "fail",
        errorMsg: result.errorMsg
      };
    });

    setTestResults(results);
  };

  const resultById = new Map(testResults.map((result) => [result.id, result]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-6 backdrop-blur-sm">
      <section className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              Batch Runner
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              Test Suite
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Add strings, set the expected result, and run them against the current NFA.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close test suite"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-auto p-5">
          <div className="mb-4 flex flex-wrap justify-between gap-2">
            <button
              type="button"
              onClick={addTestCase}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Plus size={16} /> Add String
            </button>
            <button
              type="button"
              onClick={runAll}
              disabled={testCases.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Run All
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <tr>
                  <th className="px-3 py-2 font-semibold">String</th>
                  <th className="px-3 py-2 font-semibold">Expected Result</th>
                  <th className="px-3 py-2 font-semibold">Actual Result</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="w-12 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {testCases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      No test strings yet.
                    </td>
                  </tr>
                ) : (
                  testCases.map((testCase) => {
                    const result = resultById.get(testCase.id);

                    return (
                      <tr key={testCase.id} className="bg-white dark:bg-slate-950">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={testCase.input}
                            onChange={(event) =>
                              updateTestCase(testCase.id, { input: event.target.value })
                            }
                            placeholder="leave blank for ε"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={String(testCase.expected)}
                            onChange={(event) =>
                              updateTestCase(testCase.id, {
                                expected: event.target.value === "true"
                              })
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          >
                            <option value="true">Accepted</option>
                            <option value="false">Rejected</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                          {result ? formatResult(result.actual, result.status) : "Not run"}
                        </td>
                        <td className="px-3 py-2">
                          {result ? <StatusPill result={result} /> : "—"}
                          {result?.errorMsg ? (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                              {result.errorMsg}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeTestCase(testCase.id)}
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
                            aria-label="Remove test string"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatResult(actual, status) {
  if (status === "error") return "Error";
  return actual ? "Accepted" : "Rejected";
}

function StatusPill({ result }) {
  const styles = {
    pass: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200",
    fail: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
    error: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200"
  };

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wider ${styles[result.status]}`}
    >
      {result.status}
    </span>
  );
}
