"use strict";

const EMOTIONS = ["Joie", "Colère", "Neutre", "Tristesse", "Dégoût", "Mépris", "Peur", "Anxiété", "Surprise", "Frustration"];
const PEOPLE = ["planche-originale-1", "planche-originale-2", "planche-originale-3"];
// Pixel windows in the original boards supplied in the chat. Keep only the face,
// excluding the emotion captions, colored bands and surrounding white margins.
const PORTRAIT_SHEETS = [
  {width: 1179, height: 1166, cropWidth: 210, cropHeight: 315, columns: [31, 259, 491, 724, 951], rows: [150, 680]},
  {width: 1179, height: 800, cropWidth: 150, cropHeight: 225, columns: [182, 346, 514, 683, 847], rows: [90, 468]},
  {width: 1179, height: 846, cropWidth: 150, cropHeight: 225, columns: [182, 346, 514, 683, 847], rows: [110, 485]},
];
const MODE_NAMES = {same: "Même personne", different: "Personnes différentes", identify: "Identifier l’émotion"};
const MAX_LEVEL = 70;
const ui = Object.fromEntries([
  "menu", "settingsForm", "mode", "startLevel", "background", "fullscreen", "durationPreview",
  "menuPreview", "startButton", "loadStatus", "retryLoading", "exercise", "levelInfo", "sessionInfo",
  "faceLayer", "fixation", "errorCross", "phaseHint", "pairAnswers", "emotionAnswers", "menuButton",
  "summary", "resultTitle", "resultSummary", "resultDetails", "corrections", "restartButton", "settingsButton",
].map(id => [id, document.getElementById(id)]));

const app = {
  phase: "menu", ready: false, loading: false, token: 0, timer: null, frame: null,
  mode: "same", level: 1, startLevel: 1, errors: [], answers: 0, trial: null, previous: "",
};

function exposureForLevel(level) {
  return Math.round(3000 - (level - 1) * (3000 - 30) / (MAX_LEVEL - 1));
}

function formatDuration(milliseconds) {
  return milliseconds >= 1000
    ? `${(milliseconds / 1000).toLocaleString("fr-FR", {maximumFractionDigits: 3})} s`
    : `${milliseconds} ms`;
}

function selectedLevel() {
  const value = ui.startLevel.valueAsNumber;
  return Number.isFinite(value) ? Math.max(1, Math.min(MAX_LEVEL, Math.trunc(value))) : 1;
}

function updateDurationPreview() {
  const level = selectedLevel();
  ui.durationPreview.textContent = `Niveau ${level} · apparition de ${formatDuration(exposureForLevel(level))}`;
}

function createPortrait(face, accessible = false) {
  const portrait = document.createElement("div");
  portrait.className = "portrait";
  const sheet = PORTRAIT_SHEETS[face.person];
  const x = sheet.columns[face.emotion % 5];
  const y = sheet.rows[Math.floor(face.emotion / 5)];
  portrait.style.backgroundImage = `url("./emotions/${PEOPLE[face.person]}.png")`;
  portrait.style.backgroundSize = `${sheet.width / sheet.cropWidth * 100}% ${sheet.height / sheet.cropHeight * 100}%`;
  portrait.style.backgroundPosition = `${x / (sheet.width - sheet.cropWidth) * 100}% ${y / (sheet.height - sheet.cropHeight) * 100}%`;
  if (accessible) {
    portrait.setAttribute("role", "img");
    portrait.setAttribute("aria-label", `Expression : ${EMOTIONS[face.emotion]}`);
  }
  return portrait;
}

async function preloadPortraits() {
  if (app.loading) return;
  app.loading = true;
  app.ready = false;
  ui.startButton.disabled = true;
  ui.retryLoading.hidden = true;
  ui.loadStatus.textContent = "Chargement des portraits…";
  try {
    await Promise.all(PEOPLE.map(async person => {
      const image = new Image();
      image.src = `./emotions/${person}.png`;
      await image.decode();
    }));
    app.ready = true;
    ui.menuPreview.replaceChildren(...PEOPLE.map((_, person) => createPortrait({person, emotion: 0})));
    ui.loadStatus.textContent = "30 portraits prêts · 10 émotions · 3 personnes";
    ui.startButton.disabled = false;
  } catch {
    ui.loadStatus.textContent = "Les portraits n’ont pas pu être chargés. Réessayez avant de commencer.";
    ui.retryLoading.hidden = false;
  } finally {
    app.loading = false;
  }
}

function cancelPending() {
  app.token += 1;
  clearTimeout(app.timer);
  cancelAnimationFrame(app.frame);
  app.timer = null;
  app.frame = null;
}

