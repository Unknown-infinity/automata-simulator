import {
  Circle,
  Download,
  FlaskConical,
  HelpCircle,
  Moon,
  Play,
  RotateCcw,
  Sparkles,
  StepForward,
  Sun,
  Upload
} from "lucide-react";

export default function AppHeader({
  inputString,
  setInputString,
  prompt,
  setPrompt,
  simState,
  autoPlay,
  onStartSimulation,
  onStep,
  onToggleAutoPlay,
  onResetSimulation,
  onExportJson,
  onImportClick,
  onImportFile,
  importInputRef,
  templates,
  onTemplateSelect,
  onGenerateFromPrompt,
  onOpenGuide,
  isDarkMode,
  onToggleDarkMode,
  onOpenTestSuite
}) {
  const generateFromPrompt = () => {
    onGenerateFromPrompt(prompt);
    setPrompt("");
  };

  return (
    <header className="z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
          <Circle className="text-blue-600 dark:text-blue-300" size={24} />
          Automata Simulator
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Design and simulate DFA/NFA executions step by step.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) {
              setPrompt(event.target.value);
              onTemplateSelect(event.target.value);
              event.target.value = "";
            }
          }}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">Templates</option>
          <optgroup label="Fundamentals">
            {templates.slice(0, 2).map((template) => (
              <option key={template.query} value={template.query}>
                {template.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Counting & Math">
            {templates.slice(2, 5).map((template) => (
              <option key={template.query} value={template.query}>
                {template.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Advanced Constraints">
            {templates.slice(5).map((template) => (
              <option key={template.query} value={template.query}>
                {template.label}
              </option>
            ))}
          </optgroup>
        </select>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
          <div className="pl-2 text-slate-400 dark:text-slate-500">
            <Sparkles size={16} />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                generateFromPrompt();
              }
            }}
            placeholder="e.g. ends with 10"
            className="w-40 bg-transparent text-sm text-slate-900 outline-none dark:text-white"
          />
          <button
            type="button"
            onClick={generateFromPrompt}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Generate
          </button>
        </div>

        <button
          type="button"
          onClick={onExportJson}
          className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Download size={16} /> Export
        </button>
        <button
          type="button"
          onClick={onImportClick}
          className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Upload size={16} /> Import
        </button>
        <button
          type="button"
          onClick={onOpenGuide}
          className="ml-2 rounded-full p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-slate-800"
          title="How to use"
          aria-label="How to use"
        >
          <HelpCircle size={20} />
        </button>
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="ml-2 rounded-full p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          onChange={onImportFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={onOpenTestSuite}
          className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <FlaskConical size={16} /> Test Suite
        </button>

        <div className="ml-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900">
          <input
            type="text"
            value={inputString}
            onChange={(event) => setInputString(event.target.value)}
            disabled={simState.status === "running"}
            placeholder="Input string"
            className="h-10 w-44 rounded-lg border border-slate-300 bg-white px-3 font-mono tracking-widest outline-none transition focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />

          {simState.status === "idle" ? (
            <button
              type="button"
              onClick={onStartSimulation}
              className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              <Play size={17} /> Start
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleAutoPlay}
                disabled={simState.status !== "running"}
                className={`h-10 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-50 ${
                  autoPlay
                    ? "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-slate-950"
                    : "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                }`}
              >
                {autoPlay ? "Pause" : "Auto Play"}
              </button>
              <button
                type="button"
                onClick={onStep}
                disabled={simState.status !== "running" || autoPlay}
                className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                <StepForward size={17} /> Step
              </button>
              <button
                type="button"
                onClick={onResetSimulation}
                className="flex h-10 items-center gap-2 rounded-lg bg-slate-200 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
              >
                <RotateCcw size={17} /> Reset
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
