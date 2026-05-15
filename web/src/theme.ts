// Dark/light theme system.
//
// Resolution order on first visit:
//   1. localStorage["theme"] if present and valid
//   2. matchMedia("(prefers-color-scheme: dark)") otherwise
//
// Once the user manually toggles, the choice is persisted to localStorage and
// future OS-preference changes are ignored for this site.

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

export function getStoredTheme(): Theme | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark") {
    return raw;
  }
  return null;
}

export function getPreferredTheme(): Theme {
  const stored = getStoredTheme();
  if (stored !== null) {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export function getCurrentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

export function toggleTheme(): Theme {
  const next: Theme = getCurrentTheme() === "dark" ? "light" : "dark";
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
  return next;
}

export function initTheme(): void {
  applyTheme(getPreferredTheme());

  // First-visit users follow OS preference until they manually toggle. Once a
  // value is in localStorage we stop reacting to system changes.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", (event: MediaQueryListEvent) => {
    if (getStoredTheme() !== null) {
      return;
    }
    applyTheme(event.matches ? "dark" : "light");
  });
}
