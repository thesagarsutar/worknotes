
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize the system theme listener before React loads
// This will ensure the theme is correctly set during page load and
// will respond to system theme changes even before React hydration
const initSystemThemeListener = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem("theme") || "auto";
  
  const applyTheme = () => {
    if (savedTheme === "auto") {
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
    } else {
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  };
  
  // Apply theme immediately
  applyTheme();
  
  // Set up listener for system theme changes
  mediaQuery.addEventListener('change', applyTheme);
};

// Run the initializer
initSystemThemeListener();

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
