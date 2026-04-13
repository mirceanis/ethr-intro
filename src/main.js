import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm.js";

import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/serif.css";
import "./theme.css";

const compactViewportQuery = window.matchMedia("(max-width: 900px), (max-height: 700px)");

let mermaidPromise;

async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "base",
        themeVariables: {
          background: "transparent",
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          primaryColor: "#0d2038",
          primaryTextColor: "#edf3ff",
          primaryBorderColor: "rgba(125, 211, 252, 0.35)",
          lineColor: "#7dd3fc",
          tertiaryColor: "#0b1728",
          clusterBkg: "#0b1728",
          clusterBorder: "rgba(125, 211, 252, 0.26)",
          edgeLabelBackground: "#0b1728"
        },
        flowchart: {
          htmlLabels: true,
          curve: "basis",
          useMaxWidth: true
        }
      });

      return mermaid;
    });
  }

  return mermaidPromise;
}

function getDeckLayout() {
  if (compactViewportQuery.matches) {
    return {
      width: Math.min(Math.max(window.innerWidth - 18, 320), 760),
      height: Math.min(Math.max(window.innerHeight - 18, 320), 860),
      margin: 0,
      minScale: 1,
      maxScale: 1,
    };
  }

  return {
    width: 1440,
    height: 900,
    margin: 0.08,
    minScale: 0.2,
    maxScale: 2,
  };
}

function getHorizontalSlideNumber(slide) {
  const { h } = deck.getIndices(slide);
  const total = deck.getHorizontalSlides().length;

  return [h + 1, " / ", total];
}

async function renderMermaidDiagrams() {
  const codeBlocks = document.querySelectorAll("pre code.mermaid:not([data-mermaid-ready]), pre code.language-mermaid:not([data-mermaid-ready])");

  codeBlocks.forEach((codeBlock) => {
    const pre = codeBlock.parentElement;

    if (!pre || pre.dataset.mermaidReady === "true") {
      return;
    }

    const container = document.createElement("div");
    const mermaidClass = codeBlock.dataset.mermaidClass || pre.dataset.mermaidClass || "";
    const slideTitle = pre.closest("section")?.querySelector("h1, h2")?.textContent ?? "";

    container.className = `mermaid ${mermaidClass}`.trim();
    if (!mermaidClass && slideTitle === "What the Resolver Returns") {
      container.classList.add("mermaid--resolver");
    }
    container.textContent = codeBlock.textContent ?? "";

    pre.replaceWith(container);
    pre.dataset.mermaidReady = "true";
    codeBlock.dataset.mermaidReady = "true";
  });

  const nodes = document.querySelectorAll(".mermaid:not([data-processed])");

  if (!nodes.length) {
    return;
  }

  const mermaid = await getMermaid();

  await mermaid.run({
    nodes,
    suppressErrors: true
  });
}

const deck = new Reveal({
  hash: true,
  navigationMode: "default",
  scrollActivationWidth: null,
  controls: true,
  progress: true,
  slideNumber: getHorizontalSlideNumber,
  center: false,
  transition: "slide",
  transitionSpeed: 'fast',
  backgroundTransition: "fade",
  plugins: [Markdown],
  ...getDeckLayout()
});

deck.on("ready", () => {
  void renderMermaidDiagrams();
});

deck.on("slidechanged", () => {
  void renderMermaidDiagrams();
});

deck.initialize();
