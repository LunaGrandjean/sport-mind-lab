import { describe, expect, test } from "bun:test";
import type { Athlete, Axis, Result } from "../src/lib/domain";
import { topByAxis } from "../src/lib/records";
import { noteFromRaw } from "../src/lib/scoring";

const CPS: Axis = "Vitesse motrice / CPS";
const PRECISION: Axis = "Précision motrice";
const athlete = (id: string): Athlete => ({
  id,
  nom: id,
  prenom: "Sportif",
  age: 25,
  sexe: "Femme",
  discipline: "Rugby",
  poste: "",
  pathologie: "",
  niveau: "National",
});
const luna = athlete("Luna");

function trial(
  athleteId: string,
  axis: Axis,
  rawScore: number,
  side?: "G" | "D",
  patch: Partial<Result> = {},
): Result {
  return {
    id: `${athleteId}-${side}-${rawScore}`,
    athleteId,
    axis,
    score: noteFromRaw(axis, rawScore),
    rawScore,
    ...(side ? { side } : {}),
    ...(axis === CPS ? { duration: 30 } : {}),
    mode: "Standard",
    niveau: "National",
    date: "2026-11-20T10:00:00.000Z",
    source: "test",
    ...patch,
  };
}

describe("records sur le côté le moins performant", () => {
  test("CPS : 220 à droite et 190 à gauche donnent le record gauche de 190", () => {
    const [entry] = topByAxis(
      CPS,
      [luna],
      [trial(luna.id, CPS, 220, "D"), trial(luna.id, CPS, 190, "G")],
    );
    expect(entry).toMatchObject({ score: noteFromRaw(CPS, 190), rawScore: 190, side: "G" });
  });

  test("le côté droit est retenu quand il est moins performant", () => {
    expect(
      topByAxis(CPS, [luna], [trial(luna.id, CPS, 220, "G"), trial(luna.id, CPS, 190, "D")])[0],
    ).toMatchObject({ rawScore: 190, side: "D" });
  });

  test("précision : 9/10 à droite et 7/10 à gauche donnent 14/20 à gauche", () => {
    expect(
      topByAxis(
        PRECISION,
        [luna],
        [trial(luna.id, PRECISION, 9, "D"), trial(luna.id, PRECISION, 7, "G")],
      )[0],
    ).toMatchObject({ score: 14, rawScore: 7, side: "G" });
  });

  for (const axis of [CPS, PRECISION]) {
    test(`${axis} exige les deux côtés et ne devine pas le côté des anciens résultats`, () => {
      const raw = axis === CPS ? 200 : 8;
      expect(
        topByAxis(axis, [luna], [trial(luna.id, axis, raw, "G"), trial(luna.id, axis, raw)]),
      ).toEqual([]);
    });
  }

  test("compare les records personnels par côté sans retenir un ancien essai moins bon", () => {
    const trials = [
      trial(luna.id, CPS, 140, "G"),
      trial(luna.id, CPS, 190, "G"),
      trial(luna.id, CPS, 170, "G"),
      trial(luna.id, CPS, 220, "D"),
    ];
    expect(topByAxis(CPS, [luna], trials)[0]).toMatchObject({ rawScore: 190, side: "G" });
    expect(topByAxis(CPS, [luna], [...trials].reverse())[0]).toMatchObject({
      rawScore: 190,
      side: "G",
    });
  });

  test("distingue les scores bruts même quand ils partagent la même note /20", () => {
    const trials = [
      trial(luna.id, CPS, 184, "G"),
      trial(luna.id, CPS, 187, "G"),
      trial(luna.id, CPS, 190, "D"),
    ];
    expect(topByAxis(CPS, [luna], trials)[0]).toMatchObject({ rawScore: 187, side: "G" });
  });

  test("exclut les exercices CPS, les résultats sans note et les sportifs inexistants", () => {
    const trials = [
      trial(luna.id, CPS, 190, "G"),
      trial(luna.id, CPS, 220, "D"),
      trial(luna.id, CPS, 1000, "G", { duration: 180 }),
      trial(luna.id, CPS, 1000, "D", { score: null }),
      trial("inconnu", CPS, 500, "G"),
      trial("inconnu", CPS, 500, "D"),
    ];
    expect(topByAxis(CPS, [luna], trials)).toHaveLength(1);
    expect(topByAxis(CPS, [luna], trials)[0]).toMatchObject({ rawScore: 190, side: "G" });
  });

  test("calcule le podium sur le côté faible et garde un seul rang par sportif", () => {
    const athletes = ["A", "B", "C", "D", "E"].map(athlete);
    const trials = [
      trial("A", CPS, 100, "G"),
      trial("A", CPS, 400, "D"),
      trial("B", CPS, 240, "G"),
      trial("B", CPS, 230, "D"),
      trial("C", CPS, 220, "G"),
      trial("C", CPS, 210, "D"),
      trial("D", CPS, 200, "G"),
      trial("D", CPS, 190, "D"),
      trial("E", CPS, 500, "G"),
    ];
    expect(topByAxis(CPS, athletes, trials).map((entry) => entry.athlete.id)).toEqual([
      "B",
      "C",
      "D",
    ]);
  });

  test("les autres axes continuent de retenir le meilleur résultat sans exiger deux côtés", () => {
    const axis: Axis = "Mémoire billard";
    expect(
      topByAxis(axis, [luna], [trial(luna.id, axis, 4), trial(luna.id, axis, 8)])[0],
    ).toMatchObject({ score: 8, rawScore: 8 });
  });

  test("la suppression du seul résultat d'un côté retire le sportif du podium", () => {
    expect(topByAxis(CPS, [luna], [trial(luna.id, CPS, 190, "G")])).toEqual([]);
  });
});
