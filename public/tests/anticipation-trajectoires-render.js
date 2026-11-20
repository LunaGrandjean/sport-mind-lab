import {
  clamp,
  convergencePosition,
  crossingPosition,
  courtPoint,
  playerAt,
  tennisPosition,
} from "./anticipation-trajectoires-core.js";

export const OUTCOME_LABELS = { winner: "Gagnante", out: "Dehors", player: "Sur la joueuse" };
export const OUTCOME_COLORS = { winner: "#17834a", out: "#c62c42", player: "#2563a6" };

function line(ctx, from, to, color = "#fff", width = 2, dash = []) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function ball(ctx, position, radius, color, label = "") {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "#ffffff55";
  ctx.arc(position.x - radius * 0.28, position.y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();
  if (label !== "") {
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.max(9, radius * 0.95)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(label), position.x, position.y + 0.5);
  }
}

function ring(ctx, trial, color = "#d42e44") {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.arc(trial.center.x, trial.center.y, trial.targetRadius, 0, Math.PI * 2);
  ctx.stroke();
}

function court(ctx, trial) {
  const { courtMin: min, courtMax: max, width, height } = trial;
  ctx.fillStyle = "#d8e6de";
  ctx.fillRect(0, 0, width, height);
  const corners = [
    courtPoint(trial, min, 0),
    courtPoint(trial, max, 0),
    courtPoint(trial, max, 1),
    courtPoint(trial, min, 1),
  ];
  ctx.beginPath();
  corners.forEach((point, index) =>
    index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y),
  );
  ctx.closePath();
  ctx.fillStyle = "#287d5d";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();
  for (const depth of [0.25, 0.75])
    line(ctx, courtPoint(trial, min, depth), courtPoint(trial, max, depth));
  line(ctx, courtPoint(trial, 0.5, 0.25), courtPoint(trial, 0.5, 0.75));
  line(ctx, courtPoint(trial, min, 0.5), courtPoint(trial, max, 0.5), "#f5fbff", 4, [9, 5]);
  line(ctx, courtPoint(trial, min, 1), courtPoint(trial, max, 1), "#fff", 5);
  ctx.fillStyle = "#315346";
  ctx.font = `600 ${Math.max(11, Math.min(width, height) / 42)}px Arial`;
  ctx.textAlign = "center";
  for (const lateral of [0.075, 0.925]) {
    const position = courtPoint(trial, lateral, 0.5);
    ctx.save();
    ctx.translate(position.x, position.y);
    if (trial.edge === "bottom" || trial.edge === "top") ctx.rotate(-Math.PI / 2);
    ctx.fillText("ZONE MORTE", 0, 0);
    ctx.restore();
  }
}

