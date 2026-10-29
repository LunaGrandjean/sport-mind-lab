const SVG_NS = "http://www.w3.org/2000/svg";
// Six points périphériques et un centre, fixes pour tous les niveaux et phases.
const FIGURE_POINTS = Object.freeze([
  { x: 500, y: 100, color: "#c14681" },
  { x: 760, y: 250, color: "#2478bd" },
  { x: 760, y: 550, color: "#719e43" },
  { x: 500, y: 700, color: "#c52e4d" },
  { x: 240, y: 550, color: "#7c4392" },
  { x: 240, y: 250, color: "#db702f" },
  { x: 500, y: 400, color: "#e2b81e" },
].map(point => Object.freeze(point)));

const LOCAL_LINKS = [
  ...Array.from({ length: 6 }, (_, i) => [i, (i + 1) % 6]),
  ...Array.from({ length: 6 }, (_, i) => [i, 6]),
];
const CROSS_LINKS = Array.from({ length: 6 }, (_, i) => [i, (i + 2) % 6]);
const OPPOSITE_LINKS = [[0, 3], [1, 4], [2, 5]];
const FIGURE_LEVELS = {
  easy: { label: "Facile", min: 9, max: 12, longLinks: 0, pool: LOCAL_LINKS },
  medium: { label: "Moyen", min: 9, max: 11, longLinks: 2, pool: [...LOCAL_LINKS, ...CROSS_LINKS] },
  hard: { label: "Difficile", min: 10, max: 12, longLinks: 4, pool: [...LOCAL_LINKS, ...CROSS_LINKS, ...OPPOSITE_LINKS] },
};
const appState = { phase: "menu", difficulty: "easy", exposure: 5, trial: 0, token: 0, figure: [] };
const previousFigures = new Map();
let transitionTimer = null;

const menuElement = document.getElementById("menu");
const exerciseElement = document.getElementById("exercise");
const boardElement = document.getElementById("board");
const difficultyInput = document.getElementById("difficulty");
const exposureInput = document.getElementById("exposure");

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function linkKey(link) {
  return [link.a, link.b].sort((a, b) => a - b).join("-");
}

function figureSignature(links) {
  return links.map(link => linkKey(link) + (link.curved ? "c" : "s")).sort().join("|");
}

function isConnected(links) {
  const visited = new Set([0]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const { a, b } of links) {
      if (visited.has(a) !== visited.has(b)) {
        visited.add(a);
        visited.add(b);
        changed = true;
      }
    }
  }
  return visited.size === FIGURE_POINTS.length;
}

function isOpposite(link) {
  return link.a < 6 && link.b < 6 && Math.abs(link.a - link.b) === 3;
}

function generateFigure(difficulty) {
  const config = FIGURE_LEVELS[difficulty];
  const candidates = config.pool.map(([a, b]) => ({ a, b, curved: false, bend: 0 }));
  const longKeys = new Set([...CROSS_LINKS, ...OPPOSITE_LINKS].map(([a, b]) => linkKey({ a, b })));
  const selected = [];
  const used = new Set();
  const parents = FIGURE_POINTS.map((_, i) => i);
  const root = i => parents[i] === i ? i : (parents[i] = root(parents[i]));
  const add = link => { selected.push({ ...link }); used.add(linkKey(link)); };

  // Un arbre couvrant garantit que les sept points participent à la figure.
  for (const link of shuffled(candidates)) {
    const a = root(link.a), b = root(link.b);
    if (a !== b) { parents[a] = b; add(link); }
  }
  for (const link of shuffled(candidates.filter(link => longKeys.has(linkKey(link))))) {
    if (selected.filter(item => longKeys.has(linkKey(item))).length >= config.longLinks) break;
    if (!used.has(linkKey(link))) add(link);
  }
  const total = config.min + Math.floor(Math.random() * (config.max - config.min + 1));
  for (const link of shuffled(candidates)) {
    if (selected.length >= total) break;
    if (!used.has(linkKey(link))) add(link);
  }

  if (difficulty === "hard") {
    // Les diamètres sont courbés pour contourner le point central.
    const curves = new Set(selected.filter(isOpposite));
    const curveCount = 3 + Math.floor(Math.random() * 3);
    for (const link of shuffled(selected)) {
      if (curves.size >= curveCount) break;
      curves.add(link);
    }
    for (const link of curves) {
      link.curved = true;
      link.bend = (Math.random() < 0.5 ? -1 : 1) * (0.22 + Math.random() * 0.15);
    }
  }
  return selected;
}

function newFigure(difficulty) {
  const previous = previousFigures.get(difficulty);
  let links;
  for (let attempt = 0; attempt < 40; attempt++) {
    links = generateFigure(difficulty);
    if (figureSignature(links) !== previous) break;
  }
  if (figureSignature(links) === previous) {
    // Même en cas de tirages identiques, éviter deux figures successives égales.
    const removable = links.findIndex((_, i) => isConnected(links.filter((_, j) => j !== i)));
    const unused = FIGURE_LEVELS[difficulty].pool.find(([a, b]) => !links.some(link => linkKey(link) === linkKey({ a, b })));
    links.splice(removable, 1);
    if (unused) {
      const link = { a: unused[0], b: unused[1], curved: false, bend: 0 };
      if (difficulty === "hard") { link.curved = true; link.bend = 0.3; }
      links.push(link);
    }
  }
  previousFigures.set(difficulty, figureSignature(links));
  return links;
}

