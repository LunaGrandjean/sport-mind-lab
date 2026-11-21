import { calibration, makeRound, cupLabel, parseAnswer, gradeAnswer } from "./bonneteau-core.js";
import { drawBoard } from "./bonneteau-render.js";

const ids = [
  "menu",
  "settingsForm",
  "ballCount",
  "cupCount",
  "level",
  "durationHint",
  "menuFullscreen",
  "game",
  "phaseTitle",
  "roundInfo",
  "pauseButton",
  "fullscreenButton",
  "settingsButton",
  "stage",
  "board",
  "pauseOverlay",
  "phaseHint",
  "launchButton",
  "answerForm",
  "answer",
  "answerHint",
  "answerError",
  "replayControls",
  "replaySpeed",
  "replaySeek",
  "replayTime",
  "backCorrection",
  "correction",
  "correctionSettings",
  "correctionInfo",
  "summary",
  "sameLevel",
  "nextLevel",
  "replayButton",
  "correctionBoard",
  "correctionList",
];
const ui = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const PREVIEW = 3,
  COVER = 0.8,
  MIX_START = PREVIEW + COVER;
export const app = {
  phase: "menu",
  round: null,
  elapsed: 0,
  stamp: 0,
  raf: 0,
  paused: false,
  starting: false,
  rate: 0.25,
  numbers: [],
  grade: null,
  wasFullscreen: false,
  manualExit: false,
};
const cancelFrame = () => {
  cancelAnimationFrame(app.raf);
  app.raf = 0;
};
const active = () => ["preview", "cover", "mixing", "replay"].includes(app.phase);
const total = () => MIX_START + app.round.duration;
const clockTime = () =>
  app.elapsed +
  (!app.paused && active()
    ? ((performance.now() - app.stamp) / 1000) * (app.phase === "replay" ? app.rate : 1)
    : 0);
const numbersText = (numbers) => numbers.map(cupLabel).join(" · ");

function settingsHint() {
  ui.cupCount.setCustomValidity(
    Number(ui.ballCount.value) >= Number(ui.cupCount.value)
      ? "Choisir plus de gobelets que de balles pour garder au moins un gobelet vide."
      : "",
  );
  ui.level.setCustomValidity("");
  try {
    ui.durationHint.textContent = `Niveau ${ui.level.value} : ${calibration(Number(ui.level.value)).duration} secondes de mélange.`;
  } catch {
    ui.level.setCustomValidity("Choisir un niveau entier positif.");
    ui.durationHint.textContent = "Choisir un niveau entier positif.";
  }
}

function setPhase(phase) {
  app.phase = phase;
  const isGame = !["menu", "correction"].includes(phase);
  ui.menu.hidden = phase !== "menu";
  ui.game.hidden = !isGame;
  ui.correction.hidden = phase !== "correction";
  document.body.classList.toggle("running", isGame);
  document.body.dataset.phase = phase;
  ui.launchButton.hidden = phase !== "ready";
  ui.answerForm.hidden = phase !== "answer";
  ui.replayControls.hidden = phase !== "replay";
  ui.pauseButton.hidden = !active();
  ui.pauseOverlay.hidden = !app.paused || !isGame;
  ui.pauseButton.textContent = app.paused ? "Reprendre" : "Pause";
  ui.phaseTitle.textContent =
    {
      ready: "Prêt",
      preview: "Mémorisez les balles",
      cover: "Les gobelets se referment",
      mixing: "Suivez les gobelets",
      answer: "À vous de répondre",
      replay: "Relecture",
    }[phase] || "";
  if (app.round)
    ui.roundInfo.textContent = `Niveau ${app.round.level} · ${app.round.balls} balle${app.round.balls > 1 ? "s" : ""} · ${app.round.cups} gobelets · ${app.round.duration} s de mélange`;
}

async function enterFullscreen() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* La manche reste utilisable dans la fenêtre. */
    }
  }
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) return enterFullscreen();
  app.manualExit = true;
  try {
    await document.exitFullscreen();
  } catch {
    app.manualExit = false;
  }
}

export async function prepare(next = false) {
  if (app.starting) return;
  if (next) ui.level.value = String(Number(ui.level.value) + 1);
  settingsHint();
  if (!ui.settingsForm.reportValidity()) return;
  app.starting = true;
  cancelFrame();
  try {
    await enterFullscreen();
    app.elapsed = 0;
    app.paused = false;
    app.numbers = [];
    app.grade = null;
    setPhase("ready");
    app.round = makeRound(
      {
        balls: Number(ui.ballCount.value),
        cups: Number(ui.cupCount.value),
        level: Number(ui.level.value),
      },
      Math.max(240, ui.stage.clientWidth),
      Math.max(160, ui.stage.clientHeight),
    );
    setPhase("ready");
    ui.phaseHint.textContent =
      "Espace pour découvrir les balles pendant 3 secondes, puis suivre le mélange.";
    ui.answer.value = "";
    ui.answerError.textContent = "";
    ui.answer.removeAttribute("aria-invalid");
    ui.answer.maxLength = app.round.balls * 2;
    ui.answer.placeholder = Array.from({ length: app.round.balls }, (_, i) => cupLabel(i + 1)).join(
      "",
    );
    ui.answerHint.textContent = `${app.round.balls} numéro${app.round.balls > 1 ? "s" : ""} à deux chiffres, sans espace. L’ordre ne compte pas.`;
    drawCurrent();
    ui.launchButton.focus({ preventScroll: true });
  } finally {
    app.starting = false;
  }
}

