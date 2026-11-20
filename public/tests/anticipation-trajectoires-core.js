export const DIRECTIONS = {
  lr: "Gauche → droite",
  rl: "Droite → gauche",
  tb: "Haut → bas",
  bt: "Bas → haut",
  trbl: "Haut droite → bas gauche",
  brtl: "Bas droite → haut gauche",
  tlbr: "Haut gauche → bas droite",
  bltr: "Bas gauche → haut droite",
  random: "Directions mélangées",
  free: "Dans tous les sens · courbes et variations",
};

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
const between = (min, max, random) => lerp(min, max, random());
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const smooth = (t) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
const shuffled = (items, random) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export function difficulty(level, speed = 1) {
  const extra = Math.max(0, level - 1);
  return {
    duration: (0.45 + 3.55 / (1 + extra * 0.07)) / speed,
    gap: 0.035 + 0.55 / (1 + extra * 0.17),
    playerPeriod: 0.7 + 2.8 / (1 + extra * 0.05),
  };
}

export function dimensions(width, height) {
  const radius = Math.max(6, Math.min(12, Math.min(width, height) / 24));
  return {
    width,
    height,
    radius,
    targetRadius: radius * 1.2,
    center: { x: width / 2, y: height / 2 },
  };
}

/** Les quatre premiers départs occupent des bords différents. Les emplacements ne se touchent pas. */
export function edgeStarts(count, world, random = Math.random) {
  const { width, height, radius } = world;
  const margin = radius + 5;
  const corner = radius * 2.5 + 6;
  const slots = Array.from({ length: 4 }, (_, edge) => {
    const length = edge % 2 === 0 ? width : height;
    const usable = Math.max(0, length - 2 * corner);
    const number = Math.max(1, Math.floor(usable / (2 * radius + 8)) + 1);
    return shuffled(
      Array.from({ length: number }, (_, i) => {
        const coordinate =
          number === 1 ? length / 2 : corner + (usable * i) / (number - 1) + between(-2, 2, random);
        return edge === 0
          ? { x: coordinate, y: margin, edge }
          : edge === 1
            ? { x: width - margin, y: coordinate, edge }
            : edge === 2
              ? { x: coordinate, y: height - margin, edge }
              : { x: margin, y: coordinate, edge };
      }),
      random,
    );
  });
  const order = shuffled([0, 1, 2, 3], random);
  const starts = [];
  for (let i = 0; i < count; i++) {
    const available = [0, 1, 2, 3].filter((edge) => slots[edge].length);
    const edge = i < 4 ? order[i] : available[Math.floor(random() * available.length)];
    if (edge === undefined || !slots[edge]?.length)
      throw new Error("Surface trop petite pour espacer les boules.");
    const candidates = slots[edge];
    let bestIndex = 0,
      bestDistance = -1;
    candidates.forEach((candidate, index) => {
      const separation = starts.length
        ? Math.min(...starts.map((point) => distance(candidate, point)))
        : random();
      if (separation > bestDistance) {
        bestDistance = separation;
        bestIndex = index;
      }
    });
    starts.push(candidates.splice(bestIndex, 1)[0]);
  }
  return starts;
}

export function makeConvergence(settings, width, height, random = Math.random) {
  const world = dimensions(width, height);
  const calibration = difficulty(settings.level, settings.speed);
  const starts = edgeStarts(settings.count, world, random);
  const winnerId = Math.floor(random() * starts.length) + 1;
  const winnerSpeed = distance(starts[winnerId - 1], world.center) / calibration.duration;
  const balls = starts.map((start, index) => {
    const length = distance(start, world.center);
    // Le gagnant est à la fois le plus rapide en distance/seconde et le premier à atteindre le centre.
    const arrival =
      index + 1 === winnerId
        ? calibration.duration
        : Math.max(
            calibration.duration * (1 + between(calibration.gap, calibration.gap * 1.7, random)),
            length / (winnerSpeed * (1 - calibration.gap * between(0.65, 1, random))),
          );
    return { id: index + 1, start, arrival, speed: length / arrival };
  });
  const hideAt = calibration.duration * 0.8;
  const choiceAt = hideAt + 0.35;
  return {
    mode: 1,
    ...world,
    level: settings.level,
    balls,
    winnerId,
    hideAt,
    choiceAt,
    endAt: Math.max(...balls.map((ball) => ball.arrival + 0.35), choiceAt + 0.1),
  };
}

export function convergencePosition(trial, ball, time) {
  const progress = clamp(time / ball.arrival, 0, 1);
  return {
    x: lerp(ball.start.x, trial.center.x, progress),
    y: lerp(ball.start.y, trial.center.y, progress),
  };
}