function svgElement(name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

function renderFigure(svg, links, colored = true) {
  const lines = svgElement("g", { "data-layer": "links", fill: "none", stroke: "#18212c", "stroke-width": 10, "stroke-linecap": "round" });
  for (const link of links) {
    const a = FIGURE_POINTS[link.a], b = FIGURE_POINTS[link.b];
    if (link.curved) {
      const cx = Math.max(65, Math.min(935, (a.x + b.x) / 2 - (b.y - a.y) * link.bend));
      const cy = Math.max(65, Math.min(735, (a.y + b.y) / 2 + (b.x - a.x) * link.bend));
      lines.appendChild(svgElement("path", { d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}` }));
    } else {
      lines.appendChild(svgElement("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
    }
  }
  const dots = svgElement("g", { "data-layer": "points" });
  FIGURE_POINTS.forEach(point => dots.appendChild(svgElement("circle", {
    cx: point.x, cy: point.y, r: 24, fill: colored ? point.color : "#000000", stroke: "#ffffff", "stroke-width": 6,
  })));
  svg.replaceChildren(lines, dots);
}

function cancelTrial() {
  clearTimeout(transitionTimer);
  transitionTimer = null;
  appState.token++;
}

function setPhase(phase) {
  appState.phase = phase;
  boardElement.style.visibility = phase === "blank" ? "hidden" : "visible";
  boardElement.setAttribute("aria-hidden", String(phase === "blank"));
  const labels = { memorize: "Mémorisation", blank: "Pause · 3 secondes", recall: "Reproduction" };
  const hints = { memorize: "Mémorisez les liaisons.", blank: "La figure a disparu. Patientez 3 secondes.", recall: "Reproduisez les liaisons avec votre laser, sans limite de temps." };
  document.getElementById("phaseLabel").textContent = labels[phase];
  document.getElementById("phaseHint").textContent = hints[phase];
  boardElement.setAttribute("aria-label", phase === "recall" ? "Sept points noirs fixes, sans liaisons" : "Figure colorée à mémoriser");
}

function launchFigure() {
  cancelTrial();
  const token = appState.token;
  appState.figure = newFigure(appState.difficulty);
  appState.trial++;
  renderFigure(boardElement, appState.figure);
  setPhase("memorize");
  document.getElementById("trialInfo").textContent = `${FIGURE_LEVELS[appState.difficulty].label} · ${appState.exposure} s · Figure ${appState.trial}`;
  transitionTimer = setTimeout(() => {
    if (token !== appState.token) return;
    setPhase("blank");
    // Aucun point ni aucune liaison ne reste visible pendant ces trois secondes.
    boardElement.replaceChildren();
    transitionTimer = setTimeout(() => {
      if (token !== appState.token) return;
      renderFigure(boardElement, [], false);
      setPhase("recall");
      transitionTimer = null;
    }, 3000);
  }, appState.exposure * 1000);
}

function startExercise() {
  appState.difficulty = difficultyInput.value;
  appState.exposure = Number(exposureInput.value);
  appState.trial = 0;
  menuElement.hidden = true;
  exerciseElement.hidden = false;
  document.body.classList.add("exercise-open");
  // Libérer le focus des boutons : Espace doit lancer une seule figure.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  document.documentElement.requestFullscreen?.().catch(() => {});
  launchFigure();
}

function returnToMenu() {
  cancelTrial();
  appState.phase = "menu";
  boardElement.replaceChildren();
  exerciseElement.hidden = true;
  menuElement.hidden = false;
  document.body.classList.remove("exercise-open");
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  document.getElementById("startExercise").focus();
}

function updatePreview() {
  const simple = LOCAL_LINKS.map(([a, b]) => ({ a, b }));
  const medium = [[0, 5], [0, 1], [4, 3], [3, 2], [5, 6], [6, 1], [4, 6], [6, 2], [6, 3]].map(([a, b]) => ({ a, b }));
  const hard = [
    ...[[0, 4], [0, 2], [0, 6], [6, 3], [5, 3], [1, 3]].map(([a, b]) => ({ a, b })),
    ...[[5, 1], [4, 2], [5, 2], [1, 4]].map(([a, b]) => ({ a, b, curved: true, bend: 0.35 })),
  ];
  const level = difficultyInput.value;
  renderFigure(document.getElementById("menuPreview"), { easy: simple, medium, hard }[level]);
  document.getElementById("previewCaption").textContent = {
    easy: "Exemple du niveau facile, inspiré de la figure 37.",
    medium: "Exemple du niveau moyen, inspiré de la figure 41.",
    hard: "Exemple du niveau difficile, inspiré de la figure 47.",
  }[level];
}

document.getElementById("startExercise").addEventListener("click", startExercise);
document.getElementById("nextFigure").addEventListener("click", launchFigure);
document.getElementById("returnMenu").addEventListener("click", returnToMenu);
difficultyInput.addEventListener("change", updatePreview);
document.addEventListener("keydown", event => {
  if (event.code === "Escape" || event.key.toLowerCase() === "m") {
    if (appState.phase !== "menu") {
      event.preventDefault();
      event.stopPropagation();
      returnToMenu();
    }
    return;
  }
  if (event.code !== "Space" || event.repeat) return;
  if (appState.phase === "menu" && event.target instanceof Element && event.target.closest("select,input,textarea,button")) return;
  event.preventDefault();
  if (appState.phase === "menu") startExercise();
  else {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    launchFigure();
  }
});
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && appState.phase !== "menu") returnToMenu();
});
window.addEventListener("pagehide", cancelTrial);
updatePreview();
