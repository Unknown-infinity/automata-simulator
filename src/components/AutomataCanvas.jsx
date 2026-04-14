import { Info, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { COLORS, MODES, NODE_RADIUS } from "../constants";
import {
  generateId,
  getEdgePoint,
  snapPointToGrid,
  splitSymbols
} from "../lib/automata";
import TransitionModal from "./TransitionModal";

export default function AutomataCanvas({
  states,
  setStates,
  transitions,
  setTransitions,
  mode,
  setMode,
  simState
}) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [drawingTransition, setDrawingTransition] = useState(null);
  const [transitionModal, setTransitionModal] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const canvasRef = useRef(null);

  const getClientPoint = (event) => {
    const pointer = event.touches?.[0] ?? event;
    return {
      clientX: pointer.clientX,
      clientY: pointer.clientY
    };
  };

  const getMousePos = useCallback((event) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    const { clientX, clientY } = getClientPoint(event);

    return {
      x: (clientX - rect.left - transform.x) / transform.scale,
      y: (clientY - rect.top - transform.y) / transform.scale
    };
  }, [transform]);

  const handleWheel = (event) => {
    if (!event.target.closest?.(".canvas-container") || !canvasRef.current) {
      return;
    }

    event.preventDefault();

    const scaleAmount = -event.deltaY * 0.001;
    const newScale = Math.min(
      Math.max(0.1, transform.scale * (1 + scaleAmount)),
      4
    );
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
    const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

    setTransform({ x: newX, y: newY, scale: newScale });
  };

  const handleCanvasPointerDown = (event) => {
    if (event.target.closest?.(".canvas-ui")) return;

    const { clientX, clientY } = getClientPoint(event);

    if (mode === MODES.PAN) {
      setIsPanning(true);
      setPanStart({ x: clientX - transform.x, y: clientY - transform.y });
      return;
    }

    const tagName = event.target.tagName?.toLowerCase();
    if (tagName !== "svg" && tagName !== "rect") return;

    if (mode === MODES.ADD_STATE) {
      const point = snapPointToGrid(getMousePos(event));
      const newState = {
        id: generateId(),
        label: `q${states.length}`,
        x: point.x,
        y: point.y,
        isStart: states.length === 0,
        isAccept: false
      };

      setStates((currentStates) => [...currentStates, newState]);
      return;
    }

    setSelectedNode(null);
  };

  const handlePointerMove = useCallback(
    (event) => {
      const { clientX, clientY } = getClientPoint(event);

      if (isPanning && panStart) {
        event.preventDefault?.();
        setTransform((currentTransform) => ({
          ...currentTransform,
          x: clientX - panStart.x,
          y: clientY - panStart.y
        }));
        return;
      }

      if (draggingNode) {
        event.preventDefault?.();
        const point = snapPointToGrid(getMousePos(event));
        setStates((currentStates) =>
          currentStates.map((state) =>
            state.id === draggingNode ? { ...state, ...point } : state
          )
        );
        return;
      }

      if (drawingTransition) {
        const point = getMousePos(event);
        setDrawingTransition((current) =>
          current ? { ...current, currentX: point.x, currentY: point.y } : current
        );
      }
    },
    [draggingNode, drawingTransition, getMousePos, isPanning, panStart, setStates]
  );

  const handlePointerUp = useCallback(() => {
    setDraggingNode(null);
    setDrawingTransition(null);
    setIsPanning(false);
    setPanStart(null);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleNodePointerDown = (event, stateId) => {
    event.stopPropagation();

    if (mode === MODES.SELECT) {
      setDraggingNode(stateId);
      setSelectedNode(stateId);
      return;
    }

    if (mode === MODES.ADD_TRANSITION) {
      const state = states.find((candidate) => candidate.id === stateId);
      if (state) {
        setDrawingTransition({ from: stateId, currentX: state.x, currentY: state.y });
      }
      return;
    }

    if (mode === MODES.TOGGLE_START) {
      setStates((currentStates) =>
        currentStates.map((state) =>
          state.id === stateId ? { ...state, isStart: !state.isStart } : state
        )
      );
      return;
    }

    if (mode === MODES.TOGGLE_ACCEPT) {
      setStates((currentStates) =>
        currentStates.map((state) =>
          state.id === stateId ? { ...state, isAccept: !state.isAccept } : state
        )
      );
      return;
    }

    if (mode === MODES.DELETE) {
      setStates((currentStates) => currentStates.filter((state) => state.id !== stateId));
      setTransitions((currentTransitions) =>
        currentTransitions.filter(
          (transition) => transition.from !== stateId && transition.to !== stateId
        )
      );
      setSelectedNode(null);
    }
  };

  const handleNodePointerUp = (event, stateId) => {
    event.stopPropagation();

    if (mode === MODES.ADD_TRANSITION && drawingTransition) {
      setTransitionModal({ from: drawingTransition.from, to: stateId });
      setDrawingTransition(null);
    }
  };

  const handleAddTransitionSubmit = (event) => {
    event.preventDefault();

    const symbol = event.currentTarget.elements.symbol.value || "ε";
    const nextSymbols = splitSymbols(symbol);

    setTransitions((currentTransitions) => {
      const existingIndex = currentTransitions.findIndex(
        (transition) =>
          transition.from === transitionModal.from && transition.to === transitionModal.to
      );

      if (existingIndex >= 0) {
        return currentTransitions.map((transition, index) => {
          if (index !== existingIndex) return transition;

          const existingSymbols = splitSymbols(transition.symbol);
          const combined = Array.from(new Set([...existingSymbols, ...nextSymbols])).join(", ");

          return { ...transition, symbol: combined };
        });
      }

      return [
        ...currentTransitions,
        {
          id: generateId(),
          from: transitionModal.from,
          to: transitionModal.to,
          symbol
        }
      ];
    });

    setTransitionModal(null);
    setMode(MODES.SELECT);
  };

  const renderTransitions = () =>
    transitions.map((transition) => {
      const fromState = states.find((state) => state.id === transition.from);
      const toState = states.find((state) => state.id === transition.to);
      if (!fromState || !toState) return null;

      const isActive = simState.activeTransitions.has(transition.id);
      const color = isActive ? COLORS.active : COLORS.edge;
      const strokeWidth = isActive ? 3 : 2;

      if (fromState.id === toState.id) {
        const path = `M ${fromState.x - 10} ${fromState.y - 20} C ${fromState.x - 40} ${fromState.y - 90}, ${fromState.x + 40} ${fromState.y - 90}, ${fromState.x + 10} ${fromState.y - 20}`;

        return (
          <g key={transition.id}>
            <path
              id={`transition-path-${transition.id}`}
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              markerEnd={`url(#arrow-${isActive ? "active" : "normal"})`}
              className="transition-all duration-300"
            />
            {isActive && <TransitionParticle path={path} />}
            <rect
              x={fromState.x - 18}
              y={fromState.y - 78}
              width={36}
              height={22}
              rx={6}
              className="fill-white dark:fill-slate-900"
            />
            <text
              x={fromState.x}
              y={fromState.y - 62}
              textAnchor="middle"
              fontSize="12"
              fontWeight={isActive ? "bold" : "normal"}
              className="fill-slate-800 dark:fill-slate-100"
            >
              {transition.symbol}
            </text>
          </g>
        );
      }

      const hasReverse = transitions.some(
        (reverse) => reverse.from === transition.to && reverse.to === transition.from
      );
      const p1 = { x: fromState.x, y: fromState.y };
      const p2 = { x: toState.x, y: toState.y };

      let path = "";
      let textX = (p1.x + p2.x) / 2;
      let textY = (p1.y + p2.y) / 2 - 10;

      if (hasReverse) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / len;
        const ny = dy / len;
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const curveOffset = 30;
        const cx = midX - ny * curveOffset;
        const cy = midY + nx * curveOffset;
        const startEdge = getEdgePoint(cx, cy, p1.x, p1.y, NODE_RADIUS);
        const endEdge = getEdgePoint(cx, cy, p2.x, p2.y, NODE_RADIUS, 5);

        path = `M ${startEdge.x} ${startEdge.y} Q ${cx} ${cy} ${endEdge.x} ${endEdge.y}`;
        textX = cx;
        textY = cy;
      } else {
        const endEdge = getEdgePoint(p1.x, p1.y, p2.x, p2.y, NODE_RADIUS, 5);
        const startEdge = getEdgePoint(p2.x, p2.y, p1.x, p1.y, NODE_RADIUS);
        path = `M ${startEdge.x} ${startEdge.y} L ${endEdge.x} ${endEdge.y}`;
      }

      return (
        <g key={transition.id}>
          <path
            id={`transition-path-${transition.id}`}
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            markerEnd={`url(#arrow-${isActive ? "active" : "normal"})`}
            className="transition-all duration-300"
          />
          {isActive && <TransitionParticle path={path} />}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            fontSize="14"
            fontWeight={isActive ? "bold" : "normal"}
            className="fill-slate-800 stroke-white dark:fill-slate-100 dark:stroke-slate-950"
            style={{ paintOrder: "stroke", strokeWidth: 4 }}
          >
            {transition.symbol}
          </text>
        </g>
      );
    });

  return (
    <div
      ref={canvasRef}
      onPointerDown={handleCanvasPointerDown}
      onWheel={handleWheel}
      className="canvas-container relative flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900"
      style={{ touchAction: "none" }}
    >
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%",
          position: "absolute",
          cursor: mode === MODES.PAN ? (isPanning ? "grabbing" : "grab") : "default"
        }}
      >
        <svg className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <marker
              id="arrow-normal"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.edge} />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.active} />
            </marker>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.07"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect
            x="-10000"
            y="-10000"
            width="20000"
            height="20000"
            fill="url(#grid)"
            pointerEvents="all"
          />

          {states
            .filter((state) => state.isStart)
            .map((state) => {
              const isActive = simState.activeStates.has(state.id);

              return (
                <g key={`start-${state.id}`} pointerEvents="none">
                  <path
                    d={`M ${state.x - 60} ${state.y} L ${state.x - NODE_RADIUS - 5} ${state.y}`}
                    stroke={isActive ? COLORS.active : COLORS.edge}
                    strokeWidth={isActive ? 3 : 2}
                    markerEnd={`url(#arrow-${isActive ? "active" : "normal"})`}
                  />
                  <text
                    x={state.x - 70}
                    y={state.y + 4}
                    fontSize="12"
                    textAnchor="end"
                    className={`font-semibold ${
                      isActive ? "fill-yellow-500" : "fill-slate-500 dark:fill-slate-400"
                    }`}
                  >
                    Start
                  </text>
                </g>
              );
            })}

          <g pointerEvents="none">{renderTransitions()}</g>

          {drawingTransition && (
            <path
              d={buildDrawingPath(states, drawingTransition)}
              fill="none"
              stroke={COLORS.primary}
              strokeWidth="2"
              strokeDasharray="4"
              markerEnd="url(#arrow-normal)"
              pointerEvents="none"
            />
          )}
        </svg>

        {states.map((state) => {
          const isActive = simState.activeStates.has(state.id);
          const isSelected = selectedNode === state.id;
          let ringClass = "border-slate-300 dark:border-slate-600";

          if (isActive) {
            ringClass =
              "border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)] dark:border-yellow-500";
          } else if (isSelected) {
            ringClass =
              "border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.45)] dark:border-blue-300";
          }

          return (
            <div
              key={state.id}
              onPointerDown={(event) => handleNodePointerDown(event, state.id)}
              onPointerUp={(event) => handleNodePointerUp(event, state.id)}
              className={`absolute flex cursor-pointer select-none items-center justify-center rounded-full border-2 bg-white transition-colors duration-200 dark:bg-slate-800 ${ringClass}`}
              style={{
                width: NODE_RADIUS * 2,
                height: NODE_RADIUS * 2,
                left: state.x - NODE_RADIUS,
                top: state.y - NODE_RADIUS,
                touchAction: "none"
              }}
            >
              {state.isAccept && (
                <div
                  className={`absolute rounded-full border-2 ${
                    isActive
                      ? "border-yellow-400 dark:border-yellow-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                  style={{
                    width: NODE_RADIUS * 2 - 8,
                    height: NODE_RADIUS * 2 - 8
                  }}
                />
              )}
              <span className="z-10 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {state.label}
              </span>
            </div>
          );
        })}
      </div>

      {transitionModal && (
        <TransitionModal
          onCancel={() => setTransitionModal(null)}
          onSubmit={handleAddTransitionSubmit}
        />
      )}

      {simState.status === "idle" && mode !== MODES.SELECT && !transitionModal && (
        <CanvasHint mode={mode} />
      )}

      <div className="canvas-ui absolute bottom-6 right-6 z-40 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={() =>
            setTransform((currentTransform) => ({
              ...currentTransform,
              scale: Math.max(0.1, currentTransform.scale - 0.2)
            }))
          }
          className="rounded p-1 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Zoom out"
        >
          <ZoomOut size={18} />
        </button>
        <span className="w-12 text-center font-mono text-xs text-slate-600 dark:text-slate-300">
          {Math.round(transform.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() =>
            setTransform((currentTransform) => ({
              ...currentTransform,
              scale: Math.min(4, currentTransform.scale + 0.2)
            }))
          }
          className="rounded p-1 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
        <div className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-600" />
        <button
          type="button"
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="rounded px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function TransitionParticle({ path }) {
  return (
    <circle
      r="4"
      fill={COLORS.active}
      style={{ filter: "drop-shadow(0 0 8px rgba(234,179,8,0.95))" }}
    >
      <animateMotion dur="0.8s" repeatCount="indefinite" path={path} />
    </circle>
  );
}

function buildDrawingPath(states, drawingTransition) {
  const fromState = states.find((state) => state.id === drawingTransition.from);
  if (!fromState) return "";

  return `M ${fromState.x} ${fromState.y} L ${drawingTransition.currentX} ${drawingTransition.currentY}`;
}

function CanvasHint({ mode }) {
  const messages = {
    [MODES.ADD_STATE]: "Click anywhere to create a state.",
    [MODES.ADD_TRANSITION]: "Drag from one state to another.",
    [MODES.TOGGLE_START]: "Click a state to toggle start status.",
    [MODES.TOGGLE_ACCEPT]: "Click a state to toggle accept status.",
    [MODES.DELETE]: "Click a state to delete it.",
    [MODES.PAN]: "Drag the canvas background to pan."
  };

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-slate-900/85 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur dark:bg-slate-700/90">
      <Info size={16} />
      {messages[mode]}
    </div>
  );
}
