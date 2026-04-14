import { GRID_SIZE } from "../constants.js";

export const generateId = () => Math.random().toString(36).slice(2, 11);

export const splitSymbols = (symbol = "") =>
  symbol
    .split(",")
    .map((part) => part.trim())
    .map((part) => (part === "" ? "ε" : part));

export const isEpsilonSymbol = (symbol) =>
  symbol === "" || symbol === "ε" || symbol.toLowerCase() === "e";

export const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

export const snapPointToGrid = ({ x, y }) => ({
  x: snapToGrid(x),
  y: snapToGrid(y)
});

export const getEdgePoint = (x1, y1, x2, y2, radius, offset = 0) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: x1, y: y1 };

  const nx = dx / len;
  const ny = dy / len;

  return {
    x: x2 - nx * (radius + offset),
    y: y2 - ny * (radius + offset)
  };
};

export const getStateLabel = (states, stateId) =>
  states.find((state) => state.id === stateId)?.label ?? stateId;

export const getAlphabet = (transitions) => {
  const alphabet = new Set();

  transitions.forEach((transition) => {
    splitSymbols(transition.symbol).forEach((symbol) => {
      if (!isEpsilonSymbol(symbol)) {
        alphabet.add(symbol);
      }
    });
  });

  return Array.from(alphabet).sort();
};

export const createIdleSimState = () => ({
  status: "idle",
  step: 0,
  paths: [],
  activeStates: new Set(),
  activeTransitions: new Set(),
  errorMsg: "",
  history: []
});

const createPath = ({ stateId, trace, parentId = null, consumed = "" }) => ({
  id: generateId(),
  parentId,
  stateId,
  consumed,
  trace,
  status: "active",
  reason: ""
});

const createInitialPath = (stateId) =>
  createPath({
    stateId,
    trace: [
      {
        stateId,
        transitionId: null,
        symbol: "start",
        inputIndex: null
      }
    ]
  });

const appendPathStep = (path, transition, symbol, inputIndex, consumed) =>
  createPath({
    stateId: transition.to,
    parentId: path.id,
    consumed,
    trace: [
      ...path.trace,
      {
        stateId: transition.to,
        transitionId: transition.id,
        symbol,
        inputIndex
      }
    ]
  });

const deriveActiveStates = (paths) =>
  new Set(
    paths
      .filter((path) => path.status === "active" || path.status === "accepted")
      .map((path) => path.stateId)
  );

const getStateById = (states) => new Map(states.map((state) => [state.id, state]));

const transitionHasSymbol = (transition, symbol) =>
  splitSymbols(transition.symbol).includes(symbol);

const transitionHasEpsilon = (transition) =>
  splitSymbols(transition.symbol).some(isEpsilonSymbol);

const expandEpsilonPaths = (seedPaths, transitions) => {
  const paths = [];
  const takenTransitions = new Set();
  const stack = seedPaths.map((path) => ({
    path,
    visited: new Set([path.stateId])
  }));

  while (stack.length > 0) {
    const { path, visited } = stack.pop();
    paths.push(path);

    transitions.forEach((transition) => {
      if (transition.from !== path.stateId || !transitionHasEpsilon(transition)) {
        return;
      }

      if (visited.has(transition.to)) {
        return;
      }

      takenTransitions.add(transition.id);

      const epsilonPath = appendPathStep(
        path,
        transition,
        "ε",
        path.consumed.length,
        path.consumed
      );

      stack.push({
        path: epsilonPath,
        visited: new Set([...visited, transition.to])
      });
    });
  }

  return { paths, takenTransitions };
};

const evaluateTerminalPaths = (paths, states) => {
  const stateById = getStateById(states);

  return paths.map((path) => {
    if (path.status !== "active") {
      return path;
    }

    const isAccept = stateById.get(path.stateId)?.isAccept ?? false;

    return {
      ...path,
      status: isAccept ? "accepted" : "rejected",
      reason: isAccept
        ? "Input consumed in an accepting state."
        : "Input consumed outside the accepting set."
    };
  });
};

const createRunningFrame = ({ status, step, paths, activeTransitions, errorMsg = "", history }) => ({
  status,
  step,
  paths,
  activeStates: deriveActiveStates(paths),
  activeTransitions,
  errorMsg,
  history
});

const createHistoryFrame = (step, symbol, paths) => ({
  step,
  symbol,
  paths: paths.map((path) => ({ ...path, trace: [...path.trace] }))
});

export const initializePathSimulation = (states, transitions, inputString) => {
  const startStates = states.filter((state) => state.isStart).map((state) => state.id);

  if (startStates.length === 0) {
    return {
      ...createIdleSimState(),
      status: "error",
      errorMsg: "Please define at least one start state."
    };
  }

  const initialPaths = startStates.map(createInitialPath);
  const closure = expandEpsilonPaths(initialPaths, transitions);
  const paths =
    inputString.length === 0
      ? evaluateTerminalPaths(closure.paths, states)
      : closure.paths;
  const accepted = paths.some((path) => path.status === "accepted");
  const status =
    inputString.length === 0 ? (accepted ? "accepted" : "rejected") : "running";

  return createRunningFrame({
    status,
    step: 0,
    paths,
    activeTransitions: closure.takenTransitions,
    history: [createHistoryFrame(0, "ε", paths)]
  });
};

