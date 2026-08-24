import type { Athlete, Result } from "./domain";

export const EMPTY_ATHLETE: Athlete = {
  id: "athlete-1",
  nom: "",
  prenom: "",
  age: 0,
  sexe: "Homme",
  discipline: "",
  poste: "",
  pathologie: "",
  niveau: "",
};

export const INITIAL_ATHLETES: Athlete[] = [EMPTY_ATHLETE];

export const INITIAL_RESULTS: Result[] = [];
