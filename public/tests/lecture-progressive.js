const READING_TEXT = `L'entraînement visuel est aujourd'hui considéré comme un élément essentiel de la préparation du sportif de haut niveau. Longtemps limité à la simple évaluation de l'acuité visuelle, il englobe désormais toutes les capacités permettant de percevoir rapidement son environnement, de sélectionner les informations utiles et de produire une réponse motrice efficace. Dans la plupart des disciplines, la différence entre deux athlètes de haut niveau ne dépend pas uniquement de leurs qualités physiques, mais repose également sur leur capacité à détecter les indices importants quelques fractions de seconde avant leurs adversaires. Cette avance cruciale, parfois inférieure à 200 millisecondes, peut suffire à modifier complètement l'issue d'une action.
Les recherches montrent que les sportifs experts utilisent des stratégies visuelles bien différentes de celles des débutants. Ce comportement, appelé visual search behaviour, leur permet d'extraire rapidement les informations indispensables à la prise de décision tout en réduisant les traitements inutiles. Concrètement, les athlètes d'élite déplacent moins souvent leurs yeux, dirigent leur regard directement vers les zones réellement pertinentes et anticipent davantage les actions futures.
Parmi les mécanismes les plus étudiés figure le Quiet Eye, qui correspond à la dernière fixation visuelle stable réalisée juste avant l'exécution d'un geste précis. Les travaux de Joan Vickers démontrent que les meilleurs sportifs maintiennent cette fixation plus longtemps que les novices, une durée prolongée qui est directement associée à une meilleure précision dans des disciplines telles que le golf, le tir, le basketball, le football ou le rugby.
Heureusement, ces aptitudes ne sont pas figées. L'entraînement visuel vise à améliorer la rapidité des saccades oculaires, la poursuite visuelle, la vision périphérique, l'attention sélective, le filtrage des distractions ainsi que le couplage entre la perception et l'action. Grâce aux mécanismes de la neuroplasticité, l'ensemble de ces fonctions peut être stimulé et développé de façon optimale à travers un programme d'entraînement adapté.`;

const READING_DESCRIPTIONS = [
  "Le texte est écrit en gros caractères de 52 px, entièrement en gras.",
  "La taille reste grande, mais le texte n’est plus en gras.",
  "Les mots peuvent se couper à n’importe quelle lettre en fin de ligne, sans tiret : la suite continue sur la ligne suivante.",
  "Des lettres grasses et normales alternent, y compris dans un même mot.",
  "La taille de base descend à 44 px, avec les difficultés précédentes.",
  "La taille de base descend à 38 px.",
  "La taille de base descend à 32 px.",
  "La taille de base descend à 28 px.",
  "L’espace entre les lignes change d’une ligne à l’autre.",
  "Une écriture manuscrite et des lignes légèrement inclinées remplacent l’écriture régulière.",
  "L’inclinaison des lignes devient plus marquée.",
  "Les mots sont décalés en hauteur et légèrement orientés différemment.",
  "Les lettres sont aussi décalées et inclinées à l’intérieur des mots.",
  "Certaines lettres prennent des couleurs différentes, dont un jaune doux volontairement difficile à discerner sur le blanc.",
  "L’espace entre les mots varie beaucoup, de très serré à très large.",
  "L’espace entre les lettres varie aussi à l’intérieur des mots.",
  "Chaque lettre peut avoir une taille différente.",
  "L’ensemble devient plus petit : la taille de base passe à 18 px.",
  "Un « i » inutile est ajouté entre chaque paire de mots.",
  "Des « i » supplémentaires se glissent aussi dans certains mots, mais pas dans tous.",
  "Les lettres intérieures de certains mots sont mélangées ; la première et la dernière lettre restent en place. Les difficultés précédentes sont conservées.",
];
const READING_MODES = {
  lines: { label: "Lignes classiques", description: "Le texte se lit ligne après ligne, de haut en bas." },
  circular: { label: "Lecture circulaire", description: "Commencez en haut de chaque cercle, dans le sens des aiguilles d’une montre. Lisez les anneaux de l’extérieur vers l’intérieur, puis descendez au cercle suivant." },
  reverse: { label: "Verlan", description: "Les lettres de chaque mot sont écrites à l’envers : « bonjour » devient « ruojnob ». L’ordre des mots et des paragraphes reste identique." },
};
const readingState = { active: false, level: 1, mode: "lines", lastWidth: 0, renderFrame: null };
const readingLevelInput = document.getElementById("readingLevel");
const readingModeInput = document.getElementById("readingMode");
const readingSvg = document.getElementById("readingVisual");
const measureContext = document.createElement("canvas").getContext("2d");
const readingMeasures = new Map();
const READING_NS = "http://www.w3.org/2000/svg";
const SOURCE_PARAGRAPHS = READING_TEXT.split("\n");