function directionEnds(direction, world) {
  const { width: w, height: h, radius: r } = world;
  return {
    lr: [
      { x: -r, y: h / 2 },
      { x: w + r, y: h / 2 },
    ],
    rl: [
      { x: w + r, y: h / 2 },
      { x: -r, y: h / 2 },
    ],
    tb: [
      { x: w / 2, y: -r },
      { x: w / 2, y: h + r },
    ],
    bt: [
      { x: w / 2, y: h + r },
      { x: w / 2, y: -r },
    ],
    trbl: [
      { x: w + r, y: -r },
      { x: -r, y: h + r },
    ],
    brtl: [
      { x: w + r, y: h + r },
      { x: -r, y: -r },
    ],
    tlbr: [
      { x: -r, y: -r },
      { x: w + r, y: h + r },
    ],
    bltr: [
      { x: -r, y: h + r },
      { x: w + r, y: -r },
    ],
  }[direction];
}

export function makeCrossings(settings, width, height, random = Math.random) {
  const world = dimensions(width, height);
  const calibration = difficulty(settings.level, settings.speed);
  const basicDirections = Object.keys(DIRECTIONS).filter(
    (key) => key !== "random" && key !== "free",
  );
  const avoided = new Set();
  if (settings.avoid) {
    const amount =
      settings.count === 1
        ? random() < 0.4
          ? 1
          : 0
        : Math.max(1, Math.floor(settings.count * 0.4));
    shuffled(
      Array.from({ length: settings.count }, (_, i) => i),
      random,
    )
      .slice(0, amount)
      .forEach((index) => avoided.add(index));
  }
  const balls = Array.from({ length: settings.count }, (_, index) => {
    const direction =
      settings.direction === "random" || settings.direction === "free"
        ? basicDirections[Math.floor(random() * basicDirections.length)]
        : settings.direction;
    const [start, end] = directionEnds(direction, world);
    const dx = end.x - start.x,
      dy = end.y - start.y,
      length = Math.hypot(dx, dy);
    return {
      id: index + 1,
      start,
      end,
      direction,
      perpendicular: { x: -dy / length, y: dx / length },
      startAt: index * calibration.duration * settings.spacing,
      duration: calibration.duration,
      centerAt: index * calibration.duration * settings.spacing + calibration.duration / 2,
      crosses: !avoided.has(index),
      lateAvoid: random() < 0.5,
      bend:
        settings.direction === "free"
          ? between(0.13, 0.24, random) * Math.min(width, height) * (random() < 0.5 ? -1 : 1)
          : 0,
      avoidance: between(0.16, 0.23, random) * Math.min(width, height) * (random() < 0.5 ? -1 : 1),
    };
  });
  return {
    mode: 2,
    ...world,
    level: settings.level,
    balls,
    endAt: balls.at(-1).startAt + calibration.duration + 0.3,
  };
}

export function crossingPosition(trial, ball, time) {
  const raw = (time - ball.startAt) / ball.duration;
  if (raw < -1e-9 || raw > 1 + 1e-9) return null;
  const fraction = clamp(raw, 0, 1);
  const progress = ball.bend ? fraction + 0.065 * Math.sin(2 * Math.PI * fraction) : fraction;
  const curve = ball.bend * Math.sin(Math.PI * progress) * Math.sin(2 * Math.PI * progress);
  const evade = ball.crosses
    ? 0
    : ball.avoidance *
      (ball.lateAvoid
        ? smooth((progress - 0.34) / 0.12) * smooth((0.66 - progress) / 0.12)
        : Math.sin(Math.PI * progress) ** 2);
  return {
    x: lerp(ball.start.x, ball.end.x, progress) + ball.perpendicular.x * (curve + evade),
    y: lerp(ball.start.y, ball.end.y, progress) + ball.perpendicular.y * (curve + evade),
  };
}

