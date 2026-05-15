import profileImage from "../assets/profile.jpg";

// Natural dimensions of the source JPEG (1363x1363, square).
// Set explicitly so the browser reserves layout space before image decode,
// avoiding cumulative-layout-shift on first paint.
const PROFILE_W = 1363;
const PROFILE_H = 1363;

interface CTA {
  label: string;
  href: string;
  className: string;
  external?: boolean;
  download?: boolean;
}

const CTAS: CTA[] = [
  {
    label: "Download CV",
    href: "/assets/cv.pdf",
    className: "btn btn-primary hero-cta-download",
    download: true,
  },
  {
    label: "Go to website",
    href: "https://profile.c3c.cz",
    className: "btn btn-primary hero-cta-website",
    external: true,
  },
];

export function render(): HTMLElement {
  const section = document.createElement("section");
  section.id = "hero";
  section.className = "hero";

  const photoWrap = document.createElement("div");
  photoWrap.className = "hero-photo";
  const img = document.createElement("img");
  img.src = profileImage;
  img.alt = "Lukáš Čech";
  img.width = PROFILE_W;
  img.height = PROFILE_H;
  img.decoding = "async";
  img.loading = "eager";
  photoWrap.appendChild(img);
  section.appendChild(photoWrap);

  const text = document.createElement("div");
  text.className = "hero-text";

  const name = document.createElement("h1");
  name.textContent = "Lukáš Čech";
  text.appendChild(name);

  const title = document.createElement("p");
  title.className = "hero-title";
  title.textContent = "DevOps Architect";
  text.appendChild(title);

  const tagline = document.createElement("p");
  tagline.className = "hero-tagline";
  tagline.textContent = "“If there is a need, there is a path.”";
  text.appendChild(tagline);

  const ctaRow = document.createElement("div");
  ctaRow.className = "hero-ctas";
  for (const cta of CTAS) {
    const a = document.createElement("a");
    a.className = cta.className;
    a.href = cta.href;
    a.textContent = cta.label;
    if (cta.external === true) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    if (cta.download === true) {
      a.setAttribute("download", "");
    }
    ctaRow.appendChild(a);
  }
  text.appendChild(ctaRow);

  section.appendChild(text);

  return section;
}
