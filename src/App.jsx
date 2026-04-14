import { useCallback, useEffect, useRef, useState } from "react";
import { MousePointerClick, PlayCircle, Wand2, XCircle } from "lucide-react";
import { MODES } from "./constants";
import AppHeader from "./components/AppHeader";
import AutomataCanvas from "./components/AutomataCanvas";
import FormalDefinitionSidebar from "./components/FormalDefinitionSidebar";
import SimulationDashboard from "./components/SimulationDashboard";
import TestSuiteModal from "./components/TestSuiteModal";
import ToolsSidebar from "./components/ToolsSidebar";
import {
  advancePathSimulation,
  createIdleSimState,
  generateId,
  initializePathSimulation,
  validateAutomatonPayload
} from "./lib/automata";

const AUTOMATA_TEMPLATES = [
  { label: "Basic: Ends with 01", query: "ends with 01" },
  { label: "Basic: Contains 'aba'", query: "contains aba" },
  { label: "Counting: Even 0s and Even 1s", query: "even number of 0 and even number of 1" },
  { label: "Counting: At least two 1s", query: "at least 2 1" },
  { label: "Modulo: Number of 1s is multiple of 3", query: "multiple of 3 1" },
  { label: "Position: 3rd from right is 1", query: "3rd from right is 1" },
  { label: "Length: Even length string", query: "length multiple of 2" },
  { label: "Compound: Starts with a OR ends with b", query: "starts with a or ends with b" },
  { label: "Complex: Contains 00 AND even 1s", query: "contains 00 and even number of 1" }
];

