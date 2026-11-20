import {
  DIRECTIONS,
  clamp,
  makeConvergence,
  makeCrossings,
  makeTennis,
  scorePress,
  crossingSummary,
} from "./anticipation-trajectoires-core.js";
import { drawScene, OUTCOME_LABELS, OUTCOME_COLORS } from "./anticipation-trajectoires-render.js";

const ids = [
  "settingsPage",
  "settingsForm",
  "ballCount",
  "countHint",
  "level",
  "speed",
  "speedValue",
  "spacing",
  "spacingField",
  "direction",
  "directionField",
  "courtEdge",
  "courtField",
  "avoid",
  "avoidField",
  "modeInstructions",
  "startButton",
  "menuFullscreen",
  "gamePage",
  "phaseLabel",
  "trialLabel",
  "pauseButton",
  "fullscreenButton",
  "menuButton",
  "stage",
  "board",
  "pauseOverlay",
  "phaseHint",
  "readyControls",
  "launchButton",
  "choiceControls",
  "timingControls",
  "timingButton",
  "pressCount",
  "answerForm",
  "winnerCount",
  "replayControls",
  "replaySpeed",
  "replaySeek",
  "replayClock",
  "backCorrection",
  "correctionPage",
  "correctionMenu",
  "correctionSubtitle",
  "resultSummary",
  "slowReplay",
  "sameLevel",
  "nextLevel",
  "correctionDetails",
];
const ui = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const MODE_NAMES = { 1: "Première au centre", 2: "Passage au centre", 3: "Balles gagnantes" };
const COUNTS = { 1: [2, 20, 4], 2: [1, 10, 5], 3: [1, 30, 10] };
const counts = { 1: 4, 2: 5, 3: 10 };
const format = (value, digits = 2) =>
  value.toLocaleString("fr-FR", { maximumFractionDigits: digits });

export const app = {
  phase: "menu",
  menuMode: 1,
  trial: null,
  settings: null,
  elapsed: 0,
  lastStamp: 0,
  raf: 0,
  paused: false,
  presses: [],
  selectedId: null,
  tennisAnswer: null,
  view: null,
  miniDraws: [],
  starting: false,
  replayRate: 0.25,
  stopAt: 0,
  manualFullscreenExit: false,
  wasFullscreen: false,
};

for (const [value, name] of Object.entries(DIRECTIONS)) ui.direction.add(new Option(name, value));

function updateSettings(mode = app.menuMode) {
  counts[app.menuMode] = Number(ui.ballCount.value) || COUNTS[app.menuMode][2];
  app.menuMode = mode;
  const [min, max, initial] = COUNTS[mode];
  ui.ballCount.min = String(min);
  ui.ballCount.max = String(max);
  ui.ballCount.value = String(clamp(counts[mode] || initial, min, max));
  ui.countHint.textContent = `De ${min} à ${max} ${mode === 3 ? "balles de tennis" : "boules"}.`;
  ui.spacingField.hidden = mode === 1;
  ui.directionField.hidden = mode !== 2;
  ui.courtField.hidden = mode !== 3;
  ui.avoidField.hidden = mode !== 2;
  ui.modeInstructions.innerHTML = {
    1: "<p>Repérez les départs. Toutes les boules disparaissent quand la plus rapide a parcouru <strong>4/5 de son trajet</strong>. Les positions de départ reviennent : choisissez celle qui aurait atteint le cercle rouge en premier. Le niveau augmente la vitesse et réduit les écarts.</p>",
    2: "<p>Au niveau 1 et à 100 %, une traversée dure <strong>4 secondes</strong>, avec un passage au centre à 2 secondes. Appuyez une fois sur <strong>Espace</strong> quand le centre de la boule est dans le cercle rouge. Si une boule l’évite, ne répondez pas. Un appui maintenu ne compte qu’une fois.</p>",
    3: "<p>Les balles disparaissent <strong>à mi-parcours</strong>. Anticipez leur impact et la position future de la joueuse. Comptez uniquement celles qui atteindraient le terrain <strong>sans rencontrer la joueuse</strong>. Les zones claires, au-delà des lignes latérales, sont hors terrain.</p>",
  }[mode];
}

