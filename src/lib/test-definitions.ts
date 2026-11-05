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
    instructions: "Choisir librement la durée (30 secondes par défaut). Le sportif appuie sur Espace le plus vite possible ; le chronomètre démarre au premier appui.",
  },
  {
    id: "captation-visuelle",
    title: "Captation information visuelle",
    axis: "Captation information visuelle",
    type: "test",
    htmlPath: "/tests/test_captation_information_visuelle.html",
    description: "Discrimination visuelle rapide et temps de réponse.",
    objective: "Évaluer la vitesse de prise d'information sur stimulus bref.",
    instructions: "Répondre Match si les deux stimuli ont la même forme et la même orientation, sinon No Match. En mode Formes & couleurs, ignorer la couleur : c'est un distracteur.",
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
    id: "emotions-peripheriques",
    title: "Vision périphérique · Émotions",
    type: "application",
    htmlPath: "/tests/vision_peripherique_emotions.html",
    description: "Dix émotions, trois modes et des portraits réalistes au centre ou aux extrémités de l’écran.",
    objective: "Travailler la reconnaissance des expressions et la prise d’information en vision périphérique.",
    instructions: "Choisir le mode et le niveau de départ (1 par défaut). Fixer le centre ; après disparition des visages, X = même émotion, N = émotions différentes. En mode 3, choisir une émotion. Arrêt après deux erreurs avec corrections. M ou Échap pour les réglages.",
  },
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
    description: "Pointage fixe ou dynamique, suivi de cibles et mode Pac-Man.",
    objective: "Travailler la coordination visuo-motrice et la précision.",
    instructions: "Choisir le mode, le niveau puis réaliser la tâche.",
  },
  {
    id: "memoire-liaisons",
    title: "Mémoire des liaisons",
    type: "application",
    htmlPath: "/tests/memoire_des_liaisons.html",
    description: "Figures aléatoires sur sept points fixes, puis reproduction au laser.",
    objective: "Travailler la mémoire visuo-spatiale et la reproduction de liaisons en coordination motrice.",
    instructions: "Choisir le niveau et la durée. Espace affiche une figure ; après 3 secondes de pause, reproduire les liaisons sur les points noirs. Entrée affiche la correction. M ou Échap revient au menu.",
  },
  {
    id: "lecture-progressive",
    title: "Lecture progressive",
    type: "application",
    htmlPath: "/tests/lecture_progressive.html",
    description: "Un texte fixe, 22 niveaux cumulatifs et trois modes de lecture.",
    objective: "Travailler la lecture, l’attention visuelle et l’adaptation aux contraintes typographiques.",
    instructions: "Choisir le niveau et le mode : lignes, circulaire ou mots à l’envers. Flèche bas pour défiler ; M ou Échap pour les réglages.",
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
    title: "Dés",
    type: "application",
    htmlPath: "/tests/DICE.html",
    description: "Lecture rapide de dés, avec ou sans rotation.",
    objective: "Travailler la vitesse de lecture et de décision.",
    instructions: "Choisir le nombre et les couleurs des dés. Cocher Rotation pour le mode tournant, puis cliquer sur Lancer.",
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
