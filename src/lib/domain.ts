// Domaine métier : types, axes du radar et helpers.
// Aucune dépendance UI ici : facile à brancher sur une vraie persistance.

export const AXES = [
  "Dissociation motrice",
  "Précision motrice",
  "Vitesse motrice / CPS",
  "Mémoire billard",
  "Suivi visuel multi-objets",
  "Captation information visuelle",
  "Vision périphérique",
  "Attention",
  "Inhibition",
  "Temps perception / traitement / décision / réaction",
] as const;

export type Axis = (typeof AXES)[number];

/** Libellés courts pour l'affichage du radar. */
export const AXIS_SHORT: Record<Axis, string> = {
  "Dissociation motrice": "Dissociation",
  "Précision motrice": "Précision",
  "Vitesse motrice / CPS": "Vitesse / CPS",
  "Mémoire billard": "Mémoire billard",
  "Suivi visuel multi-objets": "Suivi multi-objets",
  "Captation information visuelle": "Captation visuelle",
  "Vision périphérique": "Périphérique",
  Attention: "Attention",
  Inhibition: "Inhibition",
  "Temps perception / traitement / décision / réaction": "Temps de réaction",
};

export type Sexe = "Homme" | "Femme";

export interface Athlete {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  sexe: Sexe;
  discipline: string;
  poste: string;
  pathologie: string;
  niveau: string;
}

export interface Result {
  id: string;
  athleteId: string;
  axis: Axis;
  score: number;
  rawScore?: number;
  mode: string;
  niveau: string;
  commentaire?: string;
  date: string;
  source: "test" | "manuel";
}

export interface SessionNote {
  id: string;
  athleteId: string;
  date: string;
  title: string;
  content: string;
  objectives?: string;
  nextSteps?: string;
}

export type GroupKey =
  | "tous"
  | "discipline"
  | "poste"
  | "sexe"
  | "age"
  | "niveau"
  | "pathologie";

export const GROUP_LABELS: Record<GroupKey, string> = {
  tous: "Tous les sportifs",
  discipline: "Même discipline",
  poste: "Même poste",
  sexe: "Même sexe",
  age: "Même tranche d'âge (± 3 ans)",
  niveau: "Même niveau sportif",
  pathologie: "Même pathologie",
};

export function fullName(a: Athlete) {
  return `${a.prenom} ${a.nom}`;
}

export function matchesGroup(ref: Athlete, other: Athlete, key: GroupKey) {
  switch (key) {
    case "tous":
      return true;
    case "discipline":
      return other.discipline === ref.discipline;
    case "poste":
      return other.poste === ref.poste;
    case "sexe":
      return other.sexe === ref.sexe;
    case "age":
      return Math.abs(other.age - ref.age) <= 3;
    case "niveau":
      return other.niveau === ref.niveau;
    case "pathologie":
      return other.pathologie === ref.pathologie;
  }
}

/** Moyenne par axe pour un ensemble de résultats. */
export function averageByAxis(results: Result[]): Record<Axis, number | null> {
  const out = {} as Record<Axis, number | null>;
  for (const axis of AXES) {
    const scores = results.filter((r) => r.axis === axis).map((r) => r.score);
    out[axis] = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  }
  return out;
}

export const DISCIPLINES = [
  "Football",
  "Basketball",
  "Handball",
  "Rugby",
  "Tennis",
  "Athlétisme",
];

export const NIVEAUX = ["Loisir", "Régional", "National", "Professionnel", "Élite"];

export const MODES = [
  "Standard",
  "Protocole court",
  "Protocole long",
  "Double tâche",
  "Retour de blessure",
];
