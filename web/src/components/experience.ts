/* ---------------------------------------------------------------------------
 * Experience timeline (T11 / PLAN Step 14).
 *
 * Vertical timeline, newest first. Each entry uses native <details>/<summary>
 * for progressive disclosure (RESEARCH §5): the always-visible header carries
 * company / title / dates, the open body reveals a one-line impact statement
 * and the role's skill chips. Pre-2016 collapses to a single muted line with
 * no skills.
 *
 * Voice per RESEARCH §3: outcomes-first, plain English, no banned phrases.
 * Per RESEARCH handoff: no impact metrics here — those live in T12 Notable
 * Work. Impact statements here are short orientation sentences only.
 * ------------------------------------------------------------------------- */

interface Entry {
  company: string;
  title: string;
  dates: string;
  impact: string;
  skills: readonly string[];
}

const ENTRIES: readonly Entry[] = [
  {
    company: "Veracode",
    title: "DevOps Architect",
    dates: "Jan 2025 – Present",
    impact:
      "Operates across the full DevOps surface for a large, long-established AWS estate — network and DNS architecture, GitLab administration, container hardening, and leading the standardization of deployment practice org-wide.",
    skills: [
      "AWS",
      "Terraform",
      "Terragrunt",
      "Kubernetes",
      "GitLab",
      "DNS",
      "Networking",
      "FedRAMP",
    ],
  },
  {
    company: "INVESTBAY s.r.o.",
    title: "DevOps Architect",
    dates: "Feb 2024 – Present",
    impact:
      "Leading the platform and DevOps function for the property-investment SaaS — Terraform-driven GCP and AWS estate, polyglot Go and TypeScript services, Nix-built supply chain.",
    skills: [
      "GCP",
      "AWS",
      "GitLab",
      "Terraform",
      "Go",
      "TypeScript",
      "Nix",
      "GraphQL",
      "API",
      "PostgreSQL",
      "React.js",
    ],
  },
  {
    company: "YOUR PASS s.r.o.",
    title: "DevOps Engineer",
    dates: "Jul 2021 – Present",
    impact:
      "SaaS infrastructure and SDLC ownership — Kubernetes and AWS estate, Terraform, gRPC services in Go, hermetic Nix builds.",
    skills: [
      "Kubernetes",
      "AWS",
      "Terraform",
      "Go",
      "gRPC",
      "TypeScript",
      "Nix",
      "PostgreSQL",
    ],
  },
  {
    company: "YOUR SYSTEM s.r.o.",
    title: "SysOps + Lead Developer / Architect",
    dates: "Feb 2016 – Present",
    impact:
      "Led architecture and delivery across web, back-end, and infra in the lead-developer years, then took on operational ownership of the internal Linux and AWS estate — Docker Swarm services, Terraform, observability and automation in Bash and Go.",
    skills: [
      "Docker Swarm",
      "Linux",
      "AWS",
      "Bash",
      "Terraform",
      "Go",
      "Kubernetes",
      "GraphQL",
    ],
  },
];

function makeEntry(entry: Entry): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "timeline-entry";

  const details = document.createElement("details");

  const summary = document.createElement("summary");
  summary.className = "timeline-summary";

  const head = document.createElement("div");
  head.className = "timeline-head";

  const company = document.createElement("span");
  company.className = "timeline-company";
  company.textContent = entry.company;

  const sep = document.createElement("span");
  sep.className = "timeline-sep";
  sep.textContent = "·";
  sep.setAttribute("aria-hidden", "true");

  const title = document.createElement("span");
  title.className = "timeline-title";
  title.textContent = entry.title;

  head.append(company, sep, title);

  const meta = document.createElement("span");
  meta.className = "timeline-meta";
  meta.textContent = entry.dates;

  summary.append(head, meta);
  details.appendChild(summary);

  const body = document.createElement("div");
  body.className = "timeline-body";

  const impact = document.createElement("p");
  impact.className = "timeline-impact";
  impact.textContent = entry.impact;
  body.appendChild(impact);

  const badges = document.createElement("div");
  badges.className = "timeline-badges";
  for (const skill of entry.skills) {
    const b = document.createElement("span");
    b.className = "badge";
    b.textContent = skill;
    badges.appendChild(b);
  }
  body.appendChild(badges);

  details.appendChild(body);
  wrap.appendChild(details);

  return wrap;
}

function makePastEntry(): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "timeline-entry timeline-entry-past";

  const head = document.createElement("div");
  head.className = "timeline-summary";

  const headInner = document.createElement("div");
  headInner.className = "timeline-head";

  const company = document.createElement("span");
  company.className = "timeline-company";
  company.textContent = "Past experience";

  const sep = document.createElement("span");
  sep.className = "timeline-sep";
  sep.textContent = "·";
  sep.setAttribute("aria-hidden", "true");

  const title = document.createElement("span");
  title.className = "timeline-title";
  title.textContent = "Developer";

  headInner.append(company, sep, title);

  const meta = document.createElement("span");
  meta.className = "timeline-meta";
  meta.textContent = "Before 2016";

  head.append(headInner, meta);
  wrap.appendChild(head);

  const note = document.createElement("p");
  note.className = "muted timeline-past-note";
  note.textContent =
    "Prior roles as a developer; intentionally summarized for brevity.";
  wrap.appendChild(note);

  return wrap;
}

export function render(): HTMLElement {
  const section = document.createElement("section");
  section.id = "experience";

  const heading = document.createElement("h2");
  heading.textContent = "Experience";
  section.appendChild(heading);

  const timeline = document.createElement("div");
  timeline.className = "timeline";

  for (const entry of ENTRIES) {
    timeline.appendChild(makeEntry(entry));
  }
  timeline.appendChild(makePastEntry());

  section.appendChild(timeline);
  return section;
}
