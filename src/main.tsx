import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { analytics } from "./lib/analytics";

// Initialize error monitoring
initSentry();

// Initialize analytics
analytics.initialize();

// Apply dark mode by default
document.documentElement.classList.add('dark');

createRoot(document.getElementById("root")!).render(<App />);
