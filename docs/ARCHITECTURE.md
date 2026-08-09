# Architecture cible : découplage événementiel (SNS/SQS/Lambda)

Ce document décrit une proposition de refonte de l'architecture actuelle (voir [Readme.md](../Readme.md) et [docker-compose.yml](../docker-compose.yml)) pour découpler les microservices auxiliaires de l'application principale via des événements asynchrones, plutôt que des appels HTTP synchrones.

> Statut : **proposition**, non implémentée. Aucune ressource AWS ni code Lambda n'existe encore dans le repo à ce stade.

## Pourquoi

Aujourd'hui, `app` (server.js) appelle `mail` et `moment` en HTTP synchrone, et `upload` gère les fichiers via un stockage local monté en volume. Ce couplage fort a plusieurs conséquences :
- une latence ou une panne de `mail` peut ralentir ou faire échouer une inscription utilisateur,
- un fichier uploadé passe par le conteneur `app`/`upload` (bande passante, stockage local à gérer),
- ajouter un nouveau traitement sur un événement (ex : générer une miniature après upload) oblige à modifier le service appelant.

## Vue d'ensemble

```text
Browser
   │
   ▼
┌─────────────────────┐        ┌──────────────┐
│  app (ECS Fargate)   │──────► │  MySQL (RDS) │
│  server.js (API sync)│        └──────────────┘
└─────────┬────────────┘
          │ publie des événements (plus d'appel HTTP direct)
          ▼
   ┌───────────────────────────┐
   │        SNS Topics         │
   │  - user-events            │
   └──────────────┬────────────┘
                   │
                   ▼
              ┌─────────┐        ┌────────┐
              │ SQS      │        │  S3    │◄── upload direct (presigned URL,
              │ mail-q   │        │ bucket │     l'app ne reçoit plus le binaire)
              └────┬─────┘        └───┬────┘
                   ▼                  │ S3 event notification
              ┌─────────┐             ▼
              │ Lambda   │        ┌───────────────┐
              │ mail-    │        │  SNS topic     │  (fan-out : plusieurs
              │ sender   │        │  upload-events │   consommateurs
              │ (SES)    │        └──────┬─────────┘   indépendants)
              └─────────┘                │
                              ┌──────────┴──────────┐
                              ▼                      ▼
                        ┌───────────┐         ┌──────────────┐
                        │ SQS +     │         │ SQS +        │
                        │ Lambda    │         │ Lambda       │
                        │ thumbnail │         │ metadata/scan│
                        └─────┬─────┘         └──────┬───────┘
                              └──────────┬────────────┘
                                         ▼
                              MySQL (update statut) ou
                              événement music.processed
```

## Détail par service

### `mail` → SQS + Lambda

Un seul producteur (`app`), un seul type de consommateur : une simple file SQS suffit, sans SNS. `app` publie un message (`user.registered`, `password.reset`, `music.shared`) sur `mail-q`. Une Lambda déclenchée par SQS (event source mapping) envoie l'email via **SES** (recommandé, plus fiable que le SMTP custom actuel en production) avec retry automatique et une DLQ pour les échecs persistants.

Gain : l'inscription ne bloque plus sur la latence SMTP, et un échec d'envoi ne fait plus échouer la requête utilisateur.

### `upload` → S3 direct + SNS fan-out + Lambdas

Changement structurel : au lieu que le binaire passe par un conteneur (`multer`), `app` génère une URL S3 présignée et le navigateur upload directement sur S3. L'événement S3 (`ObjectCreated`) part vers un topic SNS, qui fan-out vers plusieurs files SQS indépendantes (génération de miniature, extraction de métadonnées, scan antivirus...). Chaque Lambda peut être ajoutée ou retirée sans toucher au code de `app`.

C'est le cas d'usage typique où SNS+SQS a du sens : plusieurs consommateurs découplés du même événement.

### `moment` → à supprimer ou à garder en synchrone

Ce service ne fait qu'un calcul d'heure sans aucun I/O. Ce n'est pas un bon candidat pour du messaging asynchrone : c'est une requête de lecture qui doit répondre immédiatement au rendu de page. Deux options :
- (a) le rapatrier directement dans `server.js` — supprime un service HTTP entier pour une logique de 5 lignes ;
- (b) si le serverless est souhaité partout, en faire une petite Lambda derrière API Gateway, mais sans SNS/SQS puisqu'elle répond de façon synchrone à une requête HTTP.

## Compromis à connaître

- **Consistance éventuelle** : l'envoi d'email et le traitement d'upload ne sont plus visibles synchroniquement. Il faut exposer un statut (`pending`/`processed`) à l'utilisateur plutôt qu'une réponse immédiate.
- **Idempotence obligatoire** : SQS délivre "au moins une fois" (doublons possibles) — chaque Lambda doit être idempotente (ex : vérifier si l'email a déjà été envoyé pour cet id d'événement).
- **Dev local plus complexe** : `docker compose` reste pertinent pour `app` + `mysql`, mais SNS/SQS/Lambda en local nécessitent LocalStack ou le SAM CLI — ce n'est plus juste `docker compose up`.
- **Coût/latence** : Lambda a un cold start, acceptable pour du traitement en arrière-plan (mail, miniatures), mais ce n'est pas adapté pour remplacer les endpoints synchrones de `app`.

## Prochaines étapes possibles

- Choisir l'outil d'infrastructure as code (Terraform ou AWS SAM/CDK) pour définir topics SNS, files SQS, bucket S3, fonctions Lambda et rôles IAM.
- Décider SES vs SMTP pour `mail-sender`.
- Trancher sur le devenir de `moment` (suppression ou Lambda + API Gateway).
- Définir la structure des topics/événements (un topic générique avec attributs de filtrage, ou un topic par domaine).

Aucune de ces étapes n'est implémentée à ce stade — ce document sert de base de discussion avant tout développement.