export const advancePathSimulation = (simState, inputString, states, transitions) => {
  if (simState.status !== "running") {
    return simState;
  }

  if (simState.step >= inputString.length) {
    const terminalPaths = evaluateTerminalPaths(simState.paths, states);
    const accepted = terminalPaths.some((path) => path.status === "accepted");

    return createRunningFrame({
      status: accepted ? "accepted" : "rejected",
      step: simState.step,
      paths: terminalPaths,
      activeTransitions: new Set(),
      history: [
        ...simState.history,
        createHistoryFrame(simState.step, "end", terminalPaths)
      ]
    });
  }

  const symbol = inputString[simState.step];
  const livePaths = simState.paths.filter((path) => path.status === "active");
  const carriedPaths = simState.paths.filter((path) => path.status !== "active");
  const directTransitions = new Set();
  const deadPaths = [];
  const nextSeedPaths = [];

  livePaths.forEach((path) => {
    const matchingTransitions = transitions.filter(
      (transition) =>
        transition.from === path.stateId && transitionHasSymbol(transition, symbol)
    );

    if (matchingTransitions.length === 0) {
      deadPaths.push({
        ...path,
        status: "dead",
        reason: `No ${symbol} transition from this state.`
      });
      return;
    }

    matchingTransitions.forEach((transition) => {
      directTransitions.add(transition.id);
      nextSeedPaths.push(
        appendPathStep(
          path,
          transition,
          symbol,
          simState.step,
          `${path.consumed}${symbol}`
        )
      );
    });
  });

  const closure = expandEpsilonPaths(nextSeedPaths, transitions);
  const activeTransitions = new Set([
    ...directTransitions,
    ...closure.takenTransitions
  ]);
  const nextStep = simState.step + 1;
  let paths = [...carriedPaths, ...deadPaths, ...closure.paths];

  if (nextStep >= inputString.length) {
    paths = evaluateTerminalPaths(paths, states);
  }

  const hasAcceptedPath = paths.some((path) => path.status === "accepted");
  const hasLivePath = paths.some((path) => path.status === "active");
  const status =
    nextStep >= inputString.length
      ? hasAcceptedPath
        ? "accepted"
        : "rejected"
      : hasLivePath
        ? "running"
        : "rejected";

  return createRunningFrame({
    status,
    step: nextStep,
    paths,
    activeTransitions,
    history: [
      ...simState.history,
      createHistoryFrame(nextStep, symbol, paths)
    ]
  });
};

export const runNfa = (states, transitions, inputString) => {
  let simState = initializePathSimulation(states, transitions, inputString);
  let guard = inputString.length + 2;

  while (simState.status === "running" && guard > 0) {
    simState = advancePathSimulation(simState, inputString, states, transitions);
    guard -= 1;
  }

  return {
    accepted: simState.status === "accepted",
    status: simState.status,
    paths: simState.paths,
    errorMsg: simState.errorMsg
  };
};

export const buildFormalDefinition = (states, transitions) => {
  const alphabet = getAlphabet(transitions);
  const stateById = getStateById(states);
  const startStates = states.filter((state) => state.isStart);
  const acceptStates = states.filter((state) => state.isAccept);

  const rows = states.map((state) => {
    const cells = alphabet.map((symbol) => {
      const targets = transitions
        .filter(
          (transition) =>
            transition.from === state.id && transitionHasSymbol(transition, symbol)
        )
        .map((transition) => stateById.get(transition.to)?.label)
        .filter(Boolean);

      return {
        symbol,
        targets: Array.from(new Set(targets))
      };
    });

    return { state, cells };
  });

  return {
    states: states.map((state) => state.label),
    alphabet,
    startStates: startStates.map((state) => state.label),
    acceptStates: acceptStates.map((state) => state.label),
    rows
  };
};

export const validateAutomatonPayload = (payload) => {
  if (!payload || !Array.isArray(payload.states) || !Array.isArray(payload.transitions)) {
    throw new Error("JSON must include states and transitions arrays.");
  }

  const ids = new Set();
  const states = payload.states.map((state, index) => {
    const id = String(state.id);

    if (!state.id || ids.has(id)) {
      throw new Error("Each state must have a unique id.");
    }

    ids.add(id);

    return {
      id,
      label: String(state.label || `q${index}`),
      x: Number.isFinite(Number(state.x)) ? Number(state.x) : 120 + index * 80,
      y: Number.isFinite(Number(state.y)) ? Number(state.y) : 160,
      isStart: Boolean(state.isStart),
      isAccept: Boolean(state.isAccept)
    };
  });

  const transitions = payload.transitions.map((transition) => {
    const from = String(transition.from);
    const to = String(transition.to);

    if (!transition.id || !ids.has(from) || !ids.has(to)) {
      throw new Error("Each transition must reference existing state ids.");
    }

    return {
      id: String(transition.id),
      from,
      to,
      symbol: String(transition.symbol || "ε")
    };
  });

  return { states, transitions };
};