function readSettings() {
  ui.level.setCustomValidity("");
  if (!Number.isSafeInteger(Number(ui.level.value)))
    ui.level.setCustomValidity("Choisir un niveau entier positif.");
  if (!ui.settingsForm.reportValidity()) return null;
  return {
    mode: app.menuMode,
    count: Number(ui.ballCount.value),
    level: Number(ui.level.value),
    speed: Number(ui.speed.value) / 100,
    spacing: Number(ui.spacing.value),
    direction: ui.direction.value,
    edge: ui.courtEdge.value,
    avoid: ui.avoid.checked,
  };
}

function cancelFrame() {
  cancelAnimationFrame(app.raf);
  app.raf = 0;
}

function phase(name) {
  app.phase = name;
  document.body.dataset.phase = name;
  const game = !["menu", "correction"].includes(name);
  ui.settingsPage.hidden = name !== "menu";
  ui.gamePage.hidden = !game;
  ui.correctionPage.hidden = name !== "correction";
  document.body.classList.toggle("trajectory-running", game);
  ui.readyControls.hidden = name !== "ready";
  ui.choiceControls.hidden = name !== "choice";
  ui.timingControls.hidden = name !== "playing" || app.trial?.mode !== 2;
  ui.answerForm.hidden = name !== "answer";
  ui.replayControls.hidden = name !== "replay";
  ui.pauseButton.hidden = name !== "playing" && name !== "replay";
  ui.pauseOverlay.hidden = !app.paused || !game;
  ui.pauseButton.textContent = app.paused ? "Reprendre" : "Pause";
  ui.phaseLabel.textContent =
    {
      ready: "Prêt",
      playing: "Observez",
      choice: "À vous de choisir",
      answer: "À vous de compter",
      replay: "Relecture",
    }[name] || "";
  if (app.settings)
    ui.trialLabel.textContent = `${MODE_NAMES[app.settings.mode]} · Niveau ${app.settings.level} · ${app.settings.count} boule${app.settings.count > 1 ? "s" : ""}`;
}

async function enterFullscreen() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* L’exercice reste utilisable dans la fenêtre. */
    }
  }
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    app.manualFullscreenExit = true;
    try {
      await document.exitFullscreen();
    } catch {
      app.manualFullscreenExit = false;
    }
  } else await enterFullscreen();
}

export async function startTrial(next = false) {
  if (app.starting) return;
  if (next) ui.level.value = String(Number(ui.level.value) + 1);
  const settings = readSettings();
  if (!settings) return;
  app.starting = true;
  ui.startButton.disabled = true;
  cancelFrame();
  try {
    await enterFullscreen();
    app.settings = settings;
    app.paused = false;
    app.presses = [];
    app.selectedId = null;
    app.tennisAnswer = null;
    app.elapsed = 0;
    app.miniDraws = [];
    phase("ready");
    const width = Math.max(240, ui.stage.clientWidth),
      height = Math.max(160, ui.stage.clientHeight);
    app.trial = [null, makeConvergence, makeCrossings, makeTennis][settings.mode](
      settings,
      width,
      height,
    );
    ui.phaseHint.textContent =
      settings.mode === 1
        ? "Mémorisez les départs. Espace lance le déplacement."
        : settings.mode === 2
          ? "Fixez le cercle rouge. Espace lance la manche ; les appuis suivants servent à répondre."
          : "Observez le terrain et la joueuse. Espace lance les balles.";
    ui.pressCount.textContent = "0 appui";
    ui.choiceControls.replaceChildren();
    for (const ball of app.trial.balls) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(ball.id);
      button.setAttribute("aria-label", `Choisir la boule ${ball.id}`);
      button.addEventListener("click", () => chooseBall(ball.id));
      ui.choiceControls.append(button);
    }
    drawCurrent();
    ui.launchButton.focus({ preventScroll: true });
  } finally {
    app.starting = false;
    ui.startButton.disabled = false;
  }
}

function clockTime() {
  return app.paused || !["playing", "replay"].includes(app.phase)
    ? app.elapsed
    : app.elapsed +
        ((performance.now() - app.lastStamp) / 1000) *
          (app.phase === "replay" ? app.replayRate : 1);
}

