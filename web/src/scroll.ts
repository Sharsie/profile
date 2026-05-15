/**
 * Single shared IntersectionObserver that adds `is-visible` to each <section>
 * the first time it intersects the viewport. CSS handles the actual transition
 * (opacity + translateY ≤ 200ms). Skipped entirely under
 * `prefers-reduced-motion: reduce` — sections are revealed unconditionally
 * by the matching CSS rule.
 */

export function initScrollReveal(): void {
  // No-op under reduced-motion: CSS already paints sections fully visible.
  const reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    return;
  }

  // Defensive fallback for ancient browsers without IntersectionObserver:
  // reveal all sections immediately rather than leave them hidden.
  if (typeof window.IntersectionObserver === "undefined") {
    document.querySelectorAll<HTMLElement>("section").forEach((el) => {
      el.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      }
    },
    { threshold: 0, rootMargin: "0px 0px -10% 0px" },
  );

  document.querySelectorAll<HTMLElement>("section").forEach((el) => {
    observer.observe(el);
  });
}
