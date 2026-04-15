import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm.js";

import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/serif.css";
import "./theme.css";

const compactViewportQuery = window.matchMedia("(max-width: 900px), (max-height: 700px)");

let mermaidPromise;
let resolverPromise;

async function getMermaid() {
    if (!mermaidPromise) {
        mermaidPromise = import("mermaid").then(({default: mermaid}) => {
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

async function getDidResolver() {
    if (!resolverPromise) {
        resolverPromise = Promise.all([
            import("https://esm.sh/did-resolver@4.1.0"),
            import("https://esm.sh/ethr-did-resolver@11.1.0"),
        ]).then(([{Resolver}, {getResolver}]) => {
            const ethrResolver = getResolver({
                networks: [
                    {
                        chainId: 1,
                        registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b',
                        name: 'mainnet',
                        legacyNonce: true,
                        rpcUrl: "https://eth.drpc.org"
                    },
                    {
                        chainId: 11155111,
                        registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818',
                        name: 'sepolia',
                        legacyNonce: false,
                        rpcUrl: "https://sepolia.drpc.org"
                    },
                    {
                        chainId: 100,
                        registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818',
                        name: 'gno',
                        legacyNonce: false,
                        rpcUrl: "https://gnosis.drpc.org"
                    },
                    {
                        chainId: 17000,
                        registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818',
                        name: 'holesky',
                        legacyNonce: false,
                        rpcUrl: "https://holesky.drpc.org"
                    },
                    {
                        chainId: 137,
                        registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b',
                        name: 'polygon',
                        legacyNonce: true,
                        rpcUrl: "https://polygon.drpc.org"
                    },
                    {
                        chainId: 1313161554,
                        registry: '0x63eD58B671EeD12Bc1652845ba5b2CDfBff198e0',
                        name: 'aurora',
                        legacyNonce: true,
                        rpcUrl: "https://aurora.drpc.org"
                    },
                    {
                        chainId: 59140,
                        registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818',
                        name: 'linea:goerli',
                        legacyNonce: false,
                        rpcUrl: 'https://rpc.goerli.linea.build'
                    },
                ],
            });
            return new Resolver(ethrResolver);
        });
    }
    return resolverPromise;
}

async function resolveDid(did) {
    const container = document.getElementById("result-container");
    if (!container) return;

    container.textContent = "Resolving…";
    container.className = "did-result did-result--loading";

    try {
        const resolver = await getDidResolver();
        const result = await resolver.resolve(did.trim());

        if (result.didResolutionMetadata?.error) {
            container.textContent = result.didResolutionMetadata.error + (result.didResolutionMetadata.message ? ": " + result.didResolutionMetadata.message : "");
            container.className = "did-result did-result--error";
            return;
        }

        container.textContent = JSON.stringify(result.didDocument, null, 2);
        container.className = "did-result did-result--ok";
    } catch (err) {
        container.textContent = String(err.message || err);
        container.className = "did-result did-result--error";
    }
}

function setupDidResolver() {
    const input = document.getElementById("did-input");
    const btn = document.getElementById("did-resolve-btn");
    if (!input || !btn || btn.dataset.wired) return;
    btn.dataset.wired = "true";

    btn.addEventListener("click", () => resolveDid(input.value));
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") resolveDid(input.value);
    });

    document.querySelectorAll(".did-example").forEach((el) => {
        el.addEventListener("click", () => {
            input.value = el.dataset.did;
            resolveDid(el.dataset.did);
        });
    });
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
    const {h} = deck.getIndices(slide);
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
    setupDidResolver();
});

deck.on("slidechanged", () => {
    void renderMermaidDiagrams();
    setupDidResolver();
});

deck.initialize();