// Des variations reproductibles : changer de fenêtre ne change pas le texte ni les distracteurs.
function readingNoise(word, letter, feature) {
  let value = Math.imul(word + 17, 374761393) ^ Math.imul(letter + 29, 668265263) ^ Math.imul(feature + 41, 1274126177);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function readingConfig(level) {
  const fontSize = level >= 18 ? 18 : level >= 8 ? 28 : level === 7 ? 32 : level === 6 ? 38 : level === 5 ? 44 : 52;
  return { level, fontSize, family: level >= 10 ? '"Segoe Print", "Comic Sans MS", cursive' : 'Arial, sans-serif', splitWords: level >= 3 };
}

function scrambleInterior(word, index) {
  if (word.length < 5 || readingNoise(index, 0, 91) > 0.5) return word;
  const letters = [...word], inside = letters.slice(1, -1);
  for (let i = inside.length - 1; i > 0; i--) {
    const j = Math.floor(readingNoise(index, i, 92) * (i + 1));
    [inside[i], inside[j]] = [inside[j], inside[i]];
  }
  if (inside.join("") === letters.slice(1, -1).join("")) {
    const other = inside.findIndex(char => char !== inside[0]);
    if (other > 0) [inside[0], inside[other]] = [inside[other], inside[0]];
  }
  return letters[0] + inside.join("") + letters.at(-1);
}

function transformedWord(word, index, level, mode) {
  return word.replace(/[\p{L}\p{M}]+/gu, part => {
    let text = mode === "reverse" ? [...part].reverse().join("") : part;
    if (level >= 21) text = scrambleInterior(text, index);
    return text;
  });
}

function measureGlyph(char, size, weight, family) {
  const key = `${char}|${size}|${weight}|${family}`;
  if (!readingMeasures.has(key)) {
    measureContext.font = `${weight} ${size}px ${family}`;
    readingMeasures.set(key, measureContext.measureText(char).width);
  }
  return readingMeasures.get(key);
}

function makeReadingGlyph(char, wordIndex, letterIndex, config, kind = "source") {
  const { level, fontSize, family } = config;
  const space = kind === "space";
  const weight = level === 1 ? 800 : level >= 4 && (wordIndex + letterIndex) % 3 === 0 ? 800 : 400;
  const size = space ? fontSize : fontSize * (level >= 17 ? [0.7, 0.85, 1, 1.2, 1.45][Math.floor(readingNoise(wordIndex, letterIndex, 1) * 5)] : 1);
  const width = measureGlyph(char, size, weight, family);
  const letterGap = level >= 16 && !space ? fontSize * [-0.06, 0.03, 0.15, 0.36, 0.62][Math.floor(readingNoise(wordIndex, letterIndex, 2) * 5)] : 0;
  const wordGap = level >= 15 ? fontSize * [0.18, 0.5, 1.15, 1.9, 2.8][Math.floor(readingNoise(wordIndex, letterIndex, 3) * 5)] : fontSize * 0.34;
  const colorChoice = readingNoise(wordIndex, letterIndex, 4);
  const colors = ["#245cc3", "#c33855", "#628c38", "#e7d983", "#ab7db8"];
  return {
    char, kind, wordIndex, letterIndex, size, weight, width,
    advance: space ? wordGap : Math.max(width * 0.8, width + letterGap),
    color: level >= 14 && colorChoice < 0.4 && !space ? colors[Math.floor(colorChoice / 0.4 * colors.length)] : "#0f172a",
    wordShift: level >= 12 ? (readingNoise(wordIndex, 0, 5) - 0.5) * fontSize * 0.6 : 0,
    wordAngle: level >= 12 ? (readingNoise(wordIndex, 0, 6) - 0.5) * 8 : 0,
    letterShift: level >= 13 ? (readingNoise(wordIndex, letterIndex, 7) - 0.5) * fontSize * 0.36 : 0,
    letterAngle: level >= 13 ? (readingNoise(wordIndex, letterIndex, 8) - 0.5) * 12 : 0,
  };
}

function readingParagraphs(config, mode) {
  let wordIndex = 0;
  return SOURCE_PARAGRAPHS.map(paragraph => {
    const words = paragraph.split(" ");
    const units = [];
    words.forEach((source, position) => {
      const index = wordIndex++;
      const text = transformedWord(source, index, config.level, mode);
      const letters = [...text];
      const glyphs = [];
      const addInside = config.level >= 20 && letters.length >= 5 && readingNoise(index, 0, 81) < 0.38;
      const insideAt = 1 + Math.floor(readingNoise(index, 0, 82) * Math.max(1, letters.length - 3));
      letters.forEach((char, i) => {
        glyphs.push(makeReadingGlyph(char, index, i, config));
        if (addInside && i === insideAt && /\p{L}/u.test(char) && /\p{L}/u.test(letters[i + 1] || "")) {
          glyphs.push(makeReadingGlyph("i", index, i + 1000, config, "inside-distractor"));
        }
      });
      units.push({ kind: "word", wordIndex: index, glyphs });
      if (position < words.length - 1) {
        units.push({ kind: "space", glyphs: [makeReadingGlyph(" ", index, -1, config, "space")] });
        if (config.level >= 19) {
          units.push({ kind: "word", wordIndex: index, glyphs: [makeReadingGlyph("i", index, 2000, config, "between-distractor")] });
          units.push({ kind: "space", glyphs: [makeReadingGlyph(" ", index, -2, config, "space")] });
        }
      }
    });
    return units;
  });
}

function lineSpacing(config, index) {
  return config.fontSize * (config.level >= 9 ? [0.08, 0.6, 1.2, 0.25, 0.9][index % 5] : 0.28);
}

function layoutReadingParagraph(units, getSlot, splitWords) {
  const lines = [];
  let line = { glyphs: [], width: 0, slot: getSlot(0) };
  const flush = () => {
    if (!line.glyphs.length) return;
    lines.push(line);
    line = { glyphs: [], width: 0, slot: getSlot(lines.length) };
  };
  const add = glyph => {
    const advance = glyph.kind === "space" && line.width === 0 ? 0 : glyph.advance;
    line.glyphs.push({ ...glyph, offset: line.width });
    line.width += advance;
  };
  for (const unit of units) {
    if (!splitWords && unit.kind === "word") {
      const total = unit.glyphs.reduce((sum, glyph) => sum + glyph.advance, 0);
      if (line.width > 0 && line.width + total > line.slot.capacity) flush();
      // Un mot plus large que tout l'écran reste entier aux niveaux 1 et 2.
      const scale = Math.min(1, line.slot.capacity / total);
      unit.glyphs.forEach(glyph => add(scale < 1 ? { ...glyph, size: glyph.size * scale, width: glyph.width * scale, advance: glyph.advance * scale } : glyph));
    } else {
      for (const glyph of unit.glyphs) {
        if (glyph.kind !== "space" && line.width > 0 && line.width + glyph.advance > line.slot.capacity) flush();
        add(glyph);
      }
    }
  }
  flush();
  return lines;
}

function readingElement(name, attributes = {}) {
  const element = document.createElementNS(READING_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

function drawReadingGlyph(group, glyph, x, y, angle, config, centered = false) {
  const text = readingElement("text", {
    x, y, fill: glyph.color, "font-size": glyph.size, "font-family": config.family, "font-weight": glyph.weight,
    "data-kind": glyph.kind, "data-word": glyph.wordIndex, "data-letter": glyph.letterIndex,
    "xml:space": "preserve", "text-anchor": centered ? "middle" : "start",
  });
  if (angle) text.setAttribute("transform", `rotate(${angle} ${x} ${y})`);
  text.textContent = glyph.char;
  group.appendChild(text);
}

function drawLinearReading(paragraphs, config, width) {
  const fragment = document.createDocumentFragment();
  const padding = Math.max(16, config.fontSize * 0.75);
  let y = config.fontSize * 0.5, lineIndex = 0;
  paragraphs.forEach((units, paragraphIndex) => {
    const group = readingElement("g", { "data-paragraph": paragraphIndex });
    const lines = layoutReadingParagraph(units, () => ({ capacity: width - padding * 2 }), config.splitWords);
    for (const line of lines) {
      const maxSize = Math.max(...line.glyphs.map(glyph => glyph.size));
      const lineAngle = config.level >= 10 ? (readingNoise(paragraphIndex, lineIndex, 21) - 0.5) * (config.level >= 11 ? 5 : 2) : 0;
      const tilt = Math.abs(Math.sin(lineAngle * Math.PI / 180) * line.width);
      const jitter = config.level >= 13 ? config.fontSize * 0.5 : config.level >= 12 ? config.fontSize * 0.32 : 0;
      const baseline = y + maxSize + tilt / 2 + jitter;
      const row = readingElement("g", { "data-line": lineIndex, "data-gap": lineSpacing(config, lineIndex), "data-angle": lineAngle });
      for (const glyph of line.glyphs) {
        const x = padding + glyph.offset;
        const glyphY = baseline + Math.tan(lineAngle * Math.PI / 180) * (glyph.offset - line.width / 2) + glyph.wordShift + glyph.letterShift;
        drawReadingGlyph(row, glyph, x, glyphY, lineAngle + glyph.wordAngle + glyph.letterAngle, config);
      }
      group.appendChild(row);
      y += maxSize * 1.65 + tilt + jitter * 2 + lineSpacing(config, lineIndex++);
    }
    y += config.fontSize * 1.2;
    fragment.appendChild(group);
  });
  return { fragment, height: Math.ceil(y + config.fontSize) };
}

function drawCircularReading(paragraphs, config, width) {
  const fragment = document.createDocumentFragment();
  const diameter = Math.min(width, 980);
  const maxFont = config.fontSize * (config.level >= 17 ? 1.45 : 1);
  const outerRadius = Math.max(40, diameter / 2 - maxFont * 1.3 - 18);
  const innerRadius = Math.min(outerRadius, Math.max(maxFont * 1.6, diameter * 0.12));
  const radii = [];
  let radius = outerRadius;
  while (radius >= innerRadius) {
    radii.push(radius);
    radius -= maxFont * (config.level >= 12 ? 2.4 : 1.65) + lineSpacing(config, radii.length - 1);
  }
  if (!radii.length) radii.push(outerRadius);
  const discPitch = diameter + config.fontSize * 1.8;
  let firstDisc = 0, lineIndex = 0;
  paragraphs.forEach((units, paragraphIndex) => {
    const group = readingElement("g", { "data-paragraph": paragraphIndex });
    const lines = layoutReadingParagraph(units, index => ({
      capacity: 2 * Math.PI * radii[index % radii.length] - maxFont * 1.5,
      radius: radii[index % radii.length], disc: firstDisc + Math.floor(index / radii.length),
    }), config.splitWords);
    for (const line of lines) {
      const centerX = width / 2, centerY = line.slot.disc * discPitch + diameter / 2;
      const row = readingElement("g", { "data-line": lineIndex, "data-radius": line.slot.radius, "data-disc": line.slot.disc });
      const wobble = config.level >= 10 ? (readingNoise(paragraphIndex, lineIndex, 21) - 0.5) * (config.level >= 11 ? 5 : 2) : 0;
      for (const glyph of line.glyphs) {
        const theta = -Math.PI / 2 + (glyph.offset + glyph.width / 2) / line.slot.radius;
        const r = line.slot.radius - glyph.wordShift - glyph.letterShift;
        const x = centerX + Math.cos(theta) * r, y = centerY + Math.sin(theta) * r;
        drawReadingGlyph(row, glyph, x, y, theta * 180 / Math.PI + 90 + wobble + glyph.wordAngle + glyph.letterAngle, config, true);
      }
      group.appendChild(row);
      lineIndex++;
    }
    firstDisc += Math.ceil(lines.length / radii.length);
    fragment.appendChild(group);
  });
  return { fragment, height: Math.ceil(firstDisc * discPitch) };
}

function renderReading(resetScroll = false) {
  if (!readingState.active) return;
  const scrollRatio = window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const width = Math.max(180, Math.floor(readingSvg.getBoundingClientRect().width));
  const config = readingConfig(readingState.level);
  const paragraphs = readingParagraphs(config, readingState.mode);
  const result = readingState.mode === "circular" ? drawCircularReading(paragraphs, config, width) : drawLinearReading(paragraphs, config, width);
  readingSvg.setAttribute("viewBox", `0 0 ${width} ${result.height}`);
  readingSvg.setAttribute("height", result.height);
  readingSvg.replaceChildren(result.fragment);
  readingState.lastWidth = width;
  window.scrollTo(0, resetScroll ? 0 : scrollRatio * Math.max(0, document.documentElement.scrollHeight - innerHeight));
}

function updateReadingSettings() {
  const level = Number(readingLevelInput.value);
  document.getElementById("levelTag").textContent = `Niveau ${level} / 21`;
  document.getElementById("levelHeading").textContent = readingLevelInput.selectedOptions[0].textContent.replace(/^\d+ — /u, "");
  document.getElementById("levelDescription").textContent = READING_DESCRIPTIONS[level - 1];
  document.getElementById("modeDescription").textContent = READING_MODES[readingModeInput.value].description;
}

function startReading() {
  readingState.level = Number(readingLevelInput.value);
  readingState.mode = readingModeInput.value;
  readingState.active = true;
  document.getElementById("readingMenu").hidden = true;
  document.getElementById("readingScreen").hidden = false;
  document.body.classList.add("reading-active");
  document.getElementById("readingSession").textContent = `Niveau ${readingState.level} / 21 · ${READING_MODES[readingState.mode].label}`;
  document.getElementById("readingHint").textContent = READING_MODES[readingState.mode].description + " ↓ pour défiler · M ou Échap pour les réglages.";
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  renderReading(true);
}

function returnReadingMenu() {
  readingState.active = false;
  cancelAnimationFrame(readingState.renderFrame);
  document.getElementById("readingScreen").hidden = true;
  document.getElementById("readingMenu").hidden = false;
  document.body.classList.remove("reading-active");
  window.scrollTo(0, 0);
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  document.getElementById("startReading").focus();
}

SOURCE_PARAGRAPHS.forEach(text => {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  document.getElementById("readingAccessible").appendChild(paragraph);
});
readingLevelInput.addEventListener("change", updateReadingSettings);
readingModeInput.addEventListener("change", updateReadingSettings);
document.getElementById("startReading").addEventListener("click", startReading);
document.getElementById("readingBack").addEventListener("click", returnReadingMenu);
document.getElementById("readingBackBottom").addEventListener("click", returnReadingMenu);
document.getElementById("readingFullscreen").addEventListener("click", () => {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
});
document.addEventListener("keydown", event => {
  if (!readingState.active || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === "Escape" || event.key.toLowerCase() === "m") {
    event.preventDefault();
    event.stopPropagation();
    returnReadingMenu();
  } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    window.scrollBy(0, Math.max(64, innerHeight * 0.16) * (event.key === "ArrowDown" ? 1 : -1));
  }
});
new ResizeObserver(() => {
  if (!readingState.active || Math.abs(readingSvg.getBoundingClientRect().width - readingState.lastWidth) < 1) return;
  cancelAnimationFrame(readingState.renderFrame);
  readingState.renderFrame = requestAnimationFrame(() => renderReading());
}).observe(document.getElementById("readingSheet"));
updateReadingSettings();