function drawCurrent() {
  if (!app.round) return;
  if (app.phase === "correction") {
    drawBoard(ui.correctionBoard, app.round, app.round.duration, {
      raised: 1,
      labels: true,
      reveal: true,
      selected: app.numbers,
    });
    return;
  }
  if (ui.game.hidden) return;
  const time = Math.min(clockTime(), total());
  const mixTime = Math.max(0, time - MIX_START);
  const raised =
    app.phase === "preview"
      ? 1
      : app.phase === "cover"
        ? Math.max(0, 1 - (time - PREVIEW) / COVER)
        : 0;
  drawBoard(ui.board, app.round, mixTime, {
    raised,
    labels: app.phase === "answer" || (app.phase === "replay" && time >= total()),
    reveal: app.phase === "preview" || app.phase === "cover",
    xray: app.phase === "replay",
  });
}

function tick(now) {
  app.raf = 0;
  if (app.paused || !active()) return;
  const replay = app.phase === "replay";
  app.elapsed = Math.min(
    total(),
    app.elapsed + ((now - app.stamp) / 1000) * (replay ? app.rate : 1),
  );
  app.stamp = now;
  if (replay) {
    ui.replaySeek.value = String(Math.round((app.elapsed / total()) * 1000));
    ui.replayTime.textContent = `${app.elapsed.toFixed(1)} s`;
    if (app.elapsed >= total()) {
      app.paused = true;
      setPhase("replay");
      drawCurrent();
      return;
    }
  } else if (app.elapsed >= total()) {
    setPhase("answer");
    ui.phaseHint.textContent =
      "Le mélange est terminé. Indiquez les gobelets contenant une balle, avec deux chiffres par numéro et sans espace.";
    drawCurrent();
    ui.answer.focus({ preventScroll: true });
    return;
  } else if (app.elapsed >= MIX_START) {
    if (app.phase !== "mixing") setPhase("mixing");
    ui.phaseHint.textContent = `Mélange : ${Math.max(0, app.round.duration - (app.elapsed - MIX_START)).toFixed(1)} s restantes. Les balles restent dans leurs gobelets.`;
  } else if (app.elapsed >= PREVIEW) {
    if (app.phase !== "cover") setPhase("cover");
    ui.phaseHint.textContent = "Les balles sont recouvertes. Gardez leurs gobelets en vue.";
  }
  drawCurrent();
  app.raf = requestAnimationFrame(tick);
}

function launch() {
  if (app.phase !== "ready") return;
  app.elapsed = 0;
  app.paused = false;
  app.stamp = performance.now();
  setPhase("preview");
  ui.phaseHint.textContent =
    "Mémorisez les gobelets qui recouvrent une balle. Vous avez 3 secondes.";
  document.activeElement?.blur();
  drawCurrent();
  app.raf = requestAnimationFrame(tick);
}

function pause() {
  if (!active()) return;
  if (app.paused) {
    if (app.elapsed >= total()) app.elapsed = 0;
    app.paused = false;
    app.stamp = performance.now();
    app.raf = requestAnimationFrame(tick);
  } else {
    app.elapsed = Math.min(clockTime(), total());
    app.paused = true;
    cancelFrame();
  }
  setPhase(app.phase);
  drawCurrent();
}

function correction() {
  cancelFrame();
  app.paused = false;
  setPhase("correction");
  const { correct, found, missed, extra } = app.grade;
  ui.correctionInfo.textContent = `Niveau ${app.round.level} · ${app.round.balls} balle${app.round.balls > 1 ? "s" : ""} · ${app.round.cups} gobelets · ${app.round.duration} secondes de mélange`;
  ui.summary.replaceChildren();
  const title = document.createElement("strong");
  title.className = correct ? "success" : "failure";
  title.textContent = correct
    ? "Tous les gobelets ont été retrouvés !"
    : `${found.length} balle${found.length > 1 ? "s" : ""} retrouvée${found.length > 1 ? "s" : ""} sur ${app.round.balls}`;
  ui.summary.append(title);
  for (const text of [
    `Votre réponse : ${numbersText(app.numbers)}.`,
    `Réponse attendue : ${numbersText(app.round.answers)}.`,
    ...(missed.length ? [`Balles oubliées : ${numbersText(missed)}.`] : []),
    ...(extra.length ? [`Gobelets vides sélectionnés : ${numbersText(extra)}.`] : []),
  ]) {
    const p = document.createElement("p");
    p.textContent = text;
    ui.summary.append(p);
  }
  ui.correctionList.replaceChildren();
  for (let slot = 1; slot <= app.round.cups; slot++) {
    const li = document.createElement("li");
    li.textContent = `${cupLabel(slot)} · ${app.round.answers.includes(slot) ? "Balle" : "Vide"}${app.numbers.includes(slot) ? " · sélectionné" : ""}`;
    if (found.includes(slot)) li.style.color = "#13733f";
    if (extra.includes(slot)) li.style.color = "#b4273c";
    if (missed.includes(slot)) li.style.color = "#946000";
    ui.correctionList.append(li);
  }
  drawCurrent();
  window.scrollTo(0, 0);
}

