# Portraits d’expressions

Les trois planches originales fournies par l’utilisateur dans le chat sont conservées sans modification :

- [planche-originale-1.png](planche-originale-1.png) — 1179 × 1166 pixels.
- [planche-originale-2.png](planche-originale-2.png) — 1179 × 800 pixels.
- [planche-originale-3.png](planche-originale-3.png) — 1179 × 846 pixels.

Chaque planche contient les dix expressions de la même personne :

| Ligne | Colonne 1 | Colonne 2 | Colonne 3 | Colonne 4 | Colonne 5 |
| --- | --- | --- | --- | --- | --- |
| Haut | Joie | Colère | Neutre | Tristesse | Dégoût |
| Bas | Mépris | Peur | Anxiété | Surprise | Frustration |

Les portraits sont affichés directement depuis ces fichiers. Les fenêtres de cadrage en pixels sont définies dans `PORTRAIT_SHEETS`, dans `../emotions-peripheriques.js`. Le cadrage CSS garde les expressions du visage et exclut les légendes, les bandes colorées et les marges blanches, pour ne pas donner d’indice sur la réponse. Aucune nouvelle image n’est générée.

Le menu, les trois modes d’exercice et les corrections utilisent les mêmes portraits d’origine. Les fichiers sont préchargés et décodés avant d’activer le démarrage.

Le niveau 1 dure 3 000 ms ; la durée diminue linéairement jusqu’à 30 ms au niveau 70. L’affichage effectif des durées très courtes reste limité par la fréquence de rafraîchissement de l’écran et l’ordonnanceur du navigateur.
