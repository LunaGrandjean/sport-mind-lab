import { cupPositions, cupLabel } from "./bonneteau-core.js";

function sphere(ctx, x, y, radius) {
  const fill = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.4, 1, x, y, radius);
  fill.addColorStop(0, "#fff5b7");
  fill.addColorStop(0.35, "#ffcf45");
  fill.addColorStop(1, "#d37709");
  ctx.beginPath();
  ctx.fillStyle = fill;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff8d9";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function cup(ctx, x, y, width, raised, color, transparent) {
  const height = width * 1.15,
    bottom = y - raised * height * 0.38;
  ctx.save();
  ctx.fillStyle = "#001c1d3b";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, width * 0.62, width * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = transparent ? 0.58 : 1;
  const fill = ctx.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
  fill.addColorStop(0, "#144259");
  fill.addColorStop(0.28, "#4e8299");
  fill.addColorStop(0.65, "#2b617a");
  fill.addColorStop(1, "#103a53");
  ctx.beginPath();
  ctx.moveTo(x - width * 0.34, bottom - height);
  ctx.quadraticCurveTo(x, bottom - height - width * 0.13, x + width * 0.34, bottom - height);
  ctx.lineTo(x + width * 0.5, bottom);
  ctx.quadraticCurveTo(x, bottom + width * 0.19, x - width * 0.5, bottom);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = color || "#c2e3eb";
  ctx.lineWidth = color ? 3 : 1.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, bottom - height, width * 0.34, width * 0.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#6b9aac";
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, bottom, width * 0.5, width * 0.1, 0, 0, Math.PI);
  ctx.strokeStyle = color || "#d8eef4";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function drawBoard(
  canvas,
  round,
  time,
  { raised = 0, labels = false, reveal = false, xray = false, selected = null } = {},
) {
  const bounds = canvas.getBoundingClientRect(),
    dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.max(1, bounds.width),
    h = Math.max(1, bounds.height);
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#164c40";
  ctx.fillRect(0, 0, w, h);
  const scale = Math.min(w / round.width, h / round.height);
  const ox = (w - round.width * scale) / 2,
    oy = (h - round.height * scale) / 2;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  const felt = ctx.createRadialGradient(
    round.width / 2,
    round.height / 2,
    0,
    round.width / 2,
    round.height / 2,
    Math.max(round.width, round.height) * 0.65,
  );
  felt.addColorStop(0, "#398570");
  felt.addColorStop(1, "#164c40");
  ctx.fillStyle = felt;
  ctx.fillRect(0, 0, round.width, round.height);
  ctx.strokeStyle = "#d8bd7f";
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, round.width - 6, round.height - 6);
  const positions = cupPositions(round, time).sort((a, b) => a.y - b.y);
  const ballRadius = Math.max(4, round.cupWidth * 0.18);
  for (const item of positions) {
    const number = round.finalOrder.indexOf(item.id) + 1;
    const chosen = selected?.includes(number);
    const color = selected
      ? item.hasBall
        ? chosen
          ? "#76edaa"
          : "#ffc65b"
        : chosen
          ? "#ff8795"
          : null
      : null;
    if (reveal && !xray && item.hasBall) sphere(ctx, item.x, item.y - ballRadius, ballRadius);
    cup(ctx, item.x, item.y, round.cupWidth, raised, color, xray);
    if (xray && item.hasBall) sphere(ctx, item.x, item.y - ballRadius, ballRadius);
    if (labels) {
      const font = Math.max(9, Math.min(19, round.cupWidth * 0.5, round.cellHeight * 0.22));
      const labelWidth = font * 1.85,
        labelHeight = font * 1.5;
      const labelY = item.y + Math.max(5, round.cupWidth * 0.18);
      ctx.fillStyle = color || "#fff";
      ctx.beginPath();
      ctx.roundRect(item.x - labelWidth / 2, labelY, labelWidth, labelHeight, 5);
      ctx.fill();
      ctx.fillStyle = "#12374e";
      ctx.font = `750 ${font}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cupLabel(number), item.x, labelY + labelHeight / 2);
    }
  }
  ctx.restore();
}
