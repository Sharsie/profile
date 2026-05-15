/* ---------------------------------------------------------------------------
 * Skills section (T11 / PLAN Step 15).
 *
 * Categorized badge grid per PLAN §4 + Step 15. No proficiency bars or
 * percentages (RESEARCH §1). Certifications group is visually distinguished
 * via .badge-cert (accent border + slightly bolder weight). Groups render in
 * a responsive grid (1/2/3 columns) rather than a single stacked column.
 * ------------------------------------------------------------------------- */

interface SkillGroup {
  title: string;
  items: readonly string[];
  cert?: boolean;
}

const GROUPS: readonly SkillGroup[] = [
  {
    title: "DevOps / IaC",
    items: [
      "Kubernetes",
      "Terraform",
      "Terragrunt",
      "Docker",
      "Nix",
      "GitLab (self-managed)",
      "GitHub Actions",
      "GitOps",
      "ArgoCD",
      "Helm",
      "Service Mesh",
    ],
  },
  {
    title: "Cloud & Networking",
    items: [
      "AWS (EKS, networking, databases)",
      "GCP",
      "Azure",
      "Hub-and-spoke architecture",
      "DNS",
      "VPN architecture",
      "FedRAMP compliance",
    ],
  },
  {
    title: "Languages",
    items: ["Go", "TypeScript", "Bash", "Python", "Lua", "C++"],
  },
  {
    title: "Data & APIs",
    items: ["PostgreSQL", "MySQL/MariaDB", "GraphQL", "gRPC"],
  },
  {
    title: "Observability",
    items: ["Prometheus", "Grafana", "InfluxDB", "Elasticsearch"],
  },
  {
    title: "Frontend",
    items: ["React", "Vite", "Esbuild"],
  },
  {
    title: "SmartHome",
    items: ["KNX", "Control4"],
  },
  {
    title: "Certifications",
    items: ["Control4 Pro", "KNX Partner"],
    cert: true,
  },
];

function makeGroup(group: SkillGroup): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "skill-group";

  const h3 = document.createElement("h3");
  h3.className = "skill-group-title";
  h3.textContent = group.title;
  wrap.appendChild(h3);

  const badges = document.createElement("div");
  badges.className = "skill-badges";
  for (const item of group.items) {
    const b = document.createElement("span");
    b.className = group.cert === true ? "badge badge-cert" : "badge";
    b.textContent = item;
    badges.appendChild(b);
  }
  wrap.appendChild(badges);

  return wrap;
}

export function render(): HTMLElement {
  const section = document.createElement("section");
  section.id = "skills";

  const heading = document.createElement("h2");
  heading.textContent = "Skills";
  section.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "skill-grid";
  for (const group of GROUPS) {
    grid.appendChild(makeGroup(group));
  }
  section.appendChild(grid);

  return section;
}
