# Automata Simulator & Visual Compiler

[![Live Demo](https://img.shields.io/badge/Live_Demo-Play_Now-success?style=for-the-badge)](https://finiteautomata-simulator.netlify.app/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)]()

A web-based interactive visualizer and natural language compiler for Deterministic and Non-Deterministic Finite Automata (DFA/NFA). 

This application provides a visual interface for constructing state machines and features a custom natural language processing (NLP) engine that parses complex set-theory logic into optimized graphs using Product Automaton Construction.

---

## Core Architecture & Functionality

### Natural Language Compilation
Parses English-language constraints into finite state machines. 
* **Supported Primitives:** Prefix/suffix matching (`starts with`, `ends with`), substring detection (`contains`), and quantitative thresholds (`exactly N`, `at least N`, `multiple of N`).
* **Compound Logic Evaluation:** Supports complex intersections and unions using `AND` / `OR` boolean operators.
* **Dynamic Alphabet Inference:** The engine automatically detects and applies binary `(0, 1)` or character `(a, b)` alphabets based on the input string context.

### Interactive State Machine Editor
* **Infinite Canvas:** Drag-and-drop interface for manual node and transition construction with unbounded pan and zoom capabilities.
* **Real-Time Mathematical Sync:** The visual graph state is continuously synchronized with a side panel displaying the formal mathematical 5-tuple $(Q, \Sigma, \delta, q_0, F)$ and the corresponding state transition table ($\delta$).

### Simulation & State Evaluation
* **Deterministic & Non-Deterministic Execution:** Evaluates input strings against the active graph.
* **Computation Tree Tracking:** During NFA simulation, the engine visually highlights parallel non-deterministic branches and tracks the active computation tree step-by-step.

---

## Algorithmic Implementation

The primary technical focus of this project is the intersection engine, which parses compound statements into unified state machines without relying on hardcoded graphical edge cases. 

The compilation pipeline executes the following algorithms:
1. **Rule Tokenization:** Parses input strings into discrete sub-rules and operands.
2. **Base Generation:** Constructs the isolated DFA/NFA for each discrete rule.
3. **Product Automaton Construction:** Calculates the Cartesian product of the state sets ($Q_1 \times Q_2$) to mathematically merge independent machines.
4. **Transition Mapping & Trap States:** Maps all existing transitions across the new parallel state dimensions. Injects virtual trap states ($\emptyset$) to ensure parallel NFA branches do not terminate prematurely during intersection evaluation.
5. **Graph Pruning (Garbage Collection):** Executes a Breadth-First Search (BFS) graph traversal from the generated start state to identify and prune unreachable states from the final Cartesian product.

---

## Local Development

To clone and run this application locally, execute the following commands in your terminal:

```bash
git clone [https://github.com/Unknown-infinity/automata-simulator.git](https://github.com/Unknown-infinity/automata-simulator.git)
cd automata-simulator
npm install
npm run dev
