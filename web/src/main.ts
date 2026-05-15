import "./style.css";
import { initTheme, toggleTheme, getCurrentTheme } from "./theme";
import type { Theme } from "./theme";
import { render as renderHero } from "./components/hero";
import { render as renderAbout } from "./components/about";
import { render as renderExperience } from "./components/experience";
import { render as renderSkills } from "./components/skills";
import { render as renderProjects } from "./components/projects";
import { render as renderContact } from "./components/contact";
import { initScrollReveal } from "./scroll";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "#contact", label: "Contact" },
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
];

function themeToggleLabel(theme: Theme): string {
  // Show the active theme name. Click flips it.
  return theme === "dark" ? "Dark" : "Light";
}

function applyToggleState(button: HTMLButtonElement, theme: Theme): void {
  // aria-pressed reflects "is dark mode on" — meaningful semantics for AT.
  button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  button.textContent = themeToggleLabel(theme);
}

function buildSkipLink(): HTMLElement {
  const a = document.createElement("a");
  a.className = "skip-link";
  a.href = "#main";
  a.textContent = "Skip to content";
  return a;
}

function buildHeader(): HTMLElement {
  const header = document.createElement("header");

  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Primary");
  for (const link of NAV_LINKS) {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.label;
    nav.appendChild(a);
  }
  header.appendChild(nav);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";
  button.setAttribute("aria-label", "Toggle color theme");
  applyToggleState(button, getCurrentTheme());
  button.addEventListener("click", () => {
    const next = toggleTheme();
    applyToggleState(button, next);
  });
  header.appendChild(button);

  return header;
}

function buildMain(): HTMLElement {
  const main = document.createElement("main");
  main.id = "main";
  main.append(
    renderHero(),
    renderContact(),
    renderAbout(),
    renderExperience(),
    renderSkills(),
    renderProjects(),
  );
  return main;
}

function mount(): void {
  initTheme();

  const app = document.querySelector<HTMLDivElement>("#app");
  if (app === null) {
    return;
  }

  app.replaceChildren(buildSkipLink(), buildHeader(), buildMain());

  initScrollReveal();
}

mount();
