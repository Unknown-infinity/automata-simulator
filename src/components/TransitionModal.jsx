export default function TransitionModal({ onCancel, onSubmit }) {
  return (
    <div className="canvas-ui absolute inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-6 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-80 rounded-lg border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Transition</h3>
        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Symbols
          <input
            name="symbol"
            type="text"
            placeholder="0, 1 or ε"
            autoFocus
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Use comma-separated symbols. Leave blank for ε.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
