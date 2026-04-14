import React from "react";
import { createRoot } from "react-dom/client";
import FiniteAutomataSimulator from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FiniteAutomataSimulator />
  </React.StrictMode>
);
