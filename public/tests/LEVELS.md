# Progression au-delà des niveaux initiaux

Les niveaux initiaux gardent leur calibration. Les niveaux supplémentaires augmentent désormais la difficulté, au lieu de répéter la dernière configuration. La numérotation continue ; les conditions d’erreur et les corrections de chaque exercice sont conservées.

| Exercice | Calibration initiale | Progression supplémentaire |
| --- | --- | --- |
| Vision périphérique | Niveaux 1–70 | Durée multipliée par 0,97 par niveau, jusqu’à 16 ms ; cercles progressivement plus petits (32 px minimum) ; jusqu’à 12 cercles périphériques ; ouvertures des distracteurs plus variées. |
| Captation visuelle | Tableau initial de durées | Durée multipliée par 0,97 par niveau, jusqu’à 16 ms ; orientations des non-matchs plus proches, jusqu’à un écart de 15°. La couleur reste un distracteur. |
| Émotions | Niveaux 1–70 | Durée multipliée par 0,97 par niveau, jusqu’à 16 ms ; portraits progressivement réduits jusqu’à la moitié de leur taille. Les portraits des corrections gardent leur taille habituelle. |
| Suivi visuel multi-objets | Niveaux 1–20, grille du fichier d’origine | Montée en vitesse d’origine reproduite explicitement : facteur de déplacement égal au niveau jusqu’à 20, avec une référence de 60 Hz et une seule boucle. Au-delà, vitesse et variation croissantes ; jusqu’à 30 boules. Les réponses proposées et l’espace du jeu s’adaptent au nombre de boutons. |
| Mémoire billard | Niveaux 1–20 | La séquence continue de s’allonger : niveau + 1 chiffres. |
| Suivi de laser | Niveaux 1–20 | Cibles plus petites, mouvements plus rapides, davantage de distracteurs (jusqu’à 30) et de Pacman (jusqu’à 20). Le bonus de vitesse du niveau 20 reste acquis aux niveaux suivants. |
| Mémoire en défilement | Niveaux 1–20 | Plus de chiffres à mémoriser (jusqu’à 40) et passages plus rapides (40 ms minimum). |
| Défilement ballons | Niveaux 1–20 | Densité et nombre maximal par sport augmentés ; taille réduite progressivement ; passages plus rapides. |
| Triple tâche | Niveaux 1–40 | Les mots du Stroop apparaissent plus brièvement, jusqu’à 160 ms. |

Les bornes sur les paramètres d’affichage évitent les durées nulles ou négatives, les éléments trop petits et un nombre excessif d’objets. Les durées réelles des apparitions très brèves dépendent aussi du navigateur et du rafraîchissement de l’écran.

## Suivi visuel : référence et animation

La grille d’origine des 20 niveaux conserve ses effectifs, vitesses de base et amplitudes de variation. Les changements de vitesse et de direction interviennent toutes les 400 ms ; l’amplitude angulaire reste celle du fichier fourni. L’ancienne version accumulait une boucle par niveau : à 60 Hz, le niveau 20 déplaçait donc les boules de 20 fois la vitesse de base par image. Cette montée est maintenant explicite et calculée d’après le temps écoulé, pour garder une vitesse comparable sur les écrans à 30, 60 ou 120 Hz. Les erreurs ne créent plus d’animation supplémentaire. Le fond propre à cet exercice est bordeaux (`#701b35`).