function replay() {
  cancelFrame();
  app.elapsed = 0;
  app.paused = false;
  app.rate = Number(ui.replaySpeed.value);
  app.stamp = performance.now();
  setPhase("replay");
  ui.replaySeek.value = "0";
  ui.replayTime.textContent = "0.0 s";
  ui.phaseHint.textContent =
    "Gobelets transparents : suivez les balles pendant le même mélange, sans nouveau tirage.";
  drawCurrent();
  app.raf = requestAnimationFrame(tick);
}

function menu() {
  cancelFrame();
  app.paused = false;
  setPhase("menu");
  if (document.fullscreenElement) {
    app.manualExit = true;
    document.exitFullscreen?.().catch(() => {});
  }
  ui.ballCount.focus({ preventScroll: true });
}

ui.settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  prepare();
});
for (const input of [ui.ballCount, ui.cupCount, ui.level])
  input.addEventListener("input", settingsHint);
ui.launchButton.addEventListener("click", launch);
ui.pauseButton.addEventListener("click", pause);
for (const button of [ui.settingsButton, ui.correctionSettings])
  button.addEventListener("click", menu);
for (const button of [ui.menuFullscreen, ui.fullscreenButton])
  button.addEventListener("click", toggleFullscreen);
ui.answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (app.phase !== "answer") return;
  const parsed = parseAnswer(ui.answer.value, app.round.cups, app.round.balls);
  if (parsed.error) {
    ui.answerError.textContent = parsed.error;
    ui.answer.setAttribute("aria-invalid", "true");
    ui.answer.focus();
    return;
  }
  app.numbers = parsed.numbers;
  app.grade = gradeAnswer(app.round, app.numbers);
  correction();
});
ui.answer.addEventListener("input", () => {
  ui.answerError.textContent = "";
  ui.answer.removeAttribute("aria-invalid");
});
ui.sameLevel.addEventListener("click", () => prepare());
ui.nextLevel.addEventListener("click", () => prepare(true));
ui.replayButton.addEventListener("click", replay);
ui.backCorrection.addEventListener("click", correction);
ui.replaySpeed.addEventListener("change", () => {
  app.elapsed = clockTime();
  app.stamp = performance.now();
  app.rate = Number(ui.replaySpeed.value);
});
ui.replaySeek.addEventListener("input", () => {
  if (app.phase !== "replay") return;
  app.elapsed = (Number(ui.replaySeek.value) / 1000) * total();
  app.stamp = performance.now();
  ui.replayTime.textContent = `${app.elapsed.toFixed(1)} s`;
  drawCurrent();
});
document.addEventListener("keydown", (event) => {
  const editing = event.target instanceof Element && event.target.closest("input,select,textarea");
  if (event.key === "Escape" || (!editing && event.key.toLowerCase() === "m")) {
    if (app.phase !== "menu") {
      event.preventDefault();
      menu();
    }
    return;
  }
  if (editing || event.repeat) return;
  if (event.key.toLowerCase() === "p") {
    event.preventDefault();
    pause();
    return;
  }
  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    toggleFullscreen();
    return;
  }
  if (event.target instanceof Element && event.target.closest("button")) return;
  if (event.code === "Space" && app.phase === "ready") {
    event.preventDefault();
    launch();
  } else if (event.code === "Space" && app.phase === "replay") {
    event.preventDefault();
    pause();
  }
});
document.addEventListener("fullscreenchange", () => {
  const full = Boolean(document.fullscreenElement);
  for (const button of [ui.menuFullscreen, ui.fullscreenButton])
    button.textContent = full ? "Quitter le plein écran" : "Plein écran";
  if (app.wasFullscreen && !full && !app.manualExit && app.phase !== "menu") menu();
  app.wasFullscreen = full;
  app.manualExit = false;
  drawCurrent();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && active() && !app.paused) pause();
});
new ResizeObserver(drawCurrent).observe(ui.stage);
window.addEventListener("resize", drawCurrent);
window.addEventListener("pagehide", cancelFrame);
settingsHint();
