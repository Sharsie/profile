const PARAGRAPHS: string[] = [
  // ¶1 — role framing: DevOps Architect, tools of the trade, TS/Go as pet-project passion.
  "DevOps Architect is the title; the job is closer to DevOps wizardry — a decade-plus spent designing the practices, pipelines, and platforms that make engineering organizations move faster without breaking things. Kubernetes, infrastructure-as-code, and Nix are the daily toolkit; TypeScript and Go remain the languages reached for on the side — pet projects, built because the craft is enjoyable, not just useful.",
  // ¶2 — current shape of the work: architecture over operation, security folded in.
  "The focus isn't running infrastructure, it's architecting how it should be run — reliability, delivery, and security treated as one continuous design problem rather than three separate jobs handed to three separate teams. Development is a tool in that kit, not the destination.",
  // ¶3 — the same instinct extended into smart-home work + continuous learning.
  "That same instinct for architecting good systems doesn't stop at the cloud's edge — it carries into the home too. Control4 Pro and KNX Partner certified, writing custom drivers because every home has its own quirks and deserves a personal touch, not a generic integration. Learning never really stops; it just changes shape.",
];

export function render(): HTMLElement {
  const section = document.createElement("section");
  section.id = "about";

  const heading = document.createElement("h2");
  heading.textContent = "About";
  section.appendChild(heading);

  for (const text of PARAGRAPHS) {
    const p = document.createElement("p");
    p.textContent = text;
    section.appendChild(p);
  }

  return section;
}
