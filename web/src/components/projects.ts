/* ---------------------------------------------------------------------------
 * Notable Work + Open Source (T12 / PLAN Step 16).
 *
 * RESEARCH §2 picks "Notable Work" over project cards: most of the high-leverage
 * work is internal to employers and not public. Each card frames an employer
 * bucket as context + impact (skim layer per RESEARCH §5), with a <details>
 * that expands into concrete actions and the role's stack chips.
 *
 * The "Open Source" sub-block surfaces the public repositories under
 * github.com/Sharsie, plus a closing tile linking to the GitHub profile
 * itself.
 *
 * Voice per RESEARCH §3: outcomes-first, plain English, no banned phrases, no
 * invented metrics.
 * ------------------------------------------------------------------------- */

interface Theme {
  company: string;
  role: string;
  context: string;
  impact: string;
  actions: readonly string[];
  stack: readonly string[];
}

const THEMES: readonly Theme[] = [
  {
    company: "Veracode",
    role: "DevOps Architect · Jan 2025 – Present",
    context:
      "Enterprise application-security vendor running a large, long-accumulated AWS estate — a hub-and-spoke network that needed a consistent DNS and deployment story.",
    impact:
      "Covered ground well past a typical DevOps remit: network and DNS architecture, GitLab administration, container hardening, and standardizing how applications and infrastructure get deployed.",
    actions: [
      "Led the standardization of how applications and infrastructure get deployed across teams, setting consistent patterns as the estate grew.",
      "Designed and implemented the DNS architecture for a large hub-and-spoke network, and owned that network infrastructure end to end.",
      "Administered a self-managed GitLab instance, providing standardized deployment options through CI/CD pipelines for the teams building on it.",
      "Contributed to FedRAMP compliance work on the staging environment, including container hardening, with Kubernetes as the runtime target.",
      "Terraform and Terragrunt underpinned most of the infrastructure across the Veracode estate.",
    ],
    stack: [
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
    role: "DevOps Architect · Feb 2024 – Present",
    context:
      "Property-investment SaaS running a polyglot Go and TypeScript codebase across GCP and AWS, with the platform function still maturing.",
    impact:
      "Owned the platform shape end-to-end: Terraform-driven cloud estate, Nix-built supply chain, and review-friendly delivery the product teams could trust.",
    actions: [
      "Built out the Terraform layout for a multi-cloud GCP + AWS estate; kept environments reproducible and reviewable rather than hand-rolled.",
      "Standardised Go and TypeScript service builds on Nix so the supply chain is hermetic from local dev through CI to the production image.",
      "Shaped the API and GraphQL service boundaries with the back-end team; PostgreSQL and React.js round out the working stack.",
    ],
    stack: [
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
    role: "DevOps Engineer · Jul 2021 – Present",
    context:
      "SaaS platform with a Kubernetes-on-AWS estate and a SDLC that needs to stay honest as the team grows.",
    impact:
      "Kept the Kubernetes platform, the Terraform estate, and the Nix-built Go services boring on purpose — so feature work shipped without thinking about the substrate.",
    actions: [
      "Operated the AWS EKS estate and the Terraform that describes it; capacity, networking, and database posture under the same review pipeline as code.",
      "Shipped gRPC services in Go with hermetic Nix builds; the same toolchain ran on developer laptops and in CI.",
      "Kept PostgreSQL and the rest of the data layer healthy alongside the platform itself — backups, schema migrations, and access boundaries.",
    ],
    stack: [
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
    role: "SysOps + Lead Developer/Architect · Feb 2016 – Present",
    context:
      "Long tenure spanning lead architect through to SysOps duties — internal Linux estate, Docker Swarm services, and the in-house tooling that grew up around them.",
    impact:
      "Carried the institutional knowledge of how the systems were built and operated them — the period that produced most of the tooling still in use.",
    actions: [
      "Led architecture and delivery across web, back-end, and infrastructure for the lead-developer years; set the patterns the team worked from afterward.",
      "Also owned the operational side: Linux fleet, Docker Swarm services, AWS estate, Terraform, and the observability and automation glue in Bash and Go.",
      "Bridged the dev/ops divide on a stack that includes Kubernetes and GraphQL alongside the older Swarm-era services.",
    ],
    stack: [
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

interface Repo {
  name: string;
  url: string;
  description?: string;
  language?: string;
}

const REPOS: readonly Repo[] = [
  {
    name: "The Profile",
    url: "https://github.com/sharsie/profile",
    description: "This site — a self-contained Go binary built and deployed with Nix.",
    language: "TypeScript",
  },
  {
    name: "Nix flake: Base Veracode DevOps",
    url: "https://github.com/sharsie/nix-base-veracode-devops",
    description:
      "Base Nix flake for a Veracode workstation devshell — Terraform, Terragrunt, Python, MkDocs.",
    language: "Nix",
  },
  {
    name: "control4-utils",
    url: "https://github.com/sharsie/control4-utils",
    description: "Utility helpers for Control4 driver development.",
    language: "Lua",
  },
  {
    name: "reality-scanner",
    url: "https://github.com/sharsie/reality-scanner",
    description: "Property listing scanner written in Go.",
    language: "Go",
  },
  {
    name: "tv-status-rpio",
    url: "https://github.com/sharsie/tv-status-rpio",
    description: "Switches a Raspberry Pi GPIO pin based on TV power state.",
    language: "Go",
  },
  {
    name: "GitHub",
    url: "https://github.com/sharsie/",
  },
];

function makeThemeCard(theme: Theme): HTMLElement {
  const card = document.createElement("article");
  card.className = "card project-card";

  const company = document.createElement("h3");
  company.textContent = theme.company;
  card.appendChild(company);

  const role = document.createElement("p");
  role.className = "muted project-role";
  role.textContent = theme.role;
  card.appendChild(role);

  const context = document.createElement("p");
  context.className = "project-context";
  context.textContent = theme.context;
  card.appendChild(context);

  const impact = document.createElement("p");
  impact.className = "project-impact";
  impact.textContent = theme.impact;
  card.appendChild(impact);

  const details = document.createElement("details");
  details.className = "project-details";

  const summary = document.createElement("summary");
  summary.className = "project-summary";
  summary.textContent = "Details";
  details.appendChild(summary);

  const body = document.createElement("div");
  body.className = "project-body";

  const list = document.createElement("ul");
  list.className = "project-actions";
  for (const action of theme.actions) {
    const li = document.createElement("li");
    li.textContent = action;
    list.appendChild(li);
  }
  body.appendChild(list);

  const stack = document.createElement("div");
  stack.className = "timeline-badges";
  for (const item of theme.stack) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = item;
    stack.appendChild(badge);
  }
  body.appendChild(stack);

  details.appendChild(body);
  card.appendChild(details);

  return card;
}

function makeRepoCard(repo: Repo): HTMLElement {
  const a = document.createElement("a");
  a.className = "card project-link";
  a.href = repo.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  const name = document.createElement("h3");
  name.className = "project-link-name";
  name.textContent = repo.name;
  a.appendChild(name);

  if (repo.description) {
    const desc = document.createElement("p");
    desc.className = "project-link-desc";
    desc.textContent = repo.description;
    a.appendChild(desc);
  }

  if (repo.language) {
    const stack = document.createElement("div");
    stack.className = "timeline-badges";
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = repo.language;
    stack.appendChild(badge);
    a.appendChild(stack);
  }

  return a;
}

export function render(): HTMLElement {
  const section = document.createElement("section");
  section.id = "projects";

  const heading = document.createElement("h2");
  heading.textContent = "Notable Work";
  section.appendChild(heading);

  const intro = document.createElement("p");
  intro.className = "project-intro";
  intro.textContent =
    "Most of the work is internal to employers; below are the bigger themes plus the open-source pieces that are public.";
  section.appendChild(intro);

  for (const theme of THEMES) {
    section.appendChild(makeThemeCard(theme));
  }

  const osHeading = document.createElement("h3");
  osHeading.className = "project-os-heading";
  osHeading.textContent = "Open Source";
  section.appendChild(osHeading);

  const links = document.createElement("div");
  links.className = "project-links";
  for (const repo of REPOS) {
    links.appendChild(makeRepoCard(repo));
  }
  section.appendChild(links);

  return section;
}