function drawCurrent() {
  if (!app.trial || ui.gamePage.hidden) return;
  const time = ["playing", "replay"].includes(app.phase)
    ? Math.min(clockTime(), app.stopAt)
    : app.elapsed;
  const press = [...app.presses]
    .reverse()
    .find((entry) => time >= entry.time && time - entry.time < 0.18);
  app.view = drawScene(ui.board, app.trial, time, {
    ready: app.phase === "ready",
    starts: app.phase === "ready" || app.phase === "choice",
    reveal: app.phase === "replay",
    showPaths: app.phase === "replay",
    labels: app.phase === "replay",
    winnerId: app.phase === "replay" && app.trial.mode === 1 ? app.trial.winnerId : null,
    press: app.trial.mode === 2 ? press : null,
  });
}

function tick(now) {
  app.raf = 0;
  if (app.paused || !["playing", "replay"].includes(app.phase)) return;
  app.elapsed = Math.min(
    app.stopAt,
    app.elapsed + ((now - app.lastStamp) / 1000) * (app.phase === "replay" ? app.replayRate : 1),
  );
  app.lastStamp = now;
  if (app.phase === "playing") {
    if (app.trial.mode === 1 && app.elapsed >= app.trial.choiceAt) {
      app.elapsed = app.trial.hideAt;
      phase("choice");
      ui.phaseHint.textContent =
        "Les positions de départ sont revenues. Cliquez sur la boule qui aurait atteint le centre en premier, ou sur son numéro.";
      drawCurrent();
      return;
    }
    if (app.trial.mode === 1 && app.elapsed >= app.trial.hideAt) {
      ui.phaseLabel.textContent = "Trajectoires masquées";
      ui.phaseHint.textContent = "Toutes les boules ont disparu. Les départs vont réapparaître.";
    }
    if (app.elapsed >= app.trial.endAt) {
      if (app.trial.mode === 2) showCorrection();
      else {
        phase("answer");
        ui.phaseHint.textContent =
          "Toutes les balles ont terminé leur trajectoire. Combien auraient été gagnantes ?";
        ui.winnerCount.value = "";
        ui.winnerCount.max = String(app.settings.count);
        drawCurrent();
        ui.winnerCount.focus({ preventScroll: true });
      }
      return;
    }
  } else {
    ui.replaySeek.value = String(Math.round((app.elapsed / app.trial.endAt) * 1000));
    ui.replayClock.textContent = `${format(app.elapsed, 1)} s`;
    if (app.elapsed >= app.stopAt) {
      app.paused = true;
      phase("replay");
      drawCurrent();
      ui.phaseHint.textContent =
        "Relecture terminée. Revenez à la correction ou déplacez le curseur pour revoir un passage.";
      return;
    }
  }
  drawCurrent();
  app.raf = requestAnimationFrame(tick);
}

function launchMotion() {
  if (app.phase !== "ready") return;
  app.elapsed = 0;
  app.stopAt = app.trial.endAt;
  app.lastStamp = performance.now();
  app.paused = false;
  phase("playing");
  ui.phaseHint.textContent =
    app.trial.mode === 1
      ? "Suivez les boules jusqu’à leur disparition."
      : app.trial.mode === 2
        ? "Espace quand le centre d’une boule est dans le cercle rouge. Ne répondez pas à une boule qui l’évite."
        : "Comptez les futures balles gagnantes. La trajectoire disparaît à mi-parcours ; la joueuse continue à se déplacer.";
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  drawCurrent();
  app.raf = requestAnimationFrame(tick);
}

function recordPress() {
  if (app.phase !== "playing" || app.trial.mode !== 2 || app.paused) return;
  const time = clockTime();
  if (time > app.trial.endAt) return;
  const press = scorePress(app.trial, time, app.presses);
  app.presses.push(press);
  ui.pressCount.textContent = `${app.presses.length} appui${app.presses.length > 1 ? "s" : ""}`;
  ui.phaseHint.textContent = press.perfect
    ? `Parfait · boule ${press.ballId}`
    : `${press.reason} · appui hors de la zone parfaite`;
  drawCurrent();
}

function chooseBall(id) {
  if (app.phase !== "choice") return;
  app.selectedId = id;
  showCorrection();
}

