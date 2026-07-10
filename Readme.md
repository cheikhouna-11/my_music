# My Music

Application web de partage et d’écoute de musique, développée avec Node.js, MySQL et des microservices auxiliaires pour l’upload, l’email et la détection du moment de la journée.

## Vue d’ensemble

My Music permet de :
- parcourir et rechercher des titres musicaux,
- partager une musique avec titre, artiste et fichier audio,
- liker une piste,
- suivre les téléchargements,
- consulter un profil utilisateur avec ses musiques partagées,
- s’inscrire ou se connecter via un flux d’authentification et OTP,
- afficher automatiquement un thème clair ou sombre selon l’heure du jour via le microservice de moment.

## Structure du projet

```text
my_music/
├── package.json
├── server.js
├── schema.sql
├── Readme.md
├── src/
│   ├── index.js
│   ├── backend/
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── checkdb.js
│   │       ├── downloads.js
│   │       ├── likes.js
│   │       ├── musiques.js
│   │       ├── profile.js
│   │       └── upload.js
│   ├── frontend/
│   │   ├── index.html
│   │   ├── profile.html
│   │   ├── css/
│   │   └── js/
│   └── service_auxiliere/
│       ├── mail/
│       ├── moment/
│       └── upload/
```

## Fonctionnalités actuelles

- serveur principal Node.js servant l’interface et les API
- API pour lister/créer des musiques
- API de profil utilisateur et suppression de musiques
- likes et comptage de téléchargements
- authentification avec inscription, login et vérification OTP
- upload de fichiers audio/cover via microservice
- microservice de moment pour déterminer si c’est le matin ou le soir
- thème automatique selon la période du jour

## Prérequis

- Node.js 18+
- MySQL disponible localement ou à distance
- npm

## Installation

```bash
npm install
```

## Configuration de la base de données

Créer une base MySQL puis définir les variables d’environnement suivantes :

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=my_music
```

Ensuite, importer le schéma SQL fourni dans [schema.sql](schema.sql).

## Démarrage rapide

### 1. Lancer le serveur principal

```bash
npm start
```

Le site est accessible sur :
- http://127.0.0.1:3000

### 2. Lancer les microservices auxiliaires

Mail :
```bash
cd src/service_auxiliere/mail
npm start
```

Upload :
```bash
cd src/service_auxiliere/upload
npm start
```

Moment :
```bash
cd src/service_auxiliere/moment
node moment.js
```

## API principales

- GET /api/musiques : liste des musiques
- POST /api/musiques : création d’une musique
- GET /api/profile : profil utilisateur et musiques associées
- DELETE /api/profile/:id : suppression d’une musique du profil
- POST /api/likes : bascule un like
- POST /api/downloads : enregistre un téléchargement
- POST /api/auth/register : inscription
- POST /api/auth/verify-otp : validation OTP
- POST /api/auth/login : connexion
- GET /api/checkdb : vérification du schéma de base de données

## Notes de développement

- Le fichier [schema.sql](schema.sql) contient la structure attendue de la base de données.
- Les microservices sont pensés pour fonctionner de façon indépendante.
- Le README doit être mis à jour à chaque évolution majeure du projet.

## Historique rapide

- 2026-07-10 : ajout du serveur principal et des routes API
- 2026-07-10 : ajout de l’authentification OTP et du profil utilisateur
- 2026-07-10 : ajout des likes, téléchargements et upload de fichiers
- 2026-07-10 : ajout du microservice de moment et du thème automatique
