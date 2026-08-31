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
    rawLabel: "Clics obtenus au test CPS",
    ranges: rangesFromBounds([
      [0, 25],
      [26, 50],
      [51, 65],
      [66, 80],
      [81, 95],
      [96, 110],
      [111, 125],
      [126, 140],
      [141, 165],
      [166, 180],
      [181, 195],
      [196, 210],
      [211, 225],
      [226, 240],
      [241, 255],
      [256, 270],
      [271, 285],
      [286, 300],
      [301, 310],
      [311, 320],
      [321, Number.POSITIVE_INFINITY],
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
      [73, 79],
      [80, 87],
      [88, Number.POSITIVE_INFINITY],
    ]),
  },
  testNeuroVisuel: {
    id: "testNeuroVisuel",
    label: "Test neuro visuel",
    rawLabel: "Score brut du test",
    ranges: rangesFromBounds([
      [0, 3],
      [4, 5],
      [6, 7],
      [8, 9],
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
      [35, 36],
      [37, 39],
      [40, 42],
      [43, 46],
      [47, 51],
      [52, 59],
      [60, Number.POSITIVE_INFINITY],
    ]),
  },
  reseauxAttentionnels: {
    id: "reseauxAttentionnels",
    label: "Réseaux attentionnels",
    rawLabel: "Score brut du test",
    ranges: rangesFromBounds([
      [0, 99],
      [100, 102],
      [103, 107],
      [108, 111],
      [112, 117],
      [118, 123],
      [124, 129],
      [130, 135],
      [136, 141],
      [142, 149],
      [150, 156],
      [157, 163],
      [164, 170],
      [171, 177],
      [178, 183],
      [184, 188],
      [189, 192],
      [193, 195],
      [196, 198],
      [199, 201],
      [202, Number.POSITIVE_INFINITY],
    ]),
  },
  stroop: {
    id: "stroop",
    label: "Interférence Stroop",
    rawLabel: "Score brut du test",
    ranges: rangesFromBounds([
      [0, 99],
      [100, 102],
      [103, 107],
      [108, 111],
      [112, 117],
      [118, 123],
      [124, 129],
      [130, 135],
      [136, 141],
      [142, 149],
      [150, 156],
      [157, 163],
      [164, 170],
      [171, 177],
      [178, 183],
      [184, 188],
      [189, 192],
      [193, 195],
      [196, 198],
      [199, 201],
      [202, Number.POSITIVE_INFINITY],
    ]),
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
      [39, 41],
      [42, 44],
      [45, 47],
      [48, 50],
      [51, 52],
      [53, 54],
      [55, 57],
      [58, 61],
      [62, 66],
      [67, 71],
      [72, 76],
      [77, Number.POSITIVE_INFINITY],
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
