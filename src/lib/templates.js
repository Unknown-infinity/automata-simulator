export const TEMPLATES = [
  {
    id: "ends-with-01",
    name: "Ends with 01",
    states: [
      { id: "ends-q0", label: "q0", x: 160, y: 220, isStart: true, isAccept: false },
      { id: "ends-q1", label: "q1", x: 340, y: 220, isStart: false, isAccept: false },
      { id: "ends-q2", label: "q2", x: 520, y: 220, isStart: false, isAccept: true }
    ],
    transitions: [
      { id: "ends-t0", from: "ends-q0", to: "ends-q1", symbol: "0" },
      { id: "ends-t1", from: "ends-q0", to: "ends-q0", symbol: "1" },
      { id: "ends-t2", from: "ends-q1", to: "ends-q1", symbol: "0" },
      { id: "ends-t3", from: "ends-q1", to: "ends-q2", symbol: "1" },
      { id: "ends-t4", from: "ends-q2", to: "ends-q1", symbol: "0" },
      { id: "ends-t5", from: "ends-q2", to: "ends-q0", symbol: "1" }
    ]
  },
  {
    id: "even-ones",
    name: "Even number of 1s",
    states: [
      { id: "even-q0", label: "q0", x: 220, y: 220, isStart: true, isAccept: true },
      { id: "even-q1", label: "q1", x: 460, y: 220, isStart: false, isAccept: false }
    ],
    transitions: [
      { id: "even-t0", from: "even-q0", to: "even-q0", symbol: "0" },
      { id: "even-t1", from: "even-q0", to: "even-q1", symbol: "1" },
      { id: "even-t2", from: "even-q1", to: "even-q1", symbol: "0" },
      { id: "even-t3", from: "even-q1", to: "even-q0", symbol: "1" }
    ]
  },
  {
    id: "contains-aba",
    name: "Contains substring 'aba'",
    states: [
      { id: "aba-q0", label: "q0", x: 120, y: 220, isStart: true, isAccept: false },
      { id: "aba-q1", label: "q1", x: 300, y: 220, isStart: false, isAccept: false },
      { id: "aba-q2", label: "q2", x: 480, y: 220, isStart: false, isAccept: false },
      { id: "aba-q3", label: "q3", x: 660, y: 220, isStart: false, isAccept: true }
    ],
    transitions: [
      { id: "aba-t0", from: "aba-q0", to: "aba-q1", symbol: "a" },
      { id: "aba-t1", from: "aba-q0", to: "aba-q0", symbol: "b" },
      { id: "aba-t2", from: "aba-q1", to: "aba-q1", symbol: "a" },
      { id: "aba-t3", from: "aba-q1", to: "aba-q2", symbol: "b" },
      { id: "aba-t4", from: "aba-q2", to: "aba-q3", symbol: "a" },
      { id: "aba-t5", from: "aba-q2", to: "aba-q0", symbol: "b" },
      { id: "aba-t6", from: "aba-q3", to: "aba-q3", symbol: "a, b" }
    ]
  }
];

export const cloneTemplate = (template) => ({
  states: template.states.map((state) => ({ ...state })),
  transitions: template.transitions.map((transition) => ({ ...transition }))
});