export default function FiniteAutomataSimulator() {
  const [states, setStates] = useState([]);
  const [transitions, setTransitions] = useState([]);
  const [mode, setMode] = useState(MODES.SELECT);
  const [inputString, setInputString] = useState("");
  const [prompt, setPrompt] = useState("");
  const [simState, setSimState] = useState(createIdleSimState);
  const [autoPlay, setAutoPlay] = useState(false);
  const [testSuiteOpen, setTestSuiteOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    return false;
  });
  const [testCases, setTestCases] = useState([
    { id: generateId(), input: "", expected: true },
    { id: generateId(), input: "01", expected: true }
  ]);
  const [testResults, setTestResults] = useState([]);
  const importInputRef = useRef(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isResizingSidebar) return;

      const maxWidth = Math.min(800, window.innerWidth * 0.6);
      const nextWidth = Math.max(250, Math.min(window.innerWidth - event.clientX, maxWidth));

      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    if (isResizingSidebar) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isResizingSidebar]);

  const stopSimulation = useCallback(() => {
    setAutoPlay(false);
    setSimState(createIdleSimState());
  }, []);

  const initSimulation = useCallback(() => {
    setAutoPlay(false);
    setSimState(initializePathSimulation(states, transitions, inputString));
  }, [inputString, states, transitions]);

  const nextStep = useCallback(() => {
    setSimState((currentSimState) => {
      const nextSimState = advancePathSimulation(
        currentSimState,
        inputString,
        states,
        transitions
      );

      if (nextSimState.status !== "running") {
        setAutoPlay(false);
      }

      return nextSimState;
    });
  }, [inputString, states, transitions]);

  const toggleAutoPlay = useCallback(() => {
    if (simState.status !== "running") return;

    const shouldPlay = !autoPlay;
    setAutoPlay(shouldPlay);

    if (shouldPlay) {
      nextStep();
    }
  }, [autoPlay, nextStep, simState.status]);

  useEffect(() => {
    if (!autoPlay || simState.status !== "running") return undefined;

    const timer = window.setTimeout(() => {
      nextStep();
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [autoPlay, nextStep, simState.status, simState.step]);

  const exportJson = () => {
    const payload = JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        states,
        transitions
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "automaton.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const payload = JSON.parse(await file.text());
      const automaton = validateAutomatonPayload(payload);

      setStates(automaton.states);
      setTransitions(automaton.transitions);
      stopSimulation();
      setMode(MODES.SELECT);
    } catch (error) {
      setSimState({
        ...createIdleSimState(),
        status: "error",
        errorMsg: error.message || "Could not import that JSON file."
      });
    } finally {
      event.target.value = "";
    }
  };

  const getOtherAlphabetChar = (targetChar) =>
    targetChar === "0" ? "1" : targetChar === "1" ? "0" : targetChar === "a" ? "b" : "a";

  const getTransitionSymbols = (transition) =>
    transition.symbol
      .split(",")
      .map((symbol) => symbol.trim())
      .filter(Boolean);

  const combineAutomata = (auto1, auto2, operator = "and") => {
    if (!auto1 || !auto2) return auto1 || auto2;

    const { states: s1, transitions: t1 } = auto1;
    const { states: s2, transitions: t2 } = auto2;
    const alphabet = [
      ...new Set([...t1, ...t2].flatMap((transition) => getTransitionSymbols(transition)))
    ];
    const newStates = [];
    const newTransitions = [];
    const makeProductId = (id1, id2) => `${id1}__${id2}`;
    const productParts = new Map();
    const deadState1 = { id: "DEAD1", label: "∅", isStart: false, isAccept: false };
    const deadState2 = { id: "DEAD2", label: "∅", isStart: false, isAccept: false };
    const s1WithDead = [...s1, deadState1];
    const s2WithDead = [...s2, deadState2];

    s1WithDead.forEach((state1) => {
      s2WithDead.forEach((state2) => {
        if (state1.id === "DEAD1" && state2.id === "DEAD2") return;

        const id = makeProductId(state1.id, state2.id);
        const label =
          `${state1.label === "∅" ? "" : state1.label}${state2.label === "∅" ? "" : state2.label}` ||
          "∅";

        productParts.set(id, { id1: state1.id, id2: state2.id });
        newStates.push({
          id,
          label,
          x: 0,
          y: 0,
          isStart: state1.isStart && state2.isStart,
          isAccept:
            operator === "or"
              ? state1.isAccept || state2.isAccept
              : state1.isAccept && state2.isAccept
        });
      });
    });

    newStates.forEach((sourceState) => {
      const { id1, id2 } = productParts.get(sourceState.id);

      alphabet.forEach((symbol) => {
        let targets1 =
          id1 === "DEAD1"
            ? ["DEAD1"]
            : t1
                .filter(
                  (transition) =>
                    transition.from === id1 && getTransitionSymbols(transition).includes(symbol)
                )
                .map((transition) => transition.to);
        let targets2 =
          id2 === "DEAD2"
            ? ["DEAD2"]
            : t2
                .filter(
                  (transition) =>
                    transition.from === id2 && getTransitionSymbols(transition).includes(symbol)
                )
                .map((transition) => transition.to);

        if (targets1.length === 0) targets1 = ["DEAD1"];
        if (targets2.length === 0) targets2 = ["DEAD2"];
        if (targets1[0] === "DEAD1" && targets2[0] === "DEAD2") return;

        targets1.forEach((target1Id) => {
          targets2.forEach((target2Id) => {
            const targetCombinedId = makeProductId(target1Id, target2Id);
            const existingIndex = newTransitions.findIndex(
              (transition) =>
                transition.from === sourceState.id && transition.to === targetCombinedId
            );

            if (existingIndex >= 0) {
              const existingSymbols = getTransitionSymbols(newTransitions[existingIndex]);

              if (!existingSymbols.includes(symbol)) {
                newTransitions[existingIndex].symbol += `, ${symbol}`;
              }
            } else {
              newTransitions.push({
                id: generateId(),
                from: sourceState.id,
                to: targetCombinedId,
                symbol
              });
            }
          });
        });
      });
    });

    const reachableIds = new Set();
    const startStates = newStates.filter((state) => state.isStart).map((state) => state.id);
    const queue = [...startStates];

    while (queue.length > 0) {
      const currentId = queue.shift();

      if (!reachableIds.has(currentId)) {
        reachableIds.add(currentId);
        const outgoing = newTransitions
          .filter((transition) => transition.from === currentId)
          .map((transition) => transition.to);
        queue.push(...outgoing);
      }
    }

    const prunedStates = newStates.filter((state) => reachableIds.has(state.id));
    const prunedTransitions = newTransitions.filter(
      (transition) => reachableIds.has(transition.from) && reachableIds.has(transition.to)
    );

    prunedStates.forEach((state, index) => {
      state.x = 150 + (index % 4) * 160;
      state.y = 150 + Math.floor(index / 4) * 160;
    });

    return { states: prunedStates, transitions: prunedTransitions };
  };

  const generateSingleRule = (text) => {
    const lowerText = text.toLowerCase().trim();
    const startX = 150;
    const startY = 250;
    const spacing = 120;

    // RULE: Even number of [char] (Modulo 2 DFA)
    const evenMatch = lowerText.match(/even number of ([0-9a-z])/);
    if (evenMatch) {
      const targetChar = evenMatch[1];
      const otherChar = getOtherAlphabetChar(targetChar);

      const newStates = [
        {
          id: generateId(),
          label: "q0",
          x: startX,
          y: startY,
          isStart: true,
          isAccept: true
        },
        {
          id: generateId(),
          label: "q1",
          x: startX + spacing * 1.5,
          y: startY,
          isStart: false,
          isAccept: false
        }
      ];

      const newTransitions = [
        {
          id: generateId(),
          from: newStates[0].id,
          to: newStates[1].id,
          symbol: targetChar
        },
        {
          id: generateId(),
          from: newStates[1].id,
          to: newStates[0].id,
          symbol: targetChar
        },
        {
          id: generateId(),
          from: newStates[0].id,
          to: newStates[0].id,
          symbol: otherChar
        },
        {
          id: generateId(),
          from: newStates[1].id,
          to: newStates[1].id,
          symbol: otherChar
        }
      ];

      return { states: newStates, transitions: newTransitions };
    }

    // RULE: At most [N] [char] (Counting DFA with Dead State)
    const atMostMatch = lowerText.match(/at most (\d+)\s*([0-9a-z])/);
    if (atMostMatch) {
      const maxCount = parseInt(atMostMatch[1], 10);
      const targetChar = atMostMatch[2];
      const otherChar = getOtherAlphabetChar(targetChar);

      const newStates = [];
      const newTransitions = [];

      for (let i = 0; i <= maxCount; i += 1) {
        newStates.push({
          id: generateId(),
          label: `q${i}`,
          x: startX + i * spacing,
          y: startY,
          isStart: i === 0,
          isAccept: true
        });
      }

      const deadStateId = generateId();
      newStates.push({
        id: deadStateId,
        label: "qDead",
        x: startX + (maxCount + 1) * spacing,
        y: startY + 80,
        isStart: false,
        isAccept: false
      });

      for (let i = 0; i <= maxCount; i += 1) {
        newTransitions.push({
          id: generateId(),
          from: newStates[i].id,
          to: newStates[i].id,
          symbol: otherChar
        });

        if (i < maxCount) {
          newTransitions.push({
            id: generateId(),
            from: newStates[i].id,
            to: newStates[i + 1].id,
            symbol: targetChar
          });
        } else {
          newTransitions.push({
            id: generateId(),
            from: newStates[i].id,
            to: deadStateId,
            symbol: targetChar
          });
        }
      }

      newTransitions.push({
        id: generateId(),
        from: deadStateId,
        to: deadStateId,
        symbol: `${targetChar}, ${otherChar}`
      });

      return { states: newStates, transitions: newTransitions };
    }

    // RULE: At least [N] [char] (Counting DFA with Absorbing Accept State)
    const atLeastMatch = lowerText.match(/at least (\d+)\s*([0-9a-z])/);
    if (atLeastMatch) {
      const minCount = parseInt(atLeastMatch[1], 10);
      const targetChar = atLeastMatch[2];
      const otherChar = getOtherAlphabetChar(targetChar);

      const newStates = [];
      const newTransitions = [];

      for (let i = 0; i <= minCount; i += 1) {
        newStates.push({
          id: generateId(),
          label: `q${i}`,
          x: startX + i * spacing,
          y: startY,
          isStart: i === 0,
          isAccept: i === minCount
        });
      }

      for (let i = 0; i <= minCount; i += 1) {
        if (i < minCount) {
          newTransitions.push({
            id: generateId(),
            from: newStates[i].id,
            to: newStates[i].id,
            symbol: otherChar
          });
          newTransitions.push({
            id: generateId(),
            from: newStates[i].id,
            to: newStates[i + 1].id,
            symbol: targetChar
          });
        } else {
          newTransitions.push({
            id: generateId(),
            from: newStates[i].id,
            to: newStates[i].id,
            symbol: `${targetChar}, ${otherChar}`
          });
        }
      }

      return { states: newStates, transitions: newTransitions };
    }

    // RULE: Exactly [N] [char] (Counting DFA with Dead State)
    const exactlyMatch = lowerText.match(/exactly (\d+)\s*([0-9a-z])/);
    if (exactlyMatch) {
      const exactCount = parseInt(exactlyMatch[1], 10);
      const targetChar = exactlyMatch[2];
      const otherChar = getOtherAlphabetChar(targetChar);

      const newStates = [];
      const newTransitions = [];

      for (let i = 0; i <= exactCount; i += 1) {
        newStates.push({
          id: generateId(),
          label: `q${i}`,
          x: startX + i * spacing,
          y: startY,
          isStart: i === 0,
          isAccept: i === exactCount
        });
      }

      const deadStateId = generateId();
      newStates.push({
        id: deadStateId,
        label: "qDead",
        x: startX + (exactCount + 1) * spacing,
        y: startY + 80,
        isStart: false,
        isAccept: false
      });

      for (let i = 0; i <= exactCount; i += 1) {
        newTransitions.push({
          id: generateId(),
          from: newStates[i].id,
          to: newStates[i].id,
          symbol: otherChar
        });

        if (i < exactCount) {
          newTransitions.push({
            id: generateId(),
            from: newStates[i].id,
            to: newStates[i + 1].id,
            symbol: targetChar
          });
        } else {
          newTransitions.push({
            id: generateId(),
            from: newStates[i].id,
            to: deadStateId,
            symbol: targetChar
          });
        }
      }

      newTransitions.push({
        id: generateId(),
        from: deadStateId,
        to: deadStateId,
        symbol: `${targetChar}, ${otherChar}`
      });

      return { states: newStates, transitions: newTransitions };
    }

    // RULE: Multiple of [N] [char] (Modulo Arithmetic Circular DFA)
    const multipleMatch = lowerText.match(/multiple of (\d+)\s*([0-9a-z])/);
    if (multipleMatch) {
      const modCount = parseInt(multipleMatch[1], 10);
      const targetChar = multipleMatch[2];
      const otherChar = getOtherAlphabetChar(targetChar);

      if (modCount < 1) {
        window.alert("Multiple must be at least 1!");
        return null;
      }

      const newStates = [];
      const newTransitions = [];

      for (let i = 0; i < modCount; i += 1) {
        newStates.push({
          id: generateId(),
          label: `q${i}`,
          x: startX + i * spacing,
          y: startY,
          isStart: i === 0,
          isAccept: i === 0
        });
      }

      for (let i = 0; i < modCount; i += 1) {
        newTransitions.push({
          id: generateId(),
          from: newStates[i].id,
          to: newStates[i].id,
          symbol: otherChar
        });

        const nextStateIndex = (i + 1) % modCount;
        newTransitions.push({
          id: generateId(),
          from: newStates[i].id,
          to: newStates[nextStateIndex].id,
          symbol: targetChar
        });
      }

      return { states: newStates, transitions: newTransitions };
    }

    // RULE: Length is multiple of [N]
    const lengthMatch = lowerText.match(/length\s+(?:is\s+)?(?:a\s+)?multiple of (\d+)/);
    if (lengthMatch) {
      const modCount = parseInt(lengthMatch[1], 10);
      const alphabetList = ["0", "1"];

      if (modCount < 1) return null;

      const newStates = [];
      const newTransitions = [];

      for (let i = 0; i < modCount; i += 1) {
        newStates.push({
          id: generateId(),
          label: `q${i}`,
          x: startX + i * spacing,
          y: startY,
          isStart: i === 0,
          isAccept: i === 0
        });
      }

      for (let i = 0; i < modCount; i += 1) {
        const nextStateIndex = (i + 1) % modCount;

        alphabetList.forEach((char) => {
          newTransitions.push({
            id: generateId(),
            from: newStates[i].id,
            to: newStates[nextStateIndex].id,
            symbol: char
          });
        });
      }

      return { states: newStates, transitions: newTransitions };
    }

    // RULE: [N]th from right is [char] (NFA superpower)
    const nthRightMatch = lowerText.match(/(\d+)(?:st|nd|rd|th) from right is ([0-9a-z])/);
    if (nthRightMatch) {
      const position = parseInt(nthRightMatch[1], 10);
      const targetChar = nthRightMatch[2];
      const alphabet = "0, 1";

      if (position < 1) return null;

      const newStates = [];
      const newTransitions = [];

      for (let i = 0; i <= position; i += 1) {
        newStates.push({
          id: generateId(),
          label: `q${i}`,
          x: startX + i * spacing,
          y: startY,
          isStart: i === 0,
          isAccept: i === position
        });
      }

      newTransitions.push({
        id: generateId(),
        from: newStates[0].id,
        to: newStates[0].id,
        symbol: alphabet
      });
      newTransitions.push({
        id: generateId(),
        from: newStates[0].id,
        to: newStates[1].id,
        symbol: targetChar
      });

      for (let i = 1; i < position; i += 1) {
        newTransitions.push({
          id: generateId(),
          from: newStates[i].id,
          to: newStates[i + 1].id,
          symbol: alphabet
        });
      }

      return { states: newStates, transitions: newTransitions };
    }

    let type = "";
    let target = "";

    if (lowerText.includes("starts with")) {
      type = "starts";
      target = lowerText.split("starts with")[1].trim();
    } else if (lowerText.includes("ends with")) {
      type = "ends";
      target = lowerText.split("ends with")[1].trim();
    } else if (lowerText.includes("contains")) {
      type = "contains";
      target = lowerText.split("contains")[1].trim();
    } else {
      window.alert(
        "I understand 'starts with X', 'ends with X', 'contains X', 'even number of X', 'at most N X', 'at least N X', 'exactly N X', 'multiple of N X', 'length is multiple of N', or 'Nth from right is X' right now!"
      );
      return null;
    }

    target = target.replace(/[^0-9a-z]/g, "");
    if (!target) return null;

    const newStates = [];
    const newTransitions = [];

    for (let i = 0; i <= target.length; i += 1) {
      newStates.push({
        id: generateId(),
        label: `q${i}`,
        x: startX + i * spacing,
        y: startY,
        isStart: i === 0,
        isAccept: i === target.length
      });
    }

    for (let i = 0; i < target.length; i += 1) {
      newTransitions.push({
        id: generateId(),
        from: newStates[i].id,
        to: newStates[i + 1].id,
        symbol: target[i]
      });
    }

    // Smart Alphabet Detector: If the string has letters, default to "a, b". Otherwise, "0, 1".
    const isLetters = /[a-z]/i.test(target);
    const baseAlphabet = isLetters ? ["a", "b"] : ["0", "1"];
    const uniqueChars = new Set([...baseAlphabet, ...target.split("")]);
    const alphabet = Array.from(uniqueChars).join(", ");

    if (type === "starts") {
      newTransitions.push({
        id: generateId(),
        from: newStates[target.length].id,
        to: newStates[target.length].id,
        symbol: alphabet
      });
    } else if (type === "ends") {
      newTransitions.push({
        id: generateId(),
        from: newStates[0].id,
        to: newStates[0].id,
        symbol: alphabet
      });
    } else if (type === "contains") {
      newTransitions.push({
        id: generateId(),
        from: newStates[0].id,
        to: newStates[0].id,
        symbol: alphabet
      });
      newTransitions.push({
        id: generateId(),
        from: newStates[target.length].id,
        to: newStates[target.length].id,
        symbol: alphabet
      });
    }

    return { states: newStates, transitions: newTransitions };
  };

  const handleTextToAutomaton = (text) => {
    const tokens = text.toLowerCase().trim().split(/\s+(and|or)\s+/);
    if (tokens.length === 0) return;

    let finalAutomaton = generateSingleRule(tokens[0]);
    if (!finalAutomaton) return;

    for (let i = 1; i < tokens.length; i += 2) {
      const operator = tokens[i];
      const nextRule = tokens[i + 1];

      if (nextRule) {
        const nextAutomaton = generateSingleRule(nextRule);

        if (nextAutomaton) {
          finalAutomaton = combineAutomata(finalAutomaton, nextAutomaton, operator);
        }
      }
    }

    setStates(finalAutomaton.states);
    setTransitions(finalAutomaton.transitions);
    stopSimulation();
    setMode(MODES.SELECT);
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <AppHeader
        inputString={inputString}
        setInputString={setInputString}
        prompt={prompt}
        setPrompt={setPrompt}
        simState={simState}
        autoPlay={autoPlay}
        onStartSimulation={initSimulation}
        onStep={nextStep}
        onToggleAutoPlay={toggleAutoPlay}
        onResetSimulation={stopSimulation}
        onExportJson={exportJson}
        onImportClick={() => importInputRef.current?.click()}
        onImportFile={importJson}
        importInputRef={importInputRef}
        templates={AUTOMATA_TEMPLATES}
        onTemplateSelect={handleTextToAutomaton}
        onGenerateFromPrompt={handleTextToAutomaton}
        onOpenGuide={() => setShowGuide(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((currentValue) => !currentValue)}
        onOpenTestSuite={() => setTestSuiteOpen(true)}
      />

      <main className="relative flex flex-1 overflow-hidden">
        <ToolsSidebar mode={mode} setMode={setMode} />
        <AutomataCanvas
          states={states}
          setStates={setStates}
          transitions={transitions}
          setTransitions={setTransitions}
          mode={mode}
          setMode={setMode}
          simState={simState}
        />
        <div
          onMouseDown={(event) => {
            event.preventDefault();
            setIsResizingSidebar(true);
          }}
          className={`z-30 hidden w-1 cursor-col-resize transition-colors xl:block ${
            isResizingSidebar
              ? "bg-blue-500"
              : "bg-transparent hover:bg-slate-300 dark:hover:bg-slate-600"
          }`}
          style={{ touchAction: "none" }}
        />
        <div
          className="z-20 hidden shrink-0 flex-col overflow-x-hidden overflow-y-auto border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 xl:flex"
          style={{ width: `${sidebarWidth}px` }}
        >
          <FormalDefinitionSidebar states={states} transitions={transitions} />
        </div>
      </main>

      <SimulationDashboard inputString={inputString} simState={simState} states={states} />

      <TestSuiteModal
        open={testSuiteOpen}
        onClose={() => setTestSuiteOpen(false)}
        states={states}
        transitions={transitions}
        testCases={testCases}
        setTestCases={setTestCases}
        testResults={testResults}
        setTestResults={setTestResults}
      />

      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                <Wand2 className="text-blue-500" />
                Welcome to Automata Simulator
              </h2>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close guide"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-6 overflow-y-auto p-6 text-slate-600 dark:text-slate-300">
              <p className="text-sm leading-relaxed">
                This is an advanced interactive tool for designing and simulating
                Deterministic and Non-Deterministic Finite Automata (DFA/NFA).
                Here is how to get the most out of it.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <section className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                    <MousePointerClick size={18} className="text-blue-500" />
                    1. Manual Drawing
                  </h3>
                  <ul className="list-disc space-y-2 pl-5 text-sm marker:text-slate-300">
                    <li>Use the left toolbar to select tools.</li>
                    <li>
                      <strong>Add State:</strong> Click anywhere on the canvas.
                    </li>
                    <li>
                      <strong>Add Transition:</strong> Drag from one state to another.
                    </li>
                    <li>
                      <strong>Toggles:</strong> Click states to mark them as Start or Accept.
                    </li>
                    <li>
                      <strong>Pan & Zoom:</strong> Use the Hand tool to drag the canvas,
                      and scroll to zoom.
                    </li>
                  </ul>
                </section>

                <section className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                    <Wand2 size={18} className="text-blue-500" />
                    2. Magic Generate
                  </h3>
                  <p className="mb-2 text-sm">
                    Type rules directly into the top bar to instantly generate an automaton.
                    Try:
                  </p>
                  <ul className="space-y-1 rounded-lg border border-slate-200 bg-white p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-900">
                    <li>ends with 10</li>
                    <li>at least 2 1</li>
                    <li>multiple of 3 0</li>
                    <li className="text-blue-600 dark:text-blue-300">
                      starts with a AND ends with b
                    </li>
                  </ul>
                </section>
              </div>

              <section className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                  <PlayCircle size={18} className="text-green-500" />
                  3. Running Simulations
                </h3>
                <ul className="list-disc space-y-2 pl-5 text-sm marker:text-slate-300">
                  <li>
                    Type a string, such as{" "}
                    <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">
                      1011
                    </code>
                    , into the top-right input.
                  </li>
                  <li>
                    Click <strong>Start</strong>.
                  </li>
                  <li>
                    Use the <strong>Step</strong> button to watch the NFA evaluate
                    the string character by character.
                  </li>
                  <li>
                    Check the <strong>Computation Tree</strong> at the bottom to see
                    parallel NFA branches.
                  </li>
                </ul>
              </section>
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Got it, let&apos;s go!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
