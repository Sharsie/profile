/* ---------------------------------------------------------------------------
 * Contact.
 *
 * No visible heading — the section is self-explanatory and the nav link
 * already says "Contact"; an aria-label keeps it a named landmark for
 * assistive tech. Responsive grid of manifest-style cells (monospace key,
 * plain-text value): one column on mobile, two on desktop, pairing
 * email/phone, linkedin/github, location/remote.
 *
 * Email row carries a copy-to-clipboard button that prefers the modern
 * Clipboard API and falls back to a transient textarea + execCommand("copy")
 * for older browsers or non-secure contexts. Success/failure both restore
 * the button label after ~1.5 s; the transient `is-copied` class lets CSS
 * shift the visual.
 * ------------------------------------------------------------------------- */

const EMAIL = "lukas@c3c.cz";
const PHONE = "+420 606 626 266";
const PHONE_HREF = "tel:+420606626266";
const LINKEDIN_URL = "https://www.linkedin.com/in/lukas-cech/";
const GITHUB_URL = "https://github.com/sharsie";
const COPIED_LABEL_MS = 1500;

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

async function copyEmail(button: HTMLButtonElement): Promise<void> {
  const original = button.dataset.label ?? button.textContent ?? "Copy";
  let success = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(EMAIL);
      success = true;
    } else {
      success = fallbackCopy(EMAIL);
    }
  } catch {
    success = fallbackCopy(EMAIL);
  }

  if (success) {
    button.textContent = "Copied";
    button.classList.add("is-copied");
  } else {
    button.textContent = "Copy failed";
  }
  window.setTimeout(() => {
    button.textContent = original;
    button.classList.remove("is-copied");
  }, COPIED_LABEL_MS);
}

function makeRow(key: string): HTMLElement {
  const li = document.createElement("li");
  li.className = "contact-row";

  const dt = document.createElement("span");
  dt.className = "contact-key";
  dt.textContent = key;
  li.appendChild(dt);

  return li;
}

function makeEmailRow(): HTMLElement {
  const li = makeRow("email");

  const value = document.createElement("span");
  value.className = "contact-value";

  const link = document.createElement("a");
  link.href = `mailto:${EMAIL}`;
  link.textContent = EMAIL;
  value.appendChild(link);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-email";
  button.textContent = "Copy";
  button.dataset.label = "Copy";
  button.setAttribute("aria-label", "Copy email to clipboard");
  button.addEventListener("click", () => {
    void copyEmail(button);
  });
  value.appendChild(button);

  li.appendChild(value);
  return li;
}

function makeLinkRow(key: string, href: string, text: string): HTMLElement {
  const li = makeRow(key);

  const link = document.createElement("a");
  link.className = "contact-link";
  link.href = href;
  if (href.startsWith("http")) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  link.textContent = text;
  li.appendChild(link);

  return li;
}

function makeTextRow(key: string, text: string): HTMLElement {
  const li = makeRow(key);

  const value = document.createElement("span");
  value.className = "contact-value";
  value.textContent = text;
  li.appendChild(value);

  return li;
}

export function render(): HTMLElement {
  const section = document.createElement("section");
  section.id = "contact";
  section.setAttribute("aria-label", "Contact");

  const list = document.createElement("ul");
  list.className = "contact-rows";

  list.appendChild(makeEmailRow());
  list.appendChild(makeLinkRow("phone", PHONE_HREF, PHONE));
  list.appendChild(
    makeLinkRow("linkedin", LINKEDIN_URL, "linkedin.com/in/lukas-cech"),
  );
  list.appendChild(makeLinkRow("github", GITHUB_URL, "github.com/sharsie"));
  list.appendChild(makeTextRow("location", "Central Bohemia, Czechia"));
  list.appendChild(
    makeTextRow("remote only", "No relocation, no hybrid."),
  );

  section.appendChild(list);
  return section;
}