export function scorePress(trial, time, previous = []) {
  const already = new Set(previous.filter((press) => press.perfect).map((press) => press.ballId));
  const visible = trial.balls
    .map((ball) => {
      const position = crossingPosition(trial, ball, time);
      return position ? { ball, position, distance: distance(position, trial.center) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);
  const hit = visible.find(
    ({ ball, distance: d }) => ball.crosses && !already.has(ball.id) && d <= trial.targetRadius,
  );
  const nearest = hit || visible[0];
  const closestTime =
    nearest?.ball ||
    [...trial.balls].sort((a, b) => Math.abs(a.centerAt - time) - Math.abs(b.centerAt - time))[0];
  return {
    time,
    perfect: Boolean(hit),
    ballId: closestTime?.id ?? null,
    offsetMs: closestTime ? Math.round((time - closestTime.centerAt) * 1000) : 0,
    reason: hit
      ? "Parfait"
      : nearest && already.has(nearest.ball.id)
        ? "Déjà validée"
        : nearest && !nearest.ball.crosses
          ? "Boule en évitement"
          : time < closestTime.centerAt
            ? "Trop tôt"
            : "Trop tard",
  };
}

export function crossingSummary(trial, presses) {
  const targets = trial.balls.filter((ball) => ball.crosses).length;
  const perfect = new Set(presses.filter((press) => press.perfect).map((press) => press.ballId))
    .size;
  const avoided = trial.balls.filter((ball) => !ball.crosses);
  return {
    targets,
    perfect,
    missed: targets - perfect,
    falseAlarms: presses.filter((press) => !press.perfect).length,
    inhibited: avoided.filter((ball) => !presses.some((press) => press.ballId === ball.id)).length,
    distractors: avoided.length,
  };
}

export function courtPoint(trial, lateral, depth) {
  const { width: w, height: h } = trial;
  const pad = Math.min(34, Math.min(w, h) * 0.09);
  return trial.edge === "bottom"
    ? { x: lateral * w, y: lerp(pad, h - pad, depth) }
    : trial.edge === "top"
      ? { x: lateral * w, y: lerp(h - pad, pad, depth) }
      : trial.edge === "left"
        ? { x: lerp(w - pad, pad, depth), y: lateral * h }
        : { x: lerp(pad, w - pad, depth), y: lateral * h };
}

export function playerAt(trial, time) {
  const phase = (((time / trial.playerPeriod + trial.playerPhase) % 2) + 2) % 2;
  const progress = phase <= 1 ? phase : 2 - phase;
  return lerp(trial.courtMin + trial.reach, trial.courtMax - trial.reach, progress);
}

export function tennisOutcome(trial, ball) {
  if (ball.landing < trial.courtMin || ball.landing > trial.courtMax) return "out";
  return Math.abs(ball.landing - playerAt(trial, ball.startAt + ball.duration)) <= trial.reach
    ? "player"
    : "winner";
}

export function makeTennis(settings, width, height, random = Math.random) {
  const world = dimensions(width, height);
  const calibration = difficulty(settings.level, settings.speed);
  const trial = {
    mode: 3,
    ...world,
    level: settings.level,
    edge: settings.edge,
    courtMin: 0.16,
    courtMax: 0.84,
    reach: Math.max(
      0.035,
      Math.min(
        0.065,
        24 / (settings.edge === "left" || settings.edge === "right" ? height : width),
      ),
    ),
    playerPeriod: calibration.playerPeriod,
    playerPhase: random() * 2,
    balls: [],
  };
  trial.balls = Array.from({ length: settings.count }, (_, index) => {
    const duration = calibration.duration;
    const startAt = index * duration * settings.spacing;
    const futurePlayer = playerAt(trial, startAt + duration);
    const kind = random();
    let landing;
    if (kind < 0.22) {
      landing =
        random() < 0.5
          ? between(0.02, trial.courtMin - 0.035, random)
          : between(trial.courtMax + 0.035, 0.98, random);
    } else if (kind < 0.48) {
      landing = futurePlayer + between(-trial.reach * 0.6, trial.reach * 0.6, random);
    } else {
      for (let attempt = 0; attempt < 50; attempt++) {
        landing = between(trial.courtMin + 0.025, trial.courtMax - 0.025, random);
        if (Math.abs(landing - futurePlayer) > trial.reach + 0.03) break;
      }
      if (Math.abs(landing - futurePlayer) <= trial.reach + 0.03)
        landing = futurePlayer > 0.5 ? trial.courtMin + 0.025 : trial.courtMax - 0.025;
    }
    const ball = {
      id: index + 1,
      startAt,
      duration,
      startLateral: between(0.18, 0.82, random),
      landing,
    };
    ball.outcome = tennisOutcome(trial, ball);
    return ball;
  });
  trial.endAt = trial.balls.at(-1).startAt + trial.balls.at(-1).duration + 0.2;
  trial.winners = trial.balls.filter((ball) => ball.outcome === "winner").length;
  return trial;
}

export function tennisPosition(trial, ball, time, reveal = false) {
  const raw = (time - ball.startAt) / ball.duration;
  if (raw < -1e-9 || raw > 1 + 1e-9) return null;
  const progress = clamp(raw, 0, 1);
  if (!reveal && progress >= 0.5 - 1e-9) return null;
  return courtPoint(trial, lerp(ball.startLateral, ball.landing, progress), progress);
}
