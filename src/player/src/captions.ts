let captionsEnabled = false;
let captionContainerEl: HTMLDivElement | null = null;
let activeCaptionCleanup: (() => void) | null = null;
let lastRenderedText = "";

export function initCaptionContainer(root: Element) {
  const container = document.createElement("div");
  container.classList.add("cl-captions");
  container.setAttribute("aria-live", "polite");
  root.appendChild(container);
  captionContainerEl = container;
}

export function setCaptionsSource(el: HTMLMediaElement, vttUrl: string | null) {
  if (activeCaptionCleanup) {
    activeCaptionCleanup();
    activeCaptionCleanup = null;
  }
  clearCaptionText();

  const ccButton = getCCButton();
  if (!vttUrl) {
    if (ccButton) ccButton.setAttribute("disabled", "");
    return;
  }
  if (ccButton) ccButton.removeAttribute("disabled");

  let aborted = false;
  let intervalId: ReturnType<typeof setInterval> | undefined;

  activeCaptionCleanup = () => {
    aborted = true;
    if (intervalId !== undefined) clearInterval(intervalId);
  };

  fetch(vttUrl)
    .then(r => r.text())
    .then(text => {
      if (aborted) return;
      const cues = parseVTT(text);
      intervalId = setInterval(() => {
        const t = el.currentTime;
        const cue = cues.find(c => t >= c.start && t < c.end) ?? null;
        const next = captionsEnabled && cue ? cue.text.replace(/<[^>]+>/g, "") : "";
        if (next === lastRenderedText) return;
        lastRenderedText = next;
        if (next) {
          setCaptionText(next);
        } else {
          clearCaptionText();
        }
      }, 50);
    })
    .catch(() => {
      if (ccButton) ccButton.setAttribute("disabled", "");
    });
}

export function clearCaptions() {
  if (activeCaptionCleanup) {
    activeCaptionCleanup();
    activeCaptionCleanup = null;
  }
  clearCaptionText();
  const ccButton = getCCButton();
  if (ccButton) ccButton.setAttribute("disabled", "");
}

export function getCaptionsEnabled() {
  return captionsEnabled;
}

export function setCaptionsEnabled(val: boolean) {
  captionsEnabled = val;
  if (!val) clearCaptionText();
  const ccButton = getCCButton();
  if (ccButton) ccButton.setAttribute("aria-pressed", val ? "true" : "false");
}

function getCCButton(): HTMLButtonElement | null {
  return captionContainerEl?.parentElement?.querySelector(".cc.button") ?? null;
}

function clearCaptionText() {
  lastRenderedText = "";
  if (captionContainerEl) captionContainerEl.innerHTML = "";
}

function setCaptionText(clean: string) {
  if (!captionContainerEl) return;
  captionContainerEl.innerHTML = "";
  clean.split("\n").filter(l => l.trim()).forEach(line => {
    const p = document.createElement("p");
    p.textContent = line;
    captionContainerEl!.appendChild(p);
  });
}

interface Cue {
  start: number;
  end: number;
  text: string;
}

function parseVTT(text: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of text.split(/\n\n+/)) {
    const lines = block.trim().split("\n");
    const tsIndex = lines.findIndex(l => l.includes("-->"));
    if (tsIndex === -1) continue;
    const parts = lines[tsIndex].split("-->");
    if (parts.length < 2) continue;
    const start = parseTimestamp(parts[0].trim());
    const end = parseTimestamp(parts[1].trim().split(" ")[0]);
    const cueText = lines.slice(tsIndex + 1).join("\n").trim();
    if (cueText) cues.push({ start, end, text: cueText });
  }
  return cues;
}

function parseTimestamp(ts: string): number {
  const parts = ts.split(":");
  if (parts.length === 3) {
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return Number(parts[0]) * 60 + parseFloat(parts[1]);
}
