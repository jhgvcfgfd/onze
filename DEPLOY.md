# Mise en ligne d’Onze

## Tester en local

```sh
npm install
npm start
```

Ouvre ensuite `http://localhost:3000`. Crée un compte avec un pseudo unique et un mot de passe de 10 caractères minimum. Le serveur sert le jeu et les connexions WebSocket sur la même adresse.

## Hébergement conseillé : Railway

1. Envoie le projet sur un dépôt GitHub.
2. Dans Railway, crée un projet depuis ce dépôt. La commande de démarrage est `npm start`.
3. Ajoute un volume persistant monté sur `/app/data` et définis `DATA_DIR=/app/data`.
4. Génère un domaine public dans les réglages du service. L’application et le matchmaking utilisent ce même domaine ; Railway prend en charge les WebSockets.

N’utilise pas un hébergement de fichiers statiques uniquement : le matchmaking, la simulation des matchs et l’ELO ont besoin de `server.js` en fonctionnement. Les mots de passe sont hachés et les comptes, sessions et statistiques sont conservés dans `profiles.json` sur le volume. Les jetons de session restent dans le navigateur.

Les matchs sont arbitrés côté serveur. Le premier joueur à quatre buts gagne ; le forfait, la déconnexion et l’inactivité sont aussi arbitrés par le serveur. Par défaut, 45 secondes sans action entraînent un forfait automatique, précédé d’un avertissement 15 secondes avant. Tu peux modifier ce délai avec la variable `AFK_TIMEOUT_MS`.

Garde le volume persistant activé : sans lui, les comptes et les classements seraient réinitialisés lors du redémarrage du service.