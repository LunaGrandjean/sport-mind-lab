# Ballons de l’exercice de défilement

Six planches PNG transparentes, chacune contenant trois coloris d’un même sport, de gauche à droite. Chaque planche mesure 2172 × 724 px et se lit en trois cases carrées avec `background-size: 300% 100%` et `background-position: 0%, 50%, 100%`.

| Fichier | Coloris |
| --- | --- |
| rugby.png | Blanc et marine, blanc et rouge, blanc et turquoise |
| football.png | Blanc et noir, blanc et bleu, blanc et rouge |
| american.png | Marron, bordeaux, marine |
| basketball.png | Orange, bleu, rouge |
| handball.png | Vert et blanc, orange et marine, violet et vert citron |
| beach-volley.png | Jaune/bleu/blanc, orange/turquoise/blanc, rose/bleu/blanc |

Visuels créés avec l’outil intégré `image_gen.imagegen`, sans marque ni texte. Les proportions et bandes colorées des ballons de rugby s’inspirent de la référence fournie par l’utilisateur. Les prompts complets sont conservés dans [prompts.json](./prompts.json).

Les couleurs varient au sein d’un sport : le comptage porte sur le sport, toutes couleurs confondues. Les fichiers sont chargés et décodés avant le démarrage de l’exercice.
