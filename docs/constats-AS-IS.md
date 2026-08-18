# My Music — Constats sur l'architecture actuelle (AS-IS), par pilier du Well-Architected Framework

Ce document accompagne le diagramme `AS-IS.drawio` et liste, pilier par pilier, les limites observées sur l'architecture actuelle de My Music (exécution locale via Docker Compose, validée le 16/08/2026). Chaque constat est directement lié à ce qui a été testé ou observé pendant l'exécution locale.

---

## 1. Excellence opérationnelle

- **Un seul environnement, sans séparation dev/prod.** Un unique `docker-compose.yml` sert à la fois de base de développement et de démonstration : aucune distinction de configuration entre un environnement de test et un environnement de production.
- **Absence d'Infrastructure as Code.** Le déploiement repose entièrement sur Docker Compose exécuté manuellement sur un poste local ; aucune définition versionnée et reproductible de l'infrastructure cible (Terraform, CloudFormation, CDK).
- **Aucune observabilité centralisée.** Les seuls logs disponibles sont ceux de `docker compose logs`, consultables uniquement en local et non persistés au-delà du cycle de vie des conteneurs. Aucune métrique, aucun tableau de bord, aucune alarme.
- **Déploiement non automatisé.** Aucun pipeline CI/CD : la mise à jour du code nécessite un rebuild manuel (`docker compose up --build`) exécuté à la main.

## 2. Sécurité

- **Secrets en clair.** Les identifiants de connexion MySQL (`DB_PASSWORD`, `DB_ROOT_PASSWORD`) et les identifiants SMTP Hostinger (`SMTP_USERNAME`, `SMTP_PASSWORD`) sont stockés en clair dans des fichiers `.env` sur le poste local. Ils ne sont pas commités (`.gitignore` vérifié), mais restent non chiffrés au repos et visibles de quiconque a accès à la machine.
- **Aucune segmentation réseau.** Tous les conteneurs partagent un unique réseau bridge Docker (`my_music_net`) sans notion de sous-réseaux publics/privés, de security groups ni de filtrage par flux.
- **Pas de gestion centralisée des secrets.** Aucun coffre-fort de type Secrets Manager / Parameter Store : chaque service relit ses propres variables d'environnement.
- **MySQL avec un compte applicatif dédié mais sans rotation ni chiffrement.** Le compte `my_music` (non-root) est une bonne pratique déjà en place, mais le mot de passe n'est ni généré aléatoirement, ni chiffré, ni soumis à rotation.
- **Chiffrement en transit partiel.** La connexion SMTP vers Hostinger utilise TLS (port 465), mais les échanges internes (`app` ↔ `mysql`, `app` ↔ `mail`, `app` ↔ `moment`) transitent en clair sur le réseau Docker local.

## 3. Fiabilité

- **Un seul point de défaillance par service.** Chaque composant (`app`, `mysql`, `mail`, `moment`) tourne en une seule instance. La panne d'un conteneur rend le service concerné totalement indisponible, sans aucun mécanisme de reprise automatique au-delà du `restart policy` local.
- **Couplage HTTP synchrone entre `app` et les microservices.** Confirmé pendant les tests : `app` appelle `mail` et `moment` en HTTP synchrone (`fetch` bloquant). Une lenteur ou une panne de `mail` peut retarder ou faire échouer une inscription utilisateur — observé indirectement via le healthcheck `depends_on: condition: service_healthy` qui bloque le démarrage de `app` tant que `mail` n'est pas prêt.
- **Aucune sauvegarde automatisée de la base de données.** Les données MySQL ne sont persistées que sur un volume Docker local (`mysql_data`) ; aucune stratégie de backup, de point-in-time recovery ni de réplication.
- **Aucune haute disponibilité.** Pas de load balancer, pas de bascule multi-instance, pas de tolérance à la panne d'une zone.
- **Bug applicatif détecté pendant les tests (hors périmètre infra, mais à noter) :** le microservice `moment` classe 17h comme "matin" — logique de calcul à vérifier, sans impact sur la disponibilité mais révélateur de l'absence de tests automatisés sur les microservices.

## 4. Performance

- **Aucun CDN.** Les fichiers audio et pochettes uploadés sont servis directement depuis le conteneur `app` (route `/uploads/...`), sans mise en cache ni distribution géographique.
- **Stockage non partagé, incompatible avec le scaling horizontal.** Les fichiers uploadés sont écrits sur un volume Docker local (`uploads_data`). Si plusieurs instances de `app` étaient lancées en parallèle, chaque instance verrait un système de fichiers différent — bloquant de fait toute tentative de montée en charge horizontale, constat confirmé en observant le montage `volumes:` du service `app`.
- **Dimensionnement non maîtrisé au départ.** La version de ton binôme fixe déjà des limites CPU/mémoire par service (`deploy.resources.limits`), bonne pratique à conserver et à affiner sur AWS (dimensionnement des tâches Fargate).
- **Microservice `upload` non exploité.** Un service dédié à l'upload existe (port 4002) mais n'est pas branché au frontend, qui passe par une route interne de `app` — incohérence d'architecture à trancher explicitement dans le TO-BE plutôt qu'à laisser par défaut.

## 5. Optimisation des coûts

- **Sans objet en environnement local**, mais transposé aux constats suivants pour préparer le TO-BE AWS :
- Aucune alerte budgétaire n'existe puisqu'il n'y a pas encore de facturation cloud à ce stade.
- Le dimensionnement actuel ne donne aucune base chiffrée pour un right-sizing futur sur Fargate — il faudra mesurer la consommation réelle en conditions de test avant de choisir les tailles de tâche AWS.
- Absence de politique de cycle de vie pour les fichiers uploadés (pas de suppression automatique des fichiers orphelins, pas de classes de stockage différenciées).

## 6. Développement durable

- **Ressources locales non optimisées.** Le poste de développement fait tourner en permanence 5 conteneurs (dont un moteur MySQL complet) même en dehors des phases de test actif, sans mécanisme d'arrêt automatique.
- **Absence de mutualisation.** Chaque microservice a sa propre image et son propre runtime Node.js complet, même pour des services très légers comme `moment` (calcul pur sans I/O) — un candidat naturel à une fonction serverless mutualisée plutôt qu'à un conteneur dédié en permanence.
- **Pas de choix de région/service encore posé**, l'application n'étant pas encore déployée sur AWS — ce constat sera traité dans le rapport TO-BE (J2).

---

*Constats établis le 16/08/2026 à partir de l'exécution locale validée de la branche `develop` (commit `258a97b`), en complément du diagramme `AS-IS.drawio`.*
