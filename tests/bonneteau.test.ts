import { describe, expect, test } from "bun:test";
import {
  calibration,
  makeRound,
  cupPositions,
  formatAnswer,
  parseAnswer,
  gradeAnswer,
} from "../public/tests/bonneteau-core.js";

function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Bonneteau", () => {
  test("les durées changent exactement aux niveaux 6 et 11, les niveaux restent ouverts", () => {
    for (const [level, duration] of [
      [1, 10],
      [5, 10],
      [6, 20],
      [10, 20],
      [11, 30],
      [500, 30],
      [1000000, 30],
    ])
      expect(calibration(level).duration).toBe(duration);
    expect(calibration(500).swapDuration).toBeLessThan(calibration(100).swapDuration);
    expect(calibration(100).swapDuration).toBeLessThan(calibration(11).swapDuration);
    for (const level of [0, -1, 1.5, Infinity, NaN]) expect(() => calibration(level)).toThrow();
    let previous = Infinity;
    for (let level = 1; level <= 200; level++) {
      const round = makeRound({ balls: 1, cups: 3, level }, 800, 500, seeded(level));
      const motion = round.batches[0].motionEnd - round.batches[0].motionStart;
      expect(motion).toBeGreaterThan(0);
      expect(motion).toBeLessThan(previous);
      previous = motion;
    }
  });

  test("chaque balle reste dans son gobelet, le nombre de balles et les permutations sont conservés", () => {
    for (const cups of [2, 3, 7, 11, 16, 20]) {
      for (const balls of [1, Math.min(10, cups - 1)]) {
        for (const level of [1, 6, 11, 500]) {
          const round = makeRound({ cups, balls, level }, 1200, 600, seeded(cups + level));
          const occupied = new Set(
            round.containers.filter((cup) => cup.hasBall).map((cup) => cup.id),
          );
          expect(occupied.size).toBe(balls);
          expect(round.answers).toHaveLength(balls);
          expect(round.batches[0].start).toBe(0);
          expect(round.batches.at(-1)!.end).toBeCloseTo(round.duration, 10);
          for (const [index, batch] of round.batches.entries()) {
            expect(new Set(batch.after).size).toBe(cups);
            expect(batch.after.toSorted((a, b) => a - b)).toEqual(round.initialOrder);
            if (index) expect(batch.before).toEqual(round.batches[index - 1].after);
            const positions = cupPositions(round, (batch.start + batch.end) / 2);
            expect(positions.filter((cup) => cup.hasBall).map((cup) => cup.id)).toEqual([
              ...occupied,
            ]);
            expect(positions.every((cup) => Number.isFinite(cup.x) && Number.isFinite(cup.y))).toBe(
              true,
            );
          }
          const final = cupPositions(round, round.duration);
          round.finalOrder.forEach((id, slot) => {
            const position = final.find((cup) => cup.id === id)!;
            expect(position.x).toBeCloseTo(round.slots[slot].x, 8);
            expect(position.y).toBeCloseTo(round.slots[slot].y, 8);
            expect(round.answers.includes(slot + 1)).toBe(occupied.has(id));
          });
        }
      }
    }
  });

  test("les échanges sont continus et les deux gobelets restent distincts à mi-course", () => {
    const round = makeRound({ balls: 10, cups: 20, level: 11 }, 390, 558, seeded(92));
    for (const batch of round.batches) {
      const middle = cupPositions(round, (batch.start + batch.end) / 2);
      for (let i = 0; i < batch.moves.length; i += 2) {
        const a = middle.find((cup) => cup.id === batch.moves[i].cupId)!;
        const b = middle.find((cup) => cup.id === batch.moves[i + 1].cupId)!;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(round.cupWidth);
      }
      const before = cupPositions(round, batch.end - 1e-7),
        after = cupPositions(round, batch.end + 1e-7);
      before.forEach((cup, index) =>
        expect(Math.hypot(cup.x - after[index].x, cup.y - after[index].y)).toBeLessThan(0.001),
      );
    }
  });

  test("il reste toujours un gobelet vide et les paramètres invalides sont refusés", () => {
    expect(() => makeRound({ balls: 3, cups: 3, level: 1 }, 800, 500)).toThrow();
    expect(() => makeRound({ balls: 10, cups: 2, level: 1 }, 800, 500)).toThrow();
    expect(() => makeRound({ balls: 0, cups: 3, level: 1 }, 800, 500)).toThrow();
    expect(() => makeRound({ balls: 1, cups: 21, level: 1 }, 800, 500)).toThrow();
  });

  test("les petites populations ne produisent pas toujours le même mélange", () => {
    for (const cups of [2, 3]) {
      const endings = new Set<string>();
      for (let seed = 0; seed < 40; seed++) {
        const round = makeRound({ balls: 1, cups, level: 1 }, 800, 500, seeded(seed));
        endings.add(round.finalOrder.join(","));
      }
      expect(endings.size).toBeGreaterThan(1);
    }
  });

  test("les numéros accolés à deux chiffres sont non ambigus et l'ordre des réponses ne compte pas", () => {
    expect(parseAnswer("0112", 20)).toEqual({ numbers: [1, 12] });
    expect(parseAnswer("1102", 20)).toEqual({ numbers: [11, 2] });
    expect(parseAnswer("010512", 20)).toEqual({ numbers: [1, 5, 12] });
    expect(parseAnswer("01 03", 20)).toEqual({ numbers: [1, 3] });
    for (const value of ["112", "0101", "0121", "0003", "01,03", "ab03", ""])
      expect(parseAnswer(value, 20).error).toBeTruthy();
    const round = makeRound({ balls: 3, cups: 20, level: 1 }, 1000, 600, seeded(4));
    expect(gradeAnswer(round, [...round.answers].reverse()).correct).toBe(true);
    const empty = Array.from({ length: 20 }, (_, i) => i + 1).find(
      (number) => !round.answers.includes(number),
    )!;
    const grade = gradeAnswer(round, [...round.answers.slice(1), empty]);
    expect(grade.correct).toBe(false);
    expect(grade.found).toHaveLength(2);
    expect(grade.missed).toEqual([round.answers[0]]);
    expect(grade.extra).toEqual([empty]);
  });

  test("la saisie groupe les chiffres sans gabarit et conserve la position dans le texte", () => {
    expect(formatAnswer("")).toEqual({ value: "", caret: 0 });
    expect(formatAnswer("0")).toEqual({ value: "0", caret: 1 });
    expect(formatAnswer("0112")).toEqual({ value: "01 12", caret: 5 });
    expect(formatAnswer("011")).toEqual({ value: "01 1", caret: 4 });
    expect(formatAnswer("01, 12; 20")).toEqual({ value: "01 12 20", caret: 8 });
    expect(formatAnswer("01 12 20", 1).caret).toBe(1);
    expect(formatAnswer("01 12 20", 3).caret).toBe(3);
    expect(formatAnswer("01 12 20", 5).caret).toBe(6);
    expect(formatAnswer("0102030405060708091011121314151617181920").value).toBe(
      "01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20",
    );
  });

  test("le nombre de réponses est évalué à la correction sans donner d'indice à la saisie", () => {
    const round = makeRound({ balls: 2, cups: 20, level: 1 }, 1000, 600, seeded(4));
    const missing = parseAnswer(cupLabelForTest(round.answers[0]), round.cups);
    expect(missing.error).toBeUndefined();
    expect(gradeAnswer(round, missing.numbers).missed).toHaveLength(1);
    const extra = Array.from({ length: 20 }, (_, i) => i + 1).find(
      (number) => !round.answers.includes(number),
    )!;
    const tooMany = parseAnswer(
      [...round.answers, extra].map(cupLabelForTest).join(" "),
      round.cups,
    );
    expect(tooMany.error).toBeUndefined();
    expect(gradeAnswer(round, tooMany.numbers).extra).toEqual([extra]);
  });
});

function cupLabelForTest(number: number) {
  return String(number).padStart(2, "0");
}
