import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Hand,
  MousePointer2,
  Play,
  Trash2
} from "lucide-react";
import { MODES } from "../constants";
import ToolButton from "./ToolButton";

export default function ToolsSidebar({ mode, setMode }) {
  return (
    <aside className="z-10 flex w-16 flex-col items-center gap-2 border-r border-slate-200 bg-white py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <ToolButton
        icon={<MousePointer2 size={20} />}
        label="Select/Move"
        active={mode === MODES.SELECT}
        onClick={() => setMode(MODES.SELECT)}
      />
      <ToolButton
        icon={<Hand size={20} />}
        label="Pan Canvas"
        active={mode === MODES.PAN}
        onClick={() => setMode(MODES.PAN)}
      />
      <ToolButton
        icon={<Circle size={20} />}
        label="Add State"
        active={mode === MODES.ADD_STATE}
        onClick={() => setMode(MODES.ADD_STATE)}
      />
      <ToolButton
        icon={<ArrowRight size={20} />}
        label="Add Transition"
        active={mode === MODES.ADD_TRANSITION}
        onClick={() => setMode(MODES.ADD_TRANSITION)}
      />
      <div className="my-2 h-px w-10 bg-slate-200 dark:bg-slate-700" />
      <ToolButton
        icon={<Play size={20} className="rotate-90" />}
        label="Toggle Start"
        active={mode === MODES.TOGGLE_START}
        onClick={() => setMode(MODES.TOGGLE_START)}
      />
      <ToolButton
        icon={<CheckCircle2 size={20} />}
        label="Toggle Accept"
        active={mode === MODES.TOGGLE_ACCEPT}
        onClick={() => setMode(MODES.TOGGLE_ACCEPT)}
      />
      <div className="my-2 h-px w-10 bg-slate-200 dark:bg-slate-700" />
      <ToolButton
        icon={<Trash2 size={20} />}
        label="Delete"
        active={mode === MODES.DELETE}
        onClick={() => setMode(MODES.DELETE)}
        danger
      />
    </aside>
  );
}