function later(callback, milliseconds) {
  const token = app.token;
  app.timer = setTimeout(() => {
    if (token === app.token) callback();
  }, milliseconds);
}

function setPhase(phase) {
  app.phase = phase;
  ui.exercise.dataset.phase = phase;
  ui.faceLayer.hidden = phase !== "stimulus";
  ui.errorCross.hidden = phase !== "feedback";
  ui.fixation.hidden = phase === "feedback" || (phase === "stimulus" && app.mode === "identify");
  ui.pairAnswers.hidden = phase !== "answer" || app.mode === "identify";
  ui.emotionAnswers.hidden = phase !== "answer" || app.mode !== "identify";
}

function randomIndex(length) {
  return Math.floor(Math.random() * length);
}

function newTrial() {
  let trial;
  let signature;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const left = {person: randomIndex(PEOPLE.length), emotion: randomIndex(EMOTIONS.length)};
    let right = null;
    if (app.mode !== "identify") {
      const match = Math.random() < .5;
      right = {
        person: app.mode === "same" ? left.person : (left.person + 1 + randomIndex(PEOPLE.length - 1)) % PEOPLE.length,
        emotion: match ? left.emotion : (left.emotion + 1 + randomIndex(EMOTIONS.length - 1)) % EMOTIONS.length,
      };
    }
    trial = {level: app.level, duration: exposureForLevel(app.level), left, right};
    signature = JSON.stringify([left, right]);
    if (signature !== app.previous) break;
  }
  app.previous = signature;
  return trial;
}

function updateSessionInfo() {
  ui.levelInfo.textContent = `Niveau ${app.level} / ${MAX_LEVEL} · ${formatDuration(exposureForLevel(app.level))}`;
  ui.sessionInfo.textContent = `${MODE_NAMES[app.mode]} · ${app.errors.length} / 2 erreurs`;
}

function beginTrial() {
  cancelPending();
  app.trial = newTrial();
  updateSessionInfo();
  const left = createPortrait(app.trial.left);
  left.classList.add(app.mode === "identify" ? "center-face" : "left-face");
  ui.faceLayer.replaceChildren(left);
  if (app.trial.right) {
    const right = createPortrait(app.trial.right);
    right.classList.add("right-face");
    ui.faceLayer.append(right);
  }
  setPhase("ready");
  ui.phaseHint.textContent = app.mode === "identify" ? "Regardez le centre. Le visage va apparaître." : "Fixez la croix au centre. Les visages vont apparaître.";
  later(showStimulus, 800);
}

function showStimulus() {
  setPhase("stimulus");
  ui.phaseHint.textContent = app.mode === "identify" ? "Mémorisez l’expression." : "Gardez les yeux sur la croix centrale.";
  // Start measuring after a paint opportunity, so the first image frame is included.
  const token = app.token;
  app.frame = requestAnimationFrame(() => {
    if (token !== app.token) return;
    later(() => {
      setPhase("answer");
      ui.phaseHint.textContent = app.mode === "identify"
        ? "Quelle émotion avez-vous vue ?"
        : "Même émotion ? X = oui · N = non";
    }, app.trial.duration);
  });
}

function answer(value) {
  if (app.phase !== "answer") return;
  if (app.mode === "identify" ? !Number.isInteger(value) || value < 0 || value >= EMOTIONS.length : typeof value !== "boolean") return;
  const correct = app.mode === "identify"
    ? value === app.trial.left.emotion
    : value === (app.trial.left.emotion === app.trial.right.emotion);
  cancelPending();
  app.answers += 1;
  if (!correct) {
    app.errors.push({...app.trial, answer: value});
    updateSessionInfo();
    setPhase("feedback");
    ui.phaseHint.textContent = `Réponse incorrecte · ${app.errors.length} / 2 erreurs`;
    later(advance, 900);
  } else {
    advance();
  }
}

function advance() {
  if (app.errors.length >= 2 || app.level >= MAX_LEVEL) {
    finish();
    return;
  }
  app.level += 1;
  beginTrial();
}

