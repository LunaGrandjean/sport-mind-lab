import { AXES, type Athlete, type Result } from "./domain";

export const MOCK_ATHLETES: Athlete[] = [
  {
    id: "a1",
    nom: "Moreau",
    prenom: "Julien",
    age: 24,
    sexe: "Homme",
    discipline: "Football",
    poste: "Milieu central",
    pathologie: "Aucune",
    niveau: "Professionnel",
  },
  {
    id: "a2",
    nom: "Lefevre",
    prenom: "Camille",
    age: 21,
    sexe: "Femme",
    discipline: "Basketball",
    poste: "Meneuse",
    pathologie: "Entorse cheville (J+45)",
    niveau: "National",
  },
  {
    id: "a3",
    nom: "Bernard",
    prenom: "Thomas",
    age: 28,
    sexe: "Homme",
    discipline: "Rugby",
    poste: "Demi de mêlée",
    pathologie: "Commotion (J+90)",
    niveau: "Professionnel",
  },
  {
    id: "a4",
    nom: "Nguyen",
    prenom: "Léa",
    age: 19,
    sexe: "Femme",
    discipline: "Handball",
    poste: "Ailière",
    pathologie: "Aucune",
    niveau: "Régional",
  },
  {
    id: "a5",
    nom: "Garcia",
    prenom: "Marc",
    age: 26,
    sexe: "Homme",
    discipline: "Football",
    poste: "Gardien",
    pathologie: "Aucune",
    niveau: "National",
  },
];

// Générateur déterministe pour des données d'exemple stables (pas de flicker SSR).
function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const MOCK_RESULTS: Result[] = MOCK_ATHLETES.flatMap((athlete, ai) =>
  AXES.map((axis, xi) => {
    const seed = ai * 31 + xi * 7 + 1;
    const base = 52 + Math.round(pseudoRandom(seed) * 42);
    return {
      id: `r-${athlete.id}-${xi}`,
      athleteId: athlete.id,
      axis,
      score: Math.min(98, base),
      mode: xi % 3 === 0 ? "Protocole court" : "Standard",
      niveau: athlete.niveau,
      commentaire: "",
      date: new Date(2026, 5 + (xi % 3), 3 + xi).toISOString(),
      source: xi % 4 === 0 ? "manuel" : "test",
    } satisfies Result;
  }),
);
