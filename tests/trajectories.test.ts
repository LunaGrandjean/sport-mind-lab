import { describe, expect, test } from "bun:test";
import {
  DIRECTIONS,
  dimensions,
  difficulty,
  edgeStarts,
  makeConvergence,
  convergencePosition,
  makeCrossings,
  crossingPosition,
  scorePress,
  crossingSummary,
  makeTennis,
  tennisPosition,
  tennisOutcome,
  courtPoint,
  playerAt,
} from "../public/tests/anticipation-trajectoires-core.js";

function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
const settings = {
  count: 10,
  level: 1,
  speed: 1,
  spacing: 0.5,
  direction: "lr",
  avoid: false,
  edge: "bottom",
};
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

describe("Anticipation : convergence", () => {
  test("20 départs restent espacés, y compris sur un petit écran", () => {
    for (const [width, height] of [
      [1200, 650],
      [375, 400],
      [667, 210],
      [240, 160],
    ]) {
      const world = dimensions(width, height);
      for (let seed = 0; seed < 30; seed++) {
        for (const count of [2, 3, 4, 20]) {
          const starts = edgeStarts(count, world, seeded(seed));
          expect(starts).toHaveLength(count);
          expect(new Set(starts.slice(0, 4).map((p) => p.edge)).size).toBe(Math.min(count, 4));
          for (const [index, point] of starts.entries()) {
            expect(point.x).toBeGreaterThanOrEqual(world.radius);
            expect(point.y).toBeGreaterThanOrEqual(world.radius);
            expect(point.x).toBeLessThanOrEqual(width - world.radius);
            expect(point.y).toBeLessThanOrEqual(height - world.radius);
            for (const other of starts.slice(index + 1))
              expect(distance(point, other)).toBeGreaterThan(world.radius * 2);
          }
        }
      }
    }
  });

  test("la plus rapide est bien la première arrivée ; disparition commune à 80 %", () => {
    for (const level of [1, 50, 1000000]) {
      for (let seed = 0; seed < 50; seed++) {
        const trial = makeConvergence({ ...settings, count: 20, level }, 1100, 500, seeded(seed));
        const winner = trial.balls.find((ball) => ball.id === trial.winnerId)!;
        for (const other of trial.balls.filter((ball) => ball !== winner)) {
          expect(winner.arrival).toBeLessThan(other.arrival);
          expect(winner.speed).toBeGreaterThan(other.speed);
        }
        const remaining = distance(convergencePosition(trial, winner, trial.hideAt), trial.center);
        expect(remaining / distance(winner.start, trial.center)).toBeCloseTo(0.2, 8);
        expect(trial.choiceAt).toBeGreaterThan(trial.hideAt);
        expect(trial.endAt).toBeGreaterThanOrEqual(trial.choiceAt);
        expect(trial.endAt).toBeGreaterThan(Math.max(...trial.balls.map((ball) => ball.arrival)));
      }
    }
  });

  test("les niveaux continuent à accélérer et à rapprocher les vitesses", () => {
    const levels = [1, 20, 100, 1000, 1000000].map((level) => difficulty(level));
    expect(levels[0].duration).toBe(4);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].duration).toBeLessThan(levels[i - 1].duration);
      expect(levels[i].gap).toBeLessThan(levels[i - 1].gap);
      expect(levels[i].duration).toBeGreaterThan(0);
    }
    expect(difficulty(1, 2).duration).toBe(2);
  });
});