function addCorrection(error, index) {
  const card = document.createElement("article");
  card.className = "correction";
  const title = document.createElement("h3");
  title.textContent = `Erreur ${index + 1} · niveau ${error.level} · ${formatDuration(error.duration)}`;
  const faces = document.createElement("div");
  faces.className = "correction-faces";
  [error.left, error.right].filter(Boolean).forEach((face, faceIndex) => {
    const figure = document.createElement("figure");
    const caption = document.createElement("figcaption");
    caption.textContent = `${error.right ? (faceIndex === 0 ? "À gauche" : "À droite") : "Au centre"} : ${EMOTIONS[face.emotion]}`;
    figure.append(createPortrait(face, true), caption);
    faces.append(figure);
  });
  const given = document.createElement("p");
  const expected = document.createElement("p");
  const givenLabel = document.createElement("strong");
  givenLabel.className = "given-answer";
  givenLabel.textContent = error.right ? (error.answer ? "Même émotion" : "Émotions différentes") : EMOTIONS[error.answer];
  given.append("Réponse donnée : ", givenLabel);
  const expectedLabel = document.createElement("strong");
  expectedLabel.textContent = error.right
    ? (error.left.emotion === error.right.emotion ? "Même émotion" : "Émotions différentes")
    : EMOTIONS[error.left.emotion];
  expected.append("Réponse attendue : ", expectedLabel);
  card.append(title, faces, given, expected);
  return card;
}

function finish() {
  cancelPending();
  setPhase("results");
  ui.exercise.hidden = true;
  ui.summary.hidden = false;
  document.body.classList.remove("exercise-open");
  ui.resultTitle.textContent = app.errors.length >= 2 ? "Session terminée · 2 erreurs" : "Niveau 70 terminé";
  ui.resultSummary.textContent = `Niveau d’arrêt : ${app.level} / ${MAX_LEVEL} · apparition de ${formatDuration(exposureForLevel(app.level))}`;
  ui.resultDetails.textContent = `${MODE_NAMES[app.mode]} · départ au niveau ${app.startLevel} · ${app.answers - app.errors.length} bonnes réponses sur ${app.answers} · ${app.errors.length} erreur${app.errors.length > 1 ? "s" : ""}`;
  ui.corrections.replaceChildren(...app.errors.map(addCorrection));
  if (!app.errors.length) ui.corrections.textContent = "Aucune erreur à corriger. Bravo !";
  window.scrollTo(0, 0);
  ui.restartButton.focus({preventScroll: true});
}

async function startSession() {
  if (!app.ready || !["menu", "results"].includes(app.phase)) return;
  cancelPending();
  setPhase("starting");
  const token = app.token;
  app.mode = ui.mode.value;
  app.startLevel = selectedLevel();
  app.level = app.startLevel;
  ui.startLevel.value = String(app.startLevel);
  app.errors = [];
  app.answers = 0;
  app.previous = "";
  document.body.style.setProperty("--exercise-bg", ui.background.value === "black" ? "#000" : "#fff");
  document.body.style.setProperty("--exercise-fg", ui.background.value === "black" ? "#fff" : "#0f172a");
  if (ui.fullscreen.checked && !document.fullscreenElement) {
    try { await document.documentElement.requestFullscreen(); } catch { /* The exercise also works inside its frame. */ }
  }
  if (token !== app.token) return;
  ui.menu.hidden = true;
  ui.summary.hidden = true;
  ui.exercise.hidden = false;
  document.body.classList.add("exercise-open");
  document.activeElement?.blur();
  beginTrial();
}

function returnToMenu(message) {
  cancelPending();
  setPhase("menu");
  app.trial = null;
  ui.faceLayer.replaceChildren();
  ui.exercise.hidden = true;
  ui.summary.hidden = true;
  ui.menu.hidden = false;
  document.body.classList.remove("exercise-open");
  if (typeof message === "string") ui.loadStatus.textContent = message;
  else if (app.ready) ui.loadStatus.textContent = "30 portraits prêts · 10 émotions · 3 personnes";
  updateDurationPreview();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  ui.startButton.focus({preventScroll: true});
}

ui.settingsForm.addEventListener("submit", event => { event.preventDefault(); startSession(); });
ui.startLevel.addEventListener("input", updateDurationPreview);
ui.retryLoading.addEventListener("click", preloadPortraits);
ui.menuButton.addEventListener("click", returnToMenu);
ui.settingsButton.addEventListener("click", returnToMenu);
ui.restartButton.addEventListener("click", startSession);
ui.pairAnswers.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", () => answer(button.dataset.match === "true"));
});
EMOTIONS.forEach((emotion, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = emotion;
  button.addEventListener("click", () => answer(index));
  ui.emotionAnswers.append(button);
});
document.addEventListener("keydown", event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if ((key === "m" || key === "escape") && app.phase !== "menu") {
    event.preventDefault();
    returnToMenu();
  } else if (app.phase === "answer" && app.mode !== "identify" && (key === "x" || key === "n")) {
    event.preventDefault();
    answer(key === "x");
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && !["menu", "results"].includes(app.phase)) {
    returnToMenu("Session interrompue lors du changement d’onglet. Vous pouvez recommencer avec les mêmes réglages.");
  }
});
updateDurationPreview();
preloadPortraits();
