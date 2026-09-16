import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/main.scss";

const ROOT_ID = "mre-root";

function mount() {
  if (document.getElementById(ROOT_ID)) return;

  const root = document.createElement("div");
  root.id = ROOT_ID;
  document.documentElement.appendChild(root);

  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