function togglePause() {
  if (!["playing", "replay"].includes(app.phase)) return;
  if (!app.paused) {
    app.elapsed = Math.min(clockTime(), app.stopAt);
    app.paused = true;
    cancelFrame();
  } else {
    if (app.phase === "replay" && app.elapsed >= app.stopAt) {
      app.elapsed = 0;
      app.stopAt = app.trial.endAt;
    }
    app.paused = false;
    app.lastStamp = performance.now();
    app.raf = requestAnimationFrame(tick);
  }
  phase(app.phase);
  drawCurrent();
}

function addMini(parent, title, description, time, options, color = "") {
  const card = document.createElement("article");
  card.className = "detail-card";
  const heading = document.createElement("h2");
  heading.textContent = title;
  if (color) heading.style.color = color;
  const caption = document.createElement("p");
  caption.textContent =
    description + (options.centerDetail ? " Vue agrandie du cercle central." : "");
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${title}. ${description}`);
  card.append(heading, caption, canvas);
  parent.append(card);
  app.miniDraws.push(() => drawScene(canvas, app.trial, time, options));
  return card;
}

function grid() {
  const element = document.createElement("div");
  element.className = "detail-grid";
  ui.correctionDetails.append(element);
  return element;
}

function showCorrection() {
  cancelFrame();
  app.paused = false;
  phase("correction");
  app.miniDraws = [];
  ui.correctionDetails.replaceChildren();
  ui.correctionSubtitle.textContent = `${MODE_NAMES[app.trial.mode]} · Niveau ${app.settings.level} · ${app.settings.count} boule${app.settings.count > 1 ? "s" : ""}`;
  if (app.trial.mode === 1) {
    const correct = app.selectedId === app.trial.winnerId;
    ui.resultSummary.innerHTML = `<strong class="${correct ? "success" : "failure"}">${correct ? "Bonne anticipation !" : `La boule ${app.trial.winnerId} arrivait en premier.`}</strong><span>Votre choix : boule ${app.selectedId}. La bonne réponse est entourée en vert, votre choix en rouge s’il était différent.</span>`;
    const canvas = document.createElement("canvas");
    canvas.className = "overview-canvas";
    canvas.setAttribute("aria-label", "Positions de départ avec la bonne réponse et votre choix");
    ui.correctionDetails.append(canvas);
    app.miniDraws.push(() =>
      drawScene(canvas, app.trial, 0, {
        starts: true,
        winnerId: app.trial.winnerId,
        selectedId: app.selectedId,
        showPaths: true,
      }),
    );
    const table = document.createElement("table");
    table.className = "ranking-table";
    table.innerHTML =
      "<thead><tr><th>Ordre d’arrivée</th><th>Boule</th><th>Temps jusqu’au centre</th><th>Vitesse relative</th></tr></thead>";
    const tbody = document.createElement("tbody");
    const winner = app.trial.balls.find((ball) => ball.id === app.trial.winnerId);
    [...app.trial.balls]
      .sort((a, b) => a.arrival - b.arrival)
      .forEach((ball, index) => {
        const row = tbody.insertRow();
        if (index === 0) row.className = "success";
        [
          index + 1,
          `N° ${ball.id}`,
          `${format(ball.arrival)} s`,
          `${Math.round((ball.speed / winner.speed) * 100)} %`,
        ].forEach((text) => (row.insertCell().textContent = String(text)));
      });
    table.append(tbody);
    const scroll = document.createElement("div");
    scroll.className = "table-scroll";
    scroll.append(table);
    ui.correctionDetails.append(scroll);
  } else if (app.trial.mode === 2) {
    const summary = crossingSummary(app.trial, app.presses);
    ui.resultSummary.innerHTML = `<strong class="${summary.perfect === summary.targets && summary.falseAlarms === 0 ? "success" : "failure"}">${summary.perfect} passage${summary.perfect > 1 ? "s" : ""} parfait${summary.perfect > 1 ? "s" : ""} sur ${summary.targets}</strong><div class="stats"><span>${summary.missed} passage(s) manqué(s)</span><span>${summary.falseAlarms} appui(s) incorrect(s)</span>${summary.distractors ? `<span>${summary.inhibited} bonne(s) inhibition(s) sur ${summary.distractors}</span>` : ""}</div>`;
    const details = grid();
    app.presses.forEach((press, index) => {
      const description = `${press.ballId ? `Boule ${press.ballId} · ` : ""}${press.perfect ? "Dans le cercle" : press.reason} · ${Math.abs(press.offsetMs)} ms ${press.offsetMs < 0 ? "avant" : "après"} le passage central théorique.`;
      const card = addMini(
        details,
        `Appui ${index + 1} · ${press.perfect ? "Parfait" : "Incorrect"}`,
        description,
        press.time,
        { press, labels: true, centerDetail: true },
        press.perfect ? "#17834a" : "#c62c42",
      );
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Revoir cet appui";
      button.addEventListener("click", () =>
        startReplay(Math.max(0, press.time - 0.7), Math.min(app.trial.endAt, press.time + 0.8)),
      );
      card.append(button);
    });
    const matched = new Set(
      app.presses.filter((press) => press.perfect).map((press) => press.ballId),
    );
    for (const ball of app.trial.balls) {
      if (ball.crosses && !matched.has(ball.id))
        addMini(
          details,
          `Boule ${ball.id} · Passage manqué`,
          `Elle passait au centre à ${format(ball.centerAt)} s.`,
          ball.centerAt,
          { labels: true, centerDetail: true, press: { perfect: false } },
          "#c62c42",
        );
      if (!ball.crosses) {
        const inhibited = !app.presses.some((press) => press.ballId === ball.id);
        addMini(
          details,
          `Boule ${ball.id} · ${inhibited ? "Bonne inhibition" : "Évitement"}`,
          "Cette boule évitait le cercle : aucun appui n’était attendu.",
          ball.centerAt,
          { labels: true, showPaths: true },
          inhibited ? "#17834a" : "#c62c42",
        );
      }
    }
    if (!app.presses.length) {
      const note = document.createElement("p");
      note.className = "empty-note";
      note.textContent = summary.targets
        ? "Aucun appui enregistré. Les passages attendus sont montrés ci-dessous."
        : "Aucune boule ne passait au centre. Il fallait s’abstenir de répondre.";
      ui.correctionDetails.prepend(note);
    }
  } else {
    const totals = Object.fromEntries(
      Object.keys(OUTCOME_LABELS).map((key) => [
        key,
        app.trial.balls.filter((ball) => ball.outcome === key).length,
      ]),
    );
    ui.resultSummary.innerHTML = `<strong class="${app.tennisAnswer === app.trial.winners ? "success" : "failure"}">${app.tennisAnswer === app.trial.winners ? "Bon comptage !" : "Comptage à corriger"}</strong><span>Votre réponse : ${app.tennisAnswer}. Réponse attendue : ${app.trial.winners} balle(s) gagnante(s).</span><div class="stats"><span>${totals.winner} gagnante(s)</span><span>${totals.out} dehors</span><span>${totals.player} sur la joueuse</span></div>`;
    const details = grid();
    for (const ball of app.trial.balls)
      addMini(
        details,
        `Balle ${ball.id} · ${OUTCOME_LABELS[ball.outcome]}`,
        `Impact à ${format(ball.startAt + ball.duration)} s. La joueuse est montrée à sa position à cet instant.`,
        ball.startAt + ball.duration,
        { reveal: true, focusBall: ball },
        OUTCOME_COLORS[ball.outcome],
      );
  }
  for (const draw of app.miniDraws) draw();
  window.scrollTo(0, 0);
}

export function startReplay(from = 0, to = app.trial.endAt) {
  cancelFrame();
  app.elapsed = from;
  app.stopAt = to;
  app.paused = false;
  app.replayRate = Number(ui.replaySpeed.value);
  app.lastStamp = performance.now();
  phase("replay");
  ui.phaseHint.textContent =
    "Trajectoires complètes visibles. Le ralenti reprend exactement la manche et les positions de la joueuse.";
  ui.replaySeek.value = String((from / app.trial.endAt) * 1000);
  ui.replayClock.textContent = `${format(from, 1)} s`;
  drawCurrent();
  app.raf = requestAnimationFrame(tick);
}

function returnMenu() {
  cancelFrame();
  app.paused = false;
  phase("menu");
  if (document.fullscreenElement) {
    app.manualFullscreenExit = true;
    document.exitFullscreen?.().catch(() => {});
  }
  ui.startButton.focus({ preventScroll: true });
}

ui.settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  startTrial();
});
document
  .querySelectorAll('input[name="mode"]')
  .forEach((input) => input.addEventListener("change", () => updateSettings(Number(input.value))));
ui.level.addEventListener("input", () => ui.level.setCustomValidity(""));
ui.speed.addEventListener("input", () => {
  ui.speedValue.textContent = `${ui.speed.value} %`;
});
ui.launchButton.addEventListener("click", launchMotion);
ui.timingButton.addEventListener("click", recordPress);
ui.pauseButton.addEventListener("click", togglePause);
for (const button of [ui.menuButton, ui.correctionMenu])
  button.addEventListener("click", returnMenu);
for (const button of [ui.fullscreenButton, ui.menuFullscreen])
  button.addEventListener("click", toggleFullscreen);
ui.slowReplay.addEventListener("click", () => startReplay());
ui.sameLevel.addEventListener("click", () => startTrial());
ui.nextLevel.addEventListener("click", () => startTrial(true));
ui.backCorrection.addEventListener("click", showCorrection);
ui.answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (app.phase !== "answer" || !ui.answerForm.reportValidity()) return;
  app.tennisAnswer = Number(ui.winnerCount.value);
  showCorrection();
});
ui.board.addEventListener("pointerdown", (event) => {
  if (app.phase !== "choice" || !app.view) return;
  const { bounds, scale, offsetX, offsetY } = app.view;
  const point = {
    x: (event.clientX - bounds.left - offsetX) / scale,
    y: (event.clientY - bounds.top - offsetY) / scale,
  };
  const closest = [...app.trial.balls].sort(
    (a, b) =>
      Math.hypot(a.start.x - point.x, a.start.y - point.y) -
      Math.hypot(b.start.x - point.x, b.start.y - point.y),
  )[0];
  if (
    Math.hypot(closest.start.x - point.x, closest.start.y - point.y) <=
    Math.max(25 / scale, app.trial.radius * 2)
  )
    chooseBall(closest.id);
});
ui.replaySpeed.addEventListener("change", () => {
  if (app.phase !== "replay") return;
  app.elapsed = clockTime();
  app.lastStamp = performance.now();
  app.replayRate = Number(ui.replaySpeed.value);
});
ui.replaySeek.addEventListener("input", () => {
  if (app.phase !== "replay") return;
  app.elapsed = (Number(ui.replaySeek.value) / 1000) * app.trial.endAt;
  app.stopAt = app.trial.endAt;
  app.lastStamp = performance.now();
  ui.replayClock.textContent = `${format(app.elapsed, 1)} s`;
  drawCurrent();
});

document.addEventListener("keydown", (event) => {
  const editing = event.target instanceof Element && event.target.closest("input,select,textarea");
  if (event.code === "Escape" || (!editing && event.key.toLowerCase() === "m")) {
    if (app.phase !== "menu") {
      event.preventDefault();
      returnMenu();
    }
    return;
  }
  if (editing || event.repeat) return;
  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    toggleFullscreen();
    return;
  }
  if (event.key.toLowerCase() === "p") {
    event.preventDefault();
    togglePause();
    return;
  }
  if (event.target instanceof Element && event.target.closest("button")) return;
  if (event.key === "Enter" && app.phase === "correction") {
    event.preventDefault();
    startReplay();
    return;
  }
  if (event.code !== "Space") return;
  event.preventDefault();
  if (app.phase === "ready") launchMotion();
  else if (app.phase === "playing") recordPress();
  else if (app.phase === "correction") startTrial();
  else if (app.phase === "replay") togglePause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && !app.paused && ["playing", "replay"].includes(app.phase)) togglePause();
});
document.addEventListener("fullscreenchange", () => {
  const full = Boolean(document.fullscreenElement);
  for (const button of [ui.fullscreenButton, ui.menuFullscreen])
    button.textContent = full ? "Quitter le plein écran" : "Plein écran";
  if (app.wasFullscreen && !full && !app.manualFullscreenExit && app.phase !== "menu") returnMenu();
  app.wasFullscreen = full;
  app.manualFullscreenExit = false;
  drawCurrent();
});
new ResizeObserver(() => {
  drawCurrent();
}).observe(ui.stage);
window.addEventListener("resize", () => {
  drawCurrent();
  for (const draw of app.miniDraws) draw();
});
window.addEventListener("pagehide", cancelFrame);
updateSettings();
