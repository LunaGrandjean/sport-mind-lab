import type { Axis } from "@/lib/domain";
import type { Athlete } from "@/lib/domain";

export interface HtmlTool {
  id: string;
  title: string;
  description: string;
  objective: string;
  instructions: string;
  htmlPath: string;
  axis?: Axis;
  type: "test" | "application";
}

export const HTML_TESTS: HtmlTool[] = [
  {
    id: "cps",
    title: "Vitesse motrice / CPS",
    axis: "Vitesse motrice / CPS",
    type: "test",
    htmlPath: "/tests/test_CPS.html",
    description: "Vitesse de frappe, endurance motrice et évolution du rythme.",
    objective: "Mesurer la capacité à produire des réponses motrices rapides et répétées.",
    instructions: "Le sportif appuie le plus vite possible pendant la durée du test.",
  },
  {
    id: "captation-visuelle",
    title: "Captation information visuelle",
    axis: "Captation information visuelle",
    type: "test",
    htmlPath: "/tests/test_captation_information_visuelle.html",
    description: "Discrimination visuelle rapide et temps de réponse.",
    objective: "Évaluer la vitesse de prise d'information sur stimulus bref.",
    instructions: "Identifier rapidement si deux stimuli correspondent, puis répondre.",
  },
  {
    id: "suivi-multi-objets",
    title: "Suivi visuel multi-objets",
    axis: "Suivi visuel multi-objets",
    type: "test",
    htmlPath: "/tests/test_suivi_visuel_objets_multiples.html",
    description: "Suivi attentionnel de plusieurs objets en mouvement.",
    objective: "Mesurer la capacité à suivre plusieurs cibles malgré les distracteurs.",
    instructions: "Observer les cibles, mémoriser leur trajectoire, puis répondre.",
  },
  {
    id: "vision-peripherique",
    title: "Vision périphérique",
    axis: "Vision périphérique",
    type: "test",
    htmlPath: "/tests/test_vision_peripherique.html",
    description: "Détection périphérique et vitesse d'identification.",
    objective: "Évaluer la prise d'information dans le champ attentionnel périphérique.",
    instructions: "Fixer le centre et signaler les apparitions périphériques.",
  },
  {
    id: "memoire-billard",
    title: "Mémoire billard",
    axis: "Mémoire billard",
    type: "test",
    htmlPath: "/tests/test_memoire_billard.html",
    description: "Mémorisation de séquences spatiales.",
    objective: "Tester la mémoire de travail visuo-spatiale.",
    instructions: "Observer la séquence puis la restituer dans l'ordre demandé.",
  },
];

export const PRACTICE_APPS: HtmlTool[] = [
  {
    id: "defilement-ballons",
    title: "Défilement ballons",
    type: "application",
    htmlPath: "/tests/defilement_ballons.html",
    description: "Attention visuelle, poursuite et comptage sous charge.",
    objective: "Travailler le suivi de plusieurs informations en mouvement.",
    instructions: "Observer les ballons puis répondre au comptage demandé.",
  },
  {
    id: "suivi-laser",
    title: "Suivi de laser",
    type: "application",
    htmlPath: "/tests/Suivi-des-lasers.html",
    description: "Pointage de cibles, suivi continu et mode Pac-Man.",
    objective: "Travailler la coordination visuo-motrice et la précision.",
    instructions: "Choisir le mode, le niveau puis réaliser la tâche.",
  },
  {
    id: "memoire-defilement",
    title: "Mémoire en défilement",
    type: "application",
    htmlPath: "/tests/Memoire-en-defilements.html",
    description: "Mémoire de travail sous contrainte de mouvement.",
    objective: "Travailler la mémorisation d'informations en mouvement.",
    instructions: "Lire, mémoriser puis restituer la séquence.",
  },
  {
    id: "triple-tache",
    title: "Triple tâche",
    type: "application",
    htmlPath: "/tests/Reflexions-en-triple-taches.html",
    description: "Calcul, attention et mémorisation en double/triple charge.",
    objective: "Travailler le maintien de plusieurs tâches en parallèle.",
    instructions: "Suivre les consignes affichées et restituer les réponses.",
  },
  {
    id: "son-aleatoire",
    title: "Son aléatoire",
    type: "application",
    htmlPath: "/tests/son-aleatoire.html",
    description: "Réaction auditive et consignes de double tâche.",
    objective: "Déclencher des sons à associer à des réponses motrices.",
    instructions: "Utiliser cette app seule ou le panneau sons flottant pendant un autre test.",
  },
  {
    id: "komboid",
    title: "Komboid",
    type: "application",
    htmlPath: "/tests/entrainement_komboid.html",
    description: "Enchaînements visuo-moteurs et coordination.",
    objective: "Travailler la dissociation motrice et la précision dans une tâche rythmée.",
    instructions: "Choisir le mode puis suivre les stimuli affichés.",
  },
  {
    id: "des-basiques",
    title: "Dés basiques",
    type: "application",
    htmlPath: "/tests/DICE-des-basiques.html",
    description: "Lecture rapide de dés et prise d'information.",
    objective: "Travailler la vitesse de lecture et de décision.",
    instructions: "Lancer l'exercice et répondre selon les consignes.",
  },
  {
    id: "des-rotation",
    title: "Dés rotation",
    type: "application",
    htmlPath: "/tests/DICE-des-qui-tournent.html",
    description: "Lecture de dés en rotation et flexibilité visuelle.",
    objective: "Travailler la captation d'information dans une configuration dynamique.",
    instructions: "Observer les dés en mouvement puis répondre selon la consigne.",
  },
];

export const MANUAL_SCORE_AXES: Axis[] = [
  "Dissociation motrice",
  "Précision motrice",
  "Attention",
  "Inhibition",
  "Temps perception / traitement / décision / réaction",
];

export function findTool(id: string) {
  return [...HTML_TESTS, ...PRACTICE_APPS].find((tool) => tool.id === id);
}

export function toolUrlWithAthlete(path: string, athlete: Athlete) {
  const params = new URLSearchParams({
    nom: athlete.nom || "Session",
    prenom: athlete.prenom || "Sportif",
    age: athlete.age ? String(athlete.age) : "",
  });
  return `${path}?${params.toString()}`;
}
