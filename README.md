# Neuro Sport Hub

Crée une application web professionnelle pour un cabinet de performance neurocognitive sportive.

L’application doit avoir une identité visuelle sérieuse, sportive et institutionnelle, basée sur un thème clair :

- blanc

- gris très clair

- noir

- rouge profond comme couleur d’accent

Je vais fournir un logo, il doit être utilisé dans la sidebar ou l’en-tête de façon propre et discrète.

Objectif de l’application :

Gérer des sportifs, saisir ou lancer des tests neurocognitifs, enregistrer les résultats, et afficher un tableau de bord avec un diagramme radar des performances.

Structure souhaitée :

1. Sidebar ou navigation latérale

- Logo

- Profil sportif sélectionné

- Champs : nom, prénom, âge, sexe, discipline, poste, pathologie, niveau sportif

- Navigation claire

2. Pages principales

- Accueil

- Résultats / Dashboard

- Tests

- Applications de travail

- Saisie manuelle

3. Dashboard / Résultats

Afficher :

- cartes statistiques propres

- nombre de sportifs

- nombre de résultats

- nombre de scores utilisés dans l’araignée

- diagramme radar professionnel

- comparaison avec des groupes : tous, discipline, poste, sexe, âge, niveau sportif, pathologie

- tableau ou cartes des meilleurs scores

Les 10 axes du diagramme radar sont :

- Dissociation motrice

- Précision motrice

- Vitesse motrice / CPS

- Mémoire billard

- Suivi visuel multi-objets

- Captation information visuelle

- Vision périphérique

- Attention

- Inhibition

- Temps perception / traitement / décision / réaction

4. Saisie manuelle

Créer un formulaire moderne permettant de saisir un score global pour :

- Dissociation motrice

- Précision motrice

- Attention

- Inhibition

- Temps perception / traitement / décision / réaction

Champs complémentaires :

- mode / protocole

- niveau

- commentaire

5. Tests

Prévoir une page qui liste les tests principaux lançables dans l’app :

- Vitesse motrice / CPS

- Captation information visuelle

- Suivi visuel multi-objets

- Vision périphérique

- Mémoire billard

Chaque test doit être présenté sous forme de carte professionnelle avec :

- titre

- objectif

- consigne courte

- bouton lancer

6. Applications de travail

Créer une page séparée pour les outils qui ne servent pas forcément à générer un score radar :

- Défilement ballons

- Suivi de laser

- Mémoire en défilement

- Triple tâche

- Son aléatoire

- Komboid

- Dés basiques

- Dés rotation

Ces outils doivent être présentés comme des applications d’entraînement ou de double tâche.

7. Module son aléatoire

Prévoir dans l’interface un petit panneau flottant ou latéral “Sons / double tâche” pouvant être utilisé en même temps qu’un test.

Il doit permettre :

- mode aléatoire

- mode séquence préparée

- choix de sons

- sons vocaux possibles : “ha”, “hé”, “ho”

- sons instrumentaux ou personnalisables

- bouton lecture / pause

- déclenchement possible au clavier avec espace

8. Design

Je veux une interface de type dashboard moderne :

- pas de page marketing

- pas de gros hero inutile

- cartes blanches

- coins légèrement arrondis

- bordures fines

- ombres très légères

- navigation compacte

- boutons rouges pour les actions principales

- excellente lisibilité

- responsive desktop/tablette

- rendu professionnel, pas enfantin

9. Important

Ne crée pas seulement une maquette statique.

Crée une base fonctionnelle avec :

- navigation entre les pages

- données mockées pour les sportifs et résultats

- radar chart avec données exemple

- formulaire de saisie fonctionnel côté front

- structure de composants claire

- code propre et facilement modifiable

Utilise React, TypeScript et Tailwind si possible.

Prévois une architecture simple, que je pourrai ensuite connecter à une vraie persistance des résultats.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1eaabbf5-0d48-45b2-8a5d-a256fd0f3b22).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
