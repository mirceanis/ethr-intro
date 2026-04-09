import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm.js";

import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/serif.css";
import "./theme.css";

const compactViewportQuery = window.matchMedia("(max-width: 900px), (max-height: 700px)");

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

deck.initialize();