function player(ctx, trial, time) {
  const position = courtPoint(trial, playerAt(trial, time), 1);
  const reach =
    trial.reach * (trial.edge === "left" || trial.edge === "right" ? trial.height : trial.width);
  const size = clamp(reach / 30, 0.7, 1.4);
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.fillStyle = "#143b343b";
  ctx.beginPath();
  ctx.ellipse(0, 2, reach, 8 * size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate({ bottom: 0, top: Math.PI, left: Math.PI / 2, right: -Math.PI / 2 }[trial.edge]);
  ctx.scale(size, size);
  const stride = Math.sin(time * 10) * 4;
  ctx.lineCap = "round";
  line(ctx, { x: -6, y: -8 }, { x: -9 - stride, y: 3 }, "#e2a37b", 5);
  line(ctx, { x: 6, y: -8 }, { x: 10 + stride, y: 3 }, "#e2a37b", 5);
  line(ctx, { x: -12 - stride, y: 4 }, { x: -5 - stride, y: 4 }, "#fff", 4);
  line(ctx, { x: 7 + stride, y: 4 }, { x: 14 + stride, y: 4 }, "#fff", 4);
  ctx.beginPath();
  ctx.moveTo(-7, -21);
  ctx.lineTo(7, -21);
  ctx.lineTo(12, -7);
  ctx.lineTo(-12, -7);
  ctx.closePath();
  ctx.fillStyle = "#ec5c91";
  ctx.fill();
  line(ctx, { x: -8, y: -22 }, { x: -15, y: -12 }, "#e2a37b", 4);
  line(ctx, { x: 8, y: -22 }, { x: 18, y: -17 }, "#e2a37b", 4);
  line(ctx, { x: 18, y: -17 }, { x: 26, y: -24 }, "#d1ecf3", 3);
  ctx.beginPath();
  ctx.ellipse(31, -31, 7, 11, 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = "#b9f4ff";
  ctx.lineWidth = 3;
  ctx.stroke();
  line(ctx, { x: 25, y: -30 }, { x: 35, y: -30 }, "#ffffffbb", 1);
  line(ctx, { x: 31, y: -39 }, { x: 31, y: -23 }, "#ffffffbb", 1);
  ctx.beginPath();
  ctx.arc(0, -28, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#e2a37b";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -32, 7, Math.PI, Math.PI * 2);
  ctx.fillStyle = "#39281f";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-8, -31, 4, 8, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function impact(ctx, trial, currentBall) {
  const position = courtPoint(trial, currentBall.landing, 1);
  ctx.beginPath();
  ctx.strokeStyle = OUTCOME_COLORS[currentBall.outcome];
  ctx.lineWidth = 4;
  ctx.arc(position.x, position.y, trial.radius + 4, 0, Math.PI * 2);
  ctx.stroke();
  ball(ctx, position, trial.radius * 0.8, OUTCOME_COLORS[currentBall.outcome], currentBall.id);
}

/** Même géométrie et mêmes horloges pour le direct, les captures de correction et le ralenti. */
export function drawScene(canvas, trial, time, options = {}) {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, bounds.width),
    height = Math.max(1, bounds.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * dpr),
    pixelHeight = Math.round(height * dpr);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  const baseScale = Math.min(width / trial.width, height / trial.height);
  const scale = options.centerDetail ? Math.max(baseScale, 1) : baseScale;
  const offsetX = (width - trial.width * scale) / 2,
    offsetY = (height - trial.height * scale) / 2;
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.rect(0, 0, trial.width, trial.height);
  ctx.clip();
  if (trial.mode === 1) {
    ring(ctx, trial);
    const ordered = options.winnerId
      ? [...trial.balls].sort(
          (a, b) => Number(a.id === options.winnerId) - Number(b.id === options.winnerId),
        )
      : trial.balls;
    for (const item of ordered) {
      if (options.showPaths) line(ctx, item.start, trial.center, "#c5d8e1", 1.5, [5, 5]);
      if (!options.reveal && !options.starts && time >= trial.hideAt) continue;
      const point = options.starts ? item.start : convergencePosition(trial, item, time);
      const color =
        options.winnerId === item.id
          ? "#17834a"
          : options.selectedId === item.id
            ? "#c62c42"
            : "#164b6b";
      ball(ctx, point, trial.radius, color, item.id);
      if (options.winnerId === item.id || options.selectedId === item.id) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.arc(point.x, point.y, trial.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else if (trial.mode === 2) {
    if (options.showPaths)
      for (const item of trial.balls) {
        ctx.beginPath();
        ctx.strokeStyle = item.crosses ? "#17834a44" : "#c62c4244";
        ctx.lineWidth = 2;
        for (let index = 0; index <= 80; index++) {
          const point = crossingPosition(trial, item, item.startAt + (item.duration * index) / 80);
          if (point) index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y);
        }
        ctx.stroke();
      }
    if (!options.ready)
      for (const item of trial.balls) {
        const point = crossingPosition(trial, item, time);
        if (point) ball(ctx, point, trial.radius, "#164b6b", options.labels ? item.id : "");
      }
    ring(ctx, trial, options.press ? (options.press.perfect ? "#17834a" : "#c62c42") : "#d42e44");
  } else {
    court(ctx, trial);
    const focus = options.focusBall;
    const balls = focus ? [focus] : trial.balls;
    if (focus) {
      line(
        ctx,
        courtPoint(trial, focus.startLateral, 0),
        courtPoint(trial, focus.landing, 1),
        "#f4f8ffcc",
        2,
        [7, 6],
      );
    }
    for (const item of balls) {
      const point = tennisPosition(trial, item, time, Boolean(options.reveal));
      if (point && !options.ready) ball(ctx, point, trial.radius * 0.8, "#b6cf25", item.id);
      if (options.reveal && (focus || time >= item.startAt + item.duration))
        impact(ctx, trial, item);
    }
    player(ctx, trial, time);
  }
  ctx.restore();
  return { scale, offsetX, offsetY, bounds };
}