describe("Anticipation : passages au centre", () => {
  test("chaque direction et chaque courbe passe exactement au centre au temps prévu", () => {
    for (const direction of Object.keys(DIRECTIONS)) {
      const trial = makeCrossings({ ...settings, direction }, 1000, 600, seeded(23));
      expect(trial.balls[0].duration).toBe(4);
      expect(trial.balls[0].centerAt).toBe(2);
      trial.balls.forEach((ball, index) => {
        expect(ball.startAt).toBe(index * 2);
        expect(distance(crossingPosition(trial, ball, ball.centerAt)!, trial.center)).toBeLessThan(
          1e-8,
        );
        expect(crossingPosition(trial, ball, ball.startAt - 0.01)).toBeNull();
        expect(crossingPosition(trial, ball, ball.startAt + ball.duration + 0.01)).toBeNull();
      });
    }
  });

  test("les boules en évitement restent hors du cercle, même dans les courbes", () => {
    for (const direction of Object.keys(DIRECTIONS)) {
      for (let seed = 0; seed < 20; seed++) {
        const trial = makeCrossings(
          { ...settings, direction, avoid: true },
          1000,
          600,
          seeded(seed),
        );
        expect(trial.balls.some((ball) => ball.crosses)).toBe(true);
        expect(trial.balls.some((ball) => !ball.crosses)).toBe(true);
        for (const ball of trial.balls.filter((item) => !item.crosses)) {
          for (let sample = 0; sample <= 400; sample++) {
            const position = crossingPosition(
              trial,
              ball,
              ball.startAt + (sample / 400) * ball.duration,
            )!;
            expect(distance(position, trial.center)).toBeGreaterThan(trial.targetRadius);
          }
        }
      }
    }
  });

  test("un passage ne compte qu'une fois ; chaque appui et chaque omission est corrigé", () => {
    const trial = makeCrossings(
      { ...settings, count: 3, avoid: true, spacing: 0.8 },
      1000,
      600,
      seeded(7),
    );
    const targets = trial.balls.filter((ball) => ball.crosses);
    const distractor = trial.balls.find((ball) => !ball.crosses)!;
    const perfect = scorePress(trial, targets[0].centerAt);
    expect(perfect.perfect).toBe(true);
    const duplicate = scorePress(trial, targets[0].centerAt, [perfect]);
    expect(duplicate.perfect).toBe(false);
    expect(duplicate.reason).toBe("Déjà validée");
    const wrong = scorePress(trial, distractor.centerAt, [perfect]);
    expect(wrong.perfect).toBe(false);
    expect(wrong.reason).toBe("Boule en évitement");
    expect(crossingSummary(trial, [perfect, duplicate, wrong])).toEqual({
      targets: 2,
      perfect: 1,
      missed: 1,
      falseAlarms: 2,
      inhibited: 0,
      distractors: 1,
    });
    expect(crossingSummary(trial, [perfect]).inhibited).toBe(1);
  });
});

describe("Anticipation : tennis", () => {
  test("les quatre bords respectent la ligne de fond et les zones mortes", () => {
    for (const edge of ["top", "bottom", "left", "right"]) {
      const trial = makeTennis({ ...settings, edge }, 1000, 600, seeded(10));
      const center = courtPoint(trial, 0.5, 0.5);
      expect(center).toEqual({ x: 500, y: 300 });
      const baseline = courtPoint(trial, 0.5, 1);
      expect(
        edge === "top"
          ? baseline.y < 300
          : edge === "bottom"
            ? baseline.y > 300
            : edge === "left"
              ? baseline.x < 500
              : baseline.x > 500,
      ).toBe(true);
    }
  });

  test("disparition à mi-parcours, reprise exacte dans le ralenti et position future de la joueuse", () => {
    const outcomes = new Set<string>();
    for (let seed = 0; seed < 30; seed++) {
      const trial = makeTennis({ ...settings, count: 30 }, 1000, 600, seeded(seed));
      expect(trial.balls).toHaveLength(30);
      expect(trial.winners).toBe(trial.balls.filter((ball) => ball.outcome === "winner").length);
      for (const ball of trial.balls) {
        outcomes.add(ball.outcome);
        expect(tennisPosition(trial, ball, ball.startAt + ball.duration * 0.49)).not.toBeNull();
        expect(tennisPosition(trial, ball, ball.startAt + ball.duration * 0.5)).toBeNull();
        const arrival = ball.startAt + ball.duration;
        expect(
          distance(tennisPosition(trial, ball, arrival, true)!, courtPoint(trial, ball.landing, 1)),
        ).toBeLessThan(1e-8);
        expect(tennisOutcome(trial, ball)).toBe(ball.outcome);
        if (ball.outcome === "player")
          expect(Math.abs(ball.landing - playerAt(trial, arrival))).toBeLessThanOrEqual(
            trial.reach,
          );
        if (ball.outcome === "winner") {
          expect(ball.landing).toBeGreaterThanOrEqual(trial.courtMin);
          expect(ball.landing).toBeLessThanOrEqual(trial.courtMax);
          expect(Math.abs(ball.landing - playerAt(trial, arrival))).toBeGreaterThan(trial.reach);
        }
      }
      expect(playerAt(trial, 0)).toBeCloseTo(playerAt(trial, trial.playerPeriod * 2), 10);
    }
    expect([...outcomes].sort()).toEqual(["out", "player", "winner"]);
  });
});
