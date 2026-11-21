const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const shuffle = (values, random) => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const cupLabel = (number) => String(number).padStart(2, "0");

export function calibration(level) {
  if (!Number.isSafeInteger(level) || level < 1)
    throw new Error("Choisir un niveau entier positif.");
  return {
    duration: level <= 5 ? 10 : level <= 10 ? 20 : 30,
    swapDuration: 0.22 + 2.28 / (1 + (level - 1) * 0.12),
  };
}

export function tableLayout(count, width, height) {
  const columns = count <= 5 ? count : count <= 8 ? Math.ceil(count / 2) : 5;
  const rows = Math.ceil(count / columns);
  const padding = Math.min(28, width * 0.04, height * 0.05);
  const cellWidth = (width - padding * 2) / columns;
  const cellHeight = (height - padding * 2) / rows;
  const unit = Math.min(cellWidth, cellHeight);
  return {
    width,
    height,
    columns,
    rows,
    cellWidth,
    cellHeight,
    cupWidth: Math.min(56, unit * 0.4),
    arc: Math.min(44, unit * 0.25),
    slots: Array.from({ length: count }, (_, slot) => ({
      x: padding + ((slot % columns) + 0.5) * cellWidth,
      y: padding + (Math.floor(slot / columns) + 0.7) * cellHeight,
    })),
  };
}

function pairsFor(layout, count, axis, parity) {
  const pairs = [];
  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.columns; col++) {
      const a = row * layout.columns + col;
      if (a >= count) continue;
      const b = axis === "horizontal" ? a + 1 : a + layout.columns;
      const coordinate = axis === "horizontal" ? col : row;
      if (coordinate % 2 !== parity || b >= count) continue;
      if (axis === "horizontal" && col + 1 >= layout.columns) continue;
      pairs.push([a, b]);
    }
  }
  return pairs;
}

export function makeRound({ balls, cups, level }, width, height, random = Math.random) {
  if (!Number.isInteger(balls) || balls < 1 || balls > 10)
    throw new Error("Choisir de 1 à 10 balles.");
  if (!Number.isInteger(cups) || cups < 2 || cups > 20)
    throw new Error("Choisir de 2 à 20 gobelets.");
  if (balls >= cups)
    throw new Error("Prévoir plus de gobelets que de balles pour garder au moins un gobelet vide.");
  const tuning = calibration(level);
  const layout = tableLayout(cups, width, height);
  const ids = Array.from({ length: cups }, (_, id) => id);
  const occupied = new Set(shuffle(ids, random).slice(0, balls));
  const containers = ids.map((id) => ({ id, hasBall: occupied.has(id) }));
  const batches = [];
  let order = [...ids];
  // Répartir les changements sur toute la durée : aucun mouvement coupé à la fin.
  const batchCount = Math.ceil(tuning.duration / tuning.swapDuration);
  const batchDuration = tuning.duration / batchCount;
  // La vitesse change à chaque niveau, même lorsque le nombre d'échanges reste identique.
  const motionDuration = batchDuration * 0.75 + tuning.swapDuration * 0.1;
  for (let index = 0; index < batchCount; index++) {
    let axis =
      index < 2 || layout.rows === 1 ? "horizontal" : random() < 0.5 ? "horizontal" : "vertical";
    let parity = index < 2 ? index % 2 : random() < 0.5 ? 0 : 1;
    if (index === 2 && layout.rows > 1) {
      axis = "vertical";
      parity = (layout.rows - 2) % 2;
    }
    let pairs = pairsFor(layout, cups, axis, parity);
    if (!pairs.length) pairs = pairsFor(layout, cups, axis, 1 - parity);
    if (!pairs.length) pairs = pairsFor(layout, cups, "horizontal", 0);
    const before = [...order];
    const moves = pairs.flatMap(([a, b]) => {
      const returns = random() < 0.25;
      if (!returns) [order[a], order[b]] = [order[b], order[a]];
      return [
        { cupId: before[a], from: a, to: b, side: 1, returns },
        { cupId: before[b], from: b, to: a, side: -1, returns },
      ];
    });
    batches.push({
      start: index * batchDuration,
      end: (index + 1) * batchDuration,
      motionStart: index * batchDuration + (batchDuration - motionDuration) / 2,
      motionEnd: index * batchDuration + (batchDuration + motionDuration) / 2,
      before,
      after: [...order],
      moves,
    });
  }
  return {
    ...layout,
    balls,
    cups,
    level,
    duration: tuning.duration,
    containers,
    batches,
    initialOrder: ids,
    finalOrder: order,
    answers: order.flatMap((id, slot) => (occupied.has(id) ? [slot + 1] : [])),
  };
}

/** La balle appartient à un gobelet immuable, jamais à un emplacement de la table. */
export function cupPositions(round, time) {
  const t = clamp(time, 0, round.duration);
  const batch = round.batches.find((item) => t < item.end) || round.batches.at(-1);
  const progress = smooth((t - batch.motionStart) / (batch.motionEnd - batch.motionStart));
  const byCup = new Map(batch.moves.map((move) => [move.cupId, move]));
  return round.containers.map((container) => {
    const move = byCup.get(container.id);
    const initial = round.slots[batch.before.indexOf(container.id)];
    if (!move) return { ...container, x: initial.x, y: initial.y };
    // Certains échanges amorcés reviennent sur place : même deux gobelets restent imprévisibles.
    const travel = move.returns ? 0.5 * Math.sin(Math.PI * progress) ** 2 : progress;
    const from = round.slots[move.from],
      to = round.slots[move.to];
    const dx = to.x - from.x,
      dy = to.y - from.y,
      length = Math.hypot(dx, dy);
    // Le même vecteur normal pour les deux gobelets les fait passer de part et d'autre.
    const normal =
      move.side === 1 ? { x: -dy / length, y: dx / length } : { x: dy / length, y: -dx / length };
    const arc = Math.sin(Math.PI * travel) * round.arc * move.side;
    return {
      ...container,
      x: from.x + dx * travel + normal.x * arc,
      y: from.y + dy * travel + normal.y * arc,
    };
  });
}

export function formatAnswer(text, caret = text.length) {
  const digits = text.replace(/\D/g, "");
  const beforeCaret = text.slice(0, caret).replace(/\D/g, "").length;
  const value = digits.match(/.{1,2}/g)?.join(" ") || "";
  return { value, caret: Math.min(value.length, beforeCaret + Math.floor(beforeCaret / 2)) };
}

export function parseAnswer(text, cups) {
  const value = text.replace(/\s/g, "");
  if (!/^\d+$/.test(value) || value.length % 2 !== 0) {
    return {
      error: "Complétez chaque numéro avec deux chiffres (01 à 20).",
    };
  }
  const numbers = value.match(/.{2}/g).map(Number);
  if (numbers.some((number) => number < 1 || number > cups))
    return { error: `Les numéros vont de 01 à ${cupLabel(cups)}.` };
  if (new Set(numbers).size !== numbers.length)
    return { error: "Un gobelet ne peut être cité qu’une fois." };
  return { numbers };
}

export function gradeAnswer(round, numbers) {
  const expected = new Set(round.answers),
    selected = new Set(numbers);
  const found = round.answers.filter((number) => selected.has(number));
  const missed = round.answers.filter((number) => !selected.has(number));
  const extra = [...selected].filter((number) => !expected.has(number));
  return { correct: !missed.length && !extra.length, found, missed, extra };
}
