import type { Axis } from "@/lib/domain";

export const RADAR_MAX_SCORE = 20;

export interface BaremeRange {
  min: number;
  max: number;
  note: number;
}

export interface Bareme {
  id: string;
  label: string;
  rawLabel: string;
  ranges: BaremeRange[];
}

function rangesFromBounds(bounds: Array<[number, number]>) {
  return bounds.map(([min, max], note) => ({ min, max, note }));
}

function exactHalfStep(maxRaw: number) {
  const ranges: BaremeRange[] = [];
  for (let note = 0; note <= RADAR_MAX_SCORE; note += 1) {
    const raw = note / 2;
    if (raw <= maxRaw) ranges.push({ min: raw, max: raw, note });
  }
  return ranges;
}

function exactInteger(maxRaw: number) {
  return Array.from({ length: maxRaw + 1 }, (_, note) => ({
    min: note,
    max: note,
    note,
  }));
}

function steppedRanges(start: number, step: number, firstMax: number) {
  const ranges: BaremeRange[] = [{ min: 0, max: firstMax, note: 0 }];
  for (let note = 1; note < RADAR_MAX_SCORE; note += 1) {
    const min = start + (note - 1) * step;
    ranges.push({ min, max: min + step - 1, note });
  }
  const lastMin = start + (RADAR_MAX_SCORE - 1) * step;
  ranges.push({ min: lastMin, max: Number.POSITIVE_INFINITY, note: RADAR_MAX_SCORE });
  return ranges;
}

export const BAREMES = {
  haltere10: {
    id: "haltere10",
    label: "Haltère 10 essais",
    rawLabel: "Résultat brut obtenu",
    ranges: exactHalfStep(10),
  },
  cps: {
    id: "cps",
    label: "CPS",
    rawLabel: "Score CPS barème (équivalent 60s)",
    ranges: rangesFromBounds([
      [0, 25],
      [26, 50],
      [51, 80],
      [81, 95],
      [96, 110],
      [111, 125],
      [126, 140],
      [141, 155],
      [156, 180],
      [181, 195],
      [196, 210],
      [211, 225],
      [226, 240],
      [241, 255],
      [256, 270],
      [271, 295],
      [296, 300],
      [301, 310],
      [311, 320],
      [321, 330],
      [331, Number.POSITIVE_INFINITY],
    ]),
  },
  boulesBillard: {
    id: "boulesBillard",
    label: "Boules de billard",
    rawLabel: "Niveau / score brut",
    ranges: exactInteger(20),
  },
  labyrinthe: {
    id: "labyrinthe",
    label: "Labyrinthe 1-10",
    rawLabel: "Niveau atteint",
    ranges: exactInteger(20),
  },
  visionPeripherique: {
    id: "visionPeripherique",
    label: "Vision périphérique",
    rawLabel: "Score brut du test",
    ranges: rangesFromBounds([
      [0, 3],
      [4, 6],
      [7, 10],
      [11, 14],
      [15, 18],
      [19, 22],
      [23, 26],
      [27, 30],
      [31, 34],
      [35, 37],
      [38, 41],
      [42, 45],
      [46, 49],
      [50, 53],
      [54, 57],
      [58, 61],
      [62, 66],
      [67, 72],
      [73, 80],
      [81, 87],
      [88, Number.POSITIVE_INFINITY],
    ]),
  },
  testNeuroVisuel: {
    id: "testNeuroVisuel",
    label: "Test neuro visuel",
    rawLabel: "Score brut du test",
    ranges: rangesFromBounds([
      [0, 3],
      [4, 6],
      [7, 9],
      [10, 11],
      [12, 14],
      [15, 17],
      [18, 20],
      [21, 23],
      [24, 26],
      [27, 28],
      [29, 30],
      [31, 32],
      [33, 34],
      [35, 38],
      [39, 43],
      [44, 46],
      [47, 51],
      [52, 56],
      [57, 60],
      [61, 65],
      [66, Number.POSITIVE_INFINITY],
    ]),
  },
  reseauxAttentionnels: {
    id: "reseauxAttentionnels",
    label: "Réseaux attentionnels",
    rawLabel: "Score brut du test",
    ranges: steppedRanges(100, 8, 99),
  },
  stroop: {
    id: "stroop",
    label: "Interférence Stroop",
    rawLabel: "Score brut du test",
    ranges: steppedRanges(100, 6, 99),
  },
  uneCouleur: {
    id: "uneCouleur",
    label: "Une couleur",
    rawLabel: "Score brut du test",
    ranges: rangesFromBounds([
      [0, 0],
      [1, 4],
      [5, 9],
      [10, 14],
      [15, 19],
      [20, 24],
      [25, 29],
      [30, 34],
      [35, 38],
      [39, 43],
      [44, 45],
      [46, 50],
      [51, 52],
      [53, 54],
      [55, 57],
      [58, 59],
      [62, 66],
      [67, 71],
      [72, 76],
      [77, 85],
      [86, Number.POSITIVE_INFINITY],
    ]),
  },
} satisfies Record<string, Bareme>;

type BaremeKey = keyof typeof BAREMES;

export const AXIS_BAREME: Record<Axis, BaremeKey> = {
  "Dissociation motrice": "haltere10",
  "Précision motrice": "haltere10",
  "Vitesse motrice / CPS": "cps",
  "Mémoire billard": "boulesBillard",
  "Suivi visuel multi-objets": "testNeuroVisuel",
  "Captation information visuelle": "testNeuroVisuel",
  "Vision périphérique": "visionPeripherique",
  Attention: "reseauxAttentionnels",
  Inhibition: "stroop",
  "Temps perception / traitement / décision / réaction": "uneCouleur",
};

export function baremeForAxis(axis: Axis) {
  return BAREMES[AXIS_BAREME[axis]];
}

export function noteFromRaw(axis: Axis, rawScore: number) {
  const bareme = baremeForAxis(axis);
  const range = bareme.ranges.find(
    (item) => rawScore >= item.min && rawScore <= item.max,
  );
  return range?.note ?? null;
}

export function clampRadarScore(score: number) {
  return Math.max(0, Math.min(RADAR_MAX_SCORE, score));
}
